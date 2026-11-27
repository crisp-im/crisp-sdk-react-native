package expo.modules.crispsdk

import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.fragment.app.FragmentActivity
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import im.crisp.sdk.api.Crisp
import im.crisp.sdk.api.controller.CrispSessionController
import im.crisp.sdk.api.controller.chatbox.CrispChatboxController
import im.crisp.sdk.api.notification.CrispNotifications
import im.crisp.sdk.model.SessionEventColor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Bridges the JS API to Crisp Android SDK 3.x.
 *
 * - Session setters go through [CrispSessionController], which saves them until a chatbox
 *   loads the session, with or without a chatbox shown.
 * - UI calls and getters go through the [CrispChatPresenter] controller, on the main thread,
 *   in the order they are made.
 */
class ExpoCrispSdkModule : Module() {
  private val context
    get() = requireNotNull(appContext.reactContext)

  private val mainHandler = Handler(Looper.getMainLooper())
  private var presenter: CrispChatPresenter? = null
  private var logger: CrispLoggerBridge? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoCrispSdk")

    Events(
      "onSessionLoaded",
      "onChatOpened",
      "onChatClosed",
      "onMessageSent",
      "onMessageReceived",
      "onLogReceived",
      "onPushNotificationReceived"
    )

    OnCreate {
      val events = CrispEventsBridge { name, data -> sendEvent(name, data) }
      onMain { presenter = CrispChatPresenter(events) }
      logger = CrispLoggerBridge { level, tag, message ->
        sendEvent("onLogReceived", mapOf("log" to mapOf("level" to level, "tag" to tag, "message" to message)))
      }.also(Crisp::addLogger)
      CrispPushEventEmitter.sendEvent = { name, body -> sendEvent(name, body) }
    }

    OnDestroy {
      logger?.let(Crisp::removeLogger)
      logger = null
      CrispPushEventEmitter.sendEvent = null
      onMain {
        presenter?.close()
        presenter = null
      }
    }

    // MARK: - Configuration

    Function("configure") { websiteId: String ->
      if (CrispIdentity.configure(websiteId)) sessionChanged()
    }

    Function("setTokenId") { tokenId: String? ->
      if (CrispIdentity.setTokenId(tokenId)) sessionChanged()
    }

    Function("setLogLevel") { level: Int ->
      Crisp.setLogLevel(CrispLogLevels.toPriority(level))
    }

    // MARK: - User Information

    Function("setUserEmail") { email: String, signature: String? ->
      session().user.setEmail(email, signature)
    }

    Function("setUserNickname") { name: String ->
      session().user.setNickname(name)
    }

    Function("setUserPhone") { phone: String ->
      session().user.setPhone(phone)
    }

    Function("setUserCompany") { companyData: Map<String, Any?> ->
      session().user.setCompany(CompanyParser.fromMap(companyData) { warning -> Log.w(TAG, warning) })
    }

    Function("setUserAvatar") { url: String ->
      session().user.setAvatar(url)
    }

    // MARK: - Session Data

    Function("setSessionString") { key: String, value: String ->
      session().session.setData(mapOf(key to value))
    }

    Function("setSessionBool") { key: String, value: Boolean ->
      session().session.setData(mapOf(key to value))
    }

    Function("setSessionInt") { key: String, value: Double ->
      session().session.setData(mapOf(key to value.toInt()))
    }

    Function("setSessionSegment") { segment: String ->
      session().session.setSegments(listOf(segment), overwrite = false)
    }

    Function("setSessionSegments") { segments: List<String>, overwrite: Boolean ->
      session().session.setSegments(segments, overwrite)
    }

    // Only available while the chatbox is shown on Android: Crisp Android 3.x reads it from the chatbox
    AsyncFunction("getSessionIdentifier") Coroutine { ->
      withContext(Dispatchers.Main) { presenter?.sessionIdentifier() }
    }

    // MARK: - Events

    Function("pushSessionEvent") { name: String, color: Int ->
      session().session.pushEvent(name, color = sessionEventColor(color))
    }

    Function("pushSessionEvents") { events: List<Map<String, Any?>> ->
      val session = session().session
      for (event in events) {
        val name = event["name"] as? String ?: continue
        session.pushEvent(name, color = sessionEventColor((event["color"] as? Number)?.toInt()))
      }
    }

    // MARK: - Session Management

    Function("resetSession") {
      for (config in CrispIdentity.takeSessionsToReset()) {
        CrispSessionController(context, config).session.reset()
      }
      sessionChanged()
    }

    // MARK: - UI

    Function("show") {
      show()
    }

    Function("openChat") {
      throw CrispUnsupportedException(
        "openChat",
        "Crisp Android SDK 3.0.0beta3 cannot open the chat section directly, call show() instead"
      )
    }

    Function("searchHelpdesk") {
      show { helpdesk.search(completion = null) }
    }

    Function("openHelpdeskArticle") { id: String, locale: String, title: String?, category: String? ->
      show { helpdesk.openArticle(locale = locale, slug = id, title = title, category = category, completion = null) }
    }

    // Made once a chatbox is ready: right away if shown, otherwise the next time it is
    Function("runBotScenario") { scenarioId: String ->
      onMain { presenter?.controller?.bot?.runScenario(scenarioId, completion = null) }
    }

    // MARK: - Push Notifications

    Function("registerPushToken") { token: String ->
      if (token.isNotEmpty()) {
        CrispNotifications.onNewToken(context, token)
      }
    }

    Function("isCrispPushNotification") { data: Map<String, String> ->
      CrispNotifications.isCrispNotification(data)
    }

    Function("setShouldPromptForNotificationPermission") { _: Boolean ->
      // iOS only: on Android, the chatbox asks for the notification permission itself
    }

    // MARK: - Messages

    // Made once a chatbox is ready: right away if shown, otherwise the next time it is
    Function("showMessage") { contentData: Map<String, Any?> ->
      val content = ContentParser.fromMap(contentData)
      onMain { presenter?.controller?.message?.show(content, completion = null) }
    }
  }

  private fun session() = CrispSessionController(context, CrispIdentity.config())

  private fun sessionChanged() = onMain { presenter?.sessionChanged() }

  /** Shows the chatbox of the current session, then makes [then] on its controller. */
  private fun show(then: (CrispChatboxController.() -> Unit)? = null) {
    val config = CrispIdentity.config()
    val activity = appContext.currentActivity ?: throw CrispNoActivityException("no foreground activity")
    if (activity !is FragmentActivity) {
      throw CrispNoActivityException("the current activity is not a FragmentActivity")
    }
    onMain {
      val presenter = presenter ?: return@onMain
      presenter.show(activity, config)
      then?.invoke(presenter.controller)
    }
  }

  // Posted in order, so that UI calls run after the session changes made before them
  private fun onMain(block: () -> Unit) {
    mainHandler.post {
      try {
        block()
      } catch (e: Exception) {
        Log.e(TAG, "Crisp call failed", e)
      }
    }
  }

  private fun sessionEventColor(color: Int?): SessionEventColor =
    SessionEventColor.entries.getOrElse(color ?: -1) { SessionEventColor.BLACK }

  private companion object {
    const val TAG = "ExpoCrispSdk"
  }
}
