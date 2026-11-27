import {
  type ConfigPlugin,
  WarningAggregator,
  withEntitlementsPlist,
  withInfoPlist,
  withPodfile,
} from "expo/config-plugins";

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

// =============================================================================
// Crisp resource bundles
// =============================================================================

const RESOURCE_BUNDLES_TAG = "crisp-sdk-react-native-resource-bundles";

// Also in MIGRATION.md step 5, for Podfiles that prebuild does not generate
export const RESOURCE_BUNDLES_FIX = `installer.target_installation_results.pod_target_installation_results.each_value do |result|
  next unless %w[CrispChatBox CrispChatBoxFFI].include?(result.target.pod_name)

  result.resource_bundle_targets.each do |bundle|
    bundle.build_configurations.each do |configuration|
      library_configuration = result.native_target.build_configurations.find do |candidate|
        candidate.name == configuration.name
      end
      library_minimum = library_configuration&.build_settings&.fetch('IPHONEOS_DEPLOYMENT_TARGET', nil)
      bundle_minimum = configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
      next if [library_minimum, bundle_minimum].any? { |value| value.nil? || value.empty? }
      next unless Gem::Version.correct?(library_minimum) && Gem::Version.correct?(bundle_minimum)
      next unless Gem::Version.new(bundle_minimum) < Gem::Version.new(library_minimum)

      configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = library_minimum
    end
  end
end`;

/**
 * Crisp iOS 3.x resource bundles keep the iOS 14 minimum of their podspec, which Xcode 27
 * rejects, while React Native raises the libraries to the app minimum. The plugin aligns the
 * bundles with their library in the Podfile, right after `react_native_post_install`, which sets
 * the library minimum it reads. Recent `expo-modules-autolinking` versions (57.0.6 and later)
 * align them too; the step then changes nothing, as it only raises a bundle below its library.
 */
export const withCrispResourceBundles: ConfigPlugin = (config) => {
  return withPodfile(config, (config) => {
    const contents = addCrispResourceBundlesFix(config.modResults.contents);
    if (contents === null) {
      WarningAggregator.addWarningIOS(
        "crisp-sdk-react-native",
        "Could not locate the react_native_post_install(...) call in the Podfile: align the " +
          "Crisp resource bundles by hand if Xcode rejects them, see MIGRATION.md step 5",
      );
      return config;
    }
    config.modResults.contents = contents;
    return config;
  });
};

/**
 * Inserts the fix after the `react_native_post_install(...)` call, replacing the one an earlier
 * prebuild inserted. Returns null when it cannot locate the call.
 */
export function addCrispResourceBundlesFix(podfile: string): string | null {
  const begin = `# @generated begin ${RESOURCE_BUNDLES_TAG}`;
  const end = `# @generated end ${RESOURCE_BUNDLES_TAG}`;
  const withoutFix = podfile.replace(
    new RegExp(`\\n[ \\t]*${escapeRegExp(begin)}[\\s\\S]*?${escapeRegExp(end)}[^\\n]*`),
    "",
  );

  // Only a call that starts its line: skips commented-out calls
  const match = /^[ \t]*react_native_post_install\(/m.exec(withoutFix);
  if (!match) return null;
  const call = match.index + match[0].indexOf("react_native_post_install");

  let depth = 0;
  let close = -1;
  for (let index = call + "react_native_post_install".length; index < withoutFix.length; index++) {
    if (withoutFix[index] === "(") depth++;
    if (withoutFix[index] === ")" && --depth === 0) {
      close = index;
      break;
    }
  }
  if (close === -1) return null;

  const lineStart = withoutFix.lastIndexOf("\n", call) + 1;
  const indent = /^[ \t]*/.exec(withoutFix.slice(lineStart, call))?.[0] ?? "";
  const lineEnd = withoutFix.indexOf("\n", close);
  const insertAt = lineEnd === -1 ? withoutFix.length : lineEnd;
  const block = [
    `${begin} - expo prebuild (DO NOT MODIFY)`,
    ...RESOURCE_BUNDLES_FIX.split("\n"),
    end,
  ]
    .map((line) => (line ? indent + line : line))
    .join("\n");

  return `${withoutFix.slice(0, insertAt)}\n${block}${withoutFix.slice(insertAt)}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
