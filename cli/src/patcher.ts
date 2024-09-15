import { existsSync } from "fs";
import { copyFile } from "fs/promises";
import { $, replaceInFile } from "./utils";

const podHelperPath = "node_modules/react-native/scripts/cocoapods/helpers.rb";
const glogPodspecPath =
  "node_modules/react-native/third-party-podspecs/glog.podspec";

/**
 * the prepare_react_native_project! hook in Podfiles is not required
 * to generate the lockfile and causes issues with non-darwin CI environments
 */
export const disablePodfilePrepareHook = async ({
  debug,
  podfilePath,
}: {
  debug?: boolean;
  podfilePath: string;
}) => {
  if (!existsSync(podfilePath)) {
    throw new Error(
      `disablePodfilePrepareHook: Podfile not found at ${podfilePath}`
    );
  }

  if (debug) {
    console.log(
      `disablePodfilePrepareHook: disabling prepare_react_native_project! hook in ${podfilePath}`
    );
  }

  const podfileBackupPath = `${podfilePath}.bak`;
  await copyFile(podfilePath, podfileBackupPath);

  await replaceInFile({
    path: podfilePath,
    search: "prepare_react_native_project!",
    replace: "",
  });

  const reEnable = async () => {
    if (debug) {
      console.log(
        `disablePodfilePrepareHook: re-enabling prepare_react_native_project! hook in ${podfilePath} from ${podfileBackupPath}`
      );
    }

    await $`mv ${podfileBackupPath} ${podfilePath}`;
  };

  return reEnable;
};

/**
 * there are some hooks in react native Podfiles that call to
 * xcodebuild, and this won't be available in all environments,
 * like in CI on linux
 */
export const mockXcodebuild = async ({
  debug,
  xcVersion,
}: {
  debug?: boolean;
  xcVersion: string;
}) => {
  // verify patch paths exist before mocking
  const paths = [podHelperPath, glogPodspecPath];
  for (const path of paths) {
    if (!existsSync(path)) {
      throw new Error(
        `mockXcodebuild: path ${path} does not exist. This may mean that expo-native-lockfiles needs to be updated to address a react-native reorganization.`
      );
    }
  }

  if (debug) {
    console.log(
      `mockXcodebuild: patching xcodebuild -version calls in ${podHelperPath} and ${glogPodspecPath} to Xcode ${xcVersion}`
    );
  }

  // mv originals
  const podHelperBackupPath = `${podHelperPath}.bak`;
  await copyFile(podHelperPath, podHelperBackupPath);
  const glogPodspecBackupPath = `${glogPodspecPath}.bak`;
  await copyFile(glogPodspecPath, glogPodspecBackupPath);

  const baseReplacement = {
    search: "xcodebuild -version",
    replace: `echo Xcode ${xcVersion}`,
  };

  // patch xc versions
  await replaceInFile({
    ...baseReplacement,
    path: podHelperPath,
  });
  await replaceInFile({
    ...baseReplacement,
    path: glogPodspecPath,
  });

  const unmock = async () => {
    if (debug) {
      console.log(
        `mockXcodebuild: restoring original xcodebuild -version calls in ${podHelperPath} and ${glogPodspecPath} from ${podHelperBackupPath} and ${glogPodspecBackupPath}`
      );
    }
    try {
      await $`mv ${podHelperBackupPath} ${podHelperPath}`;
    } catch (e) {
      console.log(
        `Failed to restore ${podHelperPath} from ${podHelperBackupPath}`
      );
      console.error(e);
    }
    try {
      await $`mv ${glogPodspecBackupPath} ${glogPodspecPath}`;
    } catch (e) {
      console.log(
        `Failed to restore ${glogPodspecPath} from ${glogPodspecBackupPath}`
      );
      console.error(e);
    }
  };

  return unmock;
};
