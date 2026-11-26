package expo.modules.crispsdk

import android.util.Log
import im.crisp.sdk.api.CrispLogger

/**
 * Forwards the SDK and Web client logs to JS. Once registered, Crisp no longer logs to Logcat.
 * May be called from any thread.
 */
class CrispLoggerBridge(
  private val onLog: (level: Int, tag: String, message: String) -> Unit
) : CrispLogger {
  override fun log(priority: Int, tag: String, message: String) {
    onLog(CrispLogLevels.fromPriority(priority), tag, message)
  }
}

/** Maps the JS `CrispLogLevel` (VERBOSE 0 … ASSERT 5) to the `android.util.Log` priorities (VERBOSE 2 … ASSERT 7). */
internal object CrispLogLevels {
  fun toPriority(level: Int): Int = if (level in 0..5) Log.VERBOSE + level else Log.WARN

  fun fromPriority(priority: Int): Int = (priority - Log.VERBOSE).coerceIn(0, 5)
}
