import Foundation
import HealthKit
import WatchConnectivity

class WatchBiometricManager: NSObject, ObservableObject, HKWorkoutSessionDelegate, HKLiveWorkoutBuilderDelegate, WCSessionDelegate {
    static let shared = WatchBiometricManager()
    
    @Published var heartRate: Double = 0
    @Published var isMonitoring = false
    
    private let healthStore = HKHealthStore()
    private var workoutSession: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?
    
    override init() {
        super.init()
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
        }
    }
    
    func startWorkout() {
        let configuration = HKWorkoutConfiguration()
        configuration.activityType = .other
        configuration.locationType = .unknown
        
        do {
            workoutSession = try HKWorkoutSession(healthStore: healthStore, configuration: configuration)
            builder = workoutSession?.associatedWorkoutBuilder()
            
            workoutSession?.delegate = self
            builder?.delegate = self
            
            builder?.dataSource = HKLiveWorkoutDataSource(healthStore: healthStore, workoutConfiguration: configuration)
            
            workoutSession?.startActivity(with: Date())
            builder?.beginCollection(withStart: Date()) { success, error in
                if success {
                    DispatchQueue.main.async {
                        self.isMonitoring = true
                    }
                }
            }
        } catch {
            print("Failed to start workout: \(error)")
        }
    }
    
    func stopWorkout() {
        workoutSession?.end()
        builder?.endCollection(withEnd: Date()) { success, error in
            DispatchQueue.main.async {
                self.isMonitoring = false
            }
        }
    }
    
    // MARK: - HKLiveWorkoutBuilderDelegate
    
    func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {
        for type in collectedTypes {
            guard let quantityType = type as? HKQuantityType else { continue }
            guard let statistics = workoutBuilder.statistics(for: quantityType) else { continue }
            
            if quantityType == HKQuantityType.quantityType(forIdentifier: .heartRate) {
                let heartRateUnit = HKUnit.count().unitDivided(by: HKUnit.minute())
                let value = statistics.mostRecentQuantity()?.doubleValue(for: heartRateUnit) ?? 0
                
                DispatchQueue.main.async {
                    self.heartRate = value
                    self.sendHeartRateToPhone(value)
                }
            }
        }
    }
    
    func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}
    
    private func sendHeartRateToPhone(_ hr: Double) {
        if WCSession.default.isReachable {
            WCSession.default.sendMessage(["heartRate": hr], replyHandler: nil)
        }
    }
    
    // MARK: - HKWorkoutSessionDelegate
    func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {}
    func workoutSession(_ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState, from fromState: HKWorkoutSessionState, date: Date) {}
    
    // MARK: - WCSessionDelegate
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {}
    
    func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        if let command = message["command"] as? String {
            DispatchQueue.main.async {
                if command == "START_PATROL" {
                    self.startWorkout()
                } else if command == "STOP_PATROL" {
                    self.stopWorkout()
                }
            }
        }
    }
}
