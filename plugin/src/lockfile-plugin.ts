import path from "path";
import { existsSync } from "fs";
import { copyFile } from "fs/promises";
import {
  type ConfigPlugin,
  withDangerousMod,
  WarningAggregator,
  withAppBuildGradle,
} from "expo/config-plugins";

const pluginTag = "expo-native-lockfiles";
const warnDoesNotExistPrefix = "Lockfile does not exist at";
const warnNextStepsSuffix =
  '(not copying to project: run "yarn native-lock" to generate and commit them)';

const buildGradleReplacePoint = "android {";
const dependencyLockCall = `
dependencyLocking {
    lockAllConfigurations()
}
`;

const withGradleLockfileActivated: ConfigPlugin = (config) => {
  return withAppBuildGradle(config, (modConfig) => {
    modConfig.modResults.contents = modConfig.modResults.contents.replace(
      buildGradleReplacePoint,
      `${dependencyLockCall}\n${buildGradleReplacePoint}`
    );
    return modConfig;
  });
};

const withGradleLockfile: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    "android",
    async (modConfig) => {
      const appLockfile = "gradle.lockfile";
      const rootPath = modConfig.modRequest.projectRoot;
      const androidPath = modConfig.modRequest.platformProjectRoot;
      const lockfilePath = path.join(rootPath, appLockfile);
      const lockfileExists = existsSync(lockfilePath);
      if (!lockfileExists) {
        WarningAggregator.addWarningAndroid(
          pluginTag,
          `${warnDoesNotExistPrefix} ${lockfilePath} ${warnNextStepsSuffix}`
        );
      } else {
        const destination = path.join(androidPath, `app/${appLockfile}`);
        await copyFile(lockfilePath, destination);
      }

      return modConfig;
    },
  ]);
};

const withPodsLockfile: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (modConfig) => {
      const appLockfile = "Podfile.lock";
      const rootPath = modConfig.modRequest.projectRoot;
      const iosPath = modConfig.modRequest.platformProjectRoot;
      const lockfilePath = path.join(rootPath, appLockfile);
      const lockfileExists = existsSync(lockfilePath);
      if (!lockfileExists) {
        WarningAggregator.addWarningIOS(
          pluginTag,
          `${warnDoesNotExistPrefix} ${lockfilePath} ${warnNextStepsSuffix}`
        );
      } else {
        const destination = path.join(iosPath, appLockfile);
        await copyFile(lockfilePath, destination);
      }

      return modConfig;
    },
  ]);
};

const withLockfilePlugin: ConfigPlugin = (config) => {
  return withGradleLockfileActivated(
    withGradleLockfile(withPodsLockfile(config))
  );
};

export default withLockfilePlugin;
