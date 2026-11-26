package expo.modules.crispsdk

import im.crisp.sdk.model.Company
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class CompanyParserTest {
  private val warnings = mutableListOf<String>()

  @Test
  fun `maps every field`() {
    val company = CompanyParser.fromMap(
      mapOf(
        "name" to "Crisp",
        "url" to "https://crisp.chat",
        "companyDescription" to "Customer messaging",
        "employment" to mapOf("title" to "Engineer", "role" to "CTO"),
        "geolocation" to mapOf("city" to "Nantes", "country" to "FR")
      ),
      warnings::add
    )
    assertEquals(
      Company(
        name = "Crisp",
        url = "https://crisp.chat",
        description = "Customer messaging",
        employment = Company.Employment(role = "CTO", title = "Engineer"),
        geolocation = Company.Geolocation(city = "Nantes", country = "FR")
      ),
      company
    )
    assertTrue(warnings.isEmpty())
  }

  @Test
  fun `drops the employment without role, with a warning`() {
    val company = CompanyParser.fromMap(
      mapOf("name" to "Crisp", "employment" to mapOf("title" to "Engineer")),
      warnings::add
    )
    assertNull(company.employment)
    assertEquals("Crisp", company.name)
    assertEquals(1, warnings.size)
  }

  @Test
  fun `defaults the name to empty`() {
    assertEquals(Company(name = ""), CompanyParser.fromMap(emptyMap(), warnings::add))
  }
}
