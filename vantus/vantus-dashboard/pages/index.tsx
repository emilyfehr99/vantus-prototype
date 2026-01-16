import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import logger from '../utils/logger';

// Components
import PatternTimeline from '../components/PatternTimeline';
import TriageGateCountdown from '../components/TriageGateCountdown';
import LiveFeedViewer from '../components/LiveFeedViewer';
import KinematicPredictionAlert from '../components/KinematicPredictionAlert';
import SystemMessageTerminal from '../components/SystemMessageTerminal';

import { getServerUrl, getDepartmentCenter } from '../utils/client-config';
const BRIDGE_SERVER_URL = getServerUrl('bridge');

interface OfficerState {
  officerName: string;
  sessionId: string | null;
  lastContact: Date;
  location: { lat: number; lng: number } | null;
  signals: ContextualSignal[];
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
  kinematicPrediction?: any;
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

// Inline styles object
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#000000',
    color: '#ffffff',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    overflow: 'hidden',
  } as React.CSSProperties,
  header: {
    height: '56px',
    backgroundColor: '#0a0a0a',
    borderBottom: '1px solid #1a1a1a',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as React.CSSProperties,
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  } as React.CSSProperties,
  logo: {
    width: '24px',
    height: '24px',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    fontWeight: 900,
    fontSize: '12px',
    color: '#000000',
  } as React.CSSProperties,
  title: {
    fontSize: '14px',
    fontWeight: 900,
    letterSpacing: '0.15em',
    color: '#ffffff',
  } as React.CSSProperties,
  divider: {
    width: '1px',
    height: '20px',
    backgroundColor: '#333333',
  } as React.CSSProperties,
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #222222',
    borderRadius: '4px',
  } as React.CSSProperties,
  statusDot: (connected: boolean) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: connected ? '#00FF41' : '#FF3B30',
    animation: connected ? 'pulse 2s infinite' : 'none',
  } as React.CSSProperties),
  nav: {
    height: '44px',
    backgroundColor: '#050505',
    borderBottom: '1px solid #151515',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  } as React.CSSProperties,
  navButton: (active: boolean) => ({
    padding: '10px 20px',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '4px 4px 0 0',
    transition: 'all 0.2s',
    backgroundColor: active ? '#00FF41' : 'transparent',
    color: active ? '#000000' : '#555555',
    boxShadow: active ? '0 0 15px rgba(0,255,65,0.3)' : 'none',
  } as React.CSSProperties),
  main: {
    padding: '24px',
    display: 'grid',
    gridTemplateColumns: '280px 1fr 320px',
    gap: '16px',
    height: 'calc(100vh - 140px)',
  } as React.CSSProperties,
  card: {
    backgroundColor: '#0a0a0a',
    border: '1px solid #1a1a1a',
    borderRadius: '8px',
    padding: '16px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties,
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '12px',
    borderBottom: '1px solid #1a1a1a',
    marginBottom: '12px',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '10px',
    color: '#666666',
    fontWeight: 700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  officerCard: (selected: boolean) => ({
    padding: '12px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: `1px solid ${selected ? 'rgba(0,255,65,0.5)' : '#1a1a1a'}`,
    backgroundColor: selected ? 'rgba(0,255,65,0.1)' : '#0a0a0a',
    boxShadow: selected ? '0 0 15px rgba(0,255,65,0.1)' : 'none',
    marginBottom: '8px',
  } as React.CSSProperties),
  mapContainer: {
    position: 'relative' as const,
    flex: 1,
    backgroundColor: '#0a0a0a',
    border: '1px solid #1a1a1a',
    borderRadius: '8px',
    overflow: 'hidden',
  } as React.CSSProperties,
  mapGrid: {
    position: 'absolute' as const,
    inset: 0,
    opacity: 0.1,
    backgroundImage: 'linear-gradient(rgba(0, 255, 65, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 65, 0.3) 1px, transparent 1px)',
    backgroundSize: '30px 30px',
    pointerEvents: 'none' as const,
  } as React.CSSProperties,
  mapCenter: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: '12px',
    height: '12px',
    backgroundColor: '#00FF41',
    transform: 'translate(-50%, -50%) rotate(45deg)',
    boxShadow: '0 0 20px rgba(0,255,65,0.6)',
  } as React.CSSProperties,
  ring: (size: number, opacity: number) => ({
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: `${size}px`,
    height: `${size}px`,
    border: '1px dashed rgba(0,255,65,0.3)',
    borderRadius: '50%',
    opacity,
    pointerEvents: 'none' as const,
  } as React.CSSProperties),
  neonGreen: '#00FF41',
  neonRed: '#FF3B30',
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('LIVE OPERATIONS');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [officers, setOfficers] = useState<Map<string, OfficerState>>(new Map());
  const [selectedOfficer, setSelectedOfficer] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [supervisorId] = useState<string>('SUPERVISOR_001');

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    const newSocket = io(BRIDGE_SERVER_URL, { transports: ['websocket'], reconnection: true });

    const fetchOfficerStates = async () => {
      try {
        const response = await fetch(`${BRIDGE_SERVER_URL}/api/officers`);
        const data = await response.json();
        setOfficers((prev) => {
          const updated = new Map(prev);
          data.officers.forEach((officer: any) => {
            const existing: OfficerState = updated.get(officer.officerName) || {
              officerName: officer.officerName,
              sessionId: null,
              lastContact: new Date(),
              location: null,
              signals: [],
            };
            existing.sessionId = officer.sessionId;
            existing.lastContact = new Date(officer.lastContact);
            if (officer.location) existing.location = officer.location;
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
      fetchOfficerStates();
    });

    newSocket.on('CONTEXTUAL_SIGNALS_UPDATE', (data: { officerName: string; signals: ContextualSignal[] }) => {
      setOfficers(prev => {
        const updated = new Map(prev);
        const officer: OfficerState = updated.get(data.officerName) || {
          officerName: data.officerName, sessionId: null, lastContact: new Date(), location: null, signals: [],
        };
        officer.signals = [...officer.signals, ...data.signals].slice(-50);
        officer.lastContact = new Date();
        updated.set(data.officerName, officer);
        return updated;
      });
    });

    newSocket.on('TRIAGE_GATE_COUNTDOWN', (data: any) => {
      setOfficers(prev => {
        const updated = new Map(prev);
        const officer: OfficerState = updated.get(data.officerName) || {
          officerName: data.officerName, sessionId: null, lastContact: new Date(), location: null, signals: [],
        };
        officer.triageCountdown = { id: data.countdownId, remaining: data.remaining, dispatchPayload: data.dispatchPayload, canVeto: true };
        updated.set(data.officerName, officer);
        return updated;
      });
    });

    newSocket.on('TRIAGE_GATE_UPDATE', (data: any) => {
      setOfficers(prev => {
        const updated = new Map(prev);
        const officer = updated.get(data.officerName);
        if (officer?.triageCountdown) officer.triageCountdown.remaining = data.remaining;
        return updated;
      });
    });

    newSocket.on('TRIAGE_GATE_VETOED', (data: any) => {
      setOfficers(prev => {
        const updated = new Map(prev);
        const officer = updated.get(data.officerName);
        if (officer) officer.triageCountdown = undefined;
        return updated;
      });
    });

    newSocket.on('LIVE_FEED_HANDOFF', (data: any) => {
      setOfficers(prev => {
        const updated = new Map(prev);
        const officer: OfficerState = updated.get(data.officerName) || {
          officerName: data.officerName, sessionId: null, lastContact: new Date(), location: null, signals: [],
        };
        officer.liveStream = { streamId: data.streamId, streamUrl: data.stream.streamUrl, tacticalIntent: data.tacticalIntent, active: true };
        updated.set(data.officerName, officer);
        return updated;
      });
    });

    newSocket.on('LIVE_FEED_ENDED', (data: any) => {
      setOfficers(prev => {
        const updated = new Map(prev);
        const officer = updated.get(data.officerName);
        if (officer?.liveStream) {
          officer.liveStream.active = false;
          officer.liveStream.endedReason = data.reason;
        }
        return updated;
      });
    });

    setSocket(newSocket);
    const stateInterval = setInterval(fetchOfficerStates, 10000);
    return () => { newSocket.close(); clearInterval(stateInterval); };
  }, []);

  const handleTriageVeto = async (officerName: string, reason: string) => {
    if (!socket?.connected) return;
    try {
      await fetch(`${BRIDGE_SERVER_URL}/api/triage/veto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officerName, supervisorId, reason }),
      });
    } catch (error) {
      logger.error('Triage veto error', error);
    }
  };

  const getMapPosition = (lat: number, lng: number) => {
    const center = getDepartmentCenter();
    const latOffset = (lat - center.lat) * 1000;
    const lngOffset = (lng - center.lng) * 1000;
    return { x: 50 + lngOffset * 0.1, y: 50 - latOffset * 0.1 };
  };

  const getTimeSinceLastContact = (lastContact: Date): string => {
    const seconds = Math.floor((new Date().getTime() - lastContact.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  const selectedOfficerData = selectedOfficer ? officers.get(selectedOfficer) : null;
  const tabs = ['LIVE OPERATIONS', 'OFFICER STATUS', 'INTELLIGENCE', 'SETTINGS'];

  // Render different content based on active tab
  const renderTabContent = () => {
    if (activeTab === 'LIVE OPERATIONS') {
      return (
        <main style={styles.main}>
          {/* LEFT: Active Units */}
          <aside style={styles.card as React.CSSProperties}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>
                <span style={{ color: '#00FF41' }}>●</span> ACTIVE UNITS
              </span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#00FF41' }}>{officers.size}</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {Array.from(officers.values()).map((officer) => (
                <div
                  key={officer.officerName}
                  onClick={() => setSelectedOfficer(officer.officerName)}
                  style={styles.officerCard(selectedOfficer === officer.officerName)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px' }}>{officer.officerName}</span>
                    {officer.sessionId && (
                      <span style={{
                        fontSize: '8px',
                        padding: '2px 6px',
                        backgroundColor: 'rgba(0,255,65,0.2)',
                        color: '#00FF41',
                        borderRadius: '3px',
                        fontWeight: 700,
                      }}>ACTIVE</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#555' }}>
                    <span>Last: {getTimeSinceLastContact(officer.lastContact)}</span>
                    <span style={{ color: '#888' }}>{officer.signals.length} signals</span>
                  </div>
                  {officer.triageCountdown && (
                    <div style={{
                      marginTop: '8px',
                      padding: '6px 8px',
                      backgroundColor: 'rgba(255,59,48,0.1)',
                      border: '1px solid rgba(255,59,48,0.3)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <span style={{ width: '6px', height: '6px', backgroundColor: '#FF3B30', borderRadius: '50%' }} />
                      <span style={{ fontSize: '8px', color: '#FF3B30', fontWeight: 700 }}>
                        10-33 PENDING: {officer.triageCountdown.remaining}s
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {officers.size === 0 && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  color: '#333',
                  fontSize: '10px',
                }}>
                  <span style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.3 }}>◎</span>
                  NO ACTIVE UNITS
                </div>
              )}
            </div>
          </aside>

          {/* CENTER: Tactical Map */}
          <section style={styles.mapContainer}>
            <div style={styles.mapGrid} />

            <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10 }}>
              <span style={{ fontSize: '9px', color: '#666', fontWeight: 700, letterSpacing: '0.1em' }}>
                ◉ TACTICAL GEOMETRY
              </span>
            </div>
            <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
              <span style={{ fontSize: '9px', color: '#444' }}>CORDON: ALPHA-1</span>
            </div>

            <div style={styles.ring(100, 0.3)} />
            <div style={styles.ring(180, 0.2)} />
            <div style={styles.ring(260, 0.1)} />

            <div style={styles.mapCenter} />

            {Array.from(officers.values()).filter(o => o.location).map(officer => {
              const pos = getMapPosition(officer.location!.lat, officer.location!.lng);
              return (
                <div
                  key={officer.officerName}
                  onClick={() => setSelectedOfficer(officer.officerName)}
                  style={{
                    position: 'absolute',
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    zIndex: 20,
                  }}
                >
                  <div style={{
                    width: '10px',
                    height: '10px',
                    transform: 'rotate(45deg)',
                    border: '2px solid #00FF41',
                    backgroundColor: selectedOfficer === officer.officerName ? '#00FF41' : '#000',
                    boxShadow: '0 0 15px rgba(0,255,65,0.5)',
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    padding: '2px 6px',
                    fontSize: '7px',
                    color: '#00FF41',
                    border: '1px solid rgba(0,255,65,0.3)',
                    borderRadius: '3px',
                  }}>
                    {officer.officerName}
                  </div>
                </div>
              );
            })}

            <div style={{ position: 'absolute', bottom: '16px', left: '16px', display: 'flex', gap: '8px' }}>
              {['ROUTE', 'HISTORY'].map(btn => (
                <button key={btn} style={{
                  padding: '6px 12px',
                  fontSize: '8px',
                  fontWeight: 700,
                  backgroundColor: '#111',
                  border: '1px solid #222',
                  color: '#888',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}>{btn}</button>
              ))}
            </div>
          </section>

          {/* RIGHT: Intelligence Panel */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
            {selectedOfficerData ? (
              <>
                <div style={{ ...styles.card as React.CSSProperties, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: 'rgba(0,255,65,0.1)',
                      border: '1px solid rgba(0,255,65,0.3)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#00FF41',
                      fontSize: '14px',
                    }}>◉</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px' }}>{selectedOfficerData.officerName}</div>
                      <div style={{ fontSize: '9px', color: '#555' }}>SESSION: {selectedOfficerData.sessionId || 'N/A'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', backgroundColor: '#00FF41', borderRadius: '50%' }} />
                    <span style={{ fontSize: '9px', color: '#00FF41', fontWeight: 700 }}>STREAMING</span>
                  </div>
                </div>

                {selectedOfficerData.triageCountdown && (
                  <TriageGateCountdown
                    officerName={selectedOfficerData.officerName}
                    countdownId={selectedOfficerData.triageCountdown.id}
                    remaining={selectedOfficerData.triageCountdown.remaining}
                    dispatchPayload={selectedOfficerData.triageCountdown.dispatchPayload}
                    onVeto={handleTriageVeto}
                    supervisorId={supervisorId}
                  />
                )}

                {selectedOfficerData.liveStream?.active && (
                  <LiveFeedViewer
                    officerName={selectedOfficerData.officerName}
                    streamUrl={selectedOfficerData.liveStream.streamUrl}
                    tacticalIntent={selectedOfficerData.liveStream.tacticalIntent}
                    onClose={() => { }}
                  />
                )}

                {selectedOfficerData.signals.length > 0 && (
                  <PatternTimeline signals={selectedOfficerData.signals} officerName={selectedOfficerData.officerName} />
                )}

                {selectedOfficerData.kinematicPrediction && (
                  <KinematicPredictionAlert prediction={selectedOfficerData.kinematicPrediction} officerName={selectedOfficerData.officerName} />
                )}
              </>
            ) : (
              <div style={{
                ...styles.card as React.CSSProperties,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#333',
              }}>
                <span style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>◎</span>
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em' }}>SELECT UNIT TO VIEW INTELLIGENCE</span>
              </div>
            )}
          </aside>
        </main>
      );
    }

    // Placeholder screens for other tabs
    const placeholderLabels: Record<string, string> = {
      'OFFICER STATUS': 'OFFICER ROSTER MODULE',
      'INTELLIGENCE': 'INTELLIGENCE REPORTS',
      'SETTINGS': 'SYSTEM CONFIGURATION',
    };

    return (
      <main style={{ padding: '24px', height: 'calc(100vh - 140px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          ...styles.card as React.CSSProperties,
          width: '600px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 48px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: 'rgba(0,255,65,0.05)',
            border: '2px solid rgba(0,255,65,0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            fontSize: '28px',
            color: '#00FF41',
          }}>
            ◎
          </div>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: '#00FF41',
            marginBottom: '12px',
            textTransform: 'uppercase',
          }}>
            {placeholderLabels[activeTab]}
          </h2>
          <p style={{
            fontSize: '11px',
            color: '#555',
            letterSpacing: '0.05em',
            maxWidth: '400px',
            lineHeight: '1.6',
          }}>
            {activeTab === 'OFFICER STATUS' && 'View comprehensive officer roster with real-time status, shift schedules, and deployment assignments.'}
            {activeTab === 'INTELLIGENCE' && 'Access aggregated intelligence reports, pattern analysis, and historical incident data across all active units.'}
            {activeTab === 'SETTINGS' && 'Configure supervisor dashboard preferences, notification thresholds, and department-wide operational parameters.'}
          </p>
          <div style={{
            marginTop: '32px',
            padding: '12px 24px',
            backgroundColor: 'rgba(0,255,65,0.05)',
            border: '1px solid rgba(0,255,65,0.2)',
            borderRadius: '6px',
          }}>
            <span style={{ fontSize: '9px', color: '#00FF41', fontWeight: 700, letterSpacing: '0.1em' }}>
              MODULE IN DEVELOPMENT
            </span>
          </div>
        </div>
      </main>
    );
  };

  if (!mounted) return <div style={{ backgroundColor: '#000', height: '100vh', width: '100vw' }} />;

  return (
    <div style={styles.container}>
      {/* Global scanline effect */}
      <div className="scanline" />
      <div className="noise" />

      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>V</div>
          <span style={styles.title}>VANTUS SUPERVISOR</span>
          <div style={styles.divider} />
          <span style={{ fontSize: '10px', color: '#00FF41' }}>●</span>
          <span style={{ fontSize: '10px', color: '#666' }}>SECTOR_CENTRAL</span>
          <div style={styles.divider} />
          <span style={{ fontSize: '11px', color: '#00FF41', fontWeight: 'bold' }}>{currentTime}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={styles.statusBadge}>
            <span style={styles.statusDot(!!socket?.connected)} />
            <span style={{ fontSize: '9px', fontWeight: 700, color: socket?.connected ? '#00FF41' : '#FF3B30' }}>
              {socket?.connected ? 'BRIDGE ONLINE' : 'DISCONNECTED'}
            </span>
          </div>
          <button style={{
            padding: '6px 12px',
            fontSize: '9px',
            fontWeight: 700,
            color: '#FF3B30',
            border: '1px solid rgba(255,59,48,0.3)',
            backgroundColor: 'rgba(255,59,48,0.05)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}>
            END_SHIFT
          </button>
        </div>
      </header>

      {/* NAV TABS */}
      <nav style={styles.nav}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={styles.navButton(activeTab === tab)}
          >
            {tab}
          </button>
        ))}
      </nav>


      {/* MAIN CONTENT - TAB BASED */}
      {renderTabContent()}

      {/* Footer Terminal */}
      <SystemMessageTerminal />
    </div>
  );
}
