import { type ConfigPlugin, withEntitlementsPlist, withInfoPlist } from "expo/config-plugins";
import type { NotificationConfig } from "./withExpoCrisp";

export const withIosNotifications: ConfigPlugin<NotificationConfig> = (
  config,
  notificationConfig,
) => {
  const { websiteId, mode } = notificationConfig;

  // Add remote-notification to UIBackgroundModes
  config = withInfoPlist(config, (config) => {
    const modes = config.modResults.UIBackgroundModes ?? [];
    if (!modes.includes("remote-notification")) {
      config.modResults.UIBackgroundModes = [...modes, "remote-notification"];
    }

    // Store websiteId for CrispAppDelegateSubscriber to read at runtime
    config.modResults.CrispWebsiteId = websiteId;
    config.modResults.CrispNotificationsEnabled = true;
    // Store notification mode for runtime reading
    config.modResults.CrispNotificationMode = mode;

    return config;
  });

  // Add aps-environment entitlement
  config = withEntitlementsPlist(config, (config) => {
    config.modResults["aps-environment"] = "production";
    return config;
  });

  return config;
};
