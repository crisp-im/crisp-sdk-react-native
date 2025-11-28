package expo.modules.crispsdk

import im.crisp.client.external.data.Company
import im.crisp.client.external.data.Employment
import im.crisp.client.external.data.Geolocation
import java.net.URL

/**
 * Parser for Company objects from JavaScript
 * Converts Map<String, Any?> to Crisp SDK Company class
 *
 * TypeScript interface:
 * interface Company {
 *   name: string;
 *   url?: string;
 *   companyDescription?: string;
 *   employment?: Employment;
 *   geolocation?: Geolocation;
 * }
 */
object CompanyParser {
    fun fromMap(map: Map<String, Any?>): Company {
        val name = map["name"] as? String ?: ""
        val url = (map["url"] as? String)?.let {
            try { URL(it) } catch (e: Exception) { null }
        }
        val companyDescription = map["companyDescription"] as? String

        val employment = (map["employment"] as? Map<String, Any?>)?.let {
            EmploymentParser.fromMap(it)
        }

        val geolocation = (map["geolocation"] as? Map<String, Any?>)?.let {
            GeolocationParser.fromMap(it)
        }

        return Company(name, url, companyDescription, employment, geolocation)
    }
}

/**
 * Parser for Employment objects from JavaScript
 * Converts Map<String, Any?> to Crisp SDK Employment class
 *
 * TypeScript interface:
 * interface Employment {
 *   title?: string;
 *   role?: string;
 * }
 */
object EmploymentParser {
    fun fromMap(map: Map<String, Any?>): Employment {
        val title = map["title"] as? String
        val role = map["role"] as? String
        return Employment(title, role)
    }
}

/**
 * Parser for Geolocation objects from JavaScript
 * Converts Map<String, Any?> to Crisp SDK Geolocation class
 *
 * TypeScript interface:
 * interface Geolocation {
 *   country?: string;
 *   city?: string;
 * }
 */
object GeolocationParser {
    fun fromMap(map: Map<String, Any?>): Geolocation {
        val country = map["country"] as? String
        val city = map["city"] as? String
        return Geolocation(country, city)
    }
}
