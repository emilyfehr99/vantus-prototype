# Vantus Pilot - iOS & WatchOS Integration Guide

This directory contains the source files for the Vantus Pilot MVP (The Silent Lifeline). 
Because this is a complex iOS + WatchOS project involving HealthKit and Biometrics, you must create the Xcode project structure manually and import these files.

## 1. Create Xcode Project
1. Open Xcode -> **Create a new Xcode project**.
2. Select **iOS** -> **App**.
3. Product Name: `VantusPilot`.
4. Interface: **SwiftUI**.
5. Language: **Swift**.
6. **IMPORTANT**: Check "Include Watch App" (if available in your Xcode version) or add a Watch Target later.

## 2. Shared Files
1. Drag `Shared/EventLog.swift` into the project.
2. Ensure `EventLog.swift` is a member of **Both** the iOS App target and the Watch App target.

## 3. iOS Target Setup
1. Drag all files from `iOS/` into your iOS group in Xcode.
    - `BiometricManager.swift`
    - `AudioListener.swift`
    - `ContentView.swift`
    - `VantusApp.swift` (Replace the default App file)
2. **Capabilities**: Go to Project Settings -> Signing & Capabilities:
    - Add **Background Modes**:
        - [x] Audio, AirPlay, and Picture in Picture
        - [x] Location updates
        - [x] Background processing
    - Add **HealthKit**.

3. **Info.plist Permissions**:
    Add the following keys to your `Info.plist`:
    - `Privacy - Microphone Usage Description`: "Vantus listens for officer safety keywords locally."
    - `Privacy - Speech Recognition Usage Description`: "We use speech recognition to detect emergency keywords."
    - `Privacy - Location Always and When In Use Usage Description`: "We track speed and location for safety monitoring."
    - `Privacy - Health Share Usage Description`: "We monitor heart rate for stress detection."

## 4. WatchOS Target Setup
1. Drag all files from `WatchOS/` into your Watch App group.
    - `WatchBiometricManager.swift`
    - `WatchContentView.swift`
2. **Capabilities**:
    - Add **HealthKit**.
    - Add **Background Modes** -> **Workout Processing**.

## 5. Build & Run
1. Select the **iOS Scheme** and run on a physical iPhone (Simulators cannot test Bluetooth/Sensor connectivity accurately).
2. Accept all permissions on the phone ("Start Patrol").
3. Ensure the Watch App is installed and running on the paired watch.

## Logs
The "Scribe" saves logs to `session_log.json` in the iPhone's Documents Directory. You can access this via iTunes File Sharing or by modifying the code to print the path.
