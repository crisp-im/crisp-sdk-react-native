import type { ConfigPlugin } from "expo/config-plugins";
import { withAndroidNotifications } from "./withAndroid";
import { withIosNotifications } from "./withIos";

type ExpoCrispPluginProps = {
  /**
   * Your Crisp Website ID.
   * Required when notifications are enabled.
   * Find it in your Crisp Dashboard: Settings > Website Settings > Setup instructions
   */
  websiteId?: string;

  /**
   * Enable push notifications for Crisp Chat.
   *
   * When enabled, the plugin configures:
   *
   * **iOS:**
   * - Adds `remote-notification` to UIBackgroundModes
   * - Adds `aps-environment` entitlement for APNs
   * - Configures Crisp SDK with websiteId
   * - Registers for remote notifications on app launch
   * - Forwards device token to Crisp SDK
   *
   * **Android:**
   * - Adds CrispNotificationService to AndroidManifest
   * - Adds firebase-messaging dependency
   * - Configures Crisp SDK with websiteId
   * - Enables Crisp notifications in MainApplication
   *
   * @default { enabled: false }
   */
  notifications?: {
    enabled: boolean;
    /**
     * Notification handling mode.
     *
     * - `"sdk-managed"` (default): Crisp handles all notification routing exclusively.
     *   CrispNotificationService (Android) / auto-register (iOS).
     * - `"coexistence"`: Crisp notifications coexist with other notification systems
     *   (expo-notifications, Firebase, OneSignal, etc.). A chained service (Android) and
     *   filtered delegate (iOS) handle routing at the native level.
     *
     * @default "sdk-managed"
     */
    mode?: "sdk-managed" | "coexistence";
  };
};

export type NotificationMode = "sdk-managed" | "coexistence";

const VALID_MODES: NotificationMode[] = ["sdk-managed", "coexistence"];

const withExpoCrisp: ConfigPlugin<ExpoCrispPluginProps> = (
  config,
  { websiteId, notifications = { enabled: false } } = {},
) => {
  if (!notifications.enabled) {
    return config;
  }

  if (!websiteId) {
    throw new Error(
      "[crisp-sdk-react-native] websiteId is required when notifications are enabled. " +
        "Add it to your app.json plugin configuration.",
    );
  }

  const mode: NotificationMode = notifications.mode ?? "sdk-managed";

  if (!VALID_MODES.includes(mode)) {
    throw new Error(
      `[crisp-sdk-react-native] Invalid notifications.mode "${mode}". ` +
        `Accepted values: ${VALID_MODES.map((m) => `"${m}"`).join(", ")}.`,
    );
  }

  // Apply Android modifications
  config = withAndroidNotifications(config, [websiteId, mode]);

  // Apply iOS modifications
  config = withIosNotifications(config, [websiteId, mode]);

  return config;
};

export default withExpoCrisp;
