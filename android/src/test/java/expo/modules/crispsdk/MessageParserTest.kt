package expo.modules.crispsdk

import im.crisp.sdk.model.File
import im.crisp.sdk.model.Message
import im.crisp.sdk.model.MessageContent
import java.net.URL
import java.util.Date
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

class MessageParserTest {
  private fun message(content: MessageContent, user: Message.User? = null) = Message(
    isMe = false,
    content = content,
    origin = Message.Origin.NETWORK,
    timestamp = Date(1_700_000_000_123),
    fingerprint = 42L,
    from = Message.Sender.OPERATOR,
    user = user
  )

  @Test
  fun `converts a text message as the iOS bridge does`() {
    val result = MessageParser.toMap(
      message(
        MessageContent.TextContent("Hi"),
        Message.User(nickname = "Ana", userId = "u1", avatar = URL("https://example.com/a.png"))
      )
    )
    assertEquals(
      mapOf(
        "content" to "Hi",
        "timestamp" to 1_700_000_000_123L,
        "fromOperator" to true,
        "fingerprint" to "42",
        "isMe" to false,
        "origin" to "network",
        "user" to mapOf("nickname" to "Ana", "userId" to "u1", "avatar" to "https://example.com/a.png")
      ),
      result
    )
  }

  @Test
  fun `sends an empty content for other messages and omits an empty user`() {
    val result = MessageParser.toMap(
      message(MessageContent.FileContent(File("a.pdf", "application/pdf", URL("https://example.com/a.pdf"))), Message.User())
    )
    assertEquals("", result["content"])
    assertFalse(result.containsKey("user"))
  }
}
