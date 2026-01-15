/**
 * Demo Mode Screen
 * Video playback with detection overlays for client demonstrations
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Alert,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import demoVideoService from '../services/demoVideoService';
import {
    DEMO_SCRIPTS,
    DETECTION_TYPES,
    ALERT_COLORS,
} from '../utils/demoScripts';
import logger from '../utils/logger';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function DemoModeScreen({ onExit }) {
    const videoRef = useRef(null);

    // State
    const [selectedScript, setSelectedScript] = useState(DEMO_SCRIPTS[0]);
    const [videoUri, setVideoUri] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [biometrics, setBiometrics] = useState({ heartRate: 72, baseline: 72 });
    const [activeOverlay, setActiveOverlay] = useState(null);
    const [eventLog, setEventLog] = useState([]);
    const [showScriptPicker, setShowScriptPicker] = useState(true);

    // Initialize demo service
    useEffect(() => {
        demoVideoService.initialize();

        // Register overlay callback
        const unsubscribe = demoVideoService.onOverlayUpdate((event) => {
            setActiveOverlay(event);
            setEventLog(prev => [...prev, { ...event, triggeredAt: new Date().toISOString() }]);

            // Clear overlay after 3 seconds
            setTimeout(() => setActiveOverlay(null), 3000);
        });

        return () => {
            unsubscribe();
            demoVideoService.dispose();
        };
    }, []);

    // Load script
    const loadScript = (script) => {
        setSelectedScript(script);
        demoVideoService.loadScript(script.id);
        setShowScriptPicker(false);
        setEventLog([]);
        setCurrentTime(0);
        setIsPlaying(false);
    };

    // Pick video from library
    const pickVideo = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
                setVideoUri(result.assets[0].uri);
                logger.info('Video selected', { uri: result.assets[0].uri });
            }
        } catch (error) {
            logger.error('Failed to pick video', error);
            Alert.alert('Error', 'Failed to load video');
        }
    };

    // Start demo playback
    const startDemo = async () => {
        if (videoRef.current && videoUri) {
            await videoRef.current.playAsync();
        }

        demoVideoService.startPlayback((time, bio) => {
            setCurrentTime(time);
            setBiometrics(bio);
        });

        setIsPlaying(true);
    };

    // Pause demo
    const pauseDemo = async () => {
        if (videoRef.current) {
            await videoRef.current.pauseAsync();
        }
        demoVideoService.pausePlayback();
        setIsPlaying(false);
    };

    // Stop demo
    const stopDemo = async () => {
        if (videoRef.current) {
            await videoRef.current.stopAsync();
            await videoRef.current.setPositionAsync(0);
        }
        demoVideoService.stopPlayback();
        setIsPlaying(false);
        setCurrentTime(0);
        setActiveOverlay(null);
    };

    // Seek to time
    const seekTo = async (time) => {
        if (videoRef.current) {
            await videoRef.current.setPositionAsync(time * 1000);
        }
        demoVideoService.seekTo(time);
        setCurrentTime(time);
    };

    // Manual event trigger buttons
    const triggerManualEvent = (eventType) => {
        demoVideoService.manualTrigger(eventType);
    };

    // Format time display
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Script picker modal
    if (showScriptPicker) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onExit} style={styles.exitButton}>
                        <Text style={styles.exitButtonText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Demo Mode</Text>
                </View>

                <ScrollView style={styles.scriptPicker}>
                    <Text style={styles.sectionTitle}>Select Demo Scenario</Text>

                    {DEMO_SCRIPTS.map((script) => (
                        <TouchableOpacity
                            key={script.id}
                            style={styles.scriptCard}
                            onPress={() => loadScript(script)}
                        >
                            <Text style={styles.scriptName}>{script.name}</Text>
                            <Text style={styles.scriptDescription}>{script.description}</Text>
                            <View style={styles.scriptMeta}>
                                <Text style={styles.scriptMetaText}>
                                    {script.events.length} events · {script.duration}s
                                </Text>
                                <Text style={styles.scriptMetaText}>
                                    Officer: {script.officerInfo.name}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setShowScriptPicker(true)} style={styles.exitButton}>
                    <Text style={styles.exitButtonText}>← Scripts</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{selectedScript.name}</Text>
                <TouchableOpacity onPress={onExit} style={styles.exitButton}>
                    <Text style={styles.exitButtonText}>Exit</Text>
                </TouchableOpacity>
            </View>

            {/* Video Player Area */}
            <View style={styles.videoContainer}>
                {videoUri ? (
                    <Video
                        ref={videoRef}
                        source={{ uri: videoUri }}
                        style={styles.video}
                        resizeMode={ResizeMode.CONTAIN}
                        isLooping={false}
                        onPlaybackStatusUpdate={(status) => {
                            if (status.isLoaded) {
                                setDuration(status.durationMillis / 1000);
                            }
                        }}
                    />
                ) : (
                    <View style={styles.videoPlaceholder}>
                        <Text style={styles.placeholderText}>No Video Loaded</Text>
                        <TouchableOpacity style={styles.loadButton} onPress={pickVideo}>
                            <Text style={styles.loadButtonText}>📹 Load Video</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Detection Overlay */}
                {activeOverlay && (
                    <View style={[styles.overlay, { borderColor: ALERT_COLORS[activeOverlay.type] }]}>
                        <Text style={[styles.overlayType, { color: ALERT_COLORS[activeOverlay.type] }]}>
                            {activeOverlay.type.replace(/_/g, ' ')}
                        </Text>
                        <Text style={styles.overlayDescription}>{activeOverlay.description}</Text>
                        {activeOverlay.confidence && (
                            <Text style={styles.overlayConfidence}>
                                {Math.round(activeOverlay.confidence * 100)}% confidence
                            </Text>
                        )}
                    </View>
                )}

                {/* Biometric HUD */}
                <View style={styles.biometricHud}>
                    <Text style={[
                        styles.heartRate,
                        biometrics.elevated && styles.heartRateElevated
                    ]}>
                        ❤️ {biometrics.heartRate} BPM
                    </Text>
                    <Text style={styles.baseline}>
                        Baseline: {biometrics.baseline}
                    </Text>
                </View>
            </View>

            {/* Timeline */}
            <View style={styles.timeline}>
                <Text style={styles.timeDisplay}>
                    {formatTime(currentTime)} / {formatTime(selectedScript.duration)}
                </Text>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${(currentTime / selectedScript.duration) * 100}%` }
                        ]}
                    />
                    {/* Event markers */}
                    {selectedScript.events.map((event, idx) => (
                        <View
                            key={idx}
                            style={[
                                styles.eventMarker,
                                {
                                    left: `${(event.time / selectedScript.duration) * 100}%`,
                                    backgroundColor: ALERT_COLORS[event.type],
                                }
                            ]}
                        />
                    ))}
                </View>
            </View>

            {/* Playback Controls */}
            <View style={styles.controls}>
                <TouchableOpacity style={styles.controlButton} onPress={() => seekTo(Math.max(0, currentTime - 5))}>
                    <Text style={styles.controlButtonText}>⏪ -5s</Text>
                </TouchableOpacity>

                {isPlaying ? (
                    <TouchableOpacity style={styles.mainControlButton} onPress={pauseDemo}>
                        <Text style={styles.mainControlButtonText}>⏸️ Pause</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.mainControlButton} onPress={startDemo}>
                        <Text style={styles.mainControlButtonText}>▶️ Play</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.controlButton} onPress={() => seekTo(currentTime + 5)}>
                    <Text style={styles.controlButtonText}>+5s ⏩</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={stopDemo}>
                    <Text style={styles.controlButtonText}>⏹️ Stop</Text>
                </TouchableOpacity>
            </View>

            {/* Manual Trigger Buttons */}
            <View style={styles.triggerButtons}>
                <Text style={styles.triggerLabel}>Manual Triggers:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                        style={[styles.triggerButton, { backgroundColor: ALERT_COLORS.WEAPON_ALERT }]}
                        onPress={() => triggerManualEvent(DETECTION_TYPES.WEAPON_ALERT)}
                    >
                        <Text style={styles.triggerButtonText}>🔫 Weapon</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.triggerButton, { backgroundColor: ALERT_COLORS.STANCE_ALERT }]}
                        onPress={() => triggerManualEvent(DETECTION_TYPES.STANCE_ALERT)}
                    >
                        <Text style={styles.triggerButtonText}>🥋 Stance</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.triggerButton, { backgroundColor: ALERT_COLORS.HANDS_ALERT }]}
                        onPress={() => triggerManualEvent(DETECTION_TYPES.HANDS_ALERT)}
                    >
                        <Text style={styles.triggerButtonText}>✋ Hands</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.triggerButton, { backgroundColor: ALERT_COLORS.AUTO_DISPATCH }]}
                        onPress={() => triggerManualEvent(DETECTION_TYPES.AUTO_DISPATCH)}
                    >
                        <Text style={styles.triggerButtonText}>🚨 Dispatch</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Event Log */}
            <View style={styles.eventLogContainer}>
                <Text style={styles.eventLogTitle}>Event Log ({eventLog.length})</Text>
                <ScrollView style={styles.eventLog}>
                    {eventLog.slice(-5).reverse().map((event, idx) => (
                        <View key={idx} style={styles.eventLogItem}>
                            <View style={[styles.eventDot, { backgroundColor: ALERT_COLORS[event.type] }]} />
                            <Text style={styles.eventLogText}>
                                {formatTime(event.time)} - {event.type.replace(/_/g, ' ')}
                            </Text>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#16213e',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    exitButton: {
        padding: 8,
    },
    exitButtonText: {
        color: '#3498db',
        fontSize: 16,
    },
    scriptPicker: {
        flex: 1,
        padding: 16,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    scriptCard: {
        backgroundColor: '#16213e',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#3498db',
    },
    scriptName: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    scriptDescription: {
        color: '#a0a0a0',
        fontSize: 14,
        marginBottom: 8,
    },
    scriptMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    scriptMetaText: {
        color: '#6a6a8a',
        fontSize: 12,
    },
    videoContainer: {
        height: SCREEN_HEIGHT * 0.35,
        backgroundColor: '#000',
        position: 'relative',
    },
    video: {
        flex: 1,
    },
    videoPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#666',
        fontSize: 18,
        marginBottom: 16,
    },
    loadButton: {
        backgroundColor: '#3498db',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    loadButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    overlay: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.85)',
        padding: 16,
        borderRadius: 8,
        borderWidth: 3,
    },
    overlayType: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    overlayDescription: {
        color: 'white',
        fontSize: 16,
        marginBottom: 4,
    },
    overlayConfidence: {
        color: '#a0a0a0',
        fontSize: 14,
    },
    biometricHud: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 8,
        borderRadius: 8,
    },
    heartRate: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    heartRateElevated: {
        color: '#e74c3c',
    },
    baseline: {
        color: '#a0a0a0',
        fontSize: 12,
    },
    timeline: {
        padding: 16,
    },
    timeDisplay: {
        color: 'white',
        textAlign: 'center',
        marginBottom: 8,
        fontSize: 16,
    },
    progressBar: {
        height: 20,
        backgroundColor: '#2c2c54',
        borderRadius: 10,
        overflow: 'visible',
        position: 'relative',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#3498db',
        borderRadius: 10,
    },
    eventMarker: {
        position: 'absolute',
        top: -4,
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: -4,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 16,
    },
    controlButton: {
        backgroundColor: '#2c2c54',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    controlButtonText: {
        color: 'white',
        fontSize: 14,
    },
    mainControlButton: {
        backgroundColor: '#3498db',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 8,
    },
    mainControlButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    triggerButtons: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    triggerLabel: {
        color: '#a0a0a0',
        fontSize: 12,
        marginBottom: 8,
    },
    triggerButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        marginRight: 8,
    },
    triggerButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    eventLogContainer: {
        flex: 1,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#2c2c54',
    },
    eventLogTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    eventLog: {
        flex: 1,
    },
    eventLogItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    eventDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    eventLogText: {
        color: '#a0a0a0',
        fontSize: 12,
    },
});
