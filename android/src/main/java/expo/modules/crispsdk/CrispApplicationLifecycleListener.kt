package expo.modules.crispsdk

import android.app.Application
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import expo.modules.core.interfaces.ApplicationLifecycleListener
import im.crisp.sdk.api.notification.CrispNotifications

/**
 * Applies the config plugin settings (AndroidManifest meta-data) in `Application.onCreate`,
 * before Firebase Cloud Messaging delivers a notification to a process it started:
 * configures the website and enables its notifications.
 */
class CrispApplicationLifecycleListener : ApplicationLifecycleListener {
  override fun onCreate(application: Application) {
    val metaData = try {
      application.packageManager
        .getApplicationInfo(application.packageName, PackageManager.GET_META_DATA)
        .metaData
    } catch (e: PackageManager.NameNotFoundException) {
      null
    } ?: return

    val websiteId = metaData.getString(WEBSITE_ID)?.takeIf { it.isNotBlank() } ?: return
    CrispIdentity.configure(websiteId)

    if (!metaData.isTrue(NOTIFICATIONS_ENABLED)) return
    // Persisted by the SDK, which registers the device on the session of the next chatbox loading the website
    CrispNotifications.setEnabled(application, websiteId, true)
    CrispNotifications.addListener(CrispPushEventEmitter)
    Log.d(TAG, "Notifications enabled (${metaData.getString(NOTIFICATIONS_MODE) ?: "sdk-managed"} mode)")
  }

  // Android parses the meta-data value "true" written by the config plugin as a Boolean: read it untyped
  @Suppress("DEPRECATION")
  private fun Bundle.isTrue(key: String): Boolean = when (val value = get(key)) {
    is Boolean -> value
    is String -> value.equals("true", ignoreCase = true)
    else -> false
  }

  private companion object {
    const val TAG = "CrispLifecycle"
    const val WEBSITE_ID = "expo.modules.crispsdk.WEBSITE_ID"
    const val NOTIFICATIONS_ENABLED = "expo.modules.crispsdk.NOTIFICATIONS_ENABLED"
    const val NOTIFICATIONS_MODE = "expo.modules.crispsdk.NOTIFICATIONS_MODE"
  }
}
