import Foundation
import HealthKit
import WatchConnectivity
import CoreLocation

// Add Codable support for watch communication
struct WatchData: Codable {
    let heartRate: Double
    let activeEnergy: Double
    let timestamp: Date
}

class BiometricManager: NSObject, ObservableObject, WCSessionDelegate, CLLocationManagerDelegate {
    static let shared = BiometricManager()
    
    @Published var currentHeartRate: Double = 0
    @Published var isMonitoring: Bool = false
    
    private let healthStore = HKHealthStore()
    private let locationManager = CLLocationManager()
    
    // Thresholds
    private let heartRateThreshold: Double = 140.0
    private let speedThresholdMph: Double = 10.0
    
    override init() {
        super.init()
        setupWatchConnectivity()
        setupLocation()
    }
    
    // MARK: - Setup
    
    private func setupWatchConnectivity() {
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
        }
    }
    
    private func setupLocation() {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
    }
    
    func startMonitoring() {
        isMonitoring = true
        locationManager.startUpdatingLocation()
        // Signal watch to start
        sendMessageToWatch(["command": "START_PATROL"])
        Logger.shared.log(type: .systemStatus, data: "Biometric Monitoring Started")
    }
    
    func stopMonitoring() {
        isMonitoring = false
        locationManager.stopUpdatingLocation()
        sendMessageToWatch(["command": "STOP_PATROL"])
        Logger.shared.log(type: .systemStatus, data: "Biometric Monitoring Stopped")
    }
    
    private func sendMessageToWatch(_ message: [String: Any]) {
        if WCSession.default.isReachable {
            WCSession.default.sendMessage(message, replyHandler: nil) { error in
                print("Error sending to watch: \(error.localizedDescription)")
            }
        }
    }
    
    // MARK: - WCSessionDelegate
    
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {}
    func sessionDidBecomeInactive(_ session: WCSession) {}
    func sessionDidDeactivate(_ session: WCSession) {
        WCSession.default.activate()
    }
    
    func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, self.isMonitoring else { return }
            
            if let hr = message["heartRate"] as? Double {
                self.currentHeartRate = hr
                self.checkTriggers()
            }
        }
    }
    
    // MARK: - Logic
    
    private func checkTriggers() {
        guard let location = locationManager.location else { return }
        
        // Convert m/s to mph (1 m/s = 2.23694 mph)
        let speedMph = location.speed * 2.23694
        
        if currentHeartRate > heartRateThreshold && speedMph > speedThresholdMph {
            triggerAlert(speed: speedMph)
        }
    }
    
    private func triggerAlert(speed: Double) {
        // Debounce logic could go here to prevent spamming
        Logger.shared.log(
            type: .biometricSpike,
            data: "High Stress + Motion Detected (Speed: \(String(format: "%.1f", speed)) mph)",
            heartRate: currentHeartRate,
            gps: "\(locationManager.location?.coordinate.latitude ?? 0), \(locationManager.location?.coordinate.longitude ?? 0)"
        )
        
        // Haptic Feedback
        #if os(iOS)
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.warning)
        #endif
    }
    
    // MARK: - CLLocationManagerDelegate
    // Required to receive updates even if we don't use the raw location immediately
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {}
}
