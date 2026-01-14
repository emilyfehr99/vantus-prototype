import React from 'react';
import styles from '../styles/LiveFeedViewer.module.css';

interface LiveFeedViewerProps {
  officerName: string;
  streamUrl: string;
  tacticalIntent: any;
  onClose: () => void;
}

export default function LiveFeedViewer({
  officerName,
  streamUrl,
  tacticalIntent,
  onClose,
}: LiveFeedViewerProps) {
  return (
    <div className={styles.viewerContainer}>
      <div className={styles.header}>
        <h3>Live BWC Feed - {officerName}</h3>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
      </div>

      <div className={styles.videoContainer}>
        {/* In production, this would use a video player component */}
        <div className={styles.videoPlaceholder}>
          <p>Live Stream: {streamUrl}</p>
          <p className={styles.note}>
            Video player would be integrated here (e.g., HLS.js, Video.js, or native HTML5 video)
          </p>
        </div>
      </div>

      <div className={styles.tacticalIntent}>
        <h4>Tactical Intent Metadata</h4>
        <div className={styles.intentGrid}>
          <div className={styles.intentItem}>
            <span className={styles.label}>Weapon Detected:</span>
            <span className={tacticalIntent.weaponDetected ? styles.true : styles.false}>
              {tacticalIntent.weaponDetected ? 'Yes' : 'No'}
            </span>
          </div>
          <div className={styles.intentItem}>
            <span className={styles.label}>Fighting Stance:</span>
            <span className={tacticalIntent.fightingStance ? styles.true : styles.false}>
              {tacticalIntent.fightingStance ? 'Yes' : 'No'}
            </span>
          </div>
          <div className={styles.intentItem}>
            <span className={styles.label}>Hands Hidden:</span>
            <span className={tacticalIntent.handsHidden ? styles.true : styles.false}>
              {tacticalIntent.handsHidden ? 'Yes' : 'No'}
            </span>
          </div>
          <div className={styles.intentItem}>
            <span className={styles.label}>Heart Rate Elevated:</span>
            <span className={tacticalIntent.heartRateElevated ? styles.true : styles.false}>
              {tacticalIntent.heartRateElevated ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
        <div className={styles.timestamp}>
          Last Updated: {new Date(tacticalIntent.timestamp || Date.now()).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
