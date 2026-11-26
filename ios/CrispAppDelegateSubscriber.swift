import Crisp
import ExpoModulesCore
import UIKit
import UserNotifications

public class CrispAppDelegateSubscriber: ExpoAppDelegateSubscriber {

  private let replacedDelegates = NotificationDelegateChain()
  private var isCoexistenceMode: Bool {
    return Bundle.main.object(forInfoDictionaryKey: "CrispNotificationsMode") as? String == "coexistence"
  }

  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    guard let websiteId = Bundle.main.object(forInfoDictionaryKey: "CrispWebsiteId") as? String else {
      return true
    }
    let notificationsEnabled =
      Bundle.main.object(forInfoDictionaryKey: "CrispNotificationsEnabled") as? Bool ?? false

    // iOS hands the tap on a notification that launched the app only to the delegate set
    // before launch finishes: set it now, without it the tap opens the app but not the chatbox.
    // Without a delegate, iOS also drops the notifications received in the foreground.
    if notificationsEnabled {
      setupNotificationDelegate()
    }

    DispatchQueue.main.async {
      CrispSDK.configure(websiteID: websiteId)

      if notificationsEnabled {
        // Obtains the APNs device token, without prompting the user for permission (requestAuthorization does)
        application.registerForRemoteNotifications()

        // Takes the delegate back if another subscriber replaced it after this one,
        // and passes it the notifications that are not from Crisp in coexistence mode
        self.setupNotificationDelegate()
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
    guard center.delegate !== self else { return }

    // Keep the replaced delegate to pass it the notifications that are not from Crisp
    replacedDelegates.record(center.delegate)

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
      let title = content.title
      let body = content.body
      DispatchQueue.main.async {
        CrispNotificationEventEmitter.shared.emitPushNotificationReceived(title: title, body: body)
      }

      completionHandler([.banner, .sound])
    } else if isCoexistenceMode,
      replacedDelegates.forward({
        $0.userNotificationCenter?(center, willPresent: notification, withCompletionHandler: completionHandler) != nil
      })
    {
      // In coexistence mode, a replaced delegate handled the non-Crisp notification
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
      // foreground but leaves the message hidden in the closed chatbox. The
      // "Chat" tab is selected so it lands on the conversation.
      CrispChatPresenter.present(.chat)

      completionHandler()
    } else if isCoexistenceMode,
      replacedDelegates.forward({
        $0.userNotificationCenter?(center, didReceive: response, withCompletionHandler: completionHandler) != nil
      })
    {
      // In coexistence mode, a replaced delegate handled the tap on the non-Crisp notification
    } else {
      completionHandler()
    }
  }
}
