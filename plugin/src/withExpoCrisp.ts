import { ConfigPlugin } from "expo/config-plugins";
import { withAndroidNotifications } from "./withAndroid";
import { withIosNotifications } from "./withIos";

type ExpoCrispPluginProps = {
  /**
   * Enable push notifications for Crisp Chat.
   *
   * When enabled, the plugin configures:
   *
   * **iOS:**
   * - Adds `remote-notification` to UIBackgroundModes
   * - Adds `aps-environment` entitlement for APNs
   * - Registers for remote notifications on app launch
   * - Forwards device token to Crisp SDK
   *
   * **Android:**
   * - Adds CrispNotificationService to AndroidManifest
   * - Adds firebase-messaging dependency
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
  { notifications = { enabled: false } } = {}
) => {
  if (!notifications.enabled) {
    return config;
  }

  // Apply Android modifications
  config = withAndroidNotifications(config);

  // Apply iOS modifications
  config = withIosNotifications(config);

  return config;
};

export default withExpoCrisp;
