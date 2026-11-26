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

const CRISP_ANDROID_SDK_DEPENDENCY = `implementation('im.crisp:crisp-sdk:2.0.25') {
        exclude group: 'com.atlassian.commonmark', module: 'commonmark'
    }`;
const COMMONMARK_ANDROID_DEPENDENCY = "implementation 'org.commonmark:commonmark:0.21.0'";
const CRISP_COMMONMARK_EXCLUSION =
  "exclude group: 'com.atlassian.commonmark', module: 'commonmark'";

function addCrispAndroidSdkDependency(contents: string): string {
  if (!/^\s*(?:implementation|api)\s*\(?\s*['"]im\.crisp:crisp-sdk:/m.test(contents)) {
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
    /implementation\s+['"]im\.crisp:crisp-sdk:[^'"]+['"]/,
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

function addFirebaseMessagingDependencies(contents: string): string {
  if (!contents.includes("com.google.firebase:firebase-messaging")) {
    contents = contents.replace(
      /dependencies\s*\{/,
      `dependencies {
    implementation 'com.google.firebase:firebase-messaging'`,
    );
  }
  if (
    !contents.includes("com.google.firebase:firebase-bom") &&
    !/com\.google\.firebase:firebase-messaging:[^'"\s]+/.test(contents)
  ) {
    contents = contents.replace(
      /dependencies\s*\{/,
      `dependencies {
    implementation platform('com.google.firebase:firebase-bom:34.6.0')`,
    );
  }
  return contents;
}

export const withAndroidNotifications: ConfigPlugin<[string, NotificationMode]> = (
  config,
  [websiteId, mode],
) => {
  const notificationConfig: AndroidNotificationConfig = { websiteId, mode };

  config = withAndroidManifest(config, (config) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    const metadata = {
      "expo.modules.crispsdk.WEBSITE_ID": websiteId,
      "expo.modules.crispsdk.NOTIFICATIONS_ENABLED": "true",
      "expo.modules.crispsdk.NOTIFICATIONS_MODE": mode,
    };
    application["meta-data"] = (application["meta-data"] ?? []).filter(
      (entry) => !Object.hasOwn(metadata, entry.$["android:name"]),
    );
    for (const [name, value] of Object.entries(metadata)) {
      application["meta-data"].push({ $: { "android:name": name, "android:value": value } });
    }
    return config;
  });

  if (mode === "coexistence") {
    return withAndroidCoexistence(config, notificationConfig);
  }

  return withAndroidSdkManaged(config, notificationConfig);
};

// =============================================================================
// SDK-Managed Mode (existing behavior, extracted)
// =============================================================================

const withAndroidSdkManaged: ConfigPlugin<AndroidNotificationConfig> = (config) => {
  // Add CrispNotificationService and meta-data to manifest
  config = withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

    // Add CrispNotificationService
    if (!mainApplication.service) {
      mainApplication.service = [];
    }

    const packageName = config.android?.package ?? "com.anonymous";
    mainApplication.service = mainApplication.service.filter(
      (service) => service.$["android:name"] !== `${packageName}.ExpoCrispFirebaseMessagingService`,
    );

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

    return config;
  });

  // Add firebase-messaging dependency
  config = withAppBuildGradle(config, (config) => {
    config.modResults.contents = addFirebaseMessagingDependencies(config.modResults.contents);
    return config;
  });

  return config;
};

// =============================================================================
// Coexistence Mode
// =============================================================================

function hasExpoNotifications(projectRoot: string): boolean {
  try {
    require.resolve("expo-notifications", { paths: [projectRoot] });
    return true;
  } catch {
    return false;
  }
}

function generateFirebaseMessagingService(packageName: string, projectRoot: string): string {
  const expoNotificationsInstalled = hasExpoNotifications(projectRoot);
  const baseClass = expoNotificationsInstalled
    ? "expo.modules.notifications.service.ExpoFirebaseMessagingService"
    : "com.google.firebase.messaging.FirebaseMessagingService";

  return `package ${packageName}

import com.google.firebase.messaging.RemoteMessage
import im.crisp.client.external.notification.CrispNotificationClient

class ExpoCrispFirebaseMessagingService : ${baseClass}() {

    override fun onMessageReceived(message: RemoteMessage) {
        if (CrispNotificationClient.isCrispNotification(message)) {
            CrispNotificationClient.handleNotification(this, message)
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

const withAndroidCoexistence: ConfigPlugin<AndroidNotificationConfig> = (config) => {
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

      const serviceCode = generateFirebaseMessagingService(
        packageName,
        config.modRequest.projectRoot,
      );
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

    return config;
  });

  // Add firebase-messaging and crisp-sdk dependencies
  // The generated ExpoCrispFirebaseMessagingService.kt lives in the app's source directory
  // and imports CrispNotificationClient, so the app module needs the Crisp SDK dependency
  config = withAppBuildGradle(config, (config) => {
    config.modResults.contents = addFirebaseMessagingDependencies(config.modResults.contents);
    config.modResults.contents = addCrispAndroidSdkDependency(config.modResults.contents);
    config.modResults.contents = addCommonmarkAndroidDependency(config.modResults.contents);
    return config;
  });

  return config;
};
