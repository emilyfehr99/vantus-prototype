import React from 'react';
import styles from '../styles/FactTimelineView.module.css';

interface FactTimelineViewProps {
  facts: any[];
  officerName: string;
}

export default function FactTimelineView({ facts, officerName }: FactTimelineViewProps) {
  if (!facts || facts.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.header}>Fact Timeline - {officerName}</h3>
        <div className={styles.empty}>No facts logged yet</div>
      </div>
    );
  }

  // Sort facts by timestamp
  const sortedFacts = [...facts].sort((a, b) => {
    const timeA = new Date(a.timestamp || a.factTimestamp || 0).getTime();
    const timeB = new Date(b.timestamp || b.factTimestamp || 0).getTime();
    return timeB - timeA; // Most recent first
  });

  return (
    <div className={styles.container}>
      <h3 className={styles.header}>Fact Timeline - {officerName}</h3>
      <div className={styles.timeline}>
        {sortedFacts.map((fact, index) => {
          const factData = fact.fact || fact;
          const timestamp = factData.timestamp || fact.timestamp || new Date().toISOString();
          const time = new Date(timestamp);
          const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const ms = time.getMilliseconds();

          return (
            <div key={index} className={styles.timelineItem}>
              <div className={styles.timelineMarker} />
              <div className={styles.timelineContent}>
                <div className={styles.timelineTime}>
                  {timeStr}.{ms.toString().padStart(3, '0')}
                </div>
                <div className={styles.timelineType}>{factData.type || 'FACT'}</div>
                <div className={styles.timelineDescription}>
                  {factData.description || 'No description'}
                </div>
                {factData.confidence && (
                  <div className={styles.timelineConfidence}>
                    Confidence: {(factData.confidence * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
