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
      CrispSDK.configure(websiteID: websiteId)

      if let notificationsEnabled = Bundle.main.object(forInfoDictionaryKey: "CrispNotificationsEnabled") as? Bool,
        notificationsEnabled
      {
        // Always register for remote notifications to obtain the APNs device token.
        // This does NOT prompt the user for permission (that's requestAuthorization).
        DispatchQueue.main.async {
          application.registerForRemoteNotifications()
        }

        // Always set up UNUserNotificationCenterDelegate for foreground notification handling.
        // Without this, iOS silently drops notifications received while the app is in foreground.
        setupNotificationDelegate()
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
      completionHandler()
    } else if isCoexistenceMode, let previous = previousDelegate {
      // In coexistence mode, forward non-Crisp notification taps to the previous delegate
      previous.userNotificationCenter?(center, didReceive: response, withCompletionHandler: completionHandler)
    } else {
      completionHandler()
    }
  }
}
