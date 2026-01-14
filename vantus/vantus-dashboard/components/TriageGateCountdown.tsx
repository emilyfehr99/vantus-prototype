import React, { useState, useEffect } from 'react';
import styles from '../styles/TriageGateCountdown.module.css';

interface TriageGateCountdownProps {
  officerName: string;
  countdownId: string;
  remaining: number; // milliseconds
  dispatchPayload: any;
  onVeto: (officerName: string, reason: string) => void;
  supervisorId: string;
}

export default function TriageGateCountdown({
  officerName,
  countdownId,
  remaining: initialRemaining,
  dispatchPayload,
  onVeto,
  supervisorId,
}: TriageGateCountdownProps) {
  const [remaining, setRemaining] = useState(initialRemaining);
  const [vetoReason, setVetoReason] = useState('');
  const [showVetoModal, setShowVetoModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(prev => {
        const newRemaining = Math.max(0, prev - 1000);
        if (newRemaining === 0) {
          clearInterval(interval);
        }
        return newRemaining;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleVeto = () => {
    if (vetoReason.trim()) {
      onVeto(officerName, vetoReason);
      setShowVetoModal(false);
    }
  };

  const secondsRemaining = Math.ceil(remaining / 1000);
  const progress = (remaining / 10000) * 100; // 10 seconds total

  return (
    <div className={styles.countdownContainer}>
      <div className={styles.header}>
        <h3>Intelligent Triage Gate</h3>
        <span className={styles.officerName}>{officerName}</span>
      </div>

      <div className={styles.countdown}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className={styles.timeRemaining}>
          {secondsRemaining} seconds remaining
        </div>
      </div>

      <div className={styles.dispatchInfo}>
        <h4>Proposed Dispatch:</h4>
        <div className={styles.infoRow}>
          <span>Type:</span>
          <span>{dispatchPayload?.type || 'PRIORITY_1_BACKUP'}</span>
        </div>
        <div className={styles.infoRow}>
          <span>Threat:</span>
          <span>{dispatchPayload?.situation?.threat_type || 'UNKNOWN'}</span>
        </div>
        <div className={styles.infoRow}>
          <span>Confidence:</span>
          <span>{(dispatchPayload?.situation?.confidence * 100 || 0).toFixed(0)}%</span>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.vetoButton}
          onClick={() => setShowVetoModal(true)}
          disabled={remaining === 0}
        >
          VETO DISPATCH
        </button>
      </div>

      {showVetoModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Veto Dispatch</h3>
            <p>Reason for veto:</p>
            <textarea
              className={styles.reasonInput}
              value={vetoReason}
              onChange={(e) => setVetoReason(e.target.value)}
              placeholder="Enter reason for vetoing this dispatch..."
              rows={4}
            />
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowVetoModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.confirmVetoButton}
                onClick={handleVeto}
                disabled={!vetoReason.trim()}
              >
                Confirm Veto
              </button>
            </div>
          </div>
        </div>
      )}

      {remaining === 0 && (
        <div className={styles.expired}>
          <p>Countdown expired - Dispatch proceeding...</p>
        </div>
      )}
    </div>
  );
}
