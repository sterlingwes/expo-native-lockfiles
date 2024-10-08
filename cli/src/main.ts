import { resolve } from "path";
import { existsSync } from "fs";
import { copyFile } from "fs/promises";
import { generateLockfile } from "pod-lockfile";

import { $, prompt, linebreak, shasumHash } from "./utils";
import { disablePodfilePrepareHook, mockXcodebuild } from "./patcher";
import { checkLockfilesAndExit, precheck } from "./checker";

let nonInteractive = false;
if (process.argv.includes("--non-interactive") || !!process.env.CI) {
  nonInteractive = true;
}

let debug = false;
if (process.argv.includes("--debug")) {
  debug = true;
}

let android = false;
if (process.argv.includes("--android")) {
  android = true;
}

const xcVersion = process.env.XCVERSION || "15.4";

const cliCmdIndex = process.argv.findIndex((arg) =>
  arg.includes("native-lock")
);
if (cliCmdIndex === -1) {
  console.error("Could not parse native-lock command args");
  process.exit(1);
}

const subCommand =
  process.argv
    .slice(cliCmdIndex + 1)
    .find((arg) => arg.startsWith("--") === false) ?? "help";

const printHelp = () => {
  const help = `
expo-native-lockfiles CLI
Usage: yarn native-lock [subcommand]

Subcommands:
  check: Check if lockfiles after prebuild are the same as those in the root of the repo.
  write: Write the lockfiles generated after prebuild to the root of the repo.
  help: Print this help message.

Options:
  --android: Generate or check a lockfile for Android (opt-in).
  --non-interactive: Skip interactive prompts (assumes 'yes').
  --debug: Print debug information.

`;
  console.log(help);
};

const knownSubCommands = ["help", "check", "write"];
if (!knownSubCommands.includes(subCommand)) {
  console.error(
    `Unknown subcommand "${subCommand}". Supported native-lock subcommands are: ${knownSubCommands.join(
      ", "
    )}`
  );
  printHelp();
  process.exit(1);
}

if (subCommand === "help") {
  printHelp();
  process.exit(0);
}

const checkMode = subCommand === "check";

const expoPrebuildCommand = "expo prebuild --clean --no-install";

const run = async () => {
  if (checkMode) {
    precheck({ android });
  }

  if (nonInteractive === false) {
    const result = await prompt(
      'I will run "expo prebuild --clean" to generate fresh native projects, then copy the lockfiles to the root of your repo. Should I continue? (y/N): '
    );
    if (result !== "y") {
      console.log("OK! Aborting...");
      return;
    }
  }

  linebreak();
  console.log(
    `Running "${expoPrebuildCommand}" to generate fresh native projects, along with a Gradle sync, this may take a few minutes...`
  );
  linebreak();

  if (checkMode) {
    await $`CI=1 ./node_modules/.bin/${expoPrebuildCommand}`;
  } else {
    await $`CI=1 ENL_GENERATING=1 ./node_modules/.bin/${expoPrebuildCommand}`;
  }

  const basePath = "./ios";
  const podfilePath = resolve(basePath, "Podfile");

  const unmockXcodebuild = await mockXcodebuild({ debug, xcVersion });
  const reEnablePodfileHook = await disablePodfilePrepareHook({
    debug,
    podfilePath,
  });

  try {
    generateLockfile({ project: basePath, debug });
  } finally {
    await reEnablePodfileHook();
    await unmockXcodebuild();
  }

  const lockfilePath = resolve(basePath, "Podfile.lock");
  const podfileExists = existsSync(lockfilePath);
  if (!podfileExists) {
    console.warn(
      "Podfile.lock does not exist at ios/Podfile.lock. Something went wrong with prebuild & lockfile generate, aborting."
    );
    process.exit(1);
  }

  if (android) {
    await $`cd android && ./gradlew app:dependencies --write-locks`;

    const gradleLockExists = existsSync("android/app/gradle.lockfile");
    if (!gradleLockExists) {
      console.warn(
        'gradle.lockfile does not exist at android/app/gradle.lockfile. Have you setup "expo-native-lockfiles" as an expo plugin in your app.json? Aborting.'
      );
      process.exit(1);
    }
  }

  if (checkMode) {
    await checkLockfilesAndExit({ debug, android, project: basePath });
  }

  await copyFile("ios/Podfile.lock", "Podfile.lock");

  if (android) {
    await copyFile("android/app/gradle.lockfile", "gradle.lockfile");
  }

  linebreak();
  console.log("Lockfiles have been copied to the root of your project.");
  linebreak();
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("native-lock error:", err);
    process.exit(1);
  });
