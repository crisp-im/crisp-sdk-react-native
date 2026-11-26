/** @jest-environment node */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { AndroidConfig, compileModsAsync, WarningAggregator } from "expo/config-plugins";
import { withAndroidNotifications } from "../../plugin/src/withAndroid";
import type { NotificationMode } from "../../plugin/src/withExpoCrisp";

const websiteId = "00000000-0000-4000-8000-000000000001";
const packageName = "chat.crisp.synthetic";
const crispService = "im.crisp.sdk.api.notification.CrispNotificationService";
const legacyCrispService = "im.crisp.client.external.notification.CrispNotificationService";
const chainedService = `${packageName}.ExpoCrispFirebaseMessagingService`;

function createProject(expoNotifications = false, hostServices = "") {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "crisp-android-plugin-"));
  const mainDirectory = path.join(projectRoot, "android/app/src/main");
  fs.mkdirSync(mainDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(mainDirectory, "AndroidManifest.xml"),
    `<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="${packageName}">
      <application android:name=".MainApplication"><service android:name="chat.crisp.HostService" android:exported="false" />${hostServices}
      <meta-data android:name="host.setting" android:value="preserved" /></application>
    </manifest>`,
  );
  fs.writeFileSync(path.join(projectRoot, "android/app/build.gradle"), "dependencies {\n}\n");
  if (expoNotifications) {
    const notificationsDirectory = path.join(projectRoot, "node_modules/expo-notifications");
    fs.mkdirSync(notificationsDirectory, { recursive: true });
    fs.writeFileSync(path.join(notificationsDirectory, "index.js"), "");
  }
  return projectRoot;
}

async function applyAndroidConfiguration(
  projectRoot: string,
  mode: NotificationMode,
  configuredWebsiteId = websiteId,
) {
  const config = withAndroidNotifications(
    {
      name: "Synthetic Crisp configuration",
      slug: "synthetic-crisp-configuration",
      android: { package: packageName },
    },
    [configuredWebsiteId, mode],
  );
  await compileModsAsync(config, { projectRoot, platforms: ["android"] });
  const manifest = await AndroidConfig.Manifest.readAndroidManifestAsync(
    path.join(projectRoot, "android/app/src/main/AndroidManifest.xml"),
  );
  const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
  const metadata = Object.fromEntries(
    (application["meta-data"] ?? []).map((entry) => [
      entry.$["android:name"],
      entry.$["android:value"],
    ]),
  );
  const services = (application.service ?? []).filter(
    (service) => service.$["tools:node"] !== "remove",
  );
  const gradle = fs.readFileSync(path.join(projectRoot, "android/app/build.gradle"), "utf8");
  return { application, metadata, services, gradle };
}

describe("Android notification plugin", () => {
  let warnings: jest.SpyInstance;
  beforeEach(() => {
    warnings = jest.spyOn(WarningAggregator, "addWarningAndroid").mockImplementation(() => {});
  });
  afterEach(() => warnings.mockRestore());

  it.each<NotificationMode>([
    "sdk-managed",
    "coexistence",
  ])("writes the current %s mode and website", async (mode) => {
    const result = await applyAndroidConfiguration(createProject(), mode);
    expect(result.metadata).toMatchObject({
      "expo.modules.crispsdk.WEBSITE_ID": websiteId,
      "expo.modules.crispsdk.NOTIFICATIONS_ENABLED": "true",
      "expo.modules.crispsdk.NOTIFICATIONS_MODE": mode,
      "host.setting": "preserved",
    });
    expect(result.services.map((service) => service.$["android:name"])).toEqual([
      "chat.crisp.HostService",
      mode === "coexistence" ? chainedService : crispService,
    ]);
  });

  it.each<NotificationMode>([
    "sdk-managed",
    "coexistence",
  ])("updates the website and stays idempotent in %s mode", async (mode) => {
    const projectRoot = createProject();
    await applyAndroidConfiguration(projectRoot, mode);
    const nextWebsiteId = "00000000-0000-4000-8000-000000000002";
    const updated = await applyAndroidConfiguration(projectRoot, mode, nextWebsiteId);
    expect(updated.metadata["expo.modules.crispsdk.WEBSITE_ID"]).toBe(nextWebsiteId);
    const repeated = await applyAndroidConfiguration(projectRoot, mode, nextWebsiteId);
    expect(repeated).toEqual(updated);
    expect(repeated.gradle.match(/firebase-messaging/g)).toHaveLength(1);
    expect(repeated.gradle.match(/firebase-bom:34\.18\.0/g)).toHaveLength(1);
  });

  it("switches coexistence → sdk-managed → coexistence without duplicate routing", async () => {
    const projectRoot = createProject();
    const initial = await applyAndroidConfiguration(projectRoot, "coexistence");
    const managed = await applyAndroidConfiguration(projectRoot, "sdk-managed");
    expect(managed.metadata["expo.modules.crispsdk.NOTIFICATIONS_MODE"]).toBe("sdk-managed");
    expect(managed.services.map((service) => service.$["android:name"])).toEqual([
      "chat.crisp.HostService",
      crispService,
    ]);
    expect(await applyAndroidConfiguration(projectRoot, "coexistence")).toEqual(initial);
  });

  it.each<NotificationMode>([
    "sdk-managed",
    "coexistence",
  ])("preserves the host Firebase BoM in %s mode", async (mode) => {
    const projectRoot = createProject();
    const gradle =
      "dependencies {\n  implementation platform('com.google.firebase:firebase-bom:34.7.0')\n}\n";
    fs.writeFileSync(path.join(projectRoot, "android/app/build.gradle"), gradle);
    const result = await applyAndroidConfiguration(projectRoot, mode);
    expect(result.gradle.match(/firebase-bom/g)).toHaveLength(1);
    expect(result.gradle).toContain("firebase-bom:34.7.0");
    expect(result.gradle.match(/firebase-messaging/g)).toHaveLength(1);
    expect(warnings).toHaveBeenCalledWith(
      "crisp-sdk-react-native",
      expect.stringContaining("Firebase BoM 34.7.0 is older than 34.18.0"),
    );
  });

  it("does not warn about a recent host Firebase BoM", async () => {
    const projectRoot = createProject();
    const gradle =
      "dependencies {\n  implementation platform('com.google.firebase:firebase-bom:35.2.0')\n}\n";
    fs.writeFileSync(path.join(projectRoot, "android/app/build.gradle"), gradle);
    await applyAndroidConfiguration(projectRoot, "sdk-managed");
    expect(warnings).not.toHaveBeenCalled();
  });

  it("preserves an explicitly versioned host Firebase dependency", async () => {
    const projectRoot = createProject();
    const gradle =
      "dependencies {\n  implementation 'com.google.firebase:firebase-messaging:25.0.1'\n}\n";
    fs.writeFileSync(path.join(projectRoot, "android/app/build.gradle"), gradle);
    const result = await applyAndroidConfiguration(projectRoot, "sdk-managed");
    expect(result.gradle).toBe(gradle);
    expect(warnings).toHaveBeenCalledWith(
      "crisp-sdk-react-native",
      expect.stringContaining("firebase-messaging 25.0.1 is older than 25.1.2"),
    );
  });

  it.each<NotificationMode>([
    "sdk-managed",
    "coexistence",
  ])("removes the Crisp 2.x dependencies added by previous versions in %s mode", async (mode) => {
    const projectRoot = createProject();
    fs.writeFileSync(
      path.join(projectRoot, "android/app/build.gradle"),
      `dependencies {
    implementation 'org.commonmark:commonmark:0.21.0'
    implementation('im.crisp:crisp-sdk:2.0.25') {
        exclude group: 'com.atlassian.commonmark', module: 'commonmark'
    }
    implementation 'com.google.firebase:firebase-messaging'
    implementation platform('com.google.firebase:firebase-bom:34.6.0')
    implementation 'host:library:1.0.0'
}
`,
    );
    const result = await applyAndroidConfiguration(projectRoot, mode);
    expect(result.gradle).not.toMatch(/im\.crisp:crisp-sdk|commonmark/);
    expect(result.gradle).toContain("implementation 'host:library:1.0.0'");
    expect(await applyAndroidConfiguration(projectRoot, mode)).toEqual(result);
  });

  it("does not add the Crisp SDK to the app, which gets it from the module", async () => {
    const projectRoot = createProject();
    const wrapperGradle = fs.readFileSync(path.join(process.cwd(), "android/build.gradle"), "utf8");
    expect(wrapperGradle).toMatch(/^\s*api "im\.crisp:crisp-sdk:3\./m);
    const gradle = "dependencies {\n  testImplementation 'im.crisp:crisp-sdk:3.0.0beta2'\n}\n";
    fs.writeFileSync(path.join(projectRoot, "android/app/build.gradle"), gradle);
    const result = await applyAndroidConfiguration(projectRoot, "coexistence");
    expect(result.gradle.match(/im\.crisp:crisp-sdk/g)).toHaveLength(1);
    expect(result.gradle).toContain("testImplementation 'im.crisp:crisp-sdk:3.0.0beta2'");
  });

  it.each<NotificationMode>([
    "sdk-managed",
    "coexistence",
  ])("replaces the Crisp 2.x notification service in %s mode", async (mode) => {
    const legacy = `<service android:name="${legacyCrispService}" android:exported="false"><intent-filter><action android:name="com.google.firebase.MESSAGING_EVENT" /></intent-filter></service>`;
    const result = await applyAndroidConfiguration(createProject(false, legacy), mode);
    expect(result.services.map((service) => service.$["android:name"])).toEqual([
      "chat.crisp.HostService",
      mode === "coexistence" ? chainedService : crispService,
    ]);
  });

  it.each([
    true,
    false,
  ])("resolves expo-notifications in the consumer app: %s", async (installed) => {
    const projectRoot = createProject(installed);
    await applyAndroidConfiguration(projectRoot, "coexistence");
    const source = fs.readFileSync(
      path.join(
        projectRoot,
        "android/app/src/main/java/chat/crisp/synthetic/ExpoCrispFirebaseMessagingService.kt",
      ),
      "utf8",
    );
    const baseClass = installed
      ? "expo.modules.notifications.service.ExpoFirebaseMessagingService"
      : "com.google.firebase.messaging.FirebaseMessagingService";
    expect(source).toContain(`: ${baseClass}()`);
    expect(source).toContain("import im.crisp.sdk.api.notification.CrispNotifications");
    expect(source).toContain("CrispNotifications.isCrispNotification(message)");
    expect(source).toContain("CrispNotifications.handleNotification(this, message)");
    expect(source).toContain("super.onMessageReceived(message)");
    expect(source).toContain("CrispNotifications.onNewToken(this, token)");
    expect(source).toContain("super.onNewToken(token)");
    expect(source).toContain("CrispNotifications.onRegistered(this, installationId)");
    expect(source).toContain("super.onRegistered(installationId)");
  });
});
