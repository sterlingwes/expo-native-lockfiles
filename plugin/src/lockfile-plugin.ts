import path from "path";
import { copyFile, exists } from "fs/promises";
import {
  type ConfigPlugin,
  withDangerousMod,
  WarningAggregator,
} from "expo/config-plugins";

const pluginTag = "expo-native-lockfiles";
const warnDoesNotExistPrefix = "Lockfile does not exist at";
const warnNextStepsSuffix =
  '(not copying to project: run "yarn native-lock" to generate and commit them)';

const withGradleLockfile: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    "android",
    async (modConfig) => {
      const appLockfile = "gradle.lockfile";
      const rootPath = modConfig.modRequest.projectRoot;
      const androidPath = modConfig.modRequest.platformProjectRoot;
      const lockfilePath = path.join(rootPath, appLockfile);
      const lockfileExists = await exists(lockfilePath);
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
      const lockfileExists = await exists(lockfilePath);
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

export const withLockfilePlugin: ConfigPlugin = (config) => {
  return withGradleLockfile(withPodsLockfile(config));
};
