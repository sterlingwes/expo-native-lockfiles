import { existsSync } from "fs";
import { copyFile } from "fs/promises";

import { $, prompt } from "./utils";

const run = async () => {
  const result = await prompt(
    'I will run "expo prebuild --clean" to generate fresh native projects, then copy the lockfiles to the root of your repo. Should I continue? (y/N): '
  );
  if (result !== "y") {
    console.log("OK! Aborting...");
    return;
  }

  await $`CI=1 yarn expo prebuild --clean`;

  const podfileExists = existsSync("ios/Podfile.lock");
  if (!podfileExists) {
    console.warn(
      "Podfile.lock does not exist at ios/Podfile.lock. Something went wrong with expo prebuild, aborting."
    );
    process.exit(1);
  }

  await $`cd android && ./gradlew app:dependencies --write-locks`;

  const gradleLockExists = existsSync("android/app/gradle.lockfile");
  if (!gradleLockExists) {
    console.warn(
      'gradle.lockfile does not exist at android/app/gradle.lockfile. Have you setup "expo-native-lockfiles" as an expo plugin in your app.json? Aborting.'
    );
    process.exit(1);
  }

  await copyFile("ios/Podfile.lock", "Podfile.lock");
  await copyFile("android/app/gradle.lockfile", "gradle.lockfile");
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("native-lock error:", err);
    process.exit(1);
  });
