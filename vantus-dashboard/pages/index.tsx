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
  const [uptime, setUptime] = useState(99.98);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<Date>(new Date());

  useEffect(() => {
    setMounted(true);
    startTimeRef.current = new Date();
    
    // Update time every second
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    // Calculate uptime
    const updateUptime = () => {
      const elapsed = (Date.now() - startTimeRef.current.getTime()) / 1000 / 3600; // hours
      const uptimeValue = Math.max(99.98 - (elapsed * 0.001), 99.5);
      setUptime(parseFloat(uptimeValue.toFixed(2)));
    };
    updateUptime();
    const uptimeInterval = setInterval(updateUptime, 60000); // Update every minute

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
      clearInterval(uptimeInterval);
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
          <div className={styles.logo}>
            <div className={styles.logoIcon}>V</div>
            <div className={styles.logoText}>
              <div className={styles.logoMain}>VANTUS</div>
              <div className={styles.logoSub}>SAFETY SYSTEMS</div>
            </div>
          </div>
        </div>
        <nav className={styles.nav}>
          <a href="#" className={styles.navLink}>Interdiction Tech</a>
          <a href="#" className={styles.navLink}>Procurement</a>
          <a href="#" className={styles.navLink}>Field Results</a>
          <a href="#" className={styles.navLink}>Threat Library</a>
          <button className={styles.agentButton}>AGENT ACCESS</button>
        </nav>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Corner Brackets */}
        <div className={styles.cornerBracket} style={{ top: 0, left: 0 }}></div>
        <div className={styles.cornerBracket} style={{ top: 0, right: 0, transform: 'scaleX(-1)' }}></div>

        {/* Status Badge */}
        <div className={styles.statusBadge}>
          <span className={styles.statusDot}></span>
          <span className={styles.statusText}>
            {alertActive ? 'CRITICAL ALERT ACTIVE' : 'OPERATIONAL INTERDICTION PROTOCOL ALPHA'}
          </span>
        </div>

        {/* Hero Section */}
        <div className={styles.heroSection}>
          {alertActive ? (
            <>
              <h1 className={styles.heroTitle}>THREAT DETECTED.</h1>
              <h1 className={styles.heroTitle}>DEPLOY.</h1>
              <h1 className={styles.heroTitle}>SECURE.</h1>
              {threatData && (
                <div className={styles.alertDetails}>
                  <p className={styles.alertDetail}>
                    <strong>Officer:</strong> {threatData.officerName}
                  </p>
                  <p className={styles.alertDetail}>
                    <strong>Location:</strong> {threatData.location.lat.toFixed(4)}°N, {Math.abs(threatData.location.lng).toFixed(4)}°W
                  </p>
                  {threatData.heartRate && (
                    <p className={styles.alertDetail}>
                      <strong>Heart Rate:</strong> {threatData.heartRate} BPM
                    </p>
                  )}
                  {threatData.threatAssessment && (
                    <p className={styles.alertDetail}>
                      <strong>Threat Level:</strong> {threatData.threatAssessment.threatLevel}
                    </p>
                  )}
                </div>
              )}
              <div className={styles.alertActions}>
                <button className={styles.primaryButton} onClick={dispatchBackup}>
                  DISPATCH BACKUP
                </button>
                <button className={styles.secondaryButton} onClick={handleGenerateReport}>
                  GENERATE CASE REPORT
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className={styles.heroTitle}>DETECT.</h1>
              <h1 className={styles.heroTitle}>NEUTRALIZE.</h1>
              <h1 className={styles.heroTitle}>PROTECT.</h1>
              <p className={styles.heroDescription}>
                Real-time AI threat detection system for frontline interdiction. 
                Identify and neutralize threats in under 2 seconds.
              </p>
            </>
          )}
        </div>

        {/* Activity Feed */}
        <div className={styles.activityFeed}>
          <div className={styles.feedHeader}>
            <h3 className={styles.feedTitle}>ACTIVITY LOG</h3>
            <div className={styles.feedStatus}>
              <span className={styles.feedDot}></span>
              LIVE
            </div>
          </div>
          <div className={styles.feedContent}>
            {feedEntries.length === 0 ? (
              <div className={styles.feedEmpty}>
                <p>Waiting for activity...</p>
              </div>
            ) : (
              feedEntries.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className={`${styles.feedEntry} ${styles[`feedEntry${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}`]}`}
                >
                  <span className={styles.feedTime}>
                    [{new Date(entry.timestamp).toLocaleTimeString('en-GB', { hour12: false })}]
                  </span>
                  <span className={styles.feedMessage}>{entry.message}</span>
                  {entry.officerName && entry.location && (
                    <span className={styles.feedLocation}>
                      {entry.location.lat.toFixed(4)}N, {entry.location.lng.toFixed(4)}W
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Status Panel - Bottom Left */}
        <div className={styles.statusPanel}>
          <div className={styles.statusItem}>
            <span className={styles.statusIcon}>⚡</span>
            <span className={styles.statusLabel}>SENSORS:</span>
            <span className={styles.statusValue}>
              {socket?.connected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          {threatData ? (
            <>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>LAT:</span>
                <span className={styles.statusValue}>{threatData.location.lat.toFixed(4)}° N</span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>LON:</span>
                <span className={styles.statusValue}>{Math.abs(threatData.location.lng).toFixed(4)}° W</span>
              </div>
            </>
          ) : (
            <>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>LAT:</span>
                <span className={styles.statusValue}>49.8951° N</span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>LON:</span>
                <span className={styles.statusValue}>97.1384° W</span>
              </div>
            </>
          )}
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>UPTIME:</span>
            <span className={styles.statusValue}>{uptime}%</span>
          </div>
        </div>

        {/* Vertical Text - Left Edge */}
        <div className={styles.verticalText}>VANTUS_CORE_</div>
      </main>
    </div>
  );
}
