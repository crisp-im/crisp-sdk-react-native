package expo.modules.crispsdk

import androidx.fragment.app.FragmentActivity
import im.crisp.sdk.api.CrispConfig
import im.crisp.sdk.api.controller.chatbox.CrispChatboxController
import im.crisp.sdk.api.controller.chatbox.CrispEventCallbacks
import im.crisp.sdk.ui.CrispBottomSheetDialogFragment
import java.lang.ref.WeakReference
import kotlinx.coroutines.withTimeoutOrNull

/**
 * Shows the chatbox in the Crisp bottom sheet, and owns the controller driving it. Main thread only.
 *
 * Calls made without a chatbox shown (bot scenario, message) wait in the controller for the next one.
 * The controller is replaced whenever the targeted session changes, which drops them,
 * so that a call made for a user never runs in the session of another one.
 */
internal class CrispChatPresenter(private val callbacks: CrispEventCallbacks) {
  var controller: CrispChatboxController = newController()
    private set

  private var sheet: WeakReference<CrispBottomSheetDialogFragment>? = null

  private val shownSheet: CrispBottomSheetDialogFragment?
    get() = sheet?.get()?.takeIf { it.isAdded && !it.isRemoving }

  /** Shows the chatbox of [config], or keeps the one already shown for it. */
  fun show(activity: FragmentActivity, config: CrispConfig) {
    val manager = activity.supportFragmentManager
    check(!manager.isStateSaved) { "the activity is in the background" }
    val shown = manager.findFragmentByTag(CrispBottomSheetDialogFragment.TAG) as? CrispBottomSheetDialogFragment
    if (shown != null && shown.controller === controller && shown.isFor(config)) {
      sheet = WeakReference(shown)
      return
    }
    shown?.dismissAllowingStateLoss()
    val created = CrispBottomSheetDialogFragment.newInstance(config.websiteId, config.tokenId)
    created.controller = controller
    created.show(manager, CrispBottomSheetDialogFragment.TAG)
    sheet = WeakReference(created)
  }

  /** The session identifier of the chatbox shown, `null` without one or if it does not answer in time. */
  suspend fun sessionIdentifier(): String? {
    if (shownSheet == null) return null
    val current = controller
    return withTimeoutOrNull(SESSION_IDENTIFIER_TIMEOUT_MS) { current.session.getIdentifier() }
  }

  /** The targeted session changed: drops the pending calls and closes the chatbox of the previous one. */
  fun sessionChanged() {
    controller.close()
    controller = newController()
    shownSheet?.dismissAllowingStateLoss()
    sheet = null
  }

  fun close() {
    controller.close()
    shownSheet?.dismissAllowingStateLoss()
    sheet = null
  }

  private fun newController() = CrispChatboxController().also { it.addEventCallbacks(callbacks) }

  private fun CrispBottomSheetDialogFragment.isFor(config: CrispConfig): Boolean {
    val arguments = arguments ?: return false
    return arguments.getString(CrispBottomSheetDialogFragment.ARGUMENT_WEBSITE_ID) == config.websiteId &&
      arguments.getString(CrispBottomSheetDialogFragment.ARGUMENT_TOKEN_ID) == config.tokenId
  }

  private companion object {
    const val SESSION_IDENTIFIER_TIMEOUT_MS = 10_000L
  }
}
