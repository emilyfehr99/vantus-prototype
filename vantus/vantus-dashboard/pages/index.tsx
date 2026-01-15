import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
// import styles from '../styles/Dashboard.module.css'; // Commented out if file doesn't exist
import logger from '../utils/logger';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';

// Temporary styles object if CSS module doesn't exist
const styles: any = {};
import PatternTimeline from '../components/PatternTimeline';
import TriageGateCountdown from '../components/TriageGateCountdown';
import LiveFeedViewer from '../components/LiveFeedViewer';
import PeripheralThreatDisplay from '../components/PeripheralThreatDisplay';
import KinematicPredictionAlert from '../components/KinematicPredictionAlert';
import DeEscalationStatusIndicator from '../components/DeEscalationStatusIndicator';
import FactTimelineView from '../components/FactTimelineView';
import DictationCommandLog from '../components/DictationCommandLog';

// Bridge server URL - update this to match your server
// Bridge server URL - from config
import { getServerUrl, getDepartmentCenter } from '../utils/client-config';
const BRIDGE_SERVER_URL = getServerUrl('bridge');

interface OfficerState {
  officerName: string;
  sessionId: string | null;
  lastContact: Date;
  location: {
    lat: number;
    lng: number;
  } | null;
  signals: ContextualSignal[];
  sessionStartTime?: string;
  triageCountdown?: {
    id: string;
    remaining: number;
    dispatchPayload: any;
    canVeto: boolean;
  };
  liveStream?: {
    streamId: string;
    streamUrl: string;
    tacticalIntent: any;
    active: boolean;
    endedReason?: string;
  };
  peripheralThreats?: any[];
  kinematicPrediction?: any;
  deEscalationStatus?: any;
  facts?: any[];
  dictationCommands?: any[];
}

interface ContextualSignal {
  signalType: string;
  signalCategory: string;
  probability: number;
  timestamp: string;
  explanation: {
    description: string;
    originData: any;
    traceability: any;
  };
}

interface MarkerEvent {
  timestamp: string;
  eventType: string;
  description: string;
  location: { lat: number; lng: number } | null;
}

export default function Dashboard() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [officers, setOfficers] = useState<Map<string, OfficerState>>(new Map());
  const [selectedOfficer, setSelectedOfficer] = useState<string | null>(null);
  const [flaggedSignals, setFlaggedSignals] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [supervisorId] = useState<string>('SUPERVISOR_001'); // Would come from auth
  const mapRef = useRef<HTMLDivElement>(null);

  const changeLanguage = (locale: string) => {
    router.push(router.pathname, router.asPath, { locale });
  };

  useEffect(() => {
    setMounted(true);

    // Update time every second
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    // Connect to bridge server
    const newSocket = io(BRIDGE_SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
    });

    const fetchOfficerStates = async () => {
      try {
        const response = await fetch(`${BRIDGE_SERVER_URL}/api/officers`);
        const data = await response.json();

        setOfficers((prev: Map<string, OfficerState>) => {
          const updated = new Map(prev);
          data.officers.forEach((officer: any) => {
            const existing = updated.get(officer.officerName) || {
              officerName: officer.officerName,
              sessionId: null,
              lastContact: new Date(),
              location: null,
              signals: [],
            };

            existing.sessionId = officer.sessionId;
            existing.lastContact = new Date(officer.lastContact);
            if (officer.location) {
              existing.location = officer.location;
            }

            updated.set(officer.officerName, existing);
          });
          return updated;
        });
      } catch (error) {
        logger.error('Failed to fetch officer states', error);
      }
    };

    newSocket.on('connect', () => {
      logger.info('Dashboard connected to bridge server');
      // Fetch initial officer states
      fetchOfficerStates().catch(err => logger.error('Failed to fetch initial officer states', err));
    });

    newSocket.on('disconnect', () => {
      logger.info('Dashboard disconnected from bridge server');
    });

    // Listen for contextual signals
    newSocket.on('CONTEXTUAL_SIGNALS_UPDATE', (data: { officerName: string; signals: ContextualSignal[]; timestamp: string }) => {
      logger.info('CONTEXTUAL_SIGNALS_UPDATE received', { data });

      setOfficers(prev => {
        const updated = new Map(prev);
        const officer = updated.get(data.officerName) || {
          officerName: data.officerName,
          sessionId: null,
          lastContact: new Date(),
          location: null,
          signals: [],
        };

        officer.signals = [...officer.signals, ...data.signals].slice(-50); // Keep last 50
        officer.lastContact = new Date();

        updated.set(data.officerName, officer);
        return updated;
      });
    });

    // Listen for marker events
    newSocket.on('MARKER_EVENT_UPDATE', (data: { officerName: string; marker: MarkerEvent }) => {
      logger.info('MARKER_EVENT_UPDATE received', { data });
      // Could add marker events to officer state if needed
    });

    // Listen for enhanced audio signals
    newSocket.on('ENHANCED_AUDIO_SIGNAL', (data: { officerName: string; signalType: string; signal: any; timestamp: string }) => {
      logger.info('ENHANCED_AUDIO_SIGNAL received', { data });

      setOfficers(prev => {
        const updated = new Map(prev);
        const officer = updated.get(data.officerName) || {
          officerName: data.officerName,
          sessionId: null,
          lastContact: new Date(),
          location: null,
          signals: [],
        };

        officer.signals.push({
          signalType: data.signalType,
          signalCategory: data.signal.category,
          probability: data.signal.confidence,
          timestamp: data.timestamp,
          explanation: {
            description: data.signal.description,
            originData: data.signal,
            traceability: { source: 'enhanced_audio' },
          },
        });
        officer.lastContact = new Date();

        updated.set(data.officerName, officer);
        return updated;
      });
    });

    // Listen for coordination signals
    newSocket.on('COORDINATION_SIGNAL', (data: { officerName: string; signalType: string; signal: any; timestamp: string }) => {
      logger.info('COORDINATION_SIGNAL received', { data });

      setOfficers(prev => {
        const updated = new Map(prev);
        const officer = updated.get(data.officerName) || {
          officerName: data.officerName,
          sessionId: null,
          lastContact: new Date(),
          location: null,
          signals: [],
        };

        officer.signals.push({
          signalType: data.signalType,
          signalCategory: data.signal.category,
          probability: data.signal.confidence,
          timestamp: data.timestamp,
          explanation: {
            description: data.signal.description,
            originData: data.signal,
            traceability: { source: 'coordination' },
          },
        });
        officer.lastContact = new Date();

        updated.set(data.officerName, officer);
        return updated;
      });
    });

    // Listen for location signals
    newSocket.on('LOCATION_SIGNAL', (data: { officerName: string; signalType: string; signal: any; timestamp: string }) => {
      logger.info('LOCATION_SIGNAL received', { data });

      setOfficers(prev => {
        const updated = new Map(prev);
        const officer = updated.get(data.officerName) || {
          officerName: data.officerName,
          sessionId: null,
          lastContact: new Date(),
          location: null,
          signals: [],
        };

        officer.signals.push({
          signalType: data.signalType,
          signalCategory: data.signal.category,
          probability: data.signal.confidence,
          timestamp: data.timestamp,
          explanation: {
            description: data.signal.description,
            originData: data.signal,
            traceability: { source: 'location' },
          },
        });
        officer.lastContact = new Date();

        updated.set(data.officerName, officer);
        return updated;
      });
    });

    // Listen for signal correlations
    newSocket.on('SIGNAL_CORRELATION', (data: { officerName: string; signal: any; timestamp: string }) => {
      logger.info('SIGNAL_CORRELATION received', { data });

      setOfficers(prev => {
        const updated = new Map(prev);
        const officer = updated.get(data.officerName) || {
          officerName: data.officerName,
          sessionId: null,
          lastContact: new Date(),
          location: null,
          signals: [],
        };

        officer.signals.push({
          signalType: 'signal_correlation',
          signalCategory: data.signal.category,
          probability: data.signal.confidence,
          timestamp: data.timestamp,
          explanation: {
            description: data.signal.description,
            originData: data.signal,
            traceability: { source: 'correlation' },
          },
        });
        officer.lastContact = new Date();

        updated.set(data.officerName, officer);
        return updated;
      });
    });

    // Listen for session started
    newSocket.on('SESSION_STARTED', (data: { officerName: string; sessionId: string; timestamp: string }) => {
      setOfficers(prev => {
        const updated = new Map(prev);
        const officer = updated.get(data.officerName) || {
          officerName: data.officerName,
          sessionId: null,
          lastContact: new Date(),
          location: null,
          signals: [],
        };

        officer.sessionId = data.sessionId;
        officer.sessionStartTime = data.timestamp;
        officer.lastContact = new Date();

        updated.set(data.officerName, officer);
        return updated;
      });
    });

    // Listen for session ended
    newSocket.on('SESSION_ENDED_UPDATE', (data: { officerName: string; sessionId: string; summary: any }) => {
      setOfficers(prev => {
        const updated = new Map(prev);
        const officer = updated.get(data.officerName);
        if (officer) {
          officer.sessionId = null;
          officer.lastContact = new Date();
        }
        return updated;
      });
    });

    // Listen for Triage Gate Countdown
    newSocket.on('TRIAGE_GATE_COUNTDOWN', (data: { officerName: string; countdownId: string; countdown: any; dispatchPayload: any; remaining: number }) => {
      logger.info('TRIAGE_GATE_COUNTDOWN received', { data });
      // Store countdown state for UI display
      setOfficers(prev => {
        const updated = new Map(prev);
        const officer = updated.get(data.officerName) || {
          officerName: data.officerName,
          sessionId: null,
          lastContact: new Date(),
          location: null,
          signals: [],
        };
        officer.triageCountdown = {
          id: data.countdownId,
          remaining: data.remaining,
          dispatchPayload: data.dispatchPayload,
          canVeto: true,
        };
        updated.set(data.officerName, officer);
        return updated;
      });
    });

    // Listen for Triage Gate Updates
    newSocket.on('TRIAGE_GATE_UPDATE', (data: { officerName: string; remaining: number; countdown: any }) => {
      setOfficers(prev => {
        const updated = new Map(prev);
        const officer = updated.get(data.officerName);
        if (officer && officer.triageCountdown) {
          officer.triageCountdown.remaining = data.remaining;
        }
        return updated;
      });
    });

    // Listen for Triage Gate Vetoed
    newSocket.on('TRIAGE_GATE_VETOED', (data: { officerName: string; supervisorId?: string; reason: string; autoVetoed?: boolean }) => {
      logger.info('TRIAGE_GATE_VETOED received', { data });
      setOfficers(prev => {
        const updated = new Map(prev);
        const officer = updated.get(data.officerName);
        if (officer && officer.triageCountdown) {
          officer.triageCountdown = undefined; // Clear countdown
        }
        return updated;
      });
    });

    // Listen for Live Feed Hand-off
    newSocket.on('LIVE_FEED_HANDOFF', (data: { officerName: string; streamId: string; stream: any; tacticalIntent: any }) => {
      logger.info('LIVE_FEED_HANDOFF received', { data });
      setOfficers(prev => {
        const updated = new Map(prev);
        const officer = updated.get(data.officerName) || {
          officerName: data.officerName,
          sessionId: null,
          lastContact: new Date(),
          location: null,
          signals: [],
        };
        officer.liveStream = {
          streamId: data.streamId,
          streamUrl: data.stream.streamUrl,
          tacticalIntent: data.tacticalIntent,
          active: true,
        };
        updated.set(data.officerName, officer);
        return updated;
      });
    });

    // Listen for Live Feed Ended
    newSocket.on('LIVE_FEED_ENDED', (data: { officerName: string; reason: string }) => {
      logger.info('LIVE_FEED_ENDED received', { data });
      setOfficers(prev => {
        const updated = new Map(prev);
        const officer = updated.get(data.officerName);
        if (officer && officer.liveStream) {
          officer.liveStream.active = false;
          officer.liveStream.endedReason = data.reason;
        }
        return updated;
      });
    });

    // Listen for Dispatch Prevented
    newSocket.on('DISPATCH_PREVENTED', (data: { officerName: string; reason: string; thresholds: any; deEscalation: any }) => {
      logger.info('DISPATCH_PREVENTED received', { data });
      // Log that dispatch was prevented
    });

    // Legacy support for old alert system
    newSocket.on('DASHBOARD_ALERT', (data: any) => {
      logger.info('Legacy DASHBOARD_ALERT received', { data });
      // Convert to contextual signal for compatibility
      const signal: ContextualSignal = {
        signalType: 'legacy_alert',
        signalCategory: 'threat_detected',
        probability: 0.9,
        timestamp: new Date().toISOString(),
        explanation: {
          description: 'Legacy threat alert',
          originData: data,
          traceability: { source: 'legacy_system' },
        },
      };

      setOfficers(prev => {
        const updated = new Map(prev);
        const officer = updated.get(data.officerName) || {
          officerName: data.officerName,
          sessionId: null,
          lastContact: new Date(),
          location: { lat: data.location.lat, lng: data.location.lng },
          signals: [],
        };

        officer.signals = [...officer.signals, signal].slice(-50);
        officer.location = data.location;
        officer.lastContact = new Date();

        updated.set(data.officerName, officer);
        return updated;
      });
    });

    setSocket(newSocket);

    // Poll for officer states every 10 seconds
    const stateInterval = setInterval(fetchOfficerStates, 10000);

    return () => {
      newSocket.close();
      clearInterval(timeInterval);
      clearInterval(stateInterval);
    };
  }, []);

  // Handle triage gate veto
  const handleTriageVeto = async (officerName: string, reason: string) => {
    if (!socket || !socket.connected) {
      logger.error('Socket not connected');
      return;
    }

    try {
      const response = await fetch(`${BRIDGE_SERVER_URL}/api/triage/veto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officerName,
          supervisorId: supervisorId,
          reason,
        }),
      });

      if (response.ok) {
        logger.info('Triage veto sent successfully', { officerName, reason });
      } else {
        logger.error('Triage veto failed', { officerName, reason });
      }
    } catch (error) {
      logger.error('Triage veto error', error);
    }
  };


  // Convert GPS coordinates to map position
  const getMapPosition = (lat: number, lng: number) => {
    // Map center - should come from config (defaulting to Winnipeg for now)
    const center = getDepartmentCenter();
    const baseLat = center.lat;
    const baseLng = center.lng;
    const latOffset = (lat - baseLat) * 1000;
    const lngOffset = (lng - baseLng) * 1000;

    return {
      x: 50 + lngOffset * 0.1,
      y: 50 - latOffset * 0.1,
    };
  };

  // Calculate time since last contact
  const getTimeSinceLastContact = (lastContact: Date): string => {
    const seconds = Math.floor((new Date().getTime() - lastContact.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  // Get signal color based on category and probability
  // NOTE: Colors indicate pattern strength, NOT risk level
  // No red colors allowed - this is intentional to prevent risk interpretation
  const getSignalColor = (signal: ContextualSignal): string => {
    const prob = signal.probability;
    if (prob > 0.7) return '#FFAA00'; // Orange for high pattern strength
    if (prob > 0.5) return '#FFD700'; // Yellow for medium pattern strength
    return '#00FF41'; // Green for lower pattern strength
    // RED (#FF3B30) is explicitly NOT used - signals are non-diagnostic
  };

  // Flag a signal for review
  const flagSignal = (signalId: string) => {
    setFlaggedSignals(prev => new Set(prev).add(signalId));
    // In production, this would send to backend for archiving
    if (socket && socket.connected) {
      socket.emit('FLAG_SIGNAL', { signalId, timestamp: new Date().toISOString() });
    }
  };

  // Get selected officer
  const selectedOfficerData = selectedOfficer ? officers.get(selectedOfficer) : null;

  // Get recent signals for selected officer
  // NOTE: Signals are sorted by timestamp only, NOT by probability/risk
  // This prevents "highest risk" sorting which could mislead supervisors
  const recentSignals = selectedOfficerData
    ? [...selectedOfficerData.signals].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 10)
    : [];

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{t('title')}</h1>
          <div className={styles.statusBar}>
            <span className={`${styles.statusIndicator} ${socket?.connected ? styles.connected : styles.disconnected}`}>
              <span className={styles.statusDot}></span>
              {socket?.connected ? t('status_online') : t('status_offline')}
            </span>
            <span className={styles.systemTime}>
              {mounted ? currentTime : '--:--:--'}
            </span>
          </div>
          <button
            onClick={() => changeLanguage(router.locale === 'en' ? 'fr' : 'en')}
            style={{
              marginLeft: '10px',
              padding: '5px 10px',
              backgroundColor: '#333',
              color: '#fff',
              border: '1px solid #666',
              cursor: 'pointer'
            }}
          >
            {router.locale === 'en' ? 'FR' : 'EN'}
          </button>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.secureBanner}>
            {t('secure_banner')}
          </div>
        </div>
      </header>

      {/* Non-Diagnostic Banner */}
      <div className={styles.guardrailBanner}>
        <div className={styles.guardrailIcon}>⚠</div>
        <div className={styles.guardrailContent}>
          <strong>{t('guardrail_title')}</strong> {t('guardrail_text')}
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Unit Tiles Panel */}
        <div className={styles.unitsPanel}>
          <div className={styles.unitsHeader}>
            <h2>{t('active_units')}</h2>
            <span className={styles.unitCount}>{officers.size}</span>
          </div>

          <div className={styles.unitsList}>
            {Array.from(officers.values()).map((officer) => {
              const hasSignals = officer.signals.length > 0;
              const recentSignal = officer.signals[officer.signals.length - 1];
              const timeSince = getTimeSinceLastContact(officer.lastContact);

              return (
                <div
                  key={officer.officerName}
                  className={`${styles.unitTile} ${selectedOfficer === officer.officerName ? styles.unitTileSelected : ''} ${hasSignals ? styles.unitTileHasSignals : ''}`}
                  onClick={() => setSelectedOfficer(officer.officerName)}
                >
                  <div className={styles.unitTileHeader}>
                    <span className={styles.unitName}>{officer.officerName}</span>
                    {officer.sessionId && (
                      <span className={styles.sessionBadge}>ACTIVE</span>
                    )}
                  </div>

                  <div className={styles.unitTileInfo}>
                    <div className={styles.unitInfoRow}>
                      <span className={styles.unitInfoLabel}>{t('last_contact')}</span>
                      <span className={styles.unitInfoValue}>{timeSince}</span>
                    </div>

                    {hasSignals && (
                      <div className={styles.unitInfoRow}>
                        <span className={styles.unitInfoLabel}>{t('signals')}</span>
                        <span
                          className={styles.unitInfoValue}
                          title={t('signals_title_tooltip')}
                        >
                          {officer.signals.length}
                        </span>
                      </div>
                    )}

                    {recentSignal && (
                      <div className={styles.unitInfoRow}>
                        <span
                          className={styles.signalIndicator}
                          style={{ color: getSignalColor(recentSignal) }}
                          title={t('recent_signal_tooltip')}
                        >
                          ● {recentSignal.signalCategory}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {officers.size === 0 && (
              <div className={styles.unitsEmpty}>
                <p>{t('no_active_units')}</p>
                <p className={styles.unitsEmptySub}>{t('waiting_connection')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tactical Map */}
        <div className={styles.mapContainer}>
          <div ref={mapRef} className={styles.tacticalMap}>
            <div className={styles.gridOverlay}></div>

            <div className={styles.mapCenter}>
              <div className={styles.centerMarker}></div>
              <div className={styles.centerLabel}>{t('operations_center')}</div>
            </div>

            {/* Officer markers */}
            {Array.from(officers.values())
              .filter(o => o.location)
              .map((officer) => {
                const pos = getMapPosition(officer.location!.lat, officer.location!.lng);
                const hasSignals = officer.signals.length > 0;
                const recentSignal = officer.signals[officer.signals.length - 1];

                return (
                  <div
                    key={officer.officerName}
                    className={`${styles.officerMarker} ${hasSignals ? styles.officerMarkerHasSignals : ''}`}
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                    }}
                    onClick={() => setSelectedOfficer(officer.officerName)}
                  >
                    <div className={styles.markerPulse}></div>
                    <div
                      className={styles.markerIcon}
                      style={hasSignals && recentSignal ? {
                        borderColor: getSignalColor(recentSignal),
                        boxShadow: `0 0 15px ${getSignalColor(recentSignal)}40`
                      } : {}}
                    >
                      👤
                    </div>
                    <div className={styles.markerLabel}>{officer.officerName}</div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Signal Detail Panel */}
        <div className={styles.signalsPanel}>
          {selectedOfficerData ? (
            <>
              <div className={styles.signalsHeader}>
                <h2>{t('signals_header', { officerName: selectedOfficerData.officerName })}</h2>
              </div>

              {/* Triage Gate Countdown */}
              {selectedOfficerData.triageCountdown && selectedOfficer !== null && (
                <TriageGateCountdown
                  officerName={selectedOfficer}
                  countdownId={selectedOfficerData.triageCountdown.id}
                  remaining={selectedOfficerData.triageCountdown.remaining}
                  dispatchPayload={selectedOfficerData.triageCountdown.dispatchPayload}
                  onVeto={handleTriageVeto}
                  supervisorId={supervisorId}
                />
              )}

              {/* Live Feed Viewer */}
              {selectedOfficerData.liveStream && selectedOfficerData.liveStream.active && selectedOfficer !== null && (
                <LiveFeedViewer
                  officerName={selectedOfficer}
                  streamUrl={selectedOfficerData.liveStream.streamUrl}
                  tacticalIntent={selectedOfficerData.liveStream.tacticalIntent}
                  onClose={() => {
                    if (selectedOfficer === null) return;
                    setOfficers(prev => {
                      const updated = new Map(prev);
                      const officer = updated.get(selectedOfficer);
                      if (officer && officer.liveStream) {
                        officer.liveStream.active = false;
                      }
                      return updated;
                    });
                  }}
                />
              )}

              {/* Peripheral Threat Display */}
              {selectedOfficerData.peripheralThreats && selectedOfficerData.peripheralThreats.length > 0 && selectedOfficer && (
                <PeripheralThreatDisplay
                  threats={selectedOfficerData.peripheralThreats}
                  officerName={selectedOfficer as string}
                />
              )}

              {/* Kinematic Prediction Alert */}
              {selectedOfficerData.kinematicPrediction && selectedOfficer && (
                <KinematicPredictionAlert
                  prediction={selectedOfficerData.kinematicPrediction}
                  officerName={selectedOfficer as string}
                />
              )}

              {/* De-escalation Status Indicator */}
              {selectedOfficerData.deEscalationStatus && selectedOfficer && (
                <DeEscalationStatusIndicator
                  stabilization={selectedOfficerData.deEscalationStatus}
                  officerName={selectedOfficer as string}
                />
              )}

              {/* Fact Timeline View */}
              {selectedOfficerData.facts && selectedOfficerData.facts.length > 0 && selectedOfficer && (
                <FactTimelineView
                  facts={selectedOfficerData.facts}
                  officerName={selectedOfficer as string}
                />
              )}

              {/* Dictation Command Log */}
              {selectedOfficerData.dictationCommands && selectedOfficerData.dictationCommands.length > 0 && selectedOfficer && (
                <DictationCommandLog
                  commands={selectedOfficerData.dictationCommands}
                  officerName={selectedOfficer as string}
                />
              )}

              {/* Pattern Timeline */}
              {selectedOfficerData.signals.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <PatternTimeline
                    signals={selectedOfficerData.signals}
                    officerName={selectedOfficerData.officerName}
                  />
                </div>
              )}

              <div className={styles.signalsHeader}>
                <button
                  className={styles.summaryButton}
                  onClick={() => {
                    // Generate post-shift summary
                    const summary = {
                      officerName: selectedOfficerData.officerName,
                      sessionId: selectedOfficerData.sessionId,
                      signalCount: selectedOfficerData.signals.length,
                      signalsByCategory: {} as Record<string, number>,
                    };

                    // Count signals by category
                    selectedOfficerData.signals.forEach(s => {
                      summary.signalsByCategory[s.signalCategory] = (summary.signalsByCategory[s.signalCategory] || 0) + 1;
                    });

                    logger.info('Generated post-shift summary', summary);
                    alert(`Daily Summary Generated for ${selectedOfficerData.officerName}\nTotal Signals: ${selectedOfficerData.signals.length}`);
                  }}
                >
                  GENERATE DAILY SUMMARY
                </button>
              </div>

              <div className={styles.signalsList}>
                {recentSignals.map((signal, index) => (
                  <div
                    key={index}
                    className={styles.signalCard}
                    style={{ borderLeftColor: getSignalColor(signal) }}
                  >
                    <div className={styles.signalHeader}>
                      <span className={styles.signalType}>{signal.signalCategory}</span>
                      <span className={styles.signalTime}>
                        {new Date(signal.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className={styles.signalBody}>
                      <div className={styles.signalConfidence}>
                        Pattern Strength: {(signal.probability * 100).toFixed(0)}%
                      </div>
                      <div className={styles.signalDescription}>
                        {signal.explanation.description}
                      </div>

                      {/* Flagging UI */}
                      <div className={styles.signalActions}>
                        <button
                          onClick={() => flagSignal(`signal-${index}`)}
                          className={styles.flagButton}
                          disabled={flaggedSignals.has(`signal-${index}`)}
                        >
                          {flaggedSignals.has(`signal-${index}`) ? 'FLAGGED FOR REVIEW' : 'FLAG FOR REVIEW'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {recentSignals.length === 0 && (
                  <div className={styles.signalsEmpty}>
                    No recent signals to display.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.noSelection}>
              <div className={styles.noSelectionIcon}>👮</div>
              <h3>Select a unit to view details</h3>
              <p>Click on a unit tile or map marker to view real-time pattern analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
