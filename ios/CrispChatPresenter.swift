import Crisp
import UIKit

/// Single entry point for presenting the Crisp chatbox, shared by the module's
/// UI functions (`show`, `openChat`, `searchHelpdesk`, `openHelpdeskArticle`)
/// and the notification-tap handler.
enum CrispChatPresenter {

  enum Destination {
    /// The tab that was active when the chatbox was last closed.
    case lastActiveTab
    case chat
    case helpdeskSearch
    case helpdeskArticle(locale: String, slug: String, title: String?, category: String?)
  }

  /// How many times a presentation waits for an in-flight transition (e.g. a
  /// modal being dismissed right before `show()`) before giving up.
  private static let maxTransitionWaits = 3

  static func present(_ destination: Destination) {
    DispatchQueue.main.async {
      present(destination, remainingTransitionWaits: maxTransitionWaits)
    }
  }

  private static func present(_ destination: Destination, remainingTransitionWaits: Int) {
    guard var topViewController = keyWindow()?.rootViewController else {
      log("No key window, the chatbox was not presented.")
      return
    }
    if topViewController is ChatViewController {
      select(destination)
      return
    }
    while let presented = topViewController.presentedViewController {
      if presented is ChatViewController {
        select(destination)
        return
      }
      topViewController = presented
    }

    // UIKit drops a presentation onto a controller that is mid-transition, so
    // wait for the transition to finish and walk the chain again.
    if topViewController.isBeingPresented || topViewController.isBeingDismissed {
      guard remainingTransitionWaits > 0, let coordinator = topViewController.transitionCoordinator else {
        log("A transition is in progress, the chatbox was not presented.")
        return
      }
      coordinator.animate(alongsideTransition: nil) { _ in
        present(destination, remainingTransitionWaits: remainingTransitionWaits - 1)
      }
      return
    }

    select(destination)
    topViewController.present(ChatViewController(), animated: true)
  }

  private static func select(_ destination: Destination) {
    switch destination {
    case .lastActiveTab:
      break
    case .chat:
      CrispSDK.openChat()
    case .helpdeskSearch:
      CrispSDK.searchHelpdesk()
    case let .helpdeskArticle(locale, slug, title, category):
      CrispSDK.openHelpdeskArticle(locale: locale, slug: slug, title: title, category: category)
    }
  }

  private static func keyWindow() -> UIWindow? {
    return UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }
  }

  private static func log(_ message: String) {
    NSLog("[ExpoCrispSdk] %@", message)
  }
}
