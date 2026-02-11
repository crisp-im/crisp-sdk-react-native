import Crisp
import ExpoModulesCore

public class ExpoCrispSdkModule: Module {
  private let onSessionLoaded = "onSessionLoaded"
  private let onChatOpened = "onChatOpened"
  private let onChatClosed = "onChatClosed"
  private let onMessageSent = "onMessageSent"
  private let onMessageReceived = "onMessageReceived"
  private let onLogReceived = "onLogReceived"
  private let onPushNotificationReceived = "onPushNotificationReceived"

  private var callbackTokens: [CallbackToken] = []
  private var logHandler: CrispLogHandlerBridge?

  public func definition() -> ModuleDefinition {
    Name("ExpoCrispSdk")

    Events(
      onSessionLoaded,
      onChatOpened,
      onChatClosed,
      onMessageSent,
      onMessageReceived,
      onLogReceived,
      onPushNotificationReceived
    )

    OnCreate {
      self.setupCallbacks()
      self.setupLogHandler()
      self.setupNotificationEventEmitter()
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
        if let name = event["name"] as? String,
           let colorValue = event["color"] as? Int {
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

    // MARK: - Push Notifications (Coexistence Mode)

    Function("registerPushToken") { (token: String) in
      guard !token.isEmpty else { return }
      // Convert hex string to Data
      var data = Data()
      var index = token.startIndex
      while index < token.endIndex {
        let nextIndex = token.index(index, offsetBy: 2, limitedBy: token.endIndex) ?? token.endIndex
        if let byte = UInt8(token[index..<nextIndex], radix: 16) {
          data.append(byte)
        }
        index = nextIndex
      }
      CrispSDK.setDeviceToken(data)
    }

    Function("isCrispPushNotification") { (data: [String: String]) in
      return data.keys.contains("crisp_website_id")
    }

    Function("setShouldPromptForNotificationPermission") { (enabled: Bool) in
      CrispSDK.setShouldPromptForNotificationPermission(enabled)
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
  }

  // MARK: - Private Helpers

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

  private func setupNotificationEventEmitter() {
    CrispNotificationEventEmitter.shared.sendEvent = { [weak self] name, body in
      self?.sendEvent(name, body)
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

