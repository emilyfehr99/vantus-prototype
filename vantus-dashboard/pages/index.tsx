import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import styles from '../styles/Dashboard.module.css';
import { generateCaseReport } from '../utils/pdfGenerator';

// Bridge server URL - update this to match your server
const BRIDGE_SERVER_URL = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:3001';

interface ThreatData {
  officerName: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  heartRate?: number;
  threatAssessment?: any;
  alertId?: string;
}

interface FeedEntry {
  id: string;
  type: 'alert' | 'clear' | 'status';
  officerName?: string;
  location?: { lat: number; lng: number };
  timestamp: string;
  message: string;
}

export default function Dashboard() {
  const [alertActive, setAlertActive] = useState(false);
  const [threatData, setThreatData] = useState<ThreatData | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [feedEntries, setFeedEntries] = useState<FeedEntry[]>([]);
  const [officers, setOfficers] = useState<Map<string, ThreatData>>(new Map());
  const [currentTime, setCurrentTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
      console.log('Dashboard connected to bridge server');
      addFeedEntry({
        type: 'status',
        message: 'System connected to bridge server',
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Dashboard disconnected from bridge server');
      addFeedEntry({
        type: 'status',
        message: 'Connection lost - attempting to reconnect...',
      });
    });

    // Listen for DASHBOARD_ALERT
    newSocket.on('DASHBOARD_ALERT', (data: ThreatData) => {
      console.log('DASHBOARD_ALERT received:', data);
      setThreatData(data);
      setAlertActive(true);
      
      setOfficers(prev => new Map(prev).set(data.officerName, data));
      
      addFeedEntry({
        type: 'alert',
        officerName: data.officerName,
        location: data.location,
        message: `CRITICAL: ${data.officerName} - WEAPON DETECTED`,
      });
      
      if (audioRef.current) {
        audioRef.current.play().catch(err => {
          console.error('Error playing alert sound:', err);
        });
      }
    });

    // Listen for DASHBOARD_CLEAR
    newSocket.on('DASHBOARD_CLEAR', () => {
      console.log('DASHBOARD_CLEAR received');
      setAlertActive(false);
      setThreatData(null);
      
      addFeedEntry({
        type: 'clear',
        message: 'Alert cleared - All systems secure',
      });
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      clearInterval(timeInterval);
    };
  }, []);

  const addFeedEntry = (entry: Omit<FeedEntry, 'id' | 'timestamp'>) => {
    const newEntry: FeedEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    setFeedEntries(prev => [newEntry, ...prev].slice(0, 50));
  };

  // Convert GPS coordinates to map position (Winnipeg area)
  const getMapPosition = (lat: number, lng: number) => {
    const baseLat = 49.8951;
    const baseLng = -97.1384;
    const latOffset = (lat - baseLat) * 1000;
    const lngOffset = (lng - baseLng) * 1000;
    
    return {
      x: 50 + lngOffset * 0.1,
      y: 50 - latOffset * 0.1,
    };
  };

  // Dispatch backup to officer
  const dispatchBackup = () => {
    if (!threatData || !socket || !socket.connected) {
      alert('No active alert or connection unavailable');
      return;
    }

    const backupData = {
      officerName: threatData.officerName,
      priority: 1,
      eta: 4,
      message: `Officer ${threatData.officerName}, Priority 1 Backup is en route. ETA 4 minutes.`
    };

    socket.emit('DISPATCH_BACKUP', backupData);
    
    addFeedEntry({
      type: 'status',
      message: `Backup dispatched to ${threatData.officerName}`,
    });
  };

  // Generate forensic case report
  const handleGenerateReport = async () => {
    if (!threatData) {
      alert('No alert data available to generate report');
      return;
    }

    try {
      await generateCaseReport(threatData, feedEntries);
      addFeedEntry({
        type: 'status',
        message: `Forensic case report generated for alert ${threatData.alertId || 'N/A'}`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please allow popups and try again.');
    }
  };

  return (
    <div className={styles.dashboard}>
      <audio
        ref={audioRef}
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        loop
        preload="auto"
      />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logoContainer}>
            <img 
              src="/vantus-logo.png" 
              alt="Vantus Safety Systems" 
              className={styles.logo}
            />
          </div>
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
          {alertActive ? (
            <div className={styles.alertBanner}>
              <span className={styles.alertPulse}></span>
              CRITICAL ALERT ACTIVE
            </div>
          ) : (
            <div className={styles.secureBanner}>
              SYSTEM SECURE
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Tactical Map */}
        <div className={styles.mapContainer}>
          <div ref={mapRef} className={styles.tacticalMap}>
            {/* Grid overlay */}
            <div className={styles.gridOverlay}></div>
            
            {/* Map center marker */}
            <div className={styles.mapCenter}>
              <div className={styles.centerMarker}></div>
              <div className={styles.centerLabel}>OPERATIONS CENTER</div>
            </div>

            {/* Officer markers */}
            {Array.from(officers.entries()).map(([name, data]) => {
              const pos = getMapPosition(data.location.lat, data.location.lng);
              const isAlert = alertActive && threatData?.officerName === name;
              
              return (
                <div
                  key={name}
                  className={`${styles.officerMarker} ${isAlert ? styles.alertMarker : ''}`}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                  }}
                >
                  <div className={styles.markerPulse}></div>
                  <div className={styles.markerIcon}>
                    {isAlert ? '⚠' : '👤'}
                  </div>
                  <div className={styles.markerLabel}>{name}</div>
                  {isAlert && <div className={styles.alertRipple}></div>}
                </div>
              );
            })}

            {/* Threat alert overlay */}
            {alertActive && threatData && (
              <div className={styles.alertOverlay}>
                <div className={styles.alertFlash}></div>
                <div className={styles.alertInfo}>
                  <h2>CRITICAL THREAT DETECTED</h2>
                  <p>Officer: {threatData.officerName}</p>
                  <p>Location: {threatData.location.lat.toFixed(4)}, {threatData.location.lng.toFixed(4)}</p>
                  {threatData.heartRate && (
                    <p>Heart Rate: {threatData.heartRate} BPM</p>
                  )}
                  {threatData.threatAssessment && (
                    <p>Threat Level: {threatData.threatAssessment.threatLevel}</p>
                  )}
                  <div className={styles.alertActions}>
                    <button 
                      className={styles.actionButton}
                      onClick={dispatchBackup}
                    >
                      DISPATCH BACKUP
                    </button>
                    <button 
                      className={styles.actionButton}
                      onClick={handleGenerateReport}
                    >
                      GENERATE CASE REPORT
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Map coordinates display */}
            <div className={styles.mapCoords}>
              <div className={styles.coordLabel}>GRID REFERENCE</div>
              <div className={styles.coordValue}>
                {threatData 
                  ? `${threatData.location.lat.toFixed(4)}°N, ${threatData.location.lng.toFixed(4)}°W`
                  : '49.8951°N, 97.1384°W'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Feed Panel */}
        <div className={styles.feedPanel}>
          <div className={styles.feedHeader}>
            <h2>ACTIVITY LOG</h2>
            <div className={styles.feedStatus}>
              <span className={styles.feedDot}></span>
              LIVE
            </div>
          </div>
          
          <div className={styles.feedContent}>
            {feedEntries.length === 0 ? (
              <div className={styles.feedEmpty}>
                <p>Waiting for activity...</p>
                <p className={styles.feedEmptySub}>System monitoring active</p>
              </div>
            ) : (
              feedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={`${styles.feedEntry} ${styles[`feedEntry${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}`]}`}
                >
                  <span className={styles.feedTimestamp}>
                    [{new Date(entry.timestamp).toLocaleTimeString('en-GB', { hour12: false })}]
                  </span>
                  <div className={styles.feedMessage}>
                    <span className={styles.feedType}>
                      {entry.message}
                    </span>
                    {entry.officerName && (
                      <span className={styles.feedDetails}>
                        Geotag: {entry.location ? `${entry.location.lat.toFixed(4)}N, ${entry.location.lng.toFixed(4)}W` : 'N/A'} {/* ANALYST_TOKEN: */} {Math.random().toString(36).substr(2, 5).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Feed Footer Stats */}
          <div className={styles.feedFooter}>
            <div className={styles.feedStat}>
              <span className={styles.feedStatLabel}>Active Officers:</span>
              <span className={styles.feedStatValue}>{officers.size}</span>
            </div>
            <div className={styles.feedStat}>
              <span className={styles.feedStatLabel}>Alerts Today:</span>
              <span className={styles.feedStatValue}>
                {feedEntries.filter(e => e.type === 'alert').length}
              </span>
            </div>
            <div className={styles.feedStat}>
              <span className={styles.feedStatLabel}>System Status:</span>
              <span className={`${styles.feedStatValue} ${alertActive ? styles.statAlert : styles.statSecure}`}>
                {alertActive ? 'ALERT' : 'SECURE'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
