import {
  AndroidConfig,
  type ConfigPlugin,
  withAndroidManifest,
  withAppBuildGradle,
} from "expo/config-plugins";
import type { NotificationConfig } from "./withExpoCrisp";

export const withAndroidNotifications: ConfigPlugin<NotificationConfig> = (
  config,
  notificationConfig,
) => {
  const { websiteId, mode } = notificationConfig;

  // Add CrispNotificationService and meta-data to manifest
  config = withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

    // Only add CrispNotificationService in sdk-managed mode
    if (mode === "sdk-managed") {
      if (!mainApplication.service) {
        mainApplication.service = [];
      }

      const hasService = mainApplication.service.some(
        (s) =>
          s.$?.["android:name"] ===
          "im.crisp.client.external.notification.CrispNotificationService",
      );

      if (!hasService) {
        mainApplication.service.push({
          $: {
            "android:name": "im.crisp.client.external.notification.CrispNotificationService",
            "android:exported": "false",
          },
          "intent-filter": [
            {
              action: [{ $: { "android:name": "com.google.firebase.MESSAGING_EVENT" } }],
            },
          ],
        });
      }
    }

    // Add meta-data for CrispApplicationLifecycleListener to read at runtime
    if (!mainApplication["meta-data"]) {
      mainApplication["meta-data"] = [];
    }

    // Add websiteId meta-data
    const hasWebsiteId = mainApplication["meta-data"].some(
      (m) => m.$?.["android:name"] === "expo.modules.crispsdk.WEBSITE_ID",
    );
    if (!hasWebsiteId) {
      mainApplication["meta-data"].push({
        $: {
          "android:name": "expo.modules.crispsdk.WEBSITE_ID",
          "android:value": websiteId,
        },
      });
    }

    // Add notifications enabled meta-data
    const hasNotificationsEnabled = mainApplication["meta-data"].some(
      (m) => m.$?.["android:name"] === "expo.modules.crispsdk.NOTIFICATIONS_ENABLED",
    );
    if (!hasNotificationsEnabled) {
      mainApplication["meta-data"].push({
        $: {
          "android:name": "expo.modules.crispsdk.NOTIFICATIONS_ENABLED",
          "android:value": "true",
        },
      });
    }

    // Add notification mode meta-data
    const hasNotificationMode = mainApplication["meta-data"].some(
      (m) => m.$?.["android:name"] === "expo.modules.crispsdk.NOTIFICATION_MODE",
    );
    if (!hasNotificationMode) {
      mainApplication["meta-data"].push({
        $: {
          "android:name": "expo.modules.crispsdk.NOTIFICATION_MODE",
          "android:value": mode,
        },
      });
    }

    return config;
  });

  // Add Crisp SDK and firebase-messaging dependencies
  config = withAppBuildGradle(config, (config) => {
    // Add Crisp SDK dependency
    if (!config.modResults.contents.includes("im.crisp:crisp-sdk")) {
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {
    implementation 'im.crisp:crisp-sdk:2.0.15'`,
      );
    }

    // Add firebase-messaging dependency
    if (!config.modResults.contents.includes("firebase-messaging")) {
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {
    implementation 'com.google.firebase:firebase-messaging'`,
      );
    }
    return config;
  });

  return config;
};
