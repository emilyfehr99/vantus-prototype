import React from 'react';
import styles from '../styles/DeEscalationStatusIndicator.module.css';

interface DeEscalationStatusIndicatorProps {
  stabilization: any;
  officerName: string;
}

export default function DeEscalationStatusIndicator({ stabilization, officerName }: DeEscalationStatusIndicatorProps) {
  if (!stabilization) {
    return null;
  }

  const isStabilizing = stabilization.stabilizing;
  const statusColor = isStabilizing ? '#10b981' : '#f59e0b';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div 
          className={styles.statusDot}
          style={{ backgroundColor: statusColor }}
        />
        <h3>De-escalation Status - {officerName}</h3>
      </div>
      <div className={styles.content}>
        <div className={styles.status}>
          {isStabilizing ? '✅ Situation Stabilizing' : '⚠️ Situation Active'}
        </div>
        {stabilization.compliance && (
          <div className={styles.detail}>
            <span className={styles.label}>Compliance:</span>
            <span>{stabilization.compliance.compliant ? 'Yes' : 'No'}</span>
          </div>
        )}
        {stabilization.controlSignals && (
          <div className={styles.detail}>
            <span className={styles.label}>Control:</span>
            <span>{stabilization.controlSignals.underControl ? 'Yes' : 'No'}</span>
          </div>
        )}
        {stabilization.threatReduction && (
          <div className={styles.detail}>
            <span className={styles.label}>Threat Reduction:</span>
            <span>{stabilization.threatReduction.reduced ? 'Yes' : 'No'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
