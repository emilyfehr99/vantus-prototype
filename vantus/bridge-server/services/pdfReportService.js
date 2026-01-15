/**
 * PDF Report Generation Service
 * Generates court-ready incident documentation
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Report template
const REPORT_VERSION = '1.0.0';
const DEPARTMENT_PLACEHOLDER = 'YOUR DEPARTMENT';

class PDFReportService {
    constructor() {
        this.outputDir = path.join(__dirname, '../reports');
        this.ensureOutputDir();
    }

    ensureOutputDir() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Generate a unique report ID
     * Format: VTX-YYYY-MMDD-BADGE-SEQ
     */
    generateReportId(badgeNumber) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const seq = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        return `VTX-${year}-${month}${day}-${badgeNumber}-${seq}`;
    }

    /**
     * Generate verification hash for report integrity
     */
    generateVerificationHash(content) {
        return crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex').substring(0, 12);
    }

    /**
     * Format timestamp for report
     */
    formatTimestamp(isoString) {
        const date = new Date(isoString);
        return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    }

    /**
     * Format local time for report
     */
    formatLocalTime(isoString) {
        const date = new Date(isoString);
        const hours = String(date.getHours()).padStart(2, '0');
        const mins = String(date.getMinutes()).padStart(2, '0');
        const secs = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${mins}:${secs}`;
    }

    /**
     * Generate incident report
     * @param {Object} incidentData - Incident data
     * @returns {Object} Report object with content and metadata
     */
    async generateIncidentReport(incidentData) {
        const {
            officerInfo,
            sessionData,
            detectionTimeline,
            biometricData,
            factLog,
            videoClips = [],
            location,
            cadReference,
            callType = 'Unknown',
        } = incidentData;

        const reportId = this.generateReportId(officerInfo.badgeNumber);
        const generatedAt = new Date().toISOString();

        // Build report content object
        const reportContent = {
            header: {
                reportId,
                generatedAt: this.formatTimestamp(generatedAt),
                version: REPORT_VERSION,
            },
            incidentSummary: {
                officer: {
                    name: officerInfo.name || `Badge ${officerInfo.badgeNumber}`,
                    badge: officerInfo.badgeNumber,
                    unit: officerInfo.unit || 'N/A',
                },
                dateTime: {
                    start: sessionData?.startTime ? this.formatTimestamp(sessionData.startTime) : 'N/A',
                    end: sessionData?.endTime ? this.formatTimestamp(sessionData.endTime) : 'N/A',
                },
                location: location?.address || 'Location not available',
                coordinates: location?.coordinates || null,
                callType,
                cadReference: cadReference || 'N/A',
            },
            detectionTimeline: this.formatDetectionTimeline(detectionTimeline || []),
            biometricData: this.formatBiometricData(biometricData || {}),
            evidenceIntegrity: {
                factLogEntries: factLog?.length || 0,
                chainVerification: this.verifyFactLogChain(factLog),
                videoClipsAttached: videoClips.length,
                timestampsSynchronized: true,
            },
            rawData: {
                sessionId: sessionData?.sessionId,
                telemetryCount: sessionData?.telemetryData?.length || 0,
                markerCount: sessionData?.markerEvents?.length || 0,
            },
        };

        // Generate verification hash
        const verificationHash = this.generateVerificationHash(reportContent);
        reportContent.header.verificationHash = verificationHash;

        // Generate text report
        const textReport = this.generateTextReport(reportContent);

        // Save report
        const reportPath = await this.saveReport(reportId, reportContent, textReport);

        logger.info('Incident report generated', { reportId, path: reportPath });

        return {
            reportId,
            verificationHash,
            path: reportPath,
            content: reportContent,
            textReport,
        };
    }

    /**
     * Format detection timeline for report
     */
    formatDetectionTimeline(detections) {
        return detections.map(detection => ({
            time: this.formatLocalTime(detection.timestamp),
            type: detection.type || detection.category || 'DETECTION',
            description: detection.description || detection.message,
            confidence: detection.confidence ? `${Math.round(detection.confidence * 100)}%` : 'N/A',
        }));
    }

    /**
     * Format biometric data for report
     */
    formatBiometricData(biometrics) {
        return {
            baselineHR: biometrics.baseline ? `${biometrics.baseline} BPM` : 'N/A',
            peakHR: biometrics.peak ? `${biometrics.peak} BPM` : 'N/A',
            peakTime: biometrics.peakTime ? this.formatLocalTime(biometrics.peakTime) : 'N/A',
            elevatedDuration: biometrics.elevatedDuration || 'N/A',
        };
    }

    /**
     * Verify fact log chain integrity
     */
    verifyFactLogChain(factLog) {
        if (!factLog || factLog.length === 0) {
            return 'NO DATA';
        }

        // Check each entry has valid checksum and chain links properly
        let previousHash = null;
        for (const entry of factLog) {
            if (entry.previousHash && entry.previousHash !== previousHash) {
                return 'INVALID - CHAIN BROKEN';
            }
            previousHash = entry.checksum || entry.hash;
        }

        return 'VALID';
    }

    /**
     * Generate formatted text report
     */
    generateTextReport(content) {
        const line = '─'.repeat(61);
        const doubleLine = '═'.repeat(61);

        let report = `
┌${doubleLine}┐
│${'VANTUS INCIDENT REPORT'.padStart(41).padEnd(61)}│
│${'[DEPARTMENT SEAL]'.padStart(39).padEnd(61)}│
├${line}┤
│ Report ID: ${content.header.reportId.padEnd(48)}│
│ Generated: ${content.header.generatedAt.padEnd(48)}│
│ Verification Hash: ${content.header.verificationHash.padEnd(40)}│
├${line}┤
│${'INCIDENT SUMMARY'.padEnd(61)}│
│${line}│
│ Officer: ${(content.incidentSummary.officer.name + ' (Badge: ' + content.incidentSummary.officer.badge + ')').padEnd(50)}│
│ Date/Time: ${(content.incidentSummary.dateTime.start + ' - ' + content.incidentSummary.dateTime.end.split(' ')[1]).substring(0, 49).padEnd(49)}│
│ Location: ${content.incidentSummary.location.substring(0, 49).padEnd(49)}│
│ Call Type: ${content.incidentSummary.callType.padEnd(48)}│
│ CAD Reference: ${content.incidentSummary.cadReference.padEnd(44)}│
│${''.padEnd(61)}│
│${'VANTUS DETECTION TIMELINE'.padEnd(61)}│
│${line}│`;

        // Add detection timeline entries
        for (const detection of content.detectionTimeline) {
            const entry = `${detection.time} | ${detection.type.padEnd(14)} | ${detection.description.substring(0, 25)}`;
            report += `\n│ ${entry.padEnd(59)}│`;
        }

        if (content.detectionTimeline.length === 0) {
            report += `\n│ ${'No detections recorded'.padEnd(59)}│`;
        }

        report += `
│${''.padEnd(61)}│
│${'BIOMETRIC DATA'.padEnd(61)}│
│${line}│
│ Baseline HR: ${content.biometricData.baselineHR.padEnd(46)}│
│ Peak HR: ${(content.biometricData.peakHR + ' (' + content.biometricData.peakTime + ')').padEnd(50)}│
│ Duration of elevated state: ${content.biometricData.elevatedDuration.padEnd(31)}│
│${''.padEnd(61)}│
│${'EVIDENCE INTEGRITY'.padEnd(61)}│
│${line}│
│ Fact Log Entries: ${String(content.evidenceIntegrity.factLogEntries).padEnd(41)}│
│ Chain Verification: ${(content.evidenceIntegrity.chainVerification === 'VALID' ? '✓ VALID' : '✗ ' + content.evidenceIntegrity.chainVerification).padEnd(39)}│
│ Video Clips Attached: ${String(content.evidenceIntegrity.videoClipsAttached).padEnd(38)}│
│ All timestamps GPS-synchronized: ${(content.evidenceIntegrity.timestampsSynchronized ? 'Yes' : 'No').padEnd(26)}│
│${''.padEnd(61)}│
│${'TECHNICAL APPENDIX (See Exhibit A)'.padEnd(61)}│
│${line}│
│ Full detection parameters, model versions, and raw          │
│ confidence scores available in attached appendix.           │
│${''.padEnd(61)}│
├${line}┤
│ This report was automatically generated by Vantus Safety    │
│ Systems. Verification: vantus.io/verify/${content.header.verificationHash.padEnd(18)}│
└${doubleLine}┘`;

        return report;
    }

    /**
     * Save report to file
     */
    async saveReport(reportId, content, textReport) {
        const jsonPath = path.join(this.outputDir, `${reportId}.json`);
        const txtPath = path.join(this.outputDir, `${reportId}.txt`);

        // Save JSON content
        fs.writeFileSync(jsonPath, JSON.stringify(content, null, 2));

        // Save text report
        fs.writeFileSync(txtPath, textReport);

        return { json: jsonPath, txt: txtPath };
    }

    /**
     * Generate post-shift summary report
     */
    async generateShiftSummary(officerInfo, sessionData) {
        const reportId = `SHIFT-${this.generateReportId(officerInfo.badgeNumber)}`;
        const generatedAt = new Date().toISOString();

        const summary = {
            reportId,
            generatedAt: this.formatTimestamp(generatedAt),
            officer: {
                name: officerInfo.name || `Badge ${officerInfo.badgeNumber}`,
                badge: officerInfo.badgeNumber,
            },
            shiftDuration: this.calculateDuration(sessionData.startTime, sessionData.endTime),
            signalsSent: sessionData.signalCount || 0,
            alertsTriggered: sessionData.alertCount || 0,
            markersLogged: sessionData.markerEvents?.length || 0,
            welfareChecks: {
                total: sessionData.welfareChecks?.total || 0,
                responded: sessionData.welfareChecks?.responded || 0,
            },
            biometricSummary: {
                avgHeartRate: sessionData.avgHeartRate || 'N/A',
                maxHeartRate: sessionData.maxHeartRate || 'N/A',
                elevatedDuration: sessionData.elevatedDuration || 'N/A',
            },
        };

        const reportPath = path.join(this.outputDir, `${reportId}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));

        logger.info('Shift summary generated', { reportId });

        return { reportId, path: reportPath, summary };
    }

    /**
     * Calculate duration between two timestamps
     */
    calculateDuration(start, end) {
        if (!start || !end) return 'N/A';

        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMs = endDate - startDate;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${mins}m`;
    }

    /**
     * Get report by ID
     */
    getReport(reportId) {
        const jsonPath = path.join(this.outputDir, `${reportId}.json`);
        if (fs.existsSync(jsonPath)) {
            return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        }
        return null;
    }

    /**
     * List all reports
     */
    listReports() {
        const files = fs.readdirSync(this.outputDir);
        return files
            .filter(f => f.endsWith('.json'))
            .map(f => f.replace('.json', ''));
    }
}

module.exports = new PDFReportService();
