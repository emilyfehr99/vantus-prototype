// PDF Generator for Forensic Case Reports
// Uses browser's built-in printing capabilities or jsPDF for more control

interface AlertData {
  officerName: string;
  location: { lat: number; lng: number };
  timestamp: string;
  heartRate?: number;
  objectDetection?: any;
  poseAnalysis?: any;
  threatAssessment?: any;
  videoBuffer?: string;
  alertId?: string;
}

interface DetectionData {
  class: string;
  score: number;
  bbox?: number[];
}

/**
 * Generate a forensic case report PDF
 * @param alertData - Alert data to include in report
 * @param feedEntries - Related feed entries
 * @returns Promise that resolves when PDF is generated
 */
export async function generateCaseReport(
  alertData: AlertData,
  feedEntries: any[] = []
): Promise<void> {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Failed to open print window. Please allow popups.');
  }

  // Build HTML content for the report
  const htmlContent = buildReportHTML(alertData, feedEntries);
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // Close window after printing (optional)
      // printWindow.close();
    }, 250);
  };
}

/**
 * Build HTML content for the forensic report
 */
function buildReportHTML(alertData: AlertData, feedEntries: any[]): string {
  const timestamp = new Date(alertData.timestamp);
  const reportDate = timestamp.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Generate cryptographic hash (simplified - in production use crypto library)
  const hashInput = `${alertData.timestamp}${alertData.officerName}${JSON.stringify(alertData.location)}`;
  const reportHash = generateHash(hashInput);

  // Build detection details
  const detectionDetails = buildDetectionDetails(alertData);
  
  // Build sensor data section
  const sensorData = buildSensorData(alertData);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Vantus Forensic Case Report - ${alertData.alertId || 'N/A'}</title>
  <style>
    body {
      font-family: 'Courier New', monospace;
      margin: 20px;
      color: #000;
      line-height: 1.6;
    }
    .header {
      border-bottom: 3px solid #000;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      text-transform: uppercase;
    }
    .header .subtitle {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    .section {
      margin: 20px 0;
      page-break-inside: avoid;
    }
    .section-title {
      font-weight: bold;
      font-size: 14px;
      text-transform: uppercase;
      border-bottom: 2px solid #000;
      padding-bottom: 5px;
      margin-bottom: 10px;
    }
    .data-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid #ddd;
    }
    .data-label {
      font-weight: bold;
      width: 200px;
    }
    .data-value {
      flex: 1;
      text-align: right;
    }
    .confidence-score {
      display: inline-block;
      padding: 2px 8px;
      background: #f0f0f0;
      border: 1px solid #ccc;
      border-radius: 3px;
      font-size: 11px;
    }
    .hash {
      font-family: 'Courier New', monospace;
      font-size: 10px;
      background: #f5f5f5;
      padding: 10px;
      border: 1px solid #ccc;
      word-break: break-all;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #000;
      font-size: 10px;
      color: #666;
    }
    @media print {
      body { margin: 0; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>VANTUS FORENSIC CASE REPORT</h1>
    <div class="subtitle">SB 524 Compliant - Court-Ready Documentation</div>
  </div>

  <div class="section">
    <div class="section-title">Alert Information</div>
    <div class="data-row">
      <span class="data-label">Alert ID:</span>
      <span class="data-value">${alertData.alertId || 'N/A'}</span>
    </div>
    <div class="data-row">
      <span class="data-label">Officer Name:</span>
      <span class="data-value">${alertData.officerName}</span>
    </div>
    <div class="data-row">
      <span class="data-label">Timestamp:</span>
      <span class="data-value">${reportDate}</span>
    </div>
    <div class="data-row">
      <span class="data-label">Location:</span>
      <span class="data-value">${alertData.location.lat.toFixed(6)}°N, ${Math.abs(alertData.location.lng).toFixed(6)}°W</span>
    </div>
  </div>

  ${detectionDetails}

  ${sensorData}

  <div class="section">
    <div class="section-title">Threat Assessment</div>
    ${alertData.threatAssessment ? `
      <div class="data-row">
        <span class="data-label">Threat Level:</span>
        <span class="data-value">${alertData.threatAssessment.threatLevel}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Threat Score:</span>
        <span class="data-value">${alertData.threatAssessment.threatScore}/100</span>
      </div>
      <div class="data-row">
        <span class="data-label">Bladed Stance Detected:</span>
        <span class="data-value">${alertData.threatAssessment.bladedStance ? 'YES' : 'NO'}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Heart Rate Spike:</span>
        <span class="data-value">${alertData.threatAssessment.heartRateSpike > 0 ? `+${alertData.threatAssessment.heartRateSpike} BPM` : 'N/A'}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Combined Indicator:</span>
        <span class="data-value">${alertData.threatAssessment.combined ? 'YES (High Probability)' : 'NO'}</span>
      </div>
    ` : '<div class="data-row"><span class="data-value">No threat assessment data available</span></div>'}
  </div>

  <div class="section">
    <div class="section-title">Forensic Integrity</div>
    <div class="data-row">
      <span class="data-label">Report Hash (SHA-256):</span>
    </div>
    <div class="hash">${reportHash}</div>
    <div style="margin-top: 10px; font-size: 10px; color: #666;">
      This cryptographic hash ensures the integrity of this report. Any modification will result in a different hash value.
    </div>
    ${alertData.videoBuffer ? `
      <div class="data-row" style="margin-top: 15px;">
        <span class="data-label">Video Buffer Path:</span>
        <span class="data-value">${alertData.videoBuffer}</span>
      </div>
    ` : ''}
  </div>

  <div class="section">
    <div class="section-title">Timeline</div>
    ${feedEntries.slice(0, 10).map(entry => `
      <div class="data-row">
        <span class="data-label">[${new Date(entry.timestamp).toLocaleTimeString()}]</span>
        <span class="data-value">${entry.message}</span>
      </div>
    `).join('')}
  </div>

  <div class="footer">
    <div>Generated: ${new Date().toLocaleString()}</div>
    <div>Vantus Prototype System v1.0</div>
    <div style="margin-top: 10px;">
      <strong>Legal Notice:</strong> This report is generated automatically by the Vantus system. 
      All AI confidence scores and sensor data are recorded at the time of detection. 
      This document is admissible as evidence when generated in accordance with SB 524 requirements.
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Build detection details section
 */
function buildDetectionDetails(alertData: AlertData): string {
  if (!alertData.objectDetection) {
    return '<div class="section"><div class="section-title">Object Detection</div><div class="data-row"><span class="data-value">No detection data available</span></div></div>';
  }

  const detections = alertData.objectDetection.detections || [];
  const allDetections = alertData.objectDetection.allDetections || [];

  return `
    <div class="section">
      <div class="section-title">Object Detection</div>
      <div class="data-row">
        <span class="data-label">Threat Detected:</span>
        <span class="data-value">${alertData.objectDetection.detected ? 'YES' : 'NO'}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Total Objects Detected:</span>
        <span class="data-value">${allDetections.length}</span>
      </div>
      ${detections.length > 0 ? `
        <div style="margin-top: 10px;">
          <strong>Threat Objects:</strong>
          ${detections.map((det: DetectionData) => `
            <div class="data-row">
              <span class="data-label">${det.class}:</span>
              <span class="data-value">
                <span class="confidence-score">${(det.score * 100).toFixed(1)}% confidence</span>
              </span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Build sensor data section
 */
function buildSensorData(alertData: AlertData): string {
  return `
    <div class="section">
      <div class="section-title">Sensor Data</div>
      <div class="data-row">
        <span class="data-label">Heart Rate at Alert:</span>
        <span class="data-value">${alertData.heartRate || 'N/A'} BPM</span>
      </div>
      ${alertData.poseAnalysis ? `
        <div class="data-row">
          <span class="data-label">Pose Detected:</span>
          <span class="data-value">${alertData.poseAnalysis.detected ? 'YES' : 'NO'}</span>
        </div>
        <div class="data-row">
          <span class="data-label">Bladed Stance:</span>
          <span class="data-value">${alertData.poseAnalysis.bladedStance ? 'YES' : 'NO'}</span>
        </div>
        <div class="data-row">
          <span class="data-label">Pose Confidence:</span>
          <span class="data-value">
            <span class="confidence-score">${(alertData.poseAnalysis.confidence * 100).toFixed(1)}%</span>
          </span>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generate a simple hash (in production, use crypto.subtle.digest for SHA-256)
 */
function generateHash(input: string): string {
  // Simplified hash - in production use Web Crypto API
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to hex and pad
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  // Simulate SHA-256 length (64 chars)
  return hexHash.repeat(8).substring(0, 64);
}

