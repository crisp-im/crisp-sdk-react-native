import Crisp
import ExpoModulesCore

public class ExpoCrispSdkModule: Module {
  private let onSessionLoaded = "onSessionLoaded"
  private let onChatOpened = "onChatOpened"
  private let onChatClosed = "onChatClosed"
  private let onMessageSent = "onMessageSent"
  private let onMessageReceived = "onMessageReceived"
  private let onLogReceived = "onLogReceived"
  private let onNotificationReceived = "onNotificationReceived"
  private let onNotificationTapped = "onNotificationTapped"

  private var callbackTokens: [CallbackToken] = []
  private var logHandler: CrispLogHandlerBridge?
  private var isTokenRegistered = false
  private var lastRegisteredDate: Date?

  public func definition() -> ModuleDefinition {
    Name("ExpoCrispSdk")

    Events(
      onSessionLoaded,
      onChatOpened,
      onChatClosed,
      onMessageSent,
      onMessageReceived,
      onLogReceived,
      onNotificationReceived,
      onNotificationTapped
    )

    OnCreate {
      self.setupCallbacks()
      self.setupLogHandler()
    }

    OnDestroy {
      self.cleanupCallbacks()
    }

    // MARK: - Configuration

    Function("configure") { (websiteId: String) in
      CrispSDK.configure(websiteID: websiteId)
    }

    Function("setTokenId") { (tokenId: String?) in
      CrispSDK.setTokenID(tokenID: tokenId)
    }

    Function("setLogLevel") { (level: Int) in
      let severity = self.convertIntToSeverity(level)
      CrispSDK.setLogLevel(severity)
    }

    // MARK: - User Information

    Function("setUserEmail") { (email: String, signature: String?) in
      CrispSDK.user.email = email
      CrispSDK.user.signature = signature
    }

    Function("setUserNickname") { (name: String) in
      CrispSDK.user.nickname = name
    }

    Function("setUserPhone") { (phone: String) in
      CrispSDK.user.phone = phone
    }

    Function("setUserCompany") { (companyData: [String: Any]) in
      let company = CompanyParser.fromDictionary(companyData)
      CrispSDK.user.company = company
    }

    Function("setUserAvatar") { (url: String) in
      CrispSDK.user.avatar = URL(string: url)
    }

    // MARK: - Session Data

    Function("setSessionString") { (key: String, value: String) in
      CrispSDK.session.setString(value, forKey: key)
    }

    Function("setSessionBool") { (key: String, value: Bool) in
      CrispSDK.session.setBool(value, forKey: key)
    }

    Function("setSessionInt") { (key: String, value: Double) in
      CrispSDK.session.setInt(Int(value), forKey: key)
    }

    Function("setSessionSegment") { (segment: String) in
      CrispSDK.session.segment = segment
    }

    Function("setSessionSegments") { (segments: [String], overwrite: Bool) in
      CrispSDK.session.setSegments(segments, overwrite: overwrite)
    }

    AsyncFunction("getSessionIdentifier") { (promise: Promise) in
      if let identifier = CrispSDK.session.identifier {
        promise.resolve(identifier)
      } else {
        promise.resolve(nil)
      }
    }

    // MARK: - Events

    Function("pushSessionEvent") { (name: String, color: Int) in
      let sessionColor = self.convertIntToColor(color)
      CrispSDK.session.pushEvent(SessionEvent(name: name, color: sessionColor))
    }

    Function("pushSessionEvents") { (events: [[String: Any]]) in
      var sessionEvents: [SessionEvent] = []
      for event in events {
        if let name = event["name"] as? String {
          // Default to BLACK (9) if color is not provided (consistent with Android)
          let colorValue = event["color"] as? Int ?? 9
          let color = self.convertIntToColor(colorValue)
          sessionEvents.append(SessionEvent(name: name, color: color))
        }
      }
      CrispSDK.session.pushEvents(sessionEvents)
    }

    // MARK: - Session Management

    Function("resetSession") {
      CrispSDK.session.reset()
    }

    // MARK: - UI

    Function("show") {
      DispatchQueue.main.async {
        guard let viewController = self.findRootViewController() else { return }
        viewController.present(ChatViewController(), animated: true)
      }
    }

    Function("searchHelpdesk") {
      CrispSDK.searchHelpdesk()
    }

    Function("openHelpdeskArticle") { (id: String, locale: String, title: String?, category: String?) in
      CrispSDK.openHelpdeskArticle(locale: locale, slug: id, title: title, category: category)
    }

    Function("runBotScenario") { (scenarioId: String) in
      CrispSDK.session.runBotScenario(id: scenarioId)
    }

    // MARK: - Messages

    Function("showMessage") { (contentData: [String: Any]) in
      do {
        let content = try ContentParser.fromDictionary(contentData)
        CrispSDK.showMessage(with: content)
      } catch ContentParser.ContentParseError.unknownType(let type) {
        throw NSError(
          domain: "ExpoCrispSdk",
          code: 1,
          userInfo: [NSLocalizedDescriptionKey: "Unknown message content type: \(type)"]
        )
      } catch ContentParser.ContentParseError.missingRequiredField(let field) {
        throw NSError(
          domain: "ExpoCrispSdk",
          code: 2,
          userInfo: [NSLocalizedDescriptionKey: "Missing required field: \(field)"]
        )
      } catch {
        throw NSError(
          domain: "ExpoCrispSdk",
          code: 3,
          userInfo: [NSLocalizedDescriptionKey: "Failed to parse message content: \(error.localizedDescription)"]
        )
      }
    }

    // MARK: - Push Notifications

    AsyncFunction("registerPushToken") { (token: String, promise: Promise) in
      guard let tokenData = Data(hexString: token) else {
        promise.resolve([
          "success": false,
          "error": "invalid_token",
          "message": "Invalid hex token format. Expected hex-encoded APNs device token."
        ])
        return
      }

      CrispSDK.setDeviceToken(tokenData)
      self.isTokenRegistered = true
      self.lastRegisteredDate = Date()
      promise.resolve(["success": true])
    }

    AsyncFunction("unregisterPushToken") { (promise: Promise) in
      // Crisp iOS SDK doesn't have an explicit unregister method
      // Setting an empty token or nil is not supported
      // Just mark as unregistered locally
      self.isTokenRegistered = false
      self.lastRegisteredDate = nil
      promise.resolve(["success": true])
    }

    AsyncFunction("getNotificationStatus") { (promise: Promise) in
      let mode = self.getNotificationMode()
      var result: [String: Any] = [
        "isRegistered": self.isTokenRegistered,
        "mode": mode
      ]

      if let date = self.lastRegisteredDate {
        let formatter = ISO8601DateFormatter()
        result["lastRegistered"] = formatter.string(from: date)
      }

      promise.resolve(result)
    }

    Function("isCrispNotification") { (payload: [String: Any]?) -> Bool in
      guard let payload = payload else { return false }

      let sender = (payload["sender"] as? String)?.lowercased()
      return sender == "crisp" &&
             payload["website_id"] != nil &&
             payload["session_id"] != nil
    }

    AsyncFunction("handleNotification") { (payload: [String: Any], options: [String: Any]?, promise: Promise) in
      // Check if this is a Crisp notification
      let sender = (payload["sender"] as? String)?.lowercased()
      let isCrisp = sender == "crisp" &&
                    payload["website_id"] != nil &&
                    payload["session_id"] != nil

      guard isCrisp else {
        promise.resolve([
          "wasHandled": false,
          "wasDisplayed": false
        ])
        return
      }

      let displayNotification = options?["displayNotification"] as? Bool ?? true
      var warnings: [String] = []

      // iOS always displays notifications - warn if user tried to suppress
      if !displayNotification {
        warnings.append("iOS always displays notifications - displayNotification option ignored")
      }

      // Emit notification received event
      self.sendEvent(self.onNotificationReceived, [
        "notification": payload,
        "wasDisplayed": true // iOS always displays
      ])

      var result: [String: Any] = [
        "wasHandled": true,
        "wasDisplayed": true, // iOS always displays
        "sessionId": payload["session_id"] as Any
      ]

      if !warnings.isEmpty {
        result["warnings"] = warnings
      }

      promise.resolve(result)
    }
  }

  // MARK: - Private Helpers

  private func getNotificationMode() -> String {
    if let mode = Bundle.main.object(forInfoDictionaryKey: "CrispNotificationMode") as? String {
      return mode
    }
    // Default to uninitialized if not configured
    if Bundle.main.object(forInfoDictionaryKey: "CrispNotificationsEnabled") as? Bool == true {
      return "sdk-managed"
    }
    return "uninitialized"
  }

  private func convertIntToColor(_ colorInt: Int) -> SessionEventColor {
    switch colorInt {
    case 0: return .red
    case 1: return .orange
    case 2: return .yellow
    case 3: return .green
    case 4: return .blue
    case 5: return .purple
    case 6: return .pink
    case 7: return .brown
    case 8: return .grey
    case 9: return .black
    default: return .black
    }
  }

  private func findRootViewController() -> UIViewController? {
    if #available(iOS 15.0, *) {
      return UIApplication.shared.connectedScenes
        .compactMap { $0 as? UIWindowScene }
        .flatMap { $0.windows }
        .first { $0.isKeyWindow }?
        .rootViewController
    } else {
      return UIApplication.shared.windows.first?.rootViewController
    }
  }

  private func setupCallbacks() {
    callbackTokens.append(
      CrispSDK.addCallback(.sessionLoaded { [weak self] sessionId in
        guard let self = self else { return }
        self.sendEvent(self.onSessionLoaded, ["sessionId": sessionId])
      })
    )

    callbackTokens.append(
      CrispSDK.addCallback(.chatOpened { [weak self] in
        guard let self = self else { return }
        self.sendEvent(self.onChatOpened, [:])
      })
    )

    callbackTokens.append(
      CrispSDK.addCallback(.chatClosed { [weak self] in
        guard let self = self else { return }
        self.sendEvent(self.onChatClosed, [:])
      })
    )

    callbackTokens.append(
      CrispSDK.addCallback(.messageSent { [weak self] message in
        guard let self = self else { return }
        self.sendEvent(self.onMessageSent, ["message": MessageParser.toDictionary(message)])
      })
    )

    callbackTokens.append(
      CrispSDK.addCallback(.messageReceived { [weak self] message in
        guard let self = self else { return }
        self.sendEvent(self.onMessageReceived, ["message": MessageParser.toDictionary(message)])
      })
    )
  }

  private func setupLogHandler() {
    logHandler = CrispLogHandlerBridge { [weak self] severity, message in
      guard let self = self else { return }
      let levelInt = self.convertSeverityToInt(severity)
      self.sendEvent(self.onLogReceived, [
        "log": [
          "level": levelInt,
          "tag": "Crisp",  // iOS SDK doesn't provide a tag
          "message": message
        ]
      ])
    }
    if let handler = logHandler {
      CrispSDK.addLogHandler(handler)
    }
  }

  private func cleanupCallbacks() {
    for token in callbackTokens {
      CrispSDK.removeCallback(token: token)
    }
    callbackTokens.removeAll()

    // Note: Crisp SDK does not provide a way to remove log handlers.
    // The handler remains registered for the app lifetime.
    logHandler = nil
  }

  /// Converts TypeScript CrispLogLevel int to iOS Severity.
  /// Maps: VERBOSE(0)->debug, DEBUG(1)->debug, INFO(2)->info, WARN(3)->warning, ERROR(4)->error, ASSERT(5)->error
  private func convertIntToSeverity(_ levelInt: Int) -> Severity {
    switch levelInt {
    case 0, 1: return .debug     // VERBOSE and DEBUG -> debug
    case 2: return .info         // INFO -> info
    case 3: return .warning      // WARN -> warning
    case 4, 5: return .error     // ERROR and ASSERT -> error
    default: return .warning
    }
  }

  /// Converts iOS Severity to TypeScript CrispLogLevel int.
  /// Maps: debug->1, info->2, warning->3, error->4
  private func convertSeverityToInt(_ severity: Severity) -> Int {
    switch severity {
    case .debug: return 1      // DEBUG
    case .info: return 2       // INFO
    case .warning: return 3    // WARN
    case .error: return 4      // ERROR
    @unknown default: return 3 // WARN
    }
  }
}

// MARK: - Data Extension for Hex String Conversion

extension Data {
  init?(hexString: String) {
    let len = hexString.count / 2
    var data = Data(capacity: len)
    var index = hexString.startIndex
    for _ in 0..<len {
      let nextIndex = hexString.index(index, offsetBy: 2)
      guard let byte = UInt8(hexString[index..<nextIndex], radix: 16) else {
        return nil
      }
      data.append(byte)
      index = nextIndex
    }
    self = data
  }
}
