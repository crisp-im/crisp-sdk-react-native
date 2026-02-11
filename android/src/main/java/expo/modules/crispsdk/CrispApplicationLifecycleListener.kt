package expo.modules.crispsdk

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.pm.PackageManager
import android.os.Build
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

    val notificationsMode = appInfo.metaData?.getString("expo.modules.crispsdk.NOTIFICATIONS_MODE") ?: "sdk-managed"

    Log.d(TAG, "websiteId: $websiteId")
    Log.d(TAG, "notificationsEnabled: $notificationsEnabled (raw: $notificationsEnabledRaw, type: ${notificationsEnabledRaw?.javaClass?.simpleName})")
    Log.d(TAG, "notificationsMode: $notificationsMode")

    websiteId?.let { id ->
      Log.d(TAG, "Calling Crisp.configure($id)")
      Crisp.configure(application, id)

      if (notificationsEnabled) {
        createNotificationChannel(application, id)

        Log.d(TAG, "Calling Crisp.enableNotifications(true)")
        Crisp.enableNotifications(application, true)

        if (notificationsMode == "coexistence") {
          Log.d(TAG, "Coexistence mode: CrispNotificationService NOT registered (handled by ExpoCrispFirebaseMessagingService)")
        }
      }
    } ?: run {
      Log.e(TAG, "websiteId is NULL - check AndroidManifest meta-data")
    }
  }

  private fun createNotificationChannel(application: Application, websiteId: String) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channelId = "crisp_chatbox_$websiteId"
      val channelName = "Crisp Messages"
      val channel = NotificationChannel(
        channelId,
        channelName,
        NotificationManager.IMPORTANCE_HIGH
      ).apply {
        description = "Chat messages from Crisp"
        enableVibration(true)
        enableLights(true)
      }

      val notificationManager = application.getSystemService(NotificationManager::class.java)
      notificationManager.createNotificationChannel(channel)
      Log.d(TAG, "Notification channel created: $channelId")
    }
  }
}
