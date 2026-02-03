package expo.modules.crispsdk

import im.crisp.client.external.Logger

/**
 * Bridge class that implements Crisp's Logger interface
 * and forwards log messages to the Expo module for emission to JavaScript.
 *
 * IMPORTANT: Crisp SDK keeps strong references to loggers.
 * Adding a custom logger automatically disables the default Logcat logger.
 * There is no removeLogger API, so the logger remains registered for the app lifetime.
 */
class CrispLoggerBridge(
    private val onLog: (level: Logger.Level, tag: String?, message: String) -> Unit
) : Logger {

    override fun log(tag: String?, cause: Throwable) {
        val message = cause.message ?: cause.toString()
        onLog(Logger.Level.ERROR, tag, message)
    }

    override fun log(level: Logger.Level, tag: String?, message: String) {
        onLog(level, tag, message)
    }
}
