import React from 'react';
import styles from '../styles/DictationCommandLog.module.css';

interface DictationCommandLogProps {
  commands: any[];
  officerName: string;
}

export default function DictationCommandLog({ commands, officerName }: DictationCommandLogProps) {
  if (!commands || commands.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.header}>Dictation Commands - {officerName}</h3>
        <div className={styles.empty}>No commands logged yet</div>
      </div>
    );
  }

  // Sort commands by timestamp
  const sortedCommands = [...commands].sort((a, b) => {
    const timeA = new Date(a.timestamp || a.commandTimestamp || 0).getTime();
    const timeB = new Date(b.timestamp || b.commandTimestamp || 0).getTime();
    return timeB - timeA; // Most recent first
  });

  return (
    <div className={styles.container}>
      <h3 className={styles.header}>Dictation Commands - {officerName}</h3>
      <div className={styles.commandsList}>
        {sortedCommands.map((command, index) => {
          const commandData = command.command || command;
          const timestamp = commandData.timestamp || command.timestamp || new Date().toISOString();
          const time = new Date(timestamp);
          const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          return (
            <div key={index} className={styles.commandItem}>
              <div className={styles.commandTime}>{timeStr}</div>
              <div className={styles.commandType}>{commandData.type || 'COMMAND'}</div>
              {commandData.transcript && (
                <div className={styles.commandTranscript}>"{commandData.transcript}"</div>
              )}
              {commandData.result && (
                <div className={styles.commandResult}>
                  Result: {commandData.result.message || 'Processed'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
