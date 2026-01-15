/**
 * Demo Video Service
 * Manages demo video playback with scripted detection events
 */

import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { io } from 'socket.io-client';
import logger from '../utils/logger';
import configService from '../utils/config';
import {
    getDemoScript,
    getEventAtTime,
    getBiometricAtTime,
    VOICE_MESSAGES,
    ALERT_COLORS,
} from '../utils/demoScripts';

class DemoVideoService {
    constructor() {
        this.isPlaying = false;
        this.currentScript = null;
        this.currentTime = 0;
        this.playbackInterval = null;
        this.triggeredEvents = new Set();
        this.socket = null;
        this.eventCallbacks = [];
        this.overlayCallbacks = [];
    }

    /**
     * Initialize demo service
     */
    async initialize() {
        try {
            // Connect to bridge server for dashboard updates
            const serverUrl = configService.getServerUrl('bridge') || 'http://localhost:3001';
            this.socket = io(serverUrl, {
                transports: ['websocket'],
                reconnection: true,
            });

            this.socket.on('connect', () => {
                logger.info('Demo service connected to bridge server');
            });

            logger.info('Demo video service initialized');
        } catch (error) {
            logger.error('Failed to initialize demo service', error);
        }
    }

    /**
     * Load a demo script
     * @param {string} scriptId - ID of demo script to load
     */
    loadScript(scriptId) {
        this.currentScript = getDemoScript(scriptId);
        this.currentTime = 0;
        this.triggeredEvents.clear();
        logger.info('Demo script loaded', { scriptId, name: this.currentScript.name });
        return this.currentScript;
    }

    /**
     * Start playback
     * @param {Function} onTimeUpdate - Callback for time updates
     */
    startPlayback(onTimeUpdate = null) {
        if (!this.currentScript) {
            logger.error('No demo script loaded');
            return false;
        }

        this.isPlaying = true;
        this.triggeredEvents.clear();

        // Emit session start to dashboard
        this.emitToDashboard('session_start', {
            officer: this.currentScript.officerInfo,
            location: this.currentScript.location,
            callType: this.currentScript.callType,
            timestamp: new Date().toISOString(),
        });

        // Start playback timer (100ms intervals for smooth updates)
        this.playbackInterval = setInterval(() => {
            if (!this.isPlaying) return;

            this.currentTime += 0.1;

            // Check for events at current time
            this.checkForEvents();

            // Update biometrics
            const biometrics = getBiometricAtTime(this.currentScript, this.currentTime);
            this.emitToDashboard('biometric_update', biometrics);

            // Call time update callback
            if (onTimeUpdate) {
                onTimeUpdate(this.currentTime, biometrics);
            }

            // Check if playback complete
            if (this.currentTime >= this.currentScript.duration) {
                this.stopPlayback();
            }
        }, 100);

        logger.info('Demo playback started', { script: this.currentScript.name });
        return true;
    }

    /**
     * Check for and trigger events at current time
     */
    checkForEvents() {
        const event = getEventAtTime(this.currentScript, this.currentTime, 0.15);

        if (event && !this.triggeredEvents.has(event.time)) {
            this.triggeredEvents.add(event.time);
            this.triggerEvent(event);
        }
    }

    /**
     * Trigger a detection event
     */
    async triggerEvent(event) {
        logger.info('Demo event triggered', { type: event.type, time: event.time });

        // Notify overlay callbacks
        this.overlayCallbacks.forEach(cb => cb(event));

        // Trigger haptic feedback
        if (event.triggerHaptic) {
            await this.triggerHaptic(event);
        }

        // Trigger voice advisory
        if (event.triggerVoice) {
            await this.triggerVoice(event);
        }

        // Emit to dashboard
        this.emitToDashboard('detection', {
            type: event.type,
            description: event.description,
            confidence: event.confidence,
            timestamp: new Date().toISOString(),
            officer: this.currentScript.officerInfo,
            location: this.currentScript.location,
            priority: event.priority || 'normal',
        });

        // Notify event callbacks
        this.eventCallbacks.forEach(cb => cb(event));
    }

    /**
     * Trigger haptic feedback
     */
    async triggerHaptic(event) {
        try {
            if (event.priority === 'critical') {
                // Triple pulse for critical
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error), 200);
                setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error), 400);
            } else {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
        } catch (error) {
            logger.warn('Haptic feedback not available');
        }
    }

    /**
     * Trigger voice advisory
     */
    async triggerVoice(event) {
        try {
            const message = VOICE_MESSAGES[event.type] || event.description;
            await Speech.speak(message, {
                language: 'en-US',
                pitch: 1.0,
                rate: 1.1, // Slightly faster for urgency
            });
        } catch (error) {
            logger.warn('Voice advisory not available');
        }
    }

    /**
     * Pause playback
     */
    pausePlayback() {
        this.isPlaying = false;
        logger.info('Demo playback paused', { time: this.currentTime });
    }

    /**
     * Resume playback
     */
    resumePlayback() {
        this.isPlaying = true;
        logger.info('Demo playback resumed', { time: this.currentTime });
    }

    /**
     * Stop playback
     */
    stopPlayback() {
        this.isPlaying = false;
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }

        // Emit session end to dashboard
        this.emitToDashboard('session_end', {
            officer: this.currentScript?.officerInfo,
            duration: this.currentTime,
            eventsTriggered: this.triggeredEvents.size,
            timestamp: new Date().toISOString(),
        });

        logger.info('Demo playback stopped', { time: this.currentTime });
    }

    /**
     * Seek to specific time
     */
    seekTo(time) {
        const previousTime = this.currentTime;
        this.currentTime = Math.max(0, Math.min(time, this.currentScript?.duration || 0));

        // Re-trigger events if seeking backwards
        if (time < previousTime) {
            this.triggeredEvents.clear();
            // Re-add events before current time
            this.currentScript?.events.forEach(event => {
                if (event.time < time) {
                    this.triggeredEvents.add(event.time);
                }
            });
        }

        logger.info('Demo seeked', { from: previousTime, to: this.currentTime });
    }

    /**
     * Manually trigger an event (for demo buttons)
     */
    manualTrigger(eventType, description = null) {
        const event = {
            time: this.currentTime,
            type: eventType,
            description: description || VOICE_MESSAGES[eventType] || eventType,
            confidence: 0.95,
            triggerHaptic: true,
            triggerVoice: true,
            priority: eventType.includes('WEAPON') ? 'critical' : 'normal',
        };

        this.triggerEvent(event);
        return event;
    }

    /**
     * Emit event to dashboard via Socket.IO
     */
    emitToDashboard(eventType, data) {
        if (this.socket?.connected) {
            this.socket.emit(eventType, data);
        }
    }

    /**
     * Register callback for events
     */
    onEvent(callback) {
        this.eventCallbacks.push(callback);
        return () => {
            this.eventCallbacks = this.eventCallbacks.filter(cb => cb !== callback);
        };
    }

    /**
     * Register callback for overlay updates
     */
    onOverlayUpdate(callback) {
        this.overlayCallbacks.push(callback);
        return () => {
            this.overlayCallbacks = this.overlayCallbacks.filter(cb => cb !== callback);
        };
    }

    /**
     * Get current playback state
     */
    getState() {
        const biometrics = this.currentScript
            ? getBiometricAtTime(this.currentScript, this.currentTime)
            : null;

        return {
            isPlaying: this.isPlaying,
            currentTime: this.currentTime,
            duration: this.currentScript?.duration || 0,
            script: this.currentScript?.name || null,
            eventsTriggered: this.triggeredEvents.size,
            totalEvents: this.currentScript?.events?.length || 0,
            biometrics,
            connected: this.socket?.connected || false,
        };
    }

    /**
     * Get list of upcoming events
     */
    getUpcomingEvents(count = 3) {
        if (!this.currentScript) return [];

        return this.currentScript.events
            .filter(event => event.time > this.currentTime)
            .slice(0, count);
    }

    /**
     * Get triggered events log
     */
    getEventLog() {
        if (!this.currentScript) return [];

        return this.currentScript.events
            .filter(event => this.triggeredEvents.has(event.time))
            .map(event => ({
                ...event,
                color: ALERT_COLORS[event.type],
            }));
    }

    /**
     * Cleanup
     */
    dispose() {
        this.stopPlayback();
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.eventCallbacks = [];
        this.overlayCallbacks = [];
    }
}

export default new DemoVideoService();
