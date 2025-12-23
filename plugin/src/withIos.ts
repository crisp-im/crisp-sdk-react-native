import {
  type ConfigPlugin,
  withEntitlementsPlist,
  withInfoPlist,
} from "expo/config-plugins";

export const withIosNotifications: ConfigPlugin<string> = (
  config,
  websiteId
) => {
  // Add remote-notification to UIBackgroundModes
  config = withInfoPlist(config, (config) => {
    const modes = config.modResults.UIBackgroundModes ?? [];
    if (!modes.includes("remote-notification")) {
      config.modResults.UIBackgroundModes = [...modes, "remote-notification"];
    }

    // Store websiteId for CrispAppDelegateSubscriber to read at runtime
    config.modResults.CrispWebsiteId = websiteId;
    config.modResults.CrispNotificationsEnabled = true;

    return config;
  });

  // Add aps-environment entitlement
  config = withEntitlementsPlist(config, (config) => {
    config.modResults["aps-environment"] = "production";
    return config;
  });

  return config;
};
