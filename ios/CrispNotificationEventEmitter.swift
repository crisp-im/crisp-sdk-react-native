import ExpoModulesCore

/// Singleton that allows the CrispAppDelegateSubscriber to emit events
/// through the ExpoCrispSdkModule's event system.
class CrispNotificationEventEmitter {

  static let shared = CrispNotificationEventEmitter()

  /// Reference to the module's sendEvent function, set by ExpoCrispSdkModule on create.
  var sendEvent: ((_ name: String, _ body: [String: Any]) -> Void)?

  private init() {}

  func emitPushNotificationReceived(title: String, body: String) {
    sendEvent?("onPushNotificationReceived", [
      "title": title,
      "body": body
    ])
  }
}
