package expo.modules.crispsdk

import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

import im.crisp.client.external.ChatActivity
import im.crisp.client.external.Crisp
import im.crisp.client.external.Logger
import im.crisp.client.external.data.SessionEvent
import im.crisp.client.external.data.SessionEvent.Color
import im.crisp.client.external.notification.CrispNotificationClient

class ExpoCrispSdkModule : Module() {
  private val context
    get() = requireNotNull(appContext.reactContext)

  private var eventsCallback: CrispEventsBridge? = null
  private var loggerCallback: CrispLoggerBridge? = null

  private val onSessionLoaded = "onSessionLoaded"
  private val onChatOpened = "onChatOpened"
  private val onChatClosed = "onChatClosed"
  private val onMessageSent = "onMessageSent"
  private val onMessageReceived = "onMessageReceived"
  private val onLogReceived = "onLogReceived"
  private val onPushNotificationReceived = "onPushNotificationReceived"

  override fun definition() = ModuleDefinition {
    Name("ExpoCrispSdk")

    Events(
      onSessionLoaded,
      onChatOpened,
      onChatClosed,
      onMessageSent,
      onMessageReceived,
      onLogReceived,
      onPushNotificationReceived
    )

    OnCreate {
      registerEventsCallback()
      registerLogger()
    }

    OnDestroy {
      unregisterEventsCallback()
      unregisterLogger()
    }

    // MARK: - Configuration

    Function("configure") { websiteId: String ->
      Crisp.configure(context, websiteId)
    }

    Function("setTokenId") { tokenId: String? ->
      Crisp.setTokenID(context, tokenId)
    }

    Function("setLogLevel") { level: Int ->
      val logLevel = convertIntToLogLevel(level)
      Crisp.setLogLevel(logLevel)
    }

    // MARK: - User Information

    Function("setUserEmail") { email: String, signature: String? ->
      Crisp.setUserEmail(email, signature)
    }

    Function("setUserNickname") { name: String ->
      Crisp.setUserNickname(name)
    }

    Function("setUserPhone") { phone: String ->
      Crisp.setUserPhone(phone)
    }

    Function("setUserCompany") { companyData: Map<String, Any?> ->
      val company = CompanyParser.fromMap(companyData)
      Crisp.setUserCompany(company)
    }

    Function("setUserAvatar") { url: String ->
      Crisp.setUserAvatar(url)
    }

    // MARK: - Session Data

    Function("setSessionString") { key: String, value: String ->
      Crisp.setSessionString(key, value)
    }

    Function("setSessionBool") { key: String, value: Boolean ->
      Crisp.setSessionBool(key, value)
    }

    Function("setSessionInt") { key: String, value: Double ->
      Crisp.setSessionInt(key, value.toInt())
    }

    Function("setSessionSegment") { segment: String ->
      Crisp.setSessionSegment(segment)
    }

    Function("setSessionSegments") { segments: List<String>, overwrite: Boolean ->
      Crisp.setSessionSegments(segments, overwrite)
    }

    AsyncFunction("getSessionIdentifier") { promise: Promise ->
      val identifier = Crisp.getSessionIdentifier(context)
      promise.resolve(identifier)
    }

    // MARK: - Events

    Function("pushSessionEvent") { name: String, color: Int ->
      val sessionColor = convertIntToColor(color)
      Crisp.pushSessionEvent(SessionEvent(name, sessionColor))
    }

    Function("pushSessionEvents") { events: List<Map<String, Any?>> ->
      val sessionEvents = events.mapNotNull { event ->
        val name = event["name"] as? String ?: return@mapNotNull null
        val colorValue = (event["color"] as? Number)?.toInt() ?: 9
        val color = convertIntToColor(colorValue)
        SessionEvent(name, color)
      }
      Crisp.pushSessionEvents(sessionEvents)
    }

    // MARK: - Session Management

    Function("resetSession") {
      Crisp.resetChatSession(context)
    }

    // MARK: - UI

    Function("show") {
      val crispIntent = Intent(context, ChatActivity::class.java)
      crispIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(crispIntent)
    }

    Function("searchHelpdesk") {
      Crisp.searchHelpdesk(context)
    }

    Function("openHelpdeskArticle") { id: String, locale: String, title: String?, category: String? ->
      Crisp.openHelpdeskArticle(context, id, locale, title, category)
    }

    Function("runBotScenario") { scenarioId: String ->
      Crisp.runBotScenario(scenarioId)
    }

    // MARK: - Push Notifications (Coexistence Mode)

    Function("registerPushToken") { token: String ->
      if (token.isNotEmpty()) {
        CrispNotificationClient.sendTokenToCrisp(context, token)
      }
    }

    Function("isCrispPushNotification") { data: Map<String, String> ->
      data.containsKey("crisp_website_id")
    }

    Function("setShouldPromptForNotificationPermission") { _: Boolean ->
      // No-op on Android — this API does not exist in the native SDK
    }

    // MARK: - Messages

    Function("showMessage") { contentData: Map<String, Any?> ->
      val content = ContentParser.fromMap(contentData)
      Crisp.showMessage(content)
    }
  }

  private fun convertIntToColor(colorInt: Int): Color {
    return when (colorInt) {
      0 -> Color.RED
      1 -> Color.ORANGE
      2 -> Color.YELLOW
      3 -> Color.GREEN
      4 -> Color.BLUE
      5 -> Color.PURPLE
      6 -> Color.PINK
      7 -> Color.BROWN
      8 -> Color.GREY
      else -> Color.BLACK
    }
  }

  private fun registerEventsCallback() {
    unregisterEventsCallback()
    eventsCallback = CrispEventsBridge { eventName, data ->
      this@ExpoCrispSdkModule.sendEvent(eventName, data)
    }
    eventsCallback?.let { Crisp.addCallback(it) }
  }

  private fun unregisterEventsCallback() {
    eventsCallback?.let {
      Crisp.removeCallback(it)
      eventsCallback = null
    }
  }

  private fun registerLogger() {
    unregisterLogger()
    loggerCallback = CrispLoggerBridge { level, tag, message ->
      val levelInt = convertLogLevelToInt(level)
      this@ExpoCrispSdkModule.sendEvent(onLogReceived, mapOf(
        "log" to mapOf(
          "level" to levelInt,
          "tag" to tag,
          "message" to message
        )
      ))
    }
    loggerCallback?.let { Crisp.addLogger(it) }
  }

  private fun unregisterLogger() {
    // Note: Crisp SDK does not provide a removeLogger API.
    // The logger remains registered for the app lifetime.
    // Setting to null allows garbage collection of our bridge object,
    // though the SDK may still hold a reference.
    loggerCallback = null
  }

  private fun convertIntToLogLevel(levelInt: Int): Logger.Level {
    return when (levelInt) {
      0 -> Logger.Level.VERBOSE
      1 -> Logger.Level.DEBUG
      2 -> Logger.Level.INFO
      3 -> Logger.Level.WARN
      4 -> Logger.Level.ERROR
      5 -> Logger.Level.ASSERT
      else -> Logger.Level.WARN
    }
  }

  private fun convertLogLevelToInt(level: Logger.Level): Int {
    return when (level) {
      Logger.Level.VERBOSE -> 0
      Logger.Level.DEBUG -> 1
      Logger.Level.INFO -> 2
      Logger.Level.WARN -> 3
      Logger.Level.ERROR -> 4
      Logger.Level.ASSERT -> 5
    }
  }
}
