import Crisp
import ExpoModulesCore
import UIKit
import UserNotifications

public class CrispAppDelegateSubscriber: ExpoAppDelegateSubscriber {

  private var previousDelegate: UNUserNotificationCenterDelegate?
  private var isCoexistenceMode: Bool {
    return Bundle.main.object(forInfoDictionaryKey: "CrispNotificationsMode") as? String == "coexistence"
  }

  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    if let websiteId = Bundle.main.object(forInfoDictionaryKey: "CrispWebsiteId") as? String {
      DispatchQueue.main.async {
        CrispSDK.configure(websiteID: websiteId)

        if let notificationsEnabled = Bundle.main.object(forInfoDictionaryKey: "CrispNotificationsEnabled") as? Bool,
          notificationsEnabled
        {
          // Always register for remote notifications to obtain the APNs device token.
          // This does NOT prompt the user for permission (that's requestAuthorization).
          application.registerForRemoteNotifications()

          // Always set up UNUserNotificationCenterDelegate for foreground notification handling.
          // Without this, iOS silently drops notifications received while the app is in foreground.
          self.setupNotificationDelegate()
        }
      }
    }
    return true
  }

  public func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    CrispSDK.setDeviceToken(deviceToken)
  }

  public func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    print("[ExpoCrispSdk] Failed to register for remote notifications: \(error.localizedDescription)")
  }

  // MARK: - Coexistence Mode: UNUserNotificationCenterDelegate Setup

  private func setupNotificationDelegate() {
    let center = UNUserNotificationCenter.current()

    // Save the previous delegate for chain of responsibility
    previousDelegate = center.delegate

    // Set ourselves as the delegate
    center.delegate = self
  }

  // MARK: - Chatbox Presentation (notification tap)

  /// Presents the Crisp chatbox modally on the top-most view controller —
  /// the same `ChatViewController` the module's `show()` function uses —
  /// after selecting the "Chat" tab via `CrispSDK.openChat()` so the tapped
  /// notification lands on the conversation.
  /// Walks the `presentedViewController` chain so it works even when another
  /// modal is already on screen, and no-ops if a chatbox is anywhere in the
  /// chain (the chat may itself have presented a child controller, e.g. an
  /// image/attachment preview) or if a transition is in flight.
  fileprivate static func presentChatbox() {
    DispatchQueue.main.async {
      guard var topViewController = keyWindow()?.rootViewController else { return }
      // No-op if a Crisp chatbox is already anywhere in the presentation chain.
      if topViewController is ChatViewController { return }
      while let presented = topViewController.presentedViewController {
        if presented is ChatViewController { return }
        topViewController = presented
      }
      // Don't present onto a controller mid-transition — UIKit would drop it.
      guard !topViewController.isBeingPresented, !topViewController.isBeingDismissed else { return }
      // Select the "Chat" tab before presenting so the tapped notification opens
      // on the conversation rather than the Helpdesk tab. `openChat()` only sets
      // the active tab for the next presentation — it does not present anything
      // itself — so the explicit `present` below is still required.
      CrispSDK.openChat()
      topViewController.present(ChatViewController(), animated: true)
    }
  }

  private static func keyWindow() -> UIWindow? {
    return UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }
  }
}

// MARK: - UNUserNotificationCenterDelegate (Coexistence Mode)

extension CrispAppDelegateSubscriber: UNUserNotificationCenterDelegate {

  public func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    if CrispSDK.isCrispPushNotification(notification) {
      // Handle Crisp notification in foreground (both modes)
      CrispSDK.handlePushNotification(notification)

      // Emit onPushNotificationReceived event to JS
      let content = notification.request.content
      CrispNotificationEventEmitter.shared.emitPushNotificationReceived(
        title: content.title,
        body: content.body
      )

      completionHandler([.banner, .sound])
    } else if isCoexistenceMode, let previous = previousDelegate {
      // In coexistence mode, forward non-Crisp notifications to the previous delegate
      previous.userNotificationCenter?(center, willPresent: notification, withCompletionHandler: completionHandler)
    } else {
      // Default: show the notification
      completionHandler([.banner, .sound])
    }
  }

  public func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    let notification = response.notification
    if CrispSDK.isCrispPushNotification(notification) {
      // Handle Crisp notification tap (both modes)
      CrispSDK.handlePushNotification(notification)

      // Open the chatbox so the tapped conversation is actually shown.
      // `handlePushNotification` only performs SDK bookkeeping; without an
      // explicit present, tapping a Crisp notification brings the app to the
      // foreground but leaves the message hidden in the closed chatbox.
      Self.presentChatbox()

      completionHandler()
    } else if isCoexistenceMode, let previous = previousDelegate {
      // In coexistence mode, forward non-Crisp notification taps to the previous delegate
      previous.userNotificationCenter?(center, didReceive: response, withCompletionHandler: completionHandler)
    } else {
      completionHandler()
    }
  }
}
