package expo.modules.crispsdk

import im.crisp.sdk.api.CrispConfig

/**
 * The website and user that the JS API targets.
 *
 * Crisp Android 3.x has no global configuration: every call takes a [CrispConfig].
 * This process-wide state keeps the `configure` / `setTokenId` semantics of the JS API.
 * It is shared with [CrispApplicationLifecycleListener], which configures the website
 * from the config plugin meta-data before JS runs.
 */
internal object CrispIdentity {
  private var websiteId: String? = null
  private var tokenId: String? = null

  // The tokenId dropped by setTokenId(null), until the session is reset or another user is set
  private var loggedOutTokenId: String? = null

  /** Returns `true` if the targeted session changed. */
  @Synchronized
  fun configure(websiteId: String): Boolean {
    require(websiteId.isNotBlank()) { "websiteId must not be blank" }
    if (this.websiteId == websiteId) return false
    this.websiteId = websiteId
    loggedOutTokenId = null
    return true
  }

  /** Returns `true` if the targeted session changed. */
  @Synchronized
  fun setTokenId(tokenId: String?): Boolean {
    if (this.tokenId == tokenId) return false
    loggedOutTokenId = if (tokenId == null) this.tokenId else null
    this.tokenId = tokenId
    return true
  }

  @Synchronized
  fun config(): CrispConfig = CrispConfig(websiteId ?: throw CrispNotConfiguredException(), tokenId)

  /**
   * The sessions `resetSession()` resets: the current one and, right after `setTokenId(null)`,
   * the one of the user who logged out. Crisp Android 3.x only stops showing the notifications
   * of a user once their own session is reset, so the documented JS logout
   * (`setTokenId(null)` then `resetSession()`) keeps working.
   */
  @Synchronized
  fun takeSessionsToReset(): List<CrispConfig> {
    val current = config()
    val loggedOut = loggedOutTokenId?.let { CrispConfig(current.websiteId, it) }
    loggedOutTokenId = null
    return listOfNotNull(loggedOut, current)
  }

  /** Test only. */
  @Synchronized
  internal fun clear() {
    websiteId = null
    tokenId = null
    loggedOutTokenId = null
  }
}
