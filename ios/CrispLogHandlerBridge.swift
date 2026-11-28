import Crisp
import Foundation

@MainActor
final class CrispLogHandlerBridge: CrispLogHandler {
  static let shared = CrispLogHandlerBridge()

  private var handlers: [UUID: (Severity, String) -> Void] = [:]
  private var isRegistered = false

  private init() {}

  func subscribe(_ handler: @escaping (Severity, String) -> Void) -> UUID {
    if !isRegistered {
      CrispSDK.addLogHandler(self)
      isRegistered = true
    }
    let token = UUID()
    handlers[token] = handler
    return token
  }

  func removeSubscription(_ token: UUID) {
    handlers.removeValue(forKey: token)
  }

  nonisolated func log(severity: Severity, message: String) {
    DispatchQueue.main.async {
      for handler in Array(self.handlers.values) {
        handler(severity, message)
      }
    }
  }

  nonisolated func log(error: any Error) {
    log(severity: .error, message: error.localizedDescription)
  }
}
