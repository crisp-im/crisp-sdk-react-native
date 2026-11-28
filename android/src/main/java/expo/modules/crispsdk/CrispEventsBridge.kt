package expo.modules.crispsdk

import im.crisp.sdk.api.controller.chatbox.CrispEventCallbacks
import im.crisp.sdk.model.Message

/** Forwards the events of the chatbox shown by the module to JS. */
class CrispEventsBridge(
  private val onEvent: (eventName: String, data: Map<String, Any?>) -> Unit
) : CrispEventCallbacks {
  override fun onSessionLoaded(sessionId: String) {
    onEvent("onSessionLoaded", mapOf("sessionId" to sessionId))
  }

  override fun onChatOpened() {
    onEvent("onChatOpened", emptyMap())
  }

  override fun onChatClosed() {
    onEvent("onChatClosed", emptyMap())
  }

  override fun onMessageSent(message: Message) {
    onEvent("onMessageSent", mapOf("message" to MessageParser.toMap(message)))
  }

  override fun onMessageReceived(message: Message) {
    onEvent("onMessageReceived", mapOf("message" to MessageParser.toMap(message)))
  }
}
