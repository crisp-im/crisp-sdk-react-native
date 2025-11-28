import Crisp
import Foundation

enum CompanyParser {
  static func fromDictionary(_ dict: [String: Any]) -> Company {
    let name = dict["name"] as? String

    var url: URL?
    if let urlString = dict["url"] as? String, !urlString.isEmpty {
      url = URL(string: urlString)
    }

    let companyDescription = dict["companyDescription"] as? String

    var employment: Employment?
    if let employmentDict = dict["employment"] as? [String: Any] {
      let title = employmentDict["title"] as? String
      let role = employmentDict["role"] as? String
      employment = Employment(title: title, role: role)
    }

    var geolocation: Geolocation?
    if let geoDict = dict["geolocation"] as? [String: Any] {
      let city = geoDict["city"] as? String
      let country = geoDict["country"] as? String
      geolocation = Geolocation(city: city, country: country)
    }

    return Company(
      name: name,
      url: url,
      companyDescription: companyDescription,
      employment: employment,
      geolocation: geolocation
    )
  }
}
