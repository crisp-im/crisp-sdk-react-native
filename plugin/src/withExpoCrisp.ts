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

  // Apply Android modifications
  config = withAndroidNotifications(config, websiteId);

  // Apply iOS modifications
  config = withIosNotifications(config, websiteId);

  return config;
};

export default withExpoCrisp;
