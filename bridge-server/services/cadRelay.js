// CAD Relay Service - Formats alerts to NENA standards and sends to CAD systems
// Supports RapidSOS, CentralSquare, and generic webhook endpoints

const axios = require('axios');

// NENA (National Emergency Number Association) standard format
class CADRelayService {
  constructor() {
    this.webhookUrl = process.env.CAD_WEBHOOK_URL || null;
    this.rapidSosApiKey = process.env.RAPIDSOS_API_KEY || null;
    this.centralSquareApiKey = process.env.CENTRALSQUARE_API_KEY || null;
    this.cadSystem = process.env.CAD_SYSTEM || 'generic'; // 'rapidsos', 'centralsquare', 'generic'
  }

  /**
   * Format alert data to NENA standard
   */
  formatToNENA(alertData) {
    const timestamp = new Date(alertData.timestamp);
    
    return {
      // NENA Call for Service structure
      call: {
        callId: alertData.alertId || `VANTUS-${Date.now()}`,
        callType: 'THREAT_DETECTED',
        priority: 'HIGH',
        status: 'PENDING',
        
        // Location (NENA format)
        location: {
          latitude: alertData.location.lat,
          longitude: alertData.location.lng,
          accuracy: 10, // meters
          source: 'GPS',
          timestamp: alertData.timestamp
        },
        
        // Caller/Officer information
        caller: {
          name: alertData.officerName,
          type: 'OFFICER',
          phone: null, // Would be populated from officer profile
          unit: alertData.officerName
        },
        
        // Incident details
        incident: {
          type: 'WEAPON_DETECTED',
          description: `AI Threat Detection Alert: ${alertData.officerName} detected potential weapon/threat`,
          timestamp: alertData.timestamp,
          
          // Sensor data
          sensorData: {
            heartRate: alertData.heartRate || null,
            threatLevel: alertData.threatAssessment?.threatLevel || null,
            threatScore: alertData.threatAssessment?.threatScore || null,
            bladedStance: alertData.threatAssessment?.bladedStance || false,
            objectDetected: alertData.objectDetection?.detected || false
          },
          
          // Detection confidence
          confidence: {
            objectDetection: alertData.objectDetection?.detections?.[0]?.score || null,
            poseAnalysis: alertData.poseAnalysis?.confidence || null,
            combined: alertData.threatAssessment?.confidence || null
          }
        },
        
        // Metadata
        metadata: {
          source: 'VANTUS',
          version: '1.0',
          systemId: 'VANTUS-PROTOTYPE',
          videoBuffer: alertData.videoBuffer || null
        }
      },
      
      // NENA header
      header: {
        messageType: 'CALL_FOR_SERVICE',
        timestamp: timestamp.toISOString(),
        version: '1.0',
        standard: 'NENA'
      }
    };
  }

  /**
   * Format for RapidSOS API
   */
  formatForRapidSOS(nenaData) {
    return {
      incident_id: nenaData.call.callId,
      incident_type: 'THREAT_DETECTED',
      priority: 'HIGH',
      location: {
        latitude: nenaData.call.location.latitude,
        longitude: nenaData.call.location.longitude,
        accuracy: nenaData.call.location.accuracy
      },
      caller: {
        name: nenaData.call.caller.name,
        type: 'OFFICER'
      },
      details: nenaData.call.incident.description,
      metadata: nenaData.call.metadata,
      timestamp: nenaData.header.timestamp
    };
  }

  /**
   * Format for CentralSquare API
   */
  formatForCentralSquare(nenaData) {
    return {
      CallNumber: nenaData.call.callId,
      CallType: 'THREAT_DETECTED',
      Priority: 'HIGH',
      Location: {
        Latitude: nenaData.call.location.latitude,
        Longitude: nenaData.call.location.longitude,
        Accuracy: nenaData.call.location.accuracy
      },
      Caller: {
        Name: nenaData.call.caller.name,
        Type: 'OFFICER'
      },
      Description: nenaData.call.incident.description,
      SensorData: nenaData.call.incident.sensorData,
      Timestamp: nenaData.header.timestamp
    };
  }

  /**
   * Send alert to CAD system
   */
  async sendToCAD(alertData) {
    if (!this.webhookUrl && !this.rapidSosApiKey && !this.centralSquareApiKey) {
      console.warn('No CAD webhook configured. Set CAD_WEBHOOK_URL, RAPIDSOS_API_KEY, or CENTRALSQUARE_API_KEY');
      return { success: false, error: 'No CAD configuration' };
    }

    try {
      // Format to NENA standard
      const nenaData = this.formatToNENA(alertData);
      
      let payload;
      let url;
      let headers = {
        'Content-Type': 'application/json'
      };

      // Format based on CAD system
      switch (this.cadSystem.toLowerCase()) {
        case 'rapidsos':
          payload = this.formatForRapidSOS(nenaData);
          url = 'https://api.rapidsos.com/v1/incidents';
          headers['Authorization'] = `Bearer ${this.rapidSosApiKey}`;
          break;
        
        case 'centralsquare':
          payload = this.formatForCentralSquare(nenaData);
          url = this.webhookUrl || 'https://api.centralsquare.com/v1/calls';
          headers['Authorization'] = `Bearer ${this.centralSquareApiKey}`;
          break;
        
        default:
          // Generic webhook (NENA format)
          payload = nenaData;
          url = this.webhookUrl;
          break;
      }

      // Send to CAD system
      const response = await axios.post(url, payload, { headers });
      
      console.log(`CAD alert sent successfully: ${response.status}`);
      return {
        success: true,
        cadCallId: response.data?.callId || response.data?.incident_id || response.data?.CallNumber,
        system: this.cadSystem
      };
    } catch (error) {
      console.error('Error sending to CAD:', error.message);
      return {
        success: false,
        error: error.message,
        system: this.cadSystem
      };
    }
  }

  /**
   * Check if CAD is configured
   */
  isConfigured() {
    return !!(this.webhookUrl || this.rapidSosApiKey || this.centralSquareApiKey);
  }

  /**
   * Get CAD system info
   */
  getInfo() {
    return {
      system: this.cadSystem,
      configured: this.isConfigured(),
      webhookUrl: this.webhookUrl ? '***configured***' : null,
      hasRapidSos: !!this.rapidSosApiKey,
      hasCentralSquare: !!this.centralSquareApiKey
    };
  }
}

module.exports = new CADRelayService();

