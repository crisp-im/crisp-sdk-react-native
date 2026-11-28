package expo.modules.crispsdk

import im.crisp.sdk.model.Company

/**
 * Converts the JS `Company` to a native [Company].
 *
 * Crisp Android 3.x requires `employment.role` once `employment` is set. Without it, the company is
 * set without its employment, and [warn] is called, rather than failing the whole call.
 */
object CompanyParser {
  fun fromMap(map: Map<String, Any?>, warn: (String) -> Unit): Company {
    val employmentMap = map["employment"] as? Map<*, *>
    val role = employmentMap?.get("role") as? String
    val employment = when {
      employmentMap == null -> null
      role.isNullOrEmpty() -> {
        warn("setUserCompany: employment ignored on Android, as Crisp Android 3.x requires employment.role")
        null
      }
      else -> Company.Employment(role = role, title = employmentMap["title"] as? String)
    }

    val geolocation = (map["geolocation"] as? Map<*, *>)?.let {
      Company.Geolocation(city = it["city"] as? String, country = it["country"] as? String)
    }

    return Company(
      name = map["name"] as? String ?: "",
      url = map["url"] as? String,
      description = map["companyDescription"] as? String,
      employment = employment,
      geolocation = geolocation
    )
  }
}
