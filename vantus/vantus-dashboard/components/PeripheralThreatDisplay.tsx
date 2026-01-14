import React from 'react';
import styles from '../styles/PeripheralThreatDisplay.module.css';

interface PeripheralThreatDisplayProps {
  threats: any[];
  officerName: string;
}

export default function PeripheralThreatDisplay({ threats, officerName }: PeripheralThreatDisplayProps) {
  if (!threats || threats.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.header}>Peripheral Threats - {officerName}</h3>
      <div className={styles.threatsList}>
        {threats.map((threat, index) => (
          <div key={index} className={styles.threatItem}>
            <div className={styles.threatType}>{threat.type || 'THREAT'}</div>
            <div className={styles.threatLocation}>
              {threat.location === 'behind_officer' ? '⚠️ Behind Officer' : threat.location}
            </div>
            {threat.description && (
              <div className={styles.threatDescription}>{threat.description}</div>
            )}
            {threat.confidence && (
              <div className={styles.threatConfidence}>
                Confidence: {(threat.confidence * 100).toFixed(0)}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
