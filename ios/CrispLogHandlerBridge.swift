import Crisp

/**
 * Bridge class that implements Crisp's CrispLogHandler protocol
 * and forwards log messages to the Expo module for emission to JavaScript.
 *
 * IMPORTANT: The Crisp SDK does not provide a way to remove log handlers.
 * Once registered, the handler remains active for the app lifetime.
 */
class CrispLogHandlerBridge: CrispLogHandler {
    private let onLog: (Severity, String) -> Void

    init(onLog: @escaping (Severity, String) -> Void) {
        self.onLog = onLog
    }

    func log(severity: Severity, message: String) {
        onLog(severity, message)
    }

    func log(error: any Error) {
        onLog(.error, error.localizedDescription)
    }
}
