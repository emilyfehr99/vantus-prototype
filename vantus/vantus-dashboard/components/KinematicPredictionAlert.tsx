import React from 'react';
import styles from '../styles/KinematicPredictionAlert.module.css';

interface KinematicPredictionAlertProps {
  prediction: any;
  officerName: string;
}

export default function KinematicPredictionAlert({ prediction, officerName }: KinematicPredictionAlertProps) {
  if (!prediction || !prediction.predictedIntent) {
    return null;
  }

  const intent = prediction.predictedIntent;
  const isCritical = intent.confidence >= 0.80;

  return (
    <div className={`${styles.container} ${isCritical ? styles.critical : styles.warning}`}>
      <div className={styles.header}>
        <span className={styles.icon}>⚡</span>
        <h3>Kinematic Intent Prediction - {officerName}</h3>
      </div>
      <div className={styles.content}>
        <div className={styles.intentType}>{intent.type || 'INTENT_DETECTED'}</div>
        <div className={styles.confidence}>
          Confidence: {(intent.confidence * 100).toFixed(0)}%
        </div>
        {intent.description && (
          <div className={styles.description}>{intent.description}</div>
        )}
        {intent.timeWindow && (
          <div className={styles.timeWindow}>
            Predicted window: {intent.timeWindow}ms
          </div>
        )}
      </div>
    </div>
  );
}
