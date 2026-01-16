
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import logger from '../utils/logger';

// Components
import PatternTimeline from '../components/PatternTimeline';
import TriageGateCountdown from '../components/TriageGateCountdown';
import LiveFeedViewer from '../components/LiveFeedViewer';
import PeripheralThreatDisplay from '../components/PeripheralThreatDisplay';
import KinematicPredictionAlert from '../components/KinematicPredictionAlert';
import DeEscalationStatusIndicator from '../components/DeEscalationStatusIndicator';
import FactTimelineView from '../components/FactTimelineView';
import DictationCommandLog from '../components/DictationCommandLog';
import SystemMessageTerminal from '../components/SystemMessageTerminal';

// Bridge server URL - update this to match your server
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
  const [activeTab, setActiveTab] = useState('LIVE OPERATIONS');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [officers, setOfficers] = useState<Map<string, OfficerState>>(new Map());
  const [selectedOfficer, setSelectedOfficer] = useState<string | null>(null);
  const [flaggedSignals, setFlaggedSignals] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [supervisorId] = useState<string>('SUPERVISOR_001'); // Would come from auth
  const mapRef = useRef<HTMLDivElement>(null);

  // Update time for header
  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // Socket & Data Fetching Effect
  useEffect(() => {
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
      fetchOfficerStates().catch(err => logger.error('Failed to fetch initial officer states', err));
    });

    newSocket.on('CONTEXTUAL_SIGNALS_UPDATE', (data: { officerName: string; signals: ContextualSignal[]; timestamp: string }) => {
      setOfficers(prev => {
        const updated = new Map(prev);
        const officer = updated.get(data.officerName) || {
          officerName: data.officerName,
          sessionId: null,
          lastContact: new Date(),
          location: null,
          signals: [],
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

    newSocket.on('TRIAGE_GATE_UPDATE', (data: any) => {
      setOfficers(prev => {
        const updated = new Map(prev);
        const officer = updated.get(data.officerName);
        if (officer && officer.triageCountdown) {
          officer.triageCountdown.remaining = data.remaining;
        }
        return updated;
      });
    });

    newSocket.on('TRIAGE_GATE_VETOED', (data: any) => {
      setOfficers(prev => {
        const updated = new Map(prev);
        const officer = updated.get(data.officerName);
        if (officer && officer.triageCountdown) {
          officer.triageCountdown = undefined;
        }
        return updated;
      });
    });

    newSocket.on('LIVE_FEED_HANDOFF', (data: any) => {
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

    newSocket.on('LIVE_FEED_ENDED', (data: any) => {
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

    setSocket(newSocket);
    const stateInterval = setInterval(fetchOfficerStates, 10000);

    return () => {
      newSocket.close();
      clearInterval(stateInterval);
    };
  }, []); // End Socket Effect

  // Triage Veto Handler
  const handleTriageVeto = async (officerName: string, reason: string) => {
    if (!socket || !socket.connected) return;
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

  // Map Position Helper
  const getMapPosition = (lat: number, lng: number) => {
    const center = getDepartmentCenter();
    const latOffset = (lat - center.lat) * 1000;
    const lngOffset = (lng - center.lng) * 1000;
    return { x: 50 + lngOffset * 0.1, y: 50 - latOffset * 0.1 };
  };

  // Helper for Last Contact
  const getTimeSinceLastContact = (lastContact: Date): string => {
    const seconds = Math.floor((new Date().getTime() - lastContact.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  const getSignalColor = (signal: ContextualSignal): string => {
    const prob = signal.probability;
    if (prob > 0.7) return '#FFAA00';
    if (prob > 0.5) return '#FFD700';
    return '#00FF41';
  };

  const selectedOfficerData = selectedOfficer ? officers.get(selectedOfficer) : null;

  // --- RENDER CONTENT BASED ON TAB ---
  const renderContent = () => {
    switch (activeTab) {
      case 'LIVE OPERATIONS':
        return (
          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-250px)]">
            {/* LEFT COL: ACTIVE UNITS LIST */}
            <div className="col-span-3 bg-black/50 border border-gray-900 flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b border-gray-900 bg-black flex justify-between items-center">
                <h3 className="font-mono text-gray-500 text-xs tracking-widest uppercase">Active Units</h3>
                <span className="text-neon-green font-mono font-bold">{officers.size}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {Array.from(officers.values()).map((officer) => (
                  <div
                    key={officer.officerName}
                    onClick={() => setSelectedOfficer(officer.officerName)}
                    className={`p-3 border cursor-pointer transition-all ${selectedOfficer === officer.officerName ? 'bg-green-900/20 border-neon-green' : 'bg-transparent border-gray-800 hover:border-gray-600'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono font-bold text-white text-sm">{officer.officerName}</span>
                      {officer.sessionId && <span className="text-[10px] bg-green-900/40 text-neon-green px-1 rounded animate-pulse">ACTIVE</span>}
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                      <span>Signal: {getTimeSinceLastContact(officer.lastContact)}</span>
                      {officer.signals.length > 0 && <span className="text-white">{officer.signals.length} Events</span>}
                    </div>
                  </div>
                ))}
                {officers.size === 0 && (
                  <div className="text-center py-10 text-gray-600 font-mono text-xs">NO ACTIVE UNITS CONNECTED</div>
                )}
              </div>
            </div>

            {/* MIDDLE COL: TACTICAL MAP */}
            <div className="col-span-5 bg-black border border-gray-900 relative overflow-hidden group">
              <div className="absolute inset-0 grid-overlay opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 65, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 65, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
              <div className="absolute top-4 left-4 z-10">
                <h3 className="font-mono text-gray-500 text-xs tracking-widest uppercase">TACTICAL GEOMETRY</h3>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-gray-800 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                </div>
              </div>
              {/* Officer Markers */}
              {Array.from(officers.values()).filter(o => o.location).map(officer => {
                const pos = getMapPosition(officer.location!.lat, officer.location!.lng);
                return (
                  <div
                    key={officer.officerName}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-1000 ease-linear"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    onClick={() => setSelectedOfficer(officer.officerName)}
                  >
                    <div className={`w-3 h-3 rotate-45 border-2 ${selectedOfficer === officer.officerName ? 'bg-neon-green border-white' : 'bg-black border-neon-green'} shadow-[0_0_10px_rgba(0,255,65,0.5)]`}></div>
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-black/80 px-1 py-0.5 text-[8px] font-mono text-neon-green border border-green-900 rounded">{officer.officerName}</div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT COL: SIGNAL DETAIL & INTELLIGENCE */}
            <div className="col-span-4 flex flex-col gap-4 overflow-y-auto pr-2 pb-20">
              {selectedOfficerData ? (
                <>
                  <div className="flex justify-between items-center bg-black border border-green-900 p-2 mb-2">
                    <h3 className="font-bold text-white text-sm tracking-wide">UNIT: {selectedOfficerData.officerName}</h3>
                    <span className="text-[10px] font-mono text-gray-400">SESSION: {selectedOfficerData.sessionId || 'N/A'}</span>
                  </div>

                  {/* TRIAGE GATE */}
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

                  {/* LIVE FEED */}
                  {selectedOfficerData.liveStream && selectedOfficerData.liveStream.active && (
                    <LiveFeedViewer
                      officerName={selectedOfficerData.officerName}
                      streamUrl={selectedOfficerData.liveStream.streamUrl}
                      tacticalIntent={selectedOfficerData.liveStream.tacticalIntent}
                      onClose={() => {
                        /* Handle close local state if needed, but ideally driven by server */
                      }}
                    />
                  )}

                  {/* TIMELINE */}
                  {selectedOfficerData.signals.length > 0 && (
                    <PatternTimeline signals={selectedOfficerData.signals} officerName={selectedOfficerData.officerName} />
                  )}

                  {/* ALERTS */}
                  {selectedOfficerData.kinematicPrediction && (
                    <KinematicPredictionAlert prediction={selectedOfficerData.kinematicPrediction} officerName={selectedOfficerData.officerName} />
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full border border-gray-900 border-dashed text-gray-600 font-mono text-xs">
                  SELECT A UNIT TO VIEW INTELLIGENCE
                </div>
              )}
            </div>
          </div>
        );
      case 'OFFICER STATUS':
        return (
          <div className="flex items-center justify-center h-96 border border-gray-900 bg-black/50 text-gray-500 font-mono">
            [ OFFICER ROSTER MODULE - CONNECTING... ]
          </div>
        );
      case 'INTELLIGENCE':
        return (
          <div className="flex items-center justify-center h-96 border border-gray-900 bg-black/50 text-gray-500 font-mono">
            [ INTELLIGENCE REPORTS - UNAVAILABLE IN DEMO MODE ]
          </div>
        );
      case 'SETTINGS':
        return (
          <div className="flex items-center justify-center h-96 border border-gray-900 bg-black/50 text-gray-500 font-mono">
            [ SYSTEM CONFIGURATION - ACCESS RESTRICTED ]
          </div>
        );
      default:
        return null;
    }
  };

  const tabs = [
    'LIVE OPERATIONS',
    'OFFICER STATUS',
    'INTELLIGENCE',
    'SETTINGS',
  ];

  if (!mounted) return <div className="bg-black h-screen w-screen"></div>;

  return (
    <div className="min-h-screen bg-black text-white font-mono pb-12 overflow-hidden selection:bg-green-500 selection:text-black">
      {/* GLOBAL BACKGROUND EFFECTS */}
      <div className="scanline"></div>
      <div className="noise"></div>

      {/* HEADER */}
      <header className="border-b border-gray-900 px-6 py-4 flex items-center justify-between bg-black/95 backdrop-blur-md z-10 relative">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-[0.2em] text-white italic">VANTUS</h1>
            <span className="text-[10px] tracking-[0.3em] text-gray-500 font-bold uppercase ml-1">Supervisor Portal</span>
          </div>
          <div className="h-8 w-px bg-gray-800 mx-4"></div>
          <div className="flex items-center gap-2 border border-gray-800 px-3 py-1 rounded bg-black">
            <span className={`w-2 h-2 rounded-full ${socket?.connected ? 'bg-neon-green animate-pulse' : 'bg-red-500'}`}></span>
            <span className={`font-bold text-xs tracking-wider ${socket?.connected ? 'text-neon-green' : 'text-red-500'}`}>
              {socket?.connected ? 'ONLINE' : 'DISCONNECTED'}
            </span>
            <span className="text-gray-600 text-xs ml-2 tracking-widest border-l border-gray-800 pl-2">{currentTime}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 border border-yellow-900/30 bg-yellow-900/10 rounded">
            <span className="text-yellow-500 text-[10px] tracking-wider uppercase font-bold">⚠ Non-Diagnostic Signals</span>
          </div>
          <div className="border border-green-500/50 px-3 py-1 bg-green-900/10 shadow-[0_0_10px_rgba(0,255,65,0.1)]">
            <span className="text-green-500 font-bold text-xs tracking-wider">SECURE LINK v2.0</span>
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <nav className="border-b border-gray-900 px-6 flex items-center gap-1 bg-black z-10 relative">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-6 text-xs font-bold tracking-widest transition-all relative clip-path-slant ${activeTab === tab
              ? 'text-black bg-neon-green'
              : 'text-gray-500 hover:text-white hover:bg-gray-900'
              }`}
            style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* MAIN CONTENT */}
      <main className="p-6 max-w-[1920px] mx-auto z-0 relative h-full">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-widest text-white uppercase flex items-center gap-3">
            <span className="w-1 h-6 bg-neon-green block"></span>
            {activeTab}
          </h2>
        </div>

        <div className="animate-fadeIn">
          {renderContent()}
        </div>
      </main>

      {/* SYSTEM TERMINAL FOOTER */}
      <SystemMessageTerminal />
    </div>
  );
}
