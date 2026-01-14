package expo.modules.crispsdk

import android.app.Application
import android.content.pm.PackageManager
import android.util.Log
import expo.modules.core.interfaces.ApplicationLifecycleListener
import im.crisp.client.external.Crisp

class CrispApplicationLifecycleListener : ApplicationLifecycleListener {

  companion object {
    private const val TAG = "CrispLifecycle"
  }

  override fun onCreate(application: Application) {
    Log.d(TAG, "onCreate called")

    val appInfo = application.packageManager.getApplicationInfo(
      application.packageName,
      PackageManager.GET_META_DATA
    )

    val websiteId = appInfo.metaData?.getString("expo.modules.crispsdk.WEBSITE_ID")
    // AndroidManifest meta-data stores values as strings, so we need to parse it
    val notificationsEnabledRaw = appInfo.metaData?.get("expo.modules.crispsdk.NOTIFICATIONS_ENABLED")
    val notificationsEnabled = when (notificationsEnabledRaw) {
      is Boolean -> notificationsEnabledRaw
      is String -> notificationsEnabledRaw.equals("true", ignoreCase = true)
      else -> false
    }

    Log.d(TAG, "websiteId: $websiteId")
    Log.d(TAG, "notificationsEnabled: $notificationsEnabled (raw: $notificationsEnabledRaw, type: ${notificationsEnabledRaw?.javaClass?.simpleName})")

    websiteId?.let { id ->
      Log.d(TAG, "Calling Crisp.configure($id)")
      Crisp.configure(application, id)

      if (notificationsEnabled) {
        Log.d(TAG, "Calling Crisp.enableNotifications(true)")
        Crisp.enableNotifications(application, true)
      }
    } ?: run {
      Log.e(TAG, "websiteId is NULL - check AndroidManifest meta-data")
    }
  }
}
