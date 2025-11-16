const path = require("path");
const { execSync } = require("child_process");

const arch = process.env.ARCH;

module.exports = {
  appId: "com.narraflow.app",
  productName: "NarraFlow",
  mac: {
    icon: "build/icons/icon.icns",
    gatekeeperAssess: false,
    minimumSystemVersion: "11.0.0", // macOS Big Sur or later
    category: "public.app-category.productivity",
  },
  // Ad-hoc code signing after build
  afterSign: async (context) => {
    const appPath = context.appOutDir;
    const appName = context.packager.appInfo.productFilename;
    const fullAppPath = path.join(appPath, `${appName}.app`);

    console.log(`Signing app at: ${fullAppPath}`);
    execSync(`codesign --deep --force --sign - "${fullAppPath}"`);
  },
  files: [
    "dist/main/**/*",
    "dist/renderer/**/*",
    "dist/fn-key-helper/**/*",
    "dist/speechanalyzer-helper/**/*",
    "package.json"
  ],
  extraResources: [
    {
      from: "resources/whisperkit-cli",
      to: "whisperkit-cli"
    },
    {
      from: "speechanalyzer-helper/build/NarraFlowSpeechAnalyzer.app",
      to: "NarraFlowSpeechAnalyzer.app",
      filter: ["**/*"]
    }
  ],
  extraFiles: [
    {
      from: `dist/fn-key-helper/build/NarraFlowFnHelper.app`,
      to: `NarraFlowFnHelper.app`,
      filter: ["**/*"]
    }
  ],
  publish: [
    {
      provider: "github",
      owner: "projectsthataremine",
      repo: "narraflow",
    },
  ],
};
