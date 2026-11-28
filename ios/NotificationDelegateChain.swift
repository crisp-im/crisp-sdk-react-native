import UserNotifications

/// The notification center delegates that Crisp replaced, so it can pass them the notifications
/// that are not from Crisp in coexistence mode.
///
/// A delegate installed after Crisp may forward to Crisp in turn: React Native Firebase installs
/// itself between Crisp's two installs and passes every notification it does not own back to
/// Crisp. Each time Crisp is re-entered during a forward, it moves one delegate further down
/// the chain instead of forwarding to the same one again, which would loop until the stack overflows.
final class NotificationDelegateChain {
  private var delegates: [UNUserNotificationCenterDelegate] = []
  private var depth = 0

  /// Records the delegate Crisp is replacing. The most recently replaced one is called first.
  func record(_ delegate: UNUserNotificationCenterDelegate?) {
    guard let delegate, !delegates.contains(where: { $0 === delegate }) else { return }
    delegates.append(delegate)
  }

  /// Calls `handle` with the next delegate down the chain. Returns false when no delegate is left
  /// or when `handle` returns false (the delegate does not implement the method): the caller then
  /// completes the notification itself.
  func forward(_ handle: (UNUserNotificationCenterDelegate) -> Bool) -> Bool {
    guard depth < delegates.count else { return false }
    let delegate = delegates[delegates.count - 1 - depth]
    depth += 1
    defer { depth -= 1 }
    return handle(delegate)
  }
}
