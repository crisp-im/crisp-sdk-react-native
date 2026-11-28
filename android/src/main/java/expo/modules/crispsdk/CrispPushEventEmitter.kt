package expo.modules.crispsdk

import android.util.Log
import im.crisp.sdk.api.notification.CrispNotificationListener

/**
 * Forwards the Crisp notifications shown to JS as `onPushNotificationReceived`, in both notification modes.
 *
 * Registered with `CrispNotifications.addListener` from `Application.onCreate`
 * ([CrispApplicationLifecycleListener]), so that notifications received in background are not missed
 * by the SDK. They only reach JS while the module is alive: [sendEvent] is set in its `OnCreate`
 * and cleared in its `OnDestroy`.
 */
object CrispPushEventEmitter : CrispNotificationListener {
  private const val TAG = "CrispPushEventEmitter"

  @Volatile
  var sendEvent: ((name: String, body: Map<String, Any?>) -> Unit)? = null

  // Called on the main thread, once the notification is shown
  override fun onNotificationReceived(data: Map<String, String>) {
    try {
      sendEvent?.invoke(
        "onPushNotificationReceived",
        mapOf("title" to (data["title"] ?: ""), "body" to (data["body"] ?: ""))
      )
    } catch (e: Throwable) {
      Log.w(TAG, "Failed to emit onPushNotificationReceived to JS", e)
    }
  }
}
