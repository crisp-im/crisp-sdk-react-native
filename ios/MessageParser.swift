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

    return [
      "content": textContent,
      "timestamp": message.timestamp.timeIntervalSince1970 * 1000,
      "fromOperator": message.from == .operator
    ]
  }
}
