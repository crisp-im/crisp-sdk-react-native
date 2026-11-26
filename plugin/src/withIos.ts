import { type ConfigPlugin, withEntitlementsPlist, withInfoPlist } from "expo/config-plugins";

import type { NotificationMode } from "./withExpoCrisp";

type IosNotificationConfig = {
  websiteId: string;
  mode: NotificationMode;
};

export const withIosNotifications: ConfigPlugin<[string, NotificationMode]> = (
  config,
  [websiteId, mode],
) => {
  const notificationConfig: IosNotificationConfig = { websiteId, mode };

  if (mode === "coexistence") {
    return withIosCoexistence(config, notificationConfig);
  }

  return withIosSdkManaged(config, notificationConfig);
};

// =============================================================================
// SDK-Managed Mode (existing behavior, extracted)
// =============================================================================

const withIosSdkManaged: ConfigPlugin<IosNotificationConfig> = (config, { websiteId }) => {
  // Add remote-notification to UIBackgroundModes
  config = withInfoPlist(config, (config) => {
    const modes = config.modResults.UIBackgroundModes ?? [];
    if (!modes.includes("remote-notification")) {
      config.modResults.UIBackgroundModes = [...modes, "remote-notification"];
    }

    // Store websiteId for CrispAppDelegateSubscriber to read at runtime
    config.modResults.CrispWebsiteId = websiteId;
    config.modResults.CrispNotificationsEnabled = true;
    config.modResults.CrispNotificationsMode = "sdk-managed";

    return config;
  });

  // Add aps-environment entitlement
  config = withEntitlementsPlist(config, (config) => {
    config.modResults["aps-environment"] ??= "production";
    return config;
  });

  return config;
};

// =============================================================================
// Coexistence Mode
// =============================================================================

const withIosCoexistence: ConfigPlugin<IosNotificationConfig> = (config, { websiteId }) => {
  // Add remote-notification to UIBackgroundModes + plist config
  config = withInfoPlist(config, (config) => {
    const modes = config.modResults.UIBackgroundModes ?? [];
    if (!modes.includes("remote-notification")) {
      config.modResults.UIBackgroundModes = [...modes, "remote-notification"];
    }

    // Store websiteId for CrispAppDelegateSubscriber to read at runtime
    config.modResults.CrispWebsiteId = websiteId;

    // In coexistence mode, CrispNotificationsEnabled is true too (the delegate registers for
    // remote notifications in both modes); CrispNotificationsMode tells the delegate to pass
    // the notifications that are not from Crisp to the delegates it replaced
    config.modResults.CrispNotificationsEnabled = true;
    config.modResults.CrispNotificationsMode = "coexistence";

    return config;
  });

  // Add aps-environment entitlement
  config = withEntitlementsPlist(config, (config) => {
    config.modResults["aps-environment"] ??= "production";
    return config;
  });

  return config;
};
