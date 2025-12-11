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

        // Origin.getValue() returns strings like "chat:local", "chat:network", "chat:update"
        // We extract the last part after ":" or use the full value if no ":"
        val originValue = message.origin?.getValue() ?: "network"
        val originString = when {
            originValue.endsWith("local") -> "local"
            originValue.endsWith("update") -> "update"
            else -> "network"
        }

        val result = mutableMapOf<String, Any?>(
            "content" to textContent,
            "timestamp" to message.timestamp,
            "fromOperator" to (message.from == Message.From.OPERATOR),
            "fingerprint" to message.fingerprint.toString(),
            "isMe" to message.isMe(),
            "origin" to originString
        )

        // Add user info if available
        val user = message.user
        if (user != null) {
            val userMap = mutableMapOf<String, Any?>()
            user.nickname?.let { userMap["nickname"] = it }
            user.userId?.let { userMap["userId"] = it }
            user.avatar?.let { userMap["avatar"] = it }
            if (userMap.isNotEmpty()) {
                result["user"] = userMap
            }
        }

        return result
    }
}
