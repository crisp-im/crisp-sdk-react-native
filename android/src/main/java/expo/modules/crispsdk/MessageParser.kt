package expo.modules.crispsdk

import im.crisp.client.external.data.message.Message
import im.crisp.client.external.data.message.content.TextContent

/**
 * Parser for converting native Crisp Message to JS-compatible format.
 */
object MessageParser {
    fun toMap(message: Message): Map<String, Any?> {
        val content = message.content
        val textContent = if (content is TextContent) content.text else content?.toString() ?: ""

        return mapOf(
            "content" to textContent,
            "timestamp" to message.timestamp,
            "fromOperator" to (message.from == Message.From.OPERATOR)
        )
    }
}
