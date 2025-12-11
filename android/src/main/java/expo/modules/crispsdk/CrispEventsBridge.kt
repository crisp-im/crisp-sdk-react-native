package expo.modules.crispsdk

import im.crisp.client.external.EventsCallback
import im.crisp.client.external.data.message.Message

/**
 * Bridge class that implements Crisp's EventsCallback interface
 * and forwards events to the Expo module for emission to JavaScript.
 *
 * IMPORTANT: Crisp SDK keeps strong references to callbacks.
 * This class must be properly unregistered via Crisp.removeCallback()
 * to avoid memory leaks.
 */
class CrispEventsBridge(
    private val onEvent: (eventName: String, data: Map<String, Any?>) -> Unit
) : EventsCallback {

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
