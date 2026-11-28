package expo.modules.crispsdk

import im.crisp.sdk.model.Message
import im.crisp.sdk.model.MessageContent

/** Converts a native Crisp [Message] to the JS `CrispMessage`, as the iOS bridge does. */
object MessageParser {
  fun toMap(message: Message): Map<String, Any?> {
    val result = mutableMapOf<String, Any?>(
      "content" to textOf(message.content),
      "timestamp" to message.timestamp.time,
      "fromOperator" to (message.from == Message.Sender.OPERATOR),
      "fingerprint" to message.fingerprint.toString(),
      "isMe" to message.isMe,
      "origin" to message.origin.name.lowercase()
    )

    val user = message.user
    if (user != null) {
      val userMap = mutableMapOf<String, Any?>()
      user.nickname?.let { userMap["nickname"] = it }
      user.userId?.let { userMap["userId"] = it }
      user.avatar?.let { userMap["avatar"] = it.toString() }
      if (userMap.isNotEmpty()) {
        result["user"] = userMap
      }
    }

    return result
  }

  // The JS content is a string: the text of text messages, empty for the others
  private fun textOf(content: MessageContent): String = when (content) {
    is MessageContent.TextContent -> content.text
    is MessageContent.TextContentWithAttachment -> content.text
    is MessageContent.TextContentWithVideoAttachment -> content.text
    else -> ""
  }
}
