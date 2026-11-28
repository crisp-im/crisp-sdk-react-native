package expo.modules.crispsdk

import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class CrispIdentityTest {
  private val website = "00000000-0000-4000-8000-000000000001"

  @After
  fun clear() = CrispIdentity.clear()

  private fun sessionsToReset() = CrispIdentity.takeSessionsToReset().map { it.websiteId to it.tokenId }

  @Test
  fun `requires a website`() {
    assertThrows(CrispNotConfiguredException::class.java) { CrispIdentity.config() }
    assertThrows(IllegalArgumentException::class.java) { CrispIdentity.configure(" ") }
  }

  @Test
  fun `reports session changes only`() {
    assertTrue(CrispIdentity.configure(website))
    assertFalse(CrispIdentity.configure(website))
    assertTrue(CrispIdentity.setTokenId("user-1"))
    assertFalse(CrispIdentity.setTokenId("user-1"))
    assertEquals(website, CrispIdentity.config().websiteId)
    assertEquals("user-1", CrispIdentity.config().tokenId)
  }

  @Test
  fun `resets the session of the user who logged out, once`() {
    CrispIdentity.configure(website)
    CrispIdentity.setTokenId("user-1")
    CrispIdentity.setTokenId(null)
    assertEquals(listOf(website to "user-1", website to null), sessionsToReset())
    assertEquals(listOf(website to null), sessionsToReset())
  }

  @Test
  fun `does not reset a previous user once another one is set`() {
    CrispIdentity.configure(website)
    CrispIdentity.setTokenId("user-1")
    CrispIdentity.setTokenId(null)
    CrispIdentity.setTokenId("user-2")
    assertEquals(listOf(website to "user-2"), sessionsToReset())
  }

  @Test
  fun `forgets the logout when the website changes`() {
    CrispIdentity.configure(website)
    CrispIdentity.setTokenId("user-1")
    CrispIdentity.setTokenId(null)
    CrispIdentity.configure("00000000-0000-4000-8000-000000000002")
    assertEquals(listOf("00000000-0000-4000-8000-000000000002" to null), sessionsToReset())
  }
}
