import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import styles from '../styles/Dashboard.module.css';
import logger from '../utils/logger';

// Bridge server URL - update this to match your server
// Bridge server URL - from environment or default
const BRIDGE_SERVER_URL = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:3001';

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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [officers, setOfficers] = useState<Map<string, OfficerState>>(new Map());
  const [selectedOfficer, setSelectedOfficer] = useState<string | null>(null);
  const [flaggedSignals, setFlaggedSignals] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

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

    newSocket.on('connect', () => {
      logger.info('Dashboard connected to bridge server');
      // Fetch initial officer states
      fetchOfficerStates();
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

  const fetchOfficerStates = async () => {
    try {
      const response = await fetch(`${BRIDGE_SERVER_URL}/api/officers`);
      const data = await response.json();
      
      setOfficers(prev => {
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

  // Convert GPS coordinates to map position
  const getMapPosition = (lat: number, lng: number) => {
    // Map center - should come from config (defaulting to Winnipeg for now)
    const baseLat = parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LAT || '49.8951');
    const baseLng = parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LNG || '-97.1384');
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
          <h1 className={styles.title}>VANTUS SUPERVISOR DASHBOARD</h1>
          <div className={styles.statusBar}>
            <span className={`${styles.statusIndicator} ${socket?.connected ? styles.connected : styles.disconnected}`}>
              <span className={styles.statusDot}></span>
              {socket?.connected ? 'ONLINE' : 'OFFLINE'}
            </span>
            <span className={styles.systemTime}>
              {mounted ? currentTime : '--:--:--'}
            </span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.secureBanner}>
            CONTEXTUAL MONITORING
          </div>
        </div>
      </header>

      {/* Non-Diagnostic Banner */}
      <div className={styles.guardrailBanner}>
        <div className={styles.guardrailIcon}>⚠</div>
        <div className={styles.guardrailContent}>
          <strong>SIGNALS ARE NON-DIAGNOSTIC:</strong> These contextual indicators are probabilistic patterns, not threat assessments. 
          They provide situational awareness only and should not be used to make operational decisions without additional context.
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Unit Tiles Panel */}
        <div className={styles.unitsPanel}>
          <div className={styles.unitsHeader}>
            <h2>ACTIVE UNITS</h2>
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
                      <span className={styles.unitInfoLabel}>Last Contact:</span>
                      <span className={styles.unitInfoValue}>{timeSince}</span>
                    </div>
                    
                    {hasSignals && (
                      <div className={styles.unitInfoRow}>
                        <span className={styles.unitInfoLabel}>Signals:</span>
                        <span 
                          className={styles.unitInfoValue}
                          title="Total contextual signals received. Signal count does not indicate risk level."
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
                          title="Most recent signal category. Color indicates pattern strength, not risk level. No red colors are used to prevent risk interpretation."
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
                <p>No active units</p>
                <p className={styles.unitsEmptySub}>Waiting for connections...</p>
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
              <div className={styles.centerLabel}>OPERATIONS CENTER</div>
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
                <h2>SIGNALS: {selectedOfficerData.officerName}</h2>
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
                    
                    selectedOfficerData.signals.forEach(s => {
                      summary.signalsByCategory[s.signalCategory] = 
                        (summary.signalsByCategory[s.signalCategory] || 0) + 1;
                    });
                    
                    logger.info('Post-shift summary', { summary });
                    alert(`Post-Shift Summary:\n\nOfficer: ${selectedOfficerData.officerName}\nTotal Signals: ${selectedOfficerData.signals.length}\nCategories: ${Object.keys(summary.signalsByCategory).length}\n\nNote: This summary is for contextual awareness only, not performance evaluation.`);
                  }}
                  title="Generate a post-shift summary of contextual signals. This is for review purposes only, not for performance evaluation or disciplinary action."
                >
                  GENERATE SUMMARY
                </button>
              </div>
              
              <div className={styles.signalsContent}>
                {recentSignals.length === 0 ? (
                  <div className={styles.signalsEmpty}>
                    <p>No contextual signals</p>
                    <p className={styles.signalsEmptySub}>All systems normal</p>
                  </div>
                ) : (
                  recentSignals.map((signal, idx) => {
                    const signalId = `${signal.timestamp}-${idx}`;
                    const isFlagged = flaggedSignals.has(signalId);
                    
                    return (
                      <div
                        key={signalId}
                        className={`${styles.signalCard} ${isFlagged ? styles.signalCardFlagged : ''}`}
                        style={{ borderLeftColor: getSignalColor(signal) }}
                      >
                        <div className={styles.signalHeader}>
                          <div className={styles.signalHeaderRow}>
                          <div className={styles.signalCategory}>
                            <span 
                              className={styles.signalDot}
                              style={{ backgroundColor: getSignalColor(signal) }}
                            ></span>
                            {signal.signalCategory}
                            <span 
                              className={styles.tooltipTrigger}
                              title="This is a probabilistic pattern indicator, not a threat assessment. Probability indicates pattern strength, not risk level."
                            >
                              ℹ️
                            </span>
                          </div>
                          <div className={styles.signalMeta}>
                            <span 
                              className={styles.signalProbability}
                              title="Probability indicates pattern detection confidence, not risk severity. Higher probability means stronger pattern match, not higher danger."
                            >
                              {(signal.probability * 100).toFixed(0)}%
                            </span>
                            <span className={styles.signalTime}>
                              {new Date(signal.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        </div>
                        
                        <div className={styles.signalDescription}>
                          {signal.explanation.description}
                        </div>
                        
                        <details className={styles.signalDetails}>
                          <summary className={styles.signalDetailsSummary}>
                            View Explanation
                            <span 
                              className={styles.tooltipTrigger}
                              title="Explanation shows the raw data and algorithm that generated this signal. This helps verify signal validity but does not indicate risk level."
                            >
                              ℹ️
                            </span>
                          </summary>
                          <div className={styles.signalDetailsContent}>
                            <div className={styles.signalDetailsSection}>
                              <strong>Origin Data:</strong>
                              <p className={styles.signalDisclaimer}>
                                Raw telemetry data that triggered this signal. This is contextual information only, not a threat indicator.
                              </p>
                              <pre>{JSON.stringify(signal.explanation.originData, null, 2)}</pre>
                            </div>
                            <div className={styles.signalDetailsSection}>
                              <strong>Traceability:</strong>
                              <p className={styles.signalDisclaimer}>
                                Algorithm and parameters used to generate this signal. All signals are explainable and verifiable.
                              </p>
                              <pre>{JSON.stringify(signal.explanation.traceability, null, 2)}</pre>
                            </div>
                          </div>
                        </details>
                        
                        <button
                          className={`${styles.flagButton} ${isFlagged ? styles.flagButtonActive : ''}`}
                          onClick={() => flagSignal(signalId)}
                          title="Flag this signal for post-shift review. Flagging does not indicate urgency or risk - it's for administrative review only."
                        >
                          {isFlagged ? '✓ FLAGGED' : 'FLAG FOR REVIEW'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className={styles.signalsEmpty}>
              <p>Select a unit to view signals</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
