import { compileModsAsync } from "expo/config-plugins";
import type { NotificationMode } from "../../plugin/src/withExpoCrisp";
import { withIosNotifications } from "../../plugin/src/withIos";

type NativeConfiguration = {
  infoPlist: Record<string, any>;
  entitlements: Record<string, any>;
};

const websiteId = "00000000-0000-4000-8000-000000000001";

async function applyIosConfiguration(
  mode: NotificationMode,
  previous: NativeConfiguration = { infoPlist: {}, entitlements: {} },
  configuredWebsiteId = websiteId,
  repetitions = 1,
): Promise<NativeConfiguration> {
  let config = withIosNotifications(
    {
      name: "Synthetic Crisp configuration",
      slug: "synthetic-crisp-configuration",
      ios: {
        bundleIdentifier: "chat.crisp.synthetic",
        infoPlist: JSON.parse(JSON.stringify(previous.infoPlist)),
        entitlements: JSON.parse(JSON.stringify(previous.entitlements)),
      },
    },
    [configuredWebsiteId, mode],
  );
  for (let iteration = 1; iteration < repetitions; iteration += 1) {
    config = withIosNotifications(config, [configuredWebsiteId, mode]);
  }
  const result = await compileModsAsync(config, {
    projectRoot: process.cwd(),
    platforms: ["ios"],
    introspect: true,
    ignoreExistingNativeFiles: true,
  });

  return {
    infoPlist: result._internal?.modResults.ios.infoPlist,
    entitlements: result._internal?.modResults.ios.entitlements,
  };
}

describe("iOS notification plugin", () => {
  it.each<NotificationMode>([
    "sdk-managed",
    "coexistence",
  ])("writes the selected %s mode and website", async (mode) => {
    const result = await applyIosConfiguration(mode);
    expect(result.infoPlist.CrispWebsiteId).toBe(websiteId);
    expect(result.infoPlist.CrispNotificationsEnabled).toBe(true);
    expect(result.infoPlist.CrispNotificationsMode).toBe(mode);
    expect(result.infoPlist.UIBackgroundModes).toEqual(["remote-notification"]);
    expect(result.entitlements["aps-environment"]).toBe("production");
  });

  it("returns to SDK-managed registration after coexistence", async () => {
    const coexistence = await applyIosConfiguration("coexistence");
    const sdkManaged = await applyIosConfiguration("sdk-managed", coexistence);
    expect(sdkManaged.infoPlist.CrispNotificationsMode).toBe("sdk-managed");
    const returned = await applyIosConfiguration("coexistence", sdkManaged);
    expect(returned).toEqual(coexistence);
  });

  it.each<NotificationMode>([
    "sdk-managed",
    "coexistence",
  ])("preserves development APNs configuration in %s mode", async (mode) => {
    const result = await applyIosConfiguration(mode, {
      infoPlist: {},
      entitlements: { "aps-environment": "development" },
    });
    expect(result.entitlements["aps-environment"]).toBe("development");
  });

  it.each<NotificationMode>([
    "sdk-managed",
    "coexistence",
  ])("preserves host permissions and unrelated configuration in %s mode", async (mode) => {
    const previous = {
      infoPlist: {
        UIBackgroundModes: ["audio", "remote-notification"],
        NSCameraUsageDescription: "Host camera explanation",
        NSMicrophoneUsageDescription: "Host microphone explanation",
        NSPhotoLibraryUsageDescription: "Host photo explanation",
        HostNotificationSetting: "unchanged",
      },
      entitlements: {
        "aps-environment": "production",
        "com.apple.security.application-groups": ["group.chat.crisp.synthetic"],
      },
    };
    const result = await applyIosConfiguration(mode, previous);
    expect(result.infoPlist).toMatchObject(previous.infoPlist);
    expect(result.entitlements).toEqual(previous.entitlements);
  });

  it.each<NotificationMode>([
    "sdk-managed",
    "coexistence",
  ])("is idempotent across repeated prebuild evaluation in %s mode", async (mode) => {
    const first = await applyIosConfiguration(mode);
    const second = await applyIosConfiguration(mode, first);
    expect(second).toEqual(first);
    expect(await applyIosConfiguration(mode, first, websiteId, 2)).toEqual(first);
  });

  it("updates the website instead of keeping a previous installation's value", async () => {
    const first = await applyIosConfiguration("sdk-managed");
    const replacement = "00000000-0000-4000-8000-000000000002";
    const second = await applyIosConfiguration("sdk-managed", first, replacement);
    expect(second.infoPlist.CrispWebsiteId).toBe(replacement);
  });
});
