@testable import Crisp
@testable internal import ExpoCrispSdk
import XCTest

final class CrispMigrationTests: XCTestCase {
  func testTextContent() throws {
    XCTAssertEqual(try ContentParser.fromDictionary(["type": "text", "text": "Synthetic"]), .text("Synthetic"))
  }

  func testFileAndAnimationContent() throws {
    let url = try XCTUnwrap(URL(string: "https://example.com/file"))
    XCTAssertEqual(
      try ContentParser.fromDictionary(["type": "file", "url": url.absoluteString, "name": "Document", "mimeType": "application/pdf"]),
      .file(.init(name: "Document", mimeType: "application/pdf", url: url))
    )
    XCTAssertEqual(
      try ContentParser.fromDictionary(["type": "animation", "url": url.absoluteString, "mimeType": "image/gif"]),
      .animation(.init(mimeType: "image/gif", url: url))
    )
  }

  func testAudioWithWholeSeconds() throws {
    let url = try XCTUnwrap(URL(string: "https://example.com/audio.mp3"))
    XCTAssertEqual(
      try ContentParser.fromDictionary(["type": "audio", "url": url.absoluteString, "mimeType": "audio/mpeg", "duration": 12.0]),
      .audio(.init(mimeType: "audio/mpeg", url: url, duration: 12))
    )
  }

  func testPickerSelection() throws {
    let content = try ContentParser.fromDictionary([
      "type": "picker", "id": "rating", "text": "Choose",
      "choices": [["value": "yes", "label": "Yes", "selected": true], ["value": "no", "label": "No"]]
    ])
    guard case .picker(let picker) = content else { return XCTFail("Expected picker") }
    XCTAssertEqual(picker.id, "rating")
    XCTAssertEqual(picker.text, "Choose")
    XCTAssertEqual(picker.choices.map(\.value), ["yes", "no"])
    XCTAssertEqual(picker.choices.map(\.selected), [true, false])
  }

  func testFieldSupportedProperties() throws {
    let content = try ContentParser.fromDictionary(["type": "field", "id": "email", "text": "Email", "explain": "Synthetic input"])
    guard case .field(let field) = content else { return XCTFail("Expected field") }
    XCTAssertEqual(field.id, "email")
    XCTAssertEqual(field.text, "Email")
    XCTAssertEqual(field.explain, "Synthetic input")
  }

  func testCarouselAction() throws {
    let content = try ContentParser.fromDictionary([
      "type": "carousel", "text": "Items",
      "targets": [["title": "Item", "description": "Synthetic", "imageUrl": "https://example.com/image.png", "actionUrl": "https://example.com/item"]]
    ])
    guard case .carousel(let carousel) = content else { return XCTFail("Expected carousel") }
    let target = try XCTUnwrap(carousel.targets.first)
    XCTAssertEqual(target.title, "Item")
    XCTAssertEqual(target.description, "Synthetic")
    XCTAssertEqual(target.image?.absoluteString, "https://example.com/image.png")
    XCTAssertEqual(target.actions.first?.url.absoluteString, "https://example.com/item")
  }

  func testUnknownAndIncompleteContentThrow() {
    XCTAssertThrowsError(try ContentParser.fromDictionary(["type": "unknown"]))
    XCTAssertThrowsError(try ContentParser.fromDictionary(["type": "file"]))
  }

  func testCompanyDoesNotInventEmploymentRole() {
    let company = CompanyParser.fromDictionary(["name": "Synthetic", "employment": ["title": "Developer"]])
    XCTAssertEqual(company.name, "Synthetic")
    XCTAssertEqual(company.employment?.title, "Developer")
    XCTAssertNil(company.employment?.role)
  }

  func testMessageTimestampAndFingerprint() {
    let message = Message(
      isMe: false, content: .text("Synthetic reply"), origin: .network,
      timestamp: Date(timeIntervalSince1970: 1794225600.123), fingerprint: 9007199254740993,
      from: .operator, user: .init(nickname: "Support", userId: "synthetic-operator", avatar: nil)
    )
    let result = MessageParser.toDictionary(message)
    XCTAssertEqual(result["timestamp"] as? Double, 1794225600123)
    XCTAssertEqual(result["fingerprint"] as? String, "9007199254740993")
    XCTAssertEqual(result["fromOperator"] as? Bool, true)
    XCTAssertEqual(result["origin"] as? String, "network")
    XCTAssertEqual((result["user"] as? [String: Any])?["nickname"] as? String, "Support")
  }

  func testNativePushRecognition() {
    let payload = ["sender": "CRISP", "website_id": "00000000-0000-0000-0000-000000000000", "session_id": "synthetic-session"]
    XCTAssertTrue(CrispSDK._isRawCrispPushNotification(payload))
    XCTAssertFalse(CrispSDK._isRawCrispPushNotification(["crisp_website_id": "synthetic"]))
    XCTAssertFalse(CrispSDK._isRawCrispPushNotification(["sender": "crisp", "website_id": "synthetic"]))
    XCTAssertFalse(CrispSDK._isRawCrispPushNotification(["sender": "application", "website_id": "synthetic", "session_id": "synthetic"]))
  }

  @MainActor
  func testLogSubscriptionsAreRemovedIndependently() async {
    let logger = CrispLogHandlerBridge.shared
    var oldMessages: [String] = []
    var newMessages: [String] = []
    let oldToken = logger.subscribe { _, message in oldMessages.append(message) }
    let newToken = logger.subscribe { _, message in
      XCTAssertTrue(Thread.isMainThread)
      newMessages.append(message)
    }
    defer { logger.removeSubscription(newToken) }
    logger.removeSubscription(oldToken)
    await Task.detached { logger.log(severity: .warning, message: "Synthetic warning") }.value
    await drainMainQueue()
    XCTAssertTrue(oldMessages.isEmpty)
    XCTAssertEqual(newMessages, ["Synthetic warning"])
  }

  @MainActor
  func testRemovedLogSubscriptionDoesNotReceiveQueuedLogs() async {
    let logger = CrispLogHandlerBridge.shared
    var messages: [String] = []
    let token = logger.subscribe { _, message in messages.append(message) }
    logger.log(severity: .info, message: "Queued")
    logger.removeSubscription(token)
    await drainMainQueue()
    XCTAssertTrue(messages.isEmpty)
  }

  @MainActor
  func testPushSubscriptionsAreRemovedIndependently() {
    let emitter = CrispNotificationEventEmitter.shared
    var oldCount = 0
    var currentBodies: [[String: Any]] = []
    let oldToken = emitter.subscribe { _, _ in oldCount += 1 }
    let currentToken = emitter.subscribe { name, body in
      XCTAssertEqual(name, "onPushNotificationReceived")
      currentBodies.append(body)
    }
    defer { emitter.removeSubscription(currentToken) }
    emitter.removeSubscription(oldToken)
    emitter.emitPushNotificationReceived(title: "Synthetic", body: "Body")
    XCTAssertEqual(oldCount, 0)
    XCTAssertEqual(currentBodies.count, 1)
    XCTAssertEqual(currentBodies.first?["title"] as? String, "Synthetic")
    XCTAssertEqual(currentBodies.first?["body"] as? String, "Body")
  }

  @MainActor
  private func drainMainQueue() async {
    await withCheckedContinuation { continuation in
      DispatchQueue.main.async { continuation.resume() }
    }
  }
}
