import Foundation

@MainActor
final class CrispNotificationEventEmitter {

  static let shared = CrispNotificationEventEmitter()

  private var handlers: [UUID: (String, [String: Any]) -> Void] = [:]

  private init() {}

  func subscribe(_ handler: @escaping (String, [String: Any]) -> Void) -> UUID {
    let token = UUID()
    handlers[token] = handler
    return token
  }

  func removeSubscription(_ token: UUID) {
    handlers.removeValue(forKey: token)
  }

  func emitPushNotificationReceived(title: String, body: String) {
    for handler in Array(handlers.values) {
      handler("onPushNotificationReceived", ["title": title, "body": body])
    }
  }
}
