import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Animated, Dimensions, Platform, StatusBar } from 'react-native';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// --- Constants ---
const COLORS = {
  BLACK: '#000000',
  NEUTRAL_950: '#0a0a0a',
  NEUTRAL_900: '#171717',
  NEUTRAL_800: '#262626',
  NEUTRAL_700: '#404040',
  NEUTRAL_500: '#737373',
  NEUTRAL_400: '#a3a3a3',
  NEON_GREEN: '#00FF41',
  NEON_RED: '#FF3B30',
  ORANGE: '#F97316',
  WHITE: '#FFFFFF',
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- Mock Data Generators ---
const generateTimestamp = () => {
  const now = new Date();
  return now.toISOString().split('T')[1].slice(0, 12);
};

// --- Components ---

const Scanline = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_HEIGHT, SCREEN_HEIGHT],
  });

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Animated.View
        style={{
          width: '100%',
          height: 80,
          backgroundColor: COLORS.NEON_GREEN,
          opacity: 0.08,
          transform: [{ translateY }],
        }}
      />
    </View>
  );
};

const ThreatEscalationTracker = ({ peaks }) => {
  return (
    <View style={styles.trackerContainer}>
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Feather name="trending-up" size={10} color={COLORS.NEON_GREEN} />
          <Text style={styles.label}>THREAT PROGRESSION</Text>
        </View>
        <Text style={styles.value}>ESC: {(peaks[peaks.length - 1]?.level || 0).toFixed(0)}%</Text>
      </View>
      <View style={styles.barsContainer}>
        {peaks.slice(-30).map((peak, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height: `${Math.max(peak.level, 5)}%`,
                backgroundColor: peak.level > 80 ? COLORS.NEON_RED : peak.level > 50 ? COLORS.ORANGE : COLORS.NEON_GREEN,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

// Custom Tactical Map (No external dependencies)
const TacticalGroundingMap = ({ state, location }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.mapOuterContainer}>
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Feather name="globe" size={10} color={COLORS.NEON_GREEN} />
          <Text style={styles.label}>TACTICAL GROUNDING</Text>
        </View>
        <Text style={styles.label}>CORDON: ALPHA-1</Text>
      </View>

      <View style={styles.mapContainer}>
        {/* Grid Background */}
        <View style={styles.mapGrid} />

        {/* Cordon Rings */}
        <View style={[styles.ring, { width: 60, height: 60, borderRadius: 30 }]} />
        <Animated.View style={[styles.ring, { width: 100, height: 100, borderRadius: 50, opacity: 0.15, transform: [{ scale: pulseAnim }] }]} />
        <View style={[styles.ring, { width: 140, height: 140, borderRadius: 70, opacity: 0.05 }]} />

        {/* Self Marker (Center) */}
        <View style={styles.selfMarker}>
          <View style={styles.markerInner} />
        </View>

        {/* Backup Unit Marker (CODE_3 only) */}
        {state === 'CODE_3' && (
          <View style={styles.backupMarkerContainer}>
            <View style={styles.backupMarker} />
            <Text style={styles.backupLabel}>UNIT_4B-08</Text>
          </View>
        )}

        {/* Location Text */}
        <View style={styles.mapLocationLabel}>
          <Feather name="map-pin" size={8} color={COLORS.NEON_GREEN} />
          <Text style={styles.mapLocationText}>
            {location ? `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}` : 'GPS SYNC...'}
          </Text>
        </View>
      </View>

      <View style={styles.mapButtons}>
        <TouchableOpacity style={styles.mapBtn}>
          <Feather name="navigation" size={10} color={COLORS.WHITE} />
          <Text style={styles.mapBtnText}>ROUTE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapBtn}>
          <Feather name="search" size={10} color={COLORS.WHITE} />
          <Text style={styles.mapBtnText}>HISTORY</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const DeploymentNodesPanel = ({ state }) => {
  return (
    <View style={styles.panelContainer}>
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Feather name="radio" size={10} color={COLORS.NEON_GREEN} />
          <Text style={styles.label}>DEPLOYMENT NODES</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.indicator, { opacity: 0.2 }]} />
          ))}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={styles.nodeItem}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.nodeDot, { backgroundColor: COLORS.NEON_GREEN }]} />
            <Text style={styles.nodeLabel}>NODE_ALPHA-1</Text>
          </View>
          <Text style={styles.nodeStatus}>SYNCED</Text>
        </View>

        {state === 'CODE_3' && (
          <View style={[styles.nodeItem, styles.nodeItemAlert]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[styles.nodeDot, { backgroundColor: COLORS.NEON_RED }]} />
              <Text style={[styles.nodeLabel, { color: COLORS.NEON_RED }]}>BACKUP_ETA_90S</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.advisorBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <Feather name="volume-2" size={10} color={COLORS.NEON_GREEN} />
          <Text style={[styles.label, { color: COLORS.NEON_GREEN }]}>VANTUS ADVISOR</Text>
        </View>
        <Text style={styles.advisorText}>
          {state === 'CODE_3'
            ? 'Alert: Cordon Alpha-1 is being reinforced. Maintain 360 overwatch.'
            : 'Scanning sector. Stress patterns nominal. GPS precision synchronized.'}
        </Text>
      </View>
    </View>
  );
};

const SettingsPanel = ({ thresholds, setThresholds }) => {
  return (
    <View style={styles.settingsContainer}>
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Feather name="settings" size={10} color={COLORS.NEON_GREEN} />
          <Text style={styles.label}>ALERT CONFIG</Text>
        </View>
      </View>

      {[
        { key: 'weaponDetection', label: 'Weapon Sensitivity', icon: 'crosshair' },
        { key: 'vocalStress', label: 'Vocal Stress', icon: 'mic' },
        { key: 'postureAnomaly', label: 'Posture Anomaly', icon: 'activity' },
      ].map((item) => (
        <View key={item.key} style={styles.sliderRow}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Feather name={item.icon} size={8} color={COLORS.NEUTRAL_500} />
              <Text style={styles.sliderLabel}>{item.label}</Text>
            </View>
            <Text style={[styles.sliderLabel, { color: COLORS.NEON_GREEN }]}>{thresholds[item.key]}%</Text>
          </View>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${thresholds[item.key]}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
};

// --- Main App ---
export default function App() {
  const [state, setState] = useState('IDLE');
  const [logs, setLogs] = useState([]);
  const [time, setTime] = useState('');
  const [timer, setTimer] = useState(10);
  const [isMuted, setIsMuted] = useState(false);
  const [threatPeaks, setThreatPeaks] = useState([]);
  const [thresholds, setThresholds] = useState({
    weaponDetection: 85,
    vocalStress: 70,
    postureAnomaly: 60,
  });
  const [hasPermission, setHasPermission] = useState(null);
  const [location, setLocation] = useState(null);
  const cameraRef = useRef(null);

  // Permissions
  useEffect(() => {
    (async () => {
      const { status: camStatus } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(camStatus === 'granted');

      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
    })();
  }, []);

  // Time & Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour12: false }));

      setThreatPeaks((prev) => {
        const baseLevel = state === 'CODE_3' ? 90 : state === 'THREAT' ? 75 : state === 'SUSPICIOUS' ? 40 : 10;
        const newPeak = {
          timestamp: Date.now(),
          level: Math.min(100, Math.max(0, baseLevel + (Math.random() * 15 - 5))),
        };
        return [...prev, newPeak].slice(-50);
      });
    }, 1000);

    addLog('SYS', 'Operational Terminal Initialized v5.0.5', 'low');
    addLog('SYS', 'Dynamic Cordon Generation: Sector 4-B ACTIVE', 'low');

    return () => clearInterval(interval);
  }, [state]);

  const addLog = (source, message, severity = 'low') => {
    const newLog = {
      id: Math.random().toString(36),
      timestamp: generateTimestamp(),
      source,
      message,
      severity,
    };
    setLogs((prev) => [newLog, ...prev].slice(0, 50));
  };

  const triggerThreat = () => {
    setState('THREAT');
    addLog('CV', 'WEAPON SIGNATURE DETECTED: 92% PROBABILITY', 'high');
    addLog('NLP', `High-Arousal detected (Threshold: ${thresholds.vocalStress}%)`, 'high');
    setTimer(10);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Threat Escalation Timer
  useEffect(() => {
    let interval;
    if (state === 'THREAT' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (state === 'THREAT' && timer === 0) {
      setState('CODE_3');
      addLog('SYS', 'SILENT 10-33: BACKUP DISPATCHED', 'high');
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    }
    return () => clearInterval(interval);
  }, [state, timer]);

  if (hasPermission === null) {
    return <View style={styles.container} />;
  }
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'white' }}>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Scanline />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>V</Text>
          </View>
          <Text style={styles.headerTitle}>VANTUS TACTICAL</Text>
          <View style={styles.divider} />
          <Feather name="map-pin" size={10} color={COLORS.NEON_GREEN} />
          <Text style={styles.headerInfoText}>SECTOR_4-B</Text>
          <Feather name="clock" size={10} color={COLORS.NEON_GREEN} style={{ marginLeft: 8 }} />
          <Text style={styles.clockText}>{time}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setIsMuted(!isMuted)}>
            <Feather name={isMuted ? 'volume-x' : 'volume-2'} size={14} color={COLORS.NEUTRAL_500} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => addLog('USER', 'Manual Clip Staged', 'low')}>
            <Feather name="mic" size={14} color={COLORS.NEUTRAL_500} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setState('IDLE')} style={styles.endWatchBtn}>
            <Text style={styles.endWatchText}>END_WATCH</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MAIN LAYOUT */}
      <View style={styles.mainContent}>
        {/* LEFT COLUMN: Tracker, Logs, Settings */}
        <View style={styles.leftColumn}>
          <View style={{ height: 100 }}>
            <ThreatEscalationTracker peaks={threatPeaks} />
          </View>
          <View style={styles.logsPanel}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name="database" size={10} color={COLORS.NEUTRAL_500} />
                <Text style={styles.label}>EVENT SCRIBE</Text>
              </View>
              <Text style={[styles.value, { color: COLORS.NEON_GREEN, opacity: 0.4 }]}>ROLL_CACHE: ON</Text>
            </View>
            <ScrollView style={{ flex: 1 }}>
              {logs.map((log) => (
                <View key={log.id} style={styles.logRow}>
                  <Text style={styles.logTime}>{log.timestamp.split(':')[2]}s</Text>
                  <Text style={[styles.logSource, { color: log.severity === 'high' ? COLORS.NEON_RED : COLORS.NEON_GREEN }]}>
                    [{log.source}]
                  </Text>
                  <Text style={styles.logMessage}>{log.message}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
          <SettingsPanel thresholds={thresholds} setThresholds={setThresholds} />
        </View>

        {/* CENTER: Camera Feed */}
        <View style={styles.centerColumn}>
          <Camera ref={cameraRef} style={styles.camera} type={Camera.Constants.Type.back} />

          {/* HUD Overlays */}
          <View style={styles.hudOverlay} pointerEvents="none">
            <View style={[styles.corner, { top: 16, left: 16, borderTopWidth: 2, borderLeftWidth: 2 }]} />
            <View style={[styles.corner, { top: 16, right: 16, borderTopWidth: 2, borderRightWidth: 2 }]} />
            <View style={[styles.corner, { bottom: 16, left: 16, borderBottomWidth: 2, borderLeftWidth: 2 }]} />
            <View style={[styles.corner, { bottom: 16, right: 16, borderBottomWidth: 2, borderRightWidth: 2 }]} />
            <View style={styles.crosshair}>
              <View style={{ width: 20, height: 1, backgroundColor: COLORS.NEON_GREEN, opacity: 0.5 }} />
              <View style={{ width: 1, height: 20, backgroundColor: COLORS.NEON_GREEN, opacity: 0.5, position: 'absolute' }} />
            </View>
            <View style={styles.camStatus}>
              <Text style={styles.statusText}>BWC_STREAM_01 // ACTIVE</Text>
              <Text style={styles.statusText}>MODE: {state}</Text>
            </View>

            {state === 'THREAT' && (
              <View style={styles.alertBox}>
                <Feather name="alert-triangle" size={32} color={COLORS.WHITE} />
                <Text style={styles.alertTitle}>SILENT 10-33 PENDING</Text>
                <Text style={styles.alertSubtitle}>Dispatch in {timer}s. Veto available.</Text>
                <TouchableOpacity onPress={() => setState('ROUTINE')} style={styles.vetoBtn}>
                  <Text style={styles.vetoBtnText}>VETO</Text>
                </TouchableOpacity>
              </View>
            )}
            {state === 'CODE_3' && <View style={[StyleSheet.absoluteFill, { borderColor: COLORS.NEON_RED, borderWidth: 4 }]} />}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: state === 'IDLE' ? COLORS.NEON_GREEN : COLORS.NEON_RED }]}
            onPress={() => (state === 'IDLE' ? setState('ROUTINE') : triggerThreat())}
          >
            {state === 'IDLE' ? <Feather name="zap" size={24} color={COLORS.BLACK} /> : <Feather name="crosshair" size={24} color={COLORS.WHITE} />}
          </TouchableOpacity>
        </View>

        {/* RIGHT COLUMN: Map & Deployment Nodes */}
        <View style={styles.rightColumn}>
          <View style={{ height: '45%' }}>
            <TacticalGroundingMap state={state} location={location} />
          </View>
          <DeploymentNodesPanel state={state} />
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={[styles.indicator, { backgroundColor: COLORS.NEON_GREEN }]} />
          <Text style={styles.footerText}>NPU: 42°C</Text>
          <View style={[styles.indicator, { backgroundColor: COLORS.NEON_GREEN, marginLeft: 8 }]} />
          <Text style={styles.footerText}>AUD: OPUS_64</Text>
          <View style={[styles.indicator, { backgroundColor: COLORS.NEON_GREEN, marginLeft: 8 }]} />
          <Text style={styles.footerText}>GPS: 0.1m</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={[styles.footerText, { color: COLORS.WHITE, fontWeight: 'bold' }]}>VANTUS_SECURE_KERNEL v5.0.5</Text>
          <View style={[styles.indicator, { backgroundColor: COLORS.NEON_GREEN }]} />
        </View>
      </View>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BLACK },
  header: {
    height: 50,
    backgroundColor: COLORS.NEUTRAL_950,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.NEUTRAL_800,
    marginTop: Platform.OS === 'ios' ? 44 : 0,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 18, height: 18, backgroundColor: COLORS.WHITE, alignItems: 'center', justifyContent: 'center', borderRadius: 2 },
  logoText: { fontWeight: '900', fontSize: 10, color: COLORS.BLACK },
  headerTitle: { color: COLORS.WHITE, fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
  divider: { width: 1, height: 14, backgroundColor: COLORS.NEUTRAL_700, marginHorizontal: 4 },
  headerInfoText: { color: COLORS.NEUTRAL_500, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  clockText: { color: COLORS.NEON_GREEN, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: 'bold' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  endWatchBtn: { paddingHorizontal: 6, paddingVertical: 3, backgroundColor: 'rgba(255, 59, 48, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 59, 48, 0.3)', borderRadius: 2 },
  endWatchText: { color: COLORS.NEON_RED, fontSize: 8, fontWeight: 'bold' },
  mainContent: { flex: 1, flexDirection: 'row', padding: 8, gap: 8 },
  leftColumn: { width: SCREEN_WIDTH * 0.25, flexDirection: 'column', gap: 8 },
  centerColumn: { flex: 1, position: 'relative', borderWidth: 1, borderColor: COLORS.NEUTRAL_800, overflow: 'hidden' },
  rightColumn: { width: SCREEN_WIDTH * 0.25, flexDirection: 'column', gap: 8 },
  camera: { flex: 1 },
  hudOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  corner: { position: 'absolute', width: 16, height: 16, borderColor: COLORS.NEON_GREEN },
  crosshair: { alignItems: 'center', justifyContent: 'center' },
  camStatus: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4 },
  statusText: { color: COLORS.NEON_GREEN, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 9, fontWeight: 'bold' },
  alertBox: { position: 'absolute', backgroundColor: COLORS.NEON_RED, padding: 16, alignItems: 'center', borderRadius: 4, shadowColor: COLORS.NEON_RED, shadowOpacity: 0.5, shadowRadius: 20 },
  alertTitle: { color: COLORS.WHITE, fontWeight: '900', fontSize: 14, marginTop: 4 },
  alertSubtitle: { color: COLORS.WHITE, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10 },
  vetoBtn: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: COLORS.WHITE },
  vetoBtnText: { color: COLORS.BLACK, fontWeight: '900', fontSize: 10 },
  actionButton: { position: 'absolute', bottom: 16, right: 16, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  trackerContainer: { flex: 1, backgroundColor: COLORS.NEUTRAL_950, borderWidth: 1, borderColor: COLORS.NEUTRAL_800, padding: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: COLORS.NEUTRAL_500, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: 'bold', letterSpacing: 1 },
  value: { color: COLORS.NEUTRAL_500, fontSize: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  barsContainer: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 1 },
  bar: { flex: 1, minWidth: 2, borderTopLeftRadius: 1, borderTopRightRadius: 1 },
  logsPanel: { flex: 1, backgroundColor: COLORS.NEUTRAL_950, borderWidth: 1, borderColor: COLORS.NEUTRAL_800, padding: 8 },
  logRow: { flexDirection: 'row', marginBottom: 2, flexWrap: 'wrap' },
  logTime: { color: COLORS.NEUTRAL_700, fontSize: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginRight: 4 },
  logSource: { fontSize: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: 'bold', marginRight: 4 },
  logMessage: { color: COLORS.NEUTRAL_400, fontSize: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', flex: 1 },
  settingsContainer: { backgroundColor: COLORS.NEUTRAL_950, borderWidth: 1, borderColor: COLORS.NEUTRAL_800, padding: 8 },
  sliderRow: { marginBottom: 8 },
  sliderLabel: { color: COLORS.NEUTRAL_500, fontSize: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  sliderTrack: { height: 4, backgroundColor: COLORS.NEUTRAL_800, marginTop: 4, borderRadius: 2 },
  sliderFill: { height: '100%', backgroundColor: COLORS.NEON_GREEN, borderRadius: 2 },
  mapOuterContainer: { flex: 1, backgroundColor: COLORS.NEUTRAL_950, borderWidth: 1, borderColor: COLORS.NEUTRAL_800, padding: 8 },
  mapContainer: { flex: 1, backgroundColor: COLORS.NEUTRAL_900, borderRadius: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  mapGrid: { ...StyleSheet.absoluteFillObject, opacity: 0.15, borderWidth: 20, borderColor: 'transparent', borderStyle: 'dashed' },
  mapButtons: { flexDirection: 'row', gap: 4, marginTop: 6 },
  mapBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 4, backgroundColor: COLORS.NEUTRAL_900, borderWidth: 1, borderColor: COLORS.NEUTRAL_800 },
  mapBtnText: { color: COLORS.WHITE, fontSize: 8, fontWeight: 'bold' },
  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(0, 255, 65, 0.25)', borderStyle: 'dashed' },
  selfMarker: { width: 12, height: 12, backgroundColor: COLORS.NEON_GREEN, transform: [{ rotate: '45deg' }], alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.NEON_GREEN, shadowRadius: 10, shadowOpacity: 0.8, elevation: 3 },
  markerInner: { width: 4, height: 4, backgroundColor: COLORS.BLACK, borderRadius: 2 },
  backupMarkerContainer: { position: 'absolute', top: '25%', right: '25%', alignItems: 'center' },
  backupMarker: { width: 8, height: 8, backgroundColor: COLORS.NEON_RED, borderRadius: 4 },
  backupLabel: { color: COLORS.NEON_RED, fontSize: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 },
  mapLocationLabel: { position: 'absolute', bottom: 4, left: 4, flexDirection: 'row', alignItems: 'center', gap: 2 },
  mapLocationText: { color: COLORS.NEON_GREEN, fontSize: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  panelContainer: { flex: 1, backgroundColor: COLORS.NEUTRAL_950, borderWidth: 1, borderColor: COLORS.NEUTRAL_800, padding: 8 },
  nodeItem: { padding: 8, backgroundColor: 'rgba(23, 23, 23, 0.5)', borderWidth: 1, borderColor: COLORS.NEUTRAL_800, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  nodeItemAlert: { backgroundColor: 'rgba(255, 59, 48, 0.1)', borderColor: 'rgba(255, 59, 48, 0.3)' },
  nodeDot: { width: 6, height: 6, borderRadius: 3 },
  nodeLabel: { color: COLORS.WHITE, fontSize: 9, fontWeight: 'bold' },
  nodeStatus: { color: COLORS.NEUTRAL_500, fontSize: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  advisorBox: { marginTop: 8, padding: 8, backgroundColor: 'rgba(0, 255, 65, 0.05)', borderWidth: 1, borderColor: 'rgba(0, 255, 65, 0.2)' },
  advisorText: { color: COLORS.NEUTRAL_400, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontStyle: 'italic', lineHeight: 14 },
  indicator: { width: 4, height: 4, borderRadius: 2 },
  footer: { height: 28, backgroundColor: COLORS.BLACK, borderTopWidth: 1, borderTopColor: COLORS.NEUTRAL_800, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  footerLeft: { flexDirection: 'row', alignItems: 'center' },
  footerText: { color: COLORS.NEUTRAL_500, fontSize: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginLeft: 2 },
});
