package expo.modules.crispsdk

import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

import im.crisp.client.external.ChatActivity
import im.crisp.client.external.Crisp
import im.crisp.client.external.data.SessionEvent
import im.crisp.client.external.data.SessionEvent.Color

class ExpoCrispSdkModule : Module() {
  private val context
    get() = requireNotNull(appContext.reactContext)

  override fun definition() = ModuleDefinition {
    Name("ExpoCrispSdk")

    // MARK: - Configuration

    Function("configure") { websiteId: String ->
      Crisp.configure(context, websiteId)
    }

    Function("setTokenId") { tokenId: String? ->
      Crisp.setTokenID(context, tokenId)
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
}
