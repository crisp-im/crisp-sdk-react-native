@testable internal import ExpoCrispSdk
import UserNotifications
import XCTest

private final class FakeDelegate: NSObject, UNUserNotificationCenterDelegate {}

final class NotificationDelegateChainTests: XCTestCase {
  private let chain = NotificationDelegateChain()
  private let expoNotifications = FakeDelegate()
  private let firebase = FakeDelegate()
  private var calls: [FakeDelegate] = []

  /// What Crisp's delegate does with a notification that is not from Crisp in coexistence mode.
  /// `firebase` passes it back to Crisp, as React Native Firebase does with the notifications it does not own.
  private func crispReceivesForeignNotification() -> Bool {
    chain.forward { delegate in
      let fake = delegate as! FakeDelegate
      calls.append(fake)
      if fake === firebase {
        _ = crispReceivesForeignNotification()
      }
      return true
    }
  }

  func testDelegateForwardingBackReachesTheDelegateReplacedBeforeIt() {
    chain.record(expoNotifications)
    chain.record(firebase)

    XCTAssertTrue(crispReceivesForeignNotification())
    XCTAssertEqual(calls, [firebase, expoNotifications])
  }

  func testDelegateForwardingBackEndsWhenNoDelegateIsLeft() {
    chain.record(firebase)

    XCTAssertTrue(crispReceivesForeignNotification())
    XCTAssertEqual(calls, [firebase])
  }

  func testRecordsEachDelegateOnceAndIgnoresNil() {
    chain.record(nil)
    chain.record(expoNotifications)
    chain.record(expoNotifications)

    XCTAssertTrue(crispReceivesForeignNotification())
    XCTAssertEqual(calls, [expoNotifications])
  }

  func testReportsUnhandledWithoutDelegate() {
    XCTAssertFalse(chain.forward { _ in true })
  }
}
