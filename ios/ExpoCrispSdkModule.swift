import Crisp
import ExpoModulesCore

public class ExpoCrispSdkModule: Module {
  private let onSessionLoaded = "onSessionLoaded"
  private let onChatOpened = "onChatOpened"
  private let onChatClosed = "onChatClosed"
  private let onMessageSent = "onMessageSent"
  private let onMessageReceived = "onMessageReceived"

  private var callbackTokens: [CallbackToken] = []

  public func definition() -> ModuleDefinition {
    Name("ExpoCrispSdk")

    Events(
      onSessionLoaded,
      onChatOpened,
      onChatClosed,
      onMessageSent,
      onMessageReceived
    )

    OnCreate {
      self.setupCallbacks()
    }

    // MARK: - Configuration

    Function("configure") { (websiteId: String) in
      CrispSDK.configure(websiteID: websiteId)
    }

    Function("setTokenId") { (tokenId: String?) in
      CrispSDK.setTokenID(tokenID: tokenId)
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
}
