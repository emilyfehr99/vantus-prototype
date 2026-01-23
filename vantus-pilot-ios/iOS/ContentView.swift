import SwiftUI

struct ContentView: View {
    @StateObject private var biometricManager = BiometricManager.shared
    @StateObject private var audioListener = AudioListener.shared
    
    @State private var isStealthModeActive = false
    @State private var sliderPosition: CGFloat = 0.0
    @State private var badgeNumber: String = "" // [NEW] Badge Number State
    
    private let sliderWidth: CGFloat = 280
    private let sliderHeight: CGFloat = 60
    
    var body: some View {
        ZStack {
            if isStealthModeActive {
                // Stealth Mode UI
                StealthView
            } else {
                // Airlock UI
                AirlockView
            }
        }
        .statusBar(hidden: isStealthModeActive)
        .onChange(of: isStealthModeActive) { newValue in
            UIApplication.shared.isIdleTimerDisabled = newValue
            if newValue {
                startPatrol()
            } else {
                endPatrol()
            }
        }
    }
    
    // MARK: - Airlock View
    var AirlockView: some View {
        ZStack {
            // Background Color logic
            // Enforcing Light Mode Background
            Color(UIColor.systemBackground).edgesIgnoringSafeArea(.all)
            
            VStack {
                Spacer()
                
                // Placeholder for Logo - Increased Size
                Text("VANTUS") 
                    .font(.system(size: 60, weight: .bold, design: .monospaced)) 
                    .foregroundColor(.black)
                
                Text("THE SILENT LIFELINE")
                    .font(.headline) 
                    .foregroundColor(.gray)
                    .tracking(2)
                
                Spacer()
                
                // [NEW] Badge Number Input
                TextField("Enter Badge Number", text: $badgeNumber)
                    .padding()
                    .frame(width: 250)
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(8)
                    .keyboardType(.numberPad)
                    .multilineTextAlignment(.center)
                    .padding(.bottom, 20)
                
                Button(action: {
                    requestPermissionsAndStart()
                }) {
                    ZStack {
                        Circle()
                            .stroke(Color.blue.opacity(0.3), lineWidth: 2)
                            .frame(width: 200, height: 200)
                        
                        Circle()
                            .fill(Color.blue.opacity(0.1))
                            .frame(width: 180, height: 180)
                        
                        Text("START PATROL")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.blue)
                    }
                }
                .disabled(badgeNumber.isEmpty) // Disable if no badge number
                .opacity(badgeNumber.isEmpty ? 0.5 : 1.0)
                
                Spacer()
            }
        }
        .preferredColorScheme(.light)
        // .animation removed as theme change is no longer dynamic
    }
    
    // MARK: - Stealth View
    var StealthView: some View {
        ZStack {
            Color.black.edgesIgnoringSafeArea(.all)
            
            // Minimalist status indicator (hidden mostly or very dim)
            VStack {
                Spacer()
                
                // Slide to End Shift
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: sliderHeight / 2)
                        .fill(Color.gray.opacity(0.2))
                        .frame(width: sliderWidth, height: sliderHeight)
                    
                    Text("SLIDE TO END SHIFT")
                        .foregroundColor(.gray.opacity(0.5))
                        .frame(width: sliderWidth, height: sliderHeight, alignment: .center)
                    
                    Circle()
                        .fill(Color.red)
                        .frame(width: sliderHeight - 10, height: sliderHeight - 10)
                        .offset(x: 5 + sliderPosition)
                        .gesture(
                            DragGesture()
                                .onChanged { value in
                                    if value.translation.width > 0 && value.translation.width < (sliderWidth - sliderHeight) {
                                        sliderPosition = value.translation.width
                                    }
                                }
                                .onEnded { value in
                                    if sliderPosition > (sliderWidth - sliderHeight - 20) {
                                        isStealthModeActive = false
                                        sliderPosition = 0
                                    } else {
                                        withAnimation {
                                            sliderPosition = 0
                                        }
                                    }
                                }
                        )
                }
                .padding(.bottom, 50)
            }
        }
    }
    
    // MARK: - Actions
    
    func requestPermissionsAndStart() {
        // [NEW] Set active badge number
        Logger.shared.activeBadgeNumber = badgeNumber
        
        // Request Permissions Chain
        audioListener.requestPermissions { audioAllowed in
            if audioAllowed {
                // Location permissions are handled by CLLocationManager automatically on first use
                // Health permissions handled by HealthKit store
                
                DispatchQueue.main.async {
                    withAnimation {
                        isStealthModeActive = true
                    }
                }
            }
        }
    }
    
    func startPatrol() {
        biometricManager.startMonitoring()
        do {
            try audioListener.startListening()
        } catch {
            print("Failed to start audio listener: \(error)")
        }
    }
    
    func endPatrol() {
        biometricManager.stopMonitoring()
        audioListener.stopListening()
        // Optional: Clear badge number on end, or keep it per user request "stays there til he ends his shift"
        // User said "stays there til he ends his shift", implying it might persist or just remain session based.
        // We will keep it in the state so if they come back to Airlock it's there, but maybe clear it if app closes?
        // For now, let's leave it in text field.
    }
}

#Preview {
    ContentView()
}
