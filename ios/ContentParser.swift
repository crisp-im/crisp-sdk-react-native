import Crisp
import Foundation

/**
 * Parser for converting JavaScript message content dictionaries to native Crisp Message.Content.
 *
 * TypeScript union type: MessageContent
 * Discriminated by "type" field: text, file, animation, audio, picker, field, carousel
 */
enum ContentParser {

  enum ContentParseError: Error {
    case unknownType(String)
    case missingRequiredField(String)
  }

  /**
   * Parse a dictionary from JavaScript into Message.Content for CrispSDK.showMessage
   *
   * - Parameter dict: Dictionary with "type" discriminator and type-specific fields
   * - Returns: Message.Content enum value
   * - Throws: ContentParseError for invalid or unsupported content
   */
  static func fromDictionary(_ dict: [String: Any]) throws -> Message.Content {
    guard let type = dict["type"] as? String else {
      throw ContentParseError.missingRequiredField("type")
    }

    switch type {
    case "text":
      return try parseTextContent(dict)
    case "file":
      return try parseFileContent(dict)
    case "animation":
      return try parseAnimationContent(dict)
    case "audio":
      return try parseAudioContent(dict)
    case "picker":
      return try parsePickerContent(dict)
    case "field":
      return try parseFieldContent(dict)
    case "carousel":
      return try parseCarouselContent(dict)
    default:
      throw ContentParseError.unknownType(type)
    }
  }

  // MARK: - Private Parsers

  private static func parseTextContent(_ dict: [String: Any]) throws -> Message.Content {
    guard let text = dict["text"] as? String else {
      throw ContentParseError.missingRequiredField("text")
    }
    return .text(text)
  }

  private static func parseFileContent(_ dict: [String: Any]) throws -> Message.Content {
    guard let urlString = dict["url"] as? String,
          let url = URL(string: urlString) else {
      throw ContentParseError.missingRequiredField("url")
    }
    guard let name = dict["name"] as? String else {
      throw ContentParseError.missingRequiredField("name")
    }
    guard let mimeType = dict["mimeType"] as? String else {
      throw ContentParseError.missingRequiredField("mimeType")
    }

    let file = Message.Content.File(name: name, mimeType: mimeType, url: url)
    return .file(file)
  }

  private static func parseAnimationContent(_ dict: [String: Any]) throws -> Message.Content {
    guard let urlString = dict["url"] as? String,
          let url = URL(string: urlString) else {
      throw ContentParseError.missingRequiredField("url")
    }
    guard let mimeType = dict["mimeType"] as? String else {
      throw ContentParseError.missingRequiredField("mimeType")
    }

    let imageFile = Message.Content.ImageFile(mimeType: mimeType, url: url)
    return .animation(imageFile)
  }

  private static func parseAudioContent(_ dict: [String: Any]) throws -> Message.Content {
    guard let urlString = dict["url"] as? String,
          let url = URL(string: urlString) else {
      throw ContentParseError.missingRequiredField("url")
    }
    guard let mimeType = dict["mimeType"] as? String else {
      throw ContentParseError.missingRequiredField("mimeType")
    }
    guard let duration = dict["duration"] as? Double else {
      throw ContentParseError.missingRequiredField("duration")
    }

    let audioFile = Message.Content.AudioFile(mimeType: mimeType, url: url, duration: Int(duration))
    return .audio(audioFile)
  }

  private static func parsePickerContent(_ dict: [String: Any]) throws -> Message.Content {
    guard let id = dict["id"] as? String else {
      throw ContentParseError.missingRequiredField("id")
    }
    guard let text = dict["text"] as? String else {
      throw ContentParseError.missingRequiredField("text")
    }
    guard let choicesArray = dict["choices"] as? [[String: Any]] else {
      throw ContentParseError.missingRequiredField("choices")
    }

    var choices: [Message.Content.PickerValue.Choice] = []
    for choiceDict in choicesArray {
      guard let value = choiceDict["value"] as? String,
            let label = choiceDict["label"] as? String else {
        continue
      }
      let selected = choiceDict["selected"] as? Bool ?? false
      choices.append(Message.Content.PickerValue.Choice(
        label: label,
        icon: nil,
        selected: selected,
        value: value,
        action: nil
      ))
    }

    let pickerValue = Message.Content.PickerValue(id: id, text: text, choices: choices)
    return .picker(pickerValue)
  }

  private static func parseFieldContent(_ dict: [String: Any]) throws -> Message.Content {
    guard let id = dict["id"] as? String else {
      throw ContentParseError.missingRequiredField("id")
    }
    guard let text = dict["text"] as? String else {
      throw ContentParseError.missingRequiredField("text")
    }
    let explain = dict["explain"] as? String ?? ""
    let value = dict["value"] as? String

    let fieldValue = Message.Content.FieldValue(id: id, text: text, explain: explain, value: value)
    return .field(fieldValue)
  }

  private static func parseCarouselContent(_ dict: [String: Any]) throws -> Message.Content {
    guard let text = dict["text"] as? String else {
      throw ContentParseError.missingRequiredField("text")
    }
    guard let targetsArray = dict["targets"] as? [[String: Any]] else {
      throw ContentParseError.missingRequiredField("targets")
    }

    var targets: [Message.Content.CarouselValue.Target] = []
    for targetDict in targetsArray {
      guard let title = targetDict["title"] as? String else {
        continue
      }
      let description = targetDict["description"] as? String ?? ""
      let imageUrl = (targetDict["imageUrl"] as? String).flatMap { URL(string: $0) }
      let actionUrl = targetDict["actionUrl"] as? String

      // Build actions list from actionUrl if provided
      var actions: [Message.Content.CarouselValue.Target.Action] = []
      if let actionUrl = actionUrl, let url = URL(string: actionUrl) {
        actions.append(Message.Content.CarouselValue.Target.Action(label: "Open", url: url))
      }

      targets.append(Message.Content.CarouselValue.Target(
        title: title,
        description: description,
        image: imageUrl,
        actions: actions
      ))
    }

    let carouselValue = Message.Content.CarouselValue(text: text, targets: targets)
    return .carousel(carouselValue)
  }
}
