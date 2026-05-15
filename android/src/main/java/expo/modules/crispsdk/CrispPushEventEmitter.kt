package expo.modules.crispsdk

import android.util.Log

/**
 * Bridges the generated ExpoCrispFirebaseMessagingService (coexistence
 * mode) to the ExpoCrispSdkModule's event system so push notifications
 * can be forwarded to JS via `onPushNotificationReceived`. Mirrors the
 * iOS-side `CrispNotificationEventEmitter` pattern.
 *
 * `sendEvent` is installed in `ExpoCrispSdkModule.OnCreate` and cleared
 * in `OnDestroy`. Calls that arrive when the module is not active (e.g.
 * app killed/backgrounded, or before `OnCreate` during cold start) are
 * safe no-ops via the `?.invoke` null-safety operator.
 *
 * Thread safety: `sendEvent` is written from the main thread (the
 * module's `OnCreate`/`OnDestroy`) and read from the FCM service worker
 * thread (`onMessageReceived`). `@Volatile` guarantees memory visibility
 * across threads — without it the FCM thread could read a stale cached
 * null and silently drop events. The null-safe call reads the var once
 * before invoking, so there's no race between null-check and invocation.
 */
object CrispPushEventEmitter {
    private const val TAG = "CrispPushEventEmitter"

    @Volatile
    var sendEvent: ((name: String, body: Map<String, Any?>) -> Unit)? = null

    fun emitPushNotificationReceived(title: String, body: String) {
        // Best-effort emit. The FCM service worker thread must not let
        // exceptions propagate back to FCM — that would mark the message
        // as failed and could trigger redelivery. The OS notification has
        // already been posted by CrispNotificationClient.handleNotification(...)
        // before this is called, so a failure here only loses the JS
        // event, never the user-facing alert.
        try {
            sendEvent?.invoke("onPushNotificationReceived", mapOf(
                "title" to title,
                "body" to body
            ))
        } catch (e: Throwable) {
            Log.w(TAG, "Failed to emit onPushNotificationReceived to JS", e)
        }
    }
}
