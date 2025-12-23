import Crisp
import ExpoModulesCore
import UIKit

public class CrispAppDelegateSubscriber: ExpoAppDelegateSubscriber {

  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    if let websiteId = Bundle.main.object(forInfoDictionaryKey: "CrispWebsiteId") as? String {
      CrispSDK.configure(websiteID: websiteId)

      if let notificationsEnabled = Bundle.main.object(forInfoDictionaryKey: "CrispNotificationsEnabled") as? Bool,
        notificationsEnabled
      {
        DispatchQueue.main.async {
          application.registerForRemoteNotifications()
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
}
