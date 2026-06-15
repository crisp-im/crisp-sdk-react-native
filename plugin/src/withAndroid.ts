import fs from "node:fs";
import path from "node:path";
import {
  AndroidConfig,
  type ConfigPlugin,
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
} from "expo/config-plugins";

import type { NotificationMode } from "./withExpoCrisp";

type AndroidNotificationConfig = {
  websiteId: string;
  mode: NotificationMode;
};

const CRISP_ANDROID_SDK_DEPENDENCY = `implementation('im.crisp:crisp-sdk:2.0.21') {
        exclude group: 'com.atlassian.commonmark', module: 'commonmark'
    }`;
const COMMONMARK_ANDROID_DEPENDENCY = "implementation 'org.commonmark:commonmark:0.21.0'";
const CRISP_COMMONMARK_EXCLUSION =
  "exclude group: 'com.atlassian.commonmark', module: 'commonmark'";

function addCrispAndroidSdkDependency(contents: string): string {
  if (!contents.includes("im.crisp:crisp-sdk")) {
    return contents.replace(
      /dependencies\s*\{/,
      `dependencies {
    ${CRISP_ANDROID_SDK_DEPENDENCY}`,
    );
  }

  if (contents.includes(CRISP_COMMONMARK_EXCLUSION)) {
    return contents;
  }

  return contents.replace(
    /implementation\s+['"]im\.crisp:crisp-sdk:2\.0\.21['"]/,
    CRISP_ANDROID_SDK_DEPENDENCY,
  );
}

function addCommonmarkAndroidDependency(contents: string): string {
  if (contents.includes("org.commonmark:commonmark")) {
    return contents;
  }

  return contents.replace(
    /dependencies\s*\{/,
    `dependencies {
    ${COMMONMARK_ANDROID_DEPENDENCY}`,
  );
}

export const withAndroidNotifications: ConfigPlugin<[string, NotificationMode]> = (
  config,
  [websiteId, mode],
) => {
  const notificationConfig: AndroidNotificationConfig = { websiteId, mode };

  if (mode === "coexistence") {
    return withAndroidCoexistence(config, notificationConfig);
  }

  return withAndroidSdkManaged(config, notificationConfig);
};

// =============================================================================
// SDK-Managed Mode (existing behavior, extracted)
// =============================================================================

const withAndroidSdkManaged: ConfigPlugin<AndroidNotificationConfig> = (config, { websiteId }) => {
  // Add CrispNotificationService and meta-data to manifest
  config = withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

    // Add CrispNotificationService
    if (!mainApplication.service) {
      mainApplication.service = [];
    }

    const hasService = mainApplication.service.some(
      (s) =>
        s.$?.["android:name"] === "im.crisp.client.external.notification.CrispNotificationService",
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

    return config;
  });

  // Add firebase-messaging dependency
  config = withAppBuildGradle(config, (config) => {
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

// =============================================================================
// Coexistence Mode
// =============================================================================

function hasExpoNotifications(): boolean {
  try {
    require.resolve("expo-notifications");
    return true;
  } catch {
    return false;
  }
}

function generateFirebaseMessagingService(packageName: string): string {
  const expoNotificationsInstalled = hasExpoNotifications();
  const baseClass = expoNotificationsInstalled
    ? "expo.modules.notifications.service.ExpoFirebaseMessagingService"
    : "com.google.firebase.messaging.FirebaseMessagingService";

  return `package ${packageName}

import com.google.firebase.messaging.RemoteMessage
import im.crisp.client.external.notification.CrispNotificationClient
import expo.modules.crispsdk.CrispPushEventEmitter

class ExpoCrispFirebaseMessagingService : ${baseClass}() {

    override fun onMessageReceived(message: RemoteMessage) {
        if (CrispNotificationClient.isCrispNotification(message)) {
            CrispNotificationClient.handleNotification(this, message)
            // Forward title/body to JS for parity with iOS's
            // onPushNotificationReceived. Falls back through the
            // data payload (Crisp uses data-only pushes) then the
            // FCM notification block, then empty.
            val title = message.data["title"]
                ?: message.notification?.title
                ?: ""
            val body = message.data["body"]
                ?: message.notification?.body
                ?: ""
            CrispPushEventEmitter.emitPushNotificationReceived(title, body)
        } else {
            super.onMessageReceived(message)
        }
    }

    override fun onNewToken(token: String) {
        CrispNotificationClient.sendTokenToCrisp(this, token)
        super.onNewToken(token)
    }
}
`;
}

const withAndroidCoexistence: ConfigPlugin<AndroidNotificationConfig> = (config, { websiteId }) => {
  // Generate the ExpoCrispFirebaseMessagingService.kt source file
  config = withDangerousMod(config, [
    "android",
    (config) => {
      const packageName = config.android?.package ?? "com.anonymous";
      const packagePath = packageName.replace(/\./g, "/");
      const serviceDir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "java",
        packagePath,
      );

      fs.mkdirSync(serviceDir, { recursive: true });

      const serviceCode = generateFirebaseMessagingService(packageName);
      fs.writeFileSync(
        path.join(serviceDir, "ExpoCrispFirebaseMessagingService.kt"),
        serviceCode,
        "utf-8",
      );

      return config;
    },
  ]);

  // Modify AndroidManifest: register our chained service, remove conflicting ones, add meta-data
  config = withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

    if (!mainApplication.service) {
      mainApplication.service = [];
    }

    // Remove any existing service with MESSAGING_EVENT intent-filter
    mainApplication.service = mainApplication.service.filter((s) => {
      const intentFilters = s["intent-filter"] ?? [];
      const hasMessagingEvent = intentFilters.some((filter) =>
        (filter.action ?? []).some(
          (a) => a.$?.["android:name"] === "com.google.firebase.MESSAGING_EVENT",
        ),
      );
      return !hasMessagingEvent;
    });

    // Register our chained service
    const packageName = config.android?.package ?? "com.anonymous";
    mainApplication.service.push({
      $: {
        "android:name": `${packageName}.ExpoCrispFirebaseMessagingService`,
        "android:exported": "false",
      },
      "intent-filter": [
        {
          action: [{ $: { "android:name": "com.google.firebase.MESSAGING_EVENT" } }],
        },
      ],
    });

    // Add meta-data
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

    // Add notifications mode meta-data
    const hasMode = mainApplication["meta-data"].some(
      (m) => m.$?.["android:name"] === "expo.modules.crispsdk.NOTIFICATIONS_MODE",
    );
    if (!hasMode) {
      mainApplication["meta-data"].push({
        $: {
          "android:name": "expo.modules.crispsdk.NOTIFICATIONS_MODE",
          "android:value": "coexistence",
        },
      });
    }

    return config;
  });

  // Add firebase-messaging and crisp-sdk dependencies
  // The generated ExpoCrispFirebaseMessagingService.kt lives in the app's source directory
  // and imports CrispNotificationClient, so the app module needs the Crisp SDK dependency
  config = withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes("firebase-messaging")) {
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {
    implementation 'com.google.firebase:firebase-messaging'`,
      );
    }
    config.modResults.contents = addCrispAndroidSdkDependency(config.modResults.contents);
    config.modResults.contents = addCommonmarkAndroidDependency(config.modResults.contents);
    return config;
  });

  return config;
};
