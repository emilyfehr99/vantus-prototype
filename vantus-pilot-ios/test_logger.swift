import Foundation

// Mock EventLog for testing since we can't compile the Swift file directly easily without a module
// (Copying the struct definition for the test script)
struct EventLog: Codable, Identifiable {
    var id: UUID = UUID()
    let timestamp: String
    let type: EventType
    let data: String
    let heartRate: Double?
    let gps: String?
    
    enum EventType: String, Codable {
        case audioTrigger = "AUDIO_TRIGGER"
        case biometricSpike = "BIOMETRIC_SPIKE"
        case systemStatus = "SYSTEM_STATUS"
    }
    
    static func currentTimestamp() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        return formatter.string(from: Date())
    }
}

class Logger {
    static let shared = Logger()
    private let fileName = "test_session_log.json"
    
    private var fileURL: URL {
        let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
        return paths[0].appendingPathComponent(fileName)
    }
    
    func log(type: EventLog.EventType, data: String, heartRate: Double? = nil, gps: String? = nil) {
        let event = EventLog(
            timestamp: EventLog.currentTimestamp(),
            type: type,
            data: data,
            heartRate: heartRate,
            gps: gps
        )
        
        do {
            var logs = loadLogs()
            logs.append(event)
            
            let encoder = JSONEncoder()
            encoder.outputFormatting = .prettyPrinted
            let jsonData = try encoder.encode(logs)
            
            try jsonData.write(to: fileURL)
            print("Successfully logged event: \(event.type.rawValue)")
        } catch {
            print("Failed to log event: \(error)")
        }
    }
    
    func loadLogs() -> [EventLog] {
        guard let data = try? Data(contentsOf: fileURL),
              let logs = try? JSONDecoder().decode([EventLog].self, from: data) else {
            return []
        }
        return logs
    }
    
    func cleanup() {
        try? FileManager.default.removeItem(at: fileURL)
    }
}

// Test Execution
print("Starting Logger Verification...")
let logger = Logger.shared

// 1. Log System Start
logger.log(type: .systemStatus, data: "Test Started")

// 2. Log Audio Trigger
logger.log(type: .audioTrigger, data: "shots fired")

// 3. Log Biometric Spike
logger.log(type: .biometricSpike, data: "High HR", heartRate: 155.0, gps: "40.7128, -74.0060")

// 4. Verify Read
print("\nReading Logs back...")
let logs = logger.loadLogs()
print("Total Logs Found: \(logs.count)")

for log in logs {
    print("[\(log.timestamp)] \(log.type.rawValue): \(log.data)")
}

if logs.count == 3 {
    print("\nSUCCESS: All events logged and retrieved.")
} else {
    print("\nFAILURE: Log count mismatch.")
}

// Cleanup
logger.cleanup()
