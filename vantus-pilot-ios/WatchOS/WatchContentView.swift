import SwiftUI
import HealthKit

struct WatchContentView: View {
    @StateObject private var biometricManager = WatchBiometricManager.shared
    
    var body: some View {
        VStack {
            if biometricManager.isMonitoring {
                Text("\(Int(biometricManager.heartRate))")
                    .font(.system(size: 50, weight: .bold))
                    .foregroundColor(.red)
                Text("BPM")
                    .font(.caption)
                    .foregroundColor(.gray)
                Text("Monitoring Active")
                    .font(.caption2)
                    .foregroundColor(.green)
                    .padding(.top, 5)
            } else {
                Text("VANTUS")
                    .font(.headline)
                Text("Standby")
                    .foregroundColor(.gray)
            }
        }
        .onAppear {
            requestHealthAuthorization()
        }
    }
    
    func requestHealthAuthorization() {
        let typesToShare: Set = [
            HKObjectType.workoutType()
        ]
        
        let typesToRead: Set = [
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!
        ]
        
        HKHealthStore().requestAuthorization(toShare: typesToShare, read: typesToRead) { success, error in
            if !success {
                print("HealthKit Authorization Failed")
            }
        }
    }
}
