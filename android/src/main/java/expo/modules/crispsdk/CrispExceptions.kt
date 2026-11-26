package expo.modules.crispsdk

import expo.modules.kotlin.exception.CodedException

internal class CrispNotConfiguredException : CodedException(
  "ERR_CRISP_NOT_CONFIGURED",
  "Call configure(websiteId) first, or enable notifications in the config plugin with your websiteId",
  null
)

internal class CrispUnsupportedException(method: String, reason: String) : CodedException(
  "ERR_CRISP_UNSUPPORTED",
  "$method is not supported on Android: $reason",
  null
)

internal class CrispNoActivityException(reason: String) : CodedException(
  "ERR_CRISP_NO_ACTIVITY",
  "Cannot show the chatbox: $reason",
  null
)
