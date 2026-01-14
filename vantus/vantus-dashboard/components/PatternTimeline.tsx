/**
 * Pattern Timeline Component
 * Visualizes patterns over time for selected officer
 */

import React from 'react';
import styles from '../styles/PatternTimeline.module.css';

interface Signal {
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

interface PatternTimelineProps {
  signals: Signal[];
  officerName: string;
}

export default function PatternTimeline({ signals, officerName }: PatternTimelineProps) {
  if (!signals || signals.length === 0) {
    return (
      <div className={styles.timelineEmpty}>
        <p>No signals to display</p>
      </div>
    );
  }

  // Sort signals by timestamp
  const sortedSignals = [...signals].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Get time range
  const firstTime = new Date(sortedSignals[0].timestamp);
  const lastTime = new Date(sortedSignals[sortedSignals.length - 1].timestamp);
  const timeRange = lastTime.getTime() - firstTime.getTime();

  // Get signal color
  const getSignalColor = (signal: Signal): string => {
    const prob = signal.probability;
    if (prob > 0.7) return '#FFAA00'; // Orange
    if (prob > 0.5) return '#FFD700'; // Yellow
    return '#00FF41'; // Green
  };

  // Calculate position on timeline
  const getTimelinePosition = (timestamp: string): number => {
    const signalTime = new Date(timestamp).getTime();
    const position = ((signalTime - firstTime.getTime()) / timeRange) * 100;
    return Math.max(0, Math.min(100, position));
  };

  return (
    <div className={styles.timelineContainer}>
      <div className={styles.timelineHeader}>
        <h3>Pattern Timeline: {officerName}</h3>
        <div className={styles.timelineLegend}>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: '#FFAA00' }}></span>
            High Pattern Strength
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: '#FFD700' }}></span>
            Medium Pattern Strength
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: '#00FF41' }}></span>
            Low Pattern Strength
          </span>
        </div>
      </div>

      <div className={styles.timeline}>
        <div className={styles.timelineTrack}>
          {sortedSignals.map((signal, idx) => {
            const position = getTimelinePosition(signal.timestamp);
            const color = getSignalColor(signal);
            
            return (
              <div
                key={`${signal.timestamp}-${idx}`}
                className={styles.timelineMarker}
                style={{
                  left: `${position}%`,
                  backgroundColor: color,
                }}
                title={`${signal.signalCategory} (${(signal.probability * 100).toFixed(0)}%) - ${new Date(signal.timestamp).toLocaleTimeString()}`}
              />
            );
          })}
        </div>

        <div className={styles.timelineLabels}>
          <span className={styles.timeLabel}>
            {firstTime.toLocaleTimeString()}
          </span>
          <span className={styles.timeLabel}>
            {lastTime.toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className={styles.timelineStats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total Signals:</span>
          <span className={styles.statValue}>{signals.length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Time Range:</span>
          <span className={styles.statValue}>
            {Math.round(timeRange / 1000 / 60)} minutes
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Categories:</span>
          <span className={styles.statValue}>
            {new Set(signals.map(s => s.signalCategory)).size}
          </span>
        </div>
      </div>
    </div>
  );
}
