import Crisp
import Foundation

/**
 * Parser for converting native Crisp Message to JS-compatible dictionary.
 */
enum MessageParser {
  static func toDictionary(_ message: Message) -> [String: Any] {
    let textContent: String
    switch message.content {
    case .text(let text):
      textContent = text
    case .textWithAttachment(let text, _, _):
      textContent = text
    case .textWithVideoAttachment(let text, _, _):
      textContent = text
    default:
      textContent = ""
    }

    let originString: String
    switch message.origin {
    case .local:
      originString = "local"
    case .network:
      originString = "network"
    case .update:
      originString = "update"
    }

    var dict: [String: Any] = [
      "content": textContent,
      "timestamp": message.timestamp.timeIntervalSince1970 * 1000,
      "fromOperator": message.from == .operator,
      "fingerprint": String(message.fingerprint),
      "isMe": message.isMe,
      "origin": originString
    ]

    // Add user info if available
    if let user = message.user {
      var userDict: [String: Any] = [:]
      if let nickname = user.nickname {
        userDict["nickname"] = nickname
      }
      if let userId = user.userId {
        userDict["userId"] = userId
      }
      if let avatar = user.avatar {
        userDict["avatar"] = avatar.absoluteString
      }
      if !userDict.isEmpty {
        dict["user"] = userDict
      }
    }

    return dict
  }
}
