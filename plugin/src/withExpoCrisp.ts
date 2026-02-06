import type { ConfigPlugin } from "expo/config-plugins";
import { withAndroidNotifications } from "./withAndroid";
import { withIosNotifications } from "./withIos";

/**
 * Notification mode for the Crisp SDK plugin.
 * - 'sdk-managed': Crisp handles token registration and notification display automatically (default)
 * - 'app-managed': App handles tokens and forwards notifications to Crisp
 */
export type NotificationMode = "sdk-managed" | "app-managed";

/**
 * Notification configuration passed to platform-specific plugins.
 */
export interface NotificationConfig {
  websiteId: string;
  mode: NotificationMode;
}

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
   * - Registers for remote notifications on app launch (sdk-managed mode)
   * - Forwards device token to Crisp SDK (sdk-managed mode)
   *
   * **Android:**
   * - Adds CrispNotificationService to AndroidManifest (sdk-managed mode only)
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
     * - 'sdk-managed' (default): Crisp SDK handles everything automatically.
     *   Token registration and notification display are managed by the SDK.
     *
     * - 'app-managed': Your app handles token registration and notification routing.
     *   Use this when integrating with expo-notifications, react-native-firebase,
     *   or other notification libraries. You must call registerPushToken() and
     *   handleNotification() manually.
     *
     * @default 'sdk-managed'
     */
    mode?: NotificationMode;
  };
};

const withExpoCrisp: ConfigPlugin<ExpoCrispPluginProps> = (
  config,
  { websiteId, notifications = { enabled: false } } = {},
) => {
  if (!notifications.enabled) {
    return config;
  }

  if (!websiteId) {
    throw new Error(
      "[expo-crisp-sdk] websiteId is required when notifications are enabled. " +
        "Add it to your app.json plugin configuration.",
    );
  }

  const notificationConfig: NotificationConfig = {
    websiteId,
    mode: notifications.mode ?? "sdk-managed",
  };

  // Apply Android modifications
  config = withAndroidNotifications(config, notificationConfig);

  // Apply iOS modifications
  config = withIosNotifications(config, notificationConfig);

  return config;
};

export default withExpoCrisp;
