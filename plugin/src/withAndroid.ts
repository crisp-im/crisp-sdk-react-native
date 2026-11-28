import fs from "node:fs";
import path from "node:path";
import {
  AndroidConfig,
  type ConfigPlugin,
  withAndroidManifest,
  withAppBuildGradle,
  WarningAggregator,
  withDangerousMod,
} from "expo/config-plugins";

import type { NotificationMode } from "./withExpoCrisp";

type AndroidNotificationConfig = {
  websiteId: string;
  mode: NotificationMode;
};

export const CRISP_NOTIFICATION_SERVICE = "im.crisp.sdk.api.notification.CrispNotificationService";
const LEGACY_CRISP_NOTIFICATION_SERVICE = "im.crisp.client.external.notification.CrispNotificationService";

/** Minimum Firebase versions required by Crisp Android SDK 3.x for notifications. */
export const FIREBASE_BOM_MIN_VERSION = "34.18.0";
const FIREBASE_MESSAGING_MIN_VERSION = "25.1.2";

// Lines added to the app module by previous versions of this plugin, for Crisp Android 2.x:
// the module now exposes the Crisp SDK to the app itself.
const LEGACY_APP_DEPENDENCIES = [
  /^[ \t]*implementation\('im\.crisp:crisp-sdk:2\.[^']+'\)\s*\{\s*exclude group: 'com\.atlassian\.commonmark', module: 'commonmark'\s*\}[ \t]*\r?\n?/m,
  /^[ \t]*implementation 'org\.commonmark:commonmark:0\.21\.0'[ \t]*\r?\n?/m,
];

function removeLegacyCrispDependencies(contents: string): string {
  return LEGACY_APP_DEPENDENCIES.reduce((result, pattern) => result.replace(pattern, ""), contents);
}

function isOlderVersion(version: string, minimum: string): boolean {
  const parts = version.split(".").map(Number);
  const minimumParts = minimum.split(".").map(Number);
  if (parts.some(Number.isNaN)) return false;
  for (let i = 0; i < minimumParts.length; i++) {
    const difference = (parts[i] ?? 0) - minimumParts[i];
    if (difference !== 0) return difference < 0;
  }
  return false;
}

function warnAboutOldFirebase(contents: string): void {
  const bom = contents.match(/com\.google\.firebase:firebase-bom:([\w.-]+)/)?.[1];
  const messaging = contents.match(/com\.google\.firebase:firebase-messaging:([\w.-]+)/)?.[1];
  if (bom && isOlderVersion(bom, FIREBASE_BOM_MIN_VERSION)) {
    WarningAggregator.addWarningAndroid(
      "crisp-sdk-react-native",
      `Firebase BoM ${bom} is older than ${FIREBASE_BOM_MIN_VERSION}, required by Crisp Android SDK 3.x notifications.`,
    );
  }
  if (messaging && isOlderVersion(messaging, FIREBASE_MESSAGING_MIN_VERSION)) {
    WarningAggregator.addWarningAndroid(
      "crisp-sdk-react-native",
      `firebase-messaging ${messaging} is older than ${FIREBASE_MESSAGING_MIN_VERSION}, required by Crisp Android SDK 3.x notifications.`,
    );
  }
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
    implementation platform('com.google.firebase:firebase-bom:${FIREBASE_BOM_MIN_VERSION}')`,
    );
  }
  warnAboutOldFirebase(contents);
  return removeLegacyCrispDependencies(contents);
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
    const replaced = [
      `${packageName}.ExpoCrispFirebaseMessagingService`,
      LEGACY_CRISP_NOTIFICATION_SERVICE,
      CRISP_NOTIFICATION_SERVICE,
    ];
    mainApplication.service = mainApplication.service.filter(
      (service) => !replaced.includes(service.$["android:name"]),
    );
    mainApplication.service.push({
      $: {
        "android:name": CRISP_NOTIFICATION_SERVICE,
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
import im.crisp.sdk.api.notification.CrispNotifications

// Generated by crisp-sdk-react-native (coexistence mode): shows Crisp notifications,
// passes the others to ${baseClass.split(".").pop()}.
class ExpoCrispFirebaseMessagingService : ${baseClass}() {

    override fun onMessageReceived(message: RemoteMessage) {
        if (CrispNotifications.isCrispNotification(message)) {
            CrispNotifications.handleNotification(this, message)
        } else {
            super.onMessageReceived(message)
        }
    }

    // Deprecated by firebase-messaging 25.1.0, still called while the app registers with the FCM token
    @Suppress("OVERRIDE_DEPRECATION", "DEPRECATION")
    override fun onNewToken(token: String) {
        CrispNotifications.onNewToken(this, token)
        super.onNewToken(token)
    }

    override fun onRegistered(installationId: String) {
        CrispNotifications.onRegistered(this, installationId)
        super.onRegistered(installationId)
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

  // The generated service lives in the app module: it gets the Crisp SDK from the module (api dependency)
  // and Firebase Messaging from the app
  config = withAppBuildGradle(config, (config) => {
    config.modResults.contents = addFirebaseMessagingDependencies(config.modResults.contents);
    return config;
  });

  return config;
};
