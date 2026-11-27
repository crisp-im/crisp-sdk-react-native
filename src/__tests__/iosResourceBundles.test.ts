import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compileModsAsync, WarningAggregator } from "expo/config-plugins";
import withExpoCrisp from "../../plugin/src/withExpoCrisp";
import { addCrispResourceBundlesFix, RESOURCE_BUNDLES_FIX } from "../../plugin/src/withIos";

// Expo 58 exports WarningAggregator as a non-configurable property: jest.spyOn cannot replace it
jest.mock("expo/config-plugins", () => {
  const actual = jest.requireActual("expo/config-plugins");
  return {
    ...actual,
    WarningAggregator: { ...actual.WarningAggregator, addWarningIOS: jest.fn() },
  };
});

// Shape of the post_install block of the Expo SDK 54 to 58 template Podfiles
const podfile = `platform :ios, podfile_properties['ios.deploymentTarget'] || '15.1'

target 'app' do
  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false,
      :ccache_enabled => ccache_enabled?(podfile_properties),
    )
  end
end
`;

const begin = "# @generated begin crisp-sdk-react-native-resource-bundles";
const end = "# @generated end crisp-sdk-react-native-resource-bundles";

// Runs the default export as `plugins: ["crisp-sdk-react-native"]` does, notifications disabled
async function prebuildPodfile(contents = podfile) {
  const projectRoot = mkdtempSync(join(tmpdir(), "crisp-podfile-"));
  try {
    mkdirSync(join(projectRoot, "ios"));
    writeFileSync(join(projectRoot, "ios", "Podfile"), contents);
    const config = withExpoCrisp(
      {
        name: "Synthetic Crisp configuration",
        slug: "synthetic-crisp-configuration",
        ios: { bundleIdentifier: "chat.crisp.synthetic" },
      },
      {},
    );
    await compileModsAsync(config, { projectRoot, platforms: ["ios"] });
    return readFileSync(join(projectRoot, "ios", "Podfile"), "utf8");
  } finally {
    rmSync(projectRoot, { recursive: true, force: true });
  }
}

describe("Crisp resource bundle alignment", () => {
  it("adds the alignment after react_native_post_install, without notifications", async () => {
    const result = await prebuildPodfile();
    const call = result.indexOf("react_native_post_install(");
    const close = result.indexOf("    )\n", call);
    const fix = result.indexOf(`    ${begin}`);
    expect(fix).toBe(close + "    )\n".length);
    expect(result.indexOf(`    ${end}\n  end\nend`)).toBeGreaterThan(fix);
    expect(result).toContain("    next unless %w[CrispChatBox CrispChatBoxFFI].include?");
    expect(result).toContain(
      "          configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = library_minimum",
    );
  });

  it("keeps one copy across repeated prebuilds", async () => {
    const once = await prebuildPodfile();
    expect(await prebuildPodfile(once)).toBe(once);
  });

  it("inserts after a single-line call, before the code that follows it", () => {
    const custom =
      "post_install do |installer|\n  react_native_post_install(installer, config[:reactNativePath])\n  puts 'after'\nend\n";
    const result = addCrispResourceBundlesFix(custom) as string;
    expect(result.indexOf(`  ${begin}`)).toBe(custom.indexOf("  puts"));
    expect(result.indexOf(`  ${end}\n  puts 'after'`)).toBeGreaterThan(0);
  });

  it("skips a commented-out call", () => {
    const custom =
      "post_install do |installer|\n  # react_native_post_install(old)\n  react_native_post_install(\n    installer,\n  )\nend\n";
    const result = addCrispResourceBundlesFix(custom) as string;
    expect(result.indexOf(begin)).toBeGreaterThan(result.indexOf("  )\n"));
  });

  it("warns and leaves a Podfile without react_native_post_install unchanged", async () => {
    const custom = "target 'app' do\n  post_install do |installer|\n  end\nend\n";
    expect(await prebuildPodfile(custom)).toBe(custom);
    expect(WarningAggregator.addWarningIOS).toHaveBeenCalledWith(
      "crisp-sdk-react-native",
      expect.stringContaining("react_native_post_install"),
    );
  });

  it("matches the manual workaround in MIGRATION.md", () => {
    const migration = readFileSync(join(__dirname, "../../MIGRATION.md"), "utf8");
    expect(migration).toContain(`\`\`\`ruby\n${RESOURCE_BUNDLES_FIX}\n\`\`\``);
  });
});
