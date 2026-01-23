import Foundation

/// The Scribe: A unified structural logger for all Vantus events.
struct EventLog: Codable, Identifiable {
    var id: UUID = UUID()
    let timestamp: String
    let type: EventType
    let data: String
    let heartRate: Double?
    let gps: String?
    let badgeNumber: String? // [NEW] Added for officer identification
    
    enum EventType: String, Codable {
        case audioTrigger = "AUDIO_TRIGGER"
        case biometricSpike = "BIOMETRIC_SPIKE"
        case systemStatus = "SYSTEM_STATUS"
    }
    
    // Helper to create timestamp
    static func currentTimestamp() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        return formatter.string(from: Date())
    }
}

class Logger {
    static let shared = Logger()
    private let fileName = "session_log.json"
    
    private var fileURL: URL {
        let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
        return paths[0].appendingPathComponent(fileName)
    }
    
    // [NEW] Store the active badge number for the session
    var activeBadgeNumber: String?
    
    func log(type: EventLog.EventType, data: String, heartRate: Double? = nil, gps: String? = nil) {
        let event = EventLog(
            timestamp: EventLog.currentTimestamp(),
            type: type,
            data: data,
            heartRate: heartRate,
            gps: gps,
            badgeNumber: activeBadgeNumber
        )
        
        do {
            var logs = loadLogs()
            logs.append(event)
            
            let encoder = JSONEncoder()
            encoder.outputFormatting = .prettyPrinted
            let jsonData = try encoder.encode(logs)
            
            try jsonData.write(to: fileURL)
            print("📝 Logged: \(event.type.rawValue) - \(event.data)")
        } catch {
            print("❌ Failed to log event: \(error)")
        }
    }
    
    private func loadLogs() -> [EventLog] {
        guard let data = try? Data(contentsOf: fileURL),
              let logs = try? JSONDecoder().decode([EventLog].self, from: data) else {
            return []
        }
        return logs
    }
}
