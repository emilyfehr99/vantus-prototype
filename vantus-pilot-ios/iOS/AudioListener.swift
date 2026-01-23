import Foundation
import Speech
import AVFoundation

class AudioListener: ObservableObject {
    static let shared = AudioListener()
    
    // Keywords to listen for
    private let triggers = ["shots fired", "drop the gun", "10-33", "officer down"]
    
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()
    
    @Published var isListening = false
    
    func requestPermissions(completion: @escaping (Bool) -> Void) {
        SFSpeechRecognizer.requestAuthorization { authStatus in
            DispatchQueue.main.async {
                switch authStatus {
                case .authorized:
                    AVAudioSession.sharedInstance().requestRecordPermission { allowed in
                        DispatchQueue.main.async {
                            completion(allowed)
                        }
                    }
                default:
                    completion(false)
                }
            }
        }
    }
    
    func startListening() throws {
        // Cancel existing task if any
        if recognitionTask != nil {
            recognitionTask?.cancel()
            recognitionTask = nil
        }
        
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        
        guard let recognitionRequest = recognitionRequest else {
            fatalError("Unable to create an SFSpeechAudioBufferRecognitionRequest object")
        }
        
        // Critical for offline/privacy
        recognitionRequest.requiresOnDeviceRecognition = true
        recognitionRequest.shouldReportPartialResults = true
        
        let inputNode = audioEngine.inputNode
        
        recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { result, error in
            if let result = result {
                self.processResult(result)
            }
            
            if error != nil || (result?.isFinal ?? false) {
                self.audioEngine.stop()
                inputNode.removeTap(onBus: 0)
                self.isListening = false
            }
        }
        
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { (buffer, when) in
            self.recognitionRequest?.append(buffer)
        }
        
        audioEngine.prepare()
        try audioEngine.start()
        
        isListening = true
        Logger.shared.log(type: .systemStatus, data: "Audio Listener Started (On-Device)")
    }
    
    func stopListening() {
        audioEngine.stop()
        recognitionRequest?.endAudio()
        isListening = false
        Logger.shared.log(type: .systemStatus, data: "Audio Listener Stopped")
    }
    
    private func processResult(_ result: SFSpeechRecognitionResult) {
        let bestString = result.bestTranscription.formattedString.lowercased()
        
        // Simple containment check. For production, would ideally process the *new* segments only.
        for trigger in triggers {
            if bestString.contains(trigger) {
                Logger.shared.log(type: .audioTrigger, data: trigger)
                // In a real scenario, we might want to "debounce" this or clear the buffer to avoid re-triggering on the same utterance immediately.
                // For MVP, we log it.
            }
        }
    }
}
