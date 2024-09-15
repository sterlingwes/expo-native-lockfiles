import { resolve } from "path";
import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { $, shasumHash } from "./utils";

export const precheck = () => {
  const basePodfileExists = existsSync("Podfile.lock");
  const baseGradleLockExists = existsSync("gradle.lockfile");
  if (!basePodfileExists || !baseGradleLockExists) {
    console.warn(
      "Base lockfiles do not exist at Podfile.lock or gradle.lockfile. Run `yarn native-lock` to generate them before running with --check."
    );
    process.exit(1);
  }
};

/**
 * since the podfile itself includes checksums for the dependency specs,
 * and those can be unstable, we only checksum the top section of the file
 */
const getPodLockfileStableChecksum = async (project: string = ".") => {
  const lockfilePath = resolve(project, "Podfile.lock");
  const podfile = await readFile(lockfilePath, "utf-8");
  const topSection = podfile.split(/SPEC CHECKSUMS:/)[0];
  if (typeof topSection !== "string") {
    throw new Error("Could not extract top section of Podfile for checksum");
  }

  const tmpPath = resolve(project, "Podfile.lock.tmp");
  await writeFile(tmpPath, topSection);
  const checksum = await $`shasum ${tmpPath}`;
  await $`rm ${tmpPath}`;
  return checksum;
};

export const checkLockfilesAndExit = async ({
  project,
}: {
  project: string;
}) => {
  const basePodfileChecksum = await getPodLockfileStableChecksum();
  const baseGradleChecksum = await $`shasum gradle.lockfile`;

  const podfileChecksum = await getPodLockfileStableChecksum(project);
  const gradleChecksum = await $`shasum android/app/gradle.lockfile`;

  const podfileChecksumMatch = podfileChecksum === basePodfileChecksum;
  const gradleChecksumMatch =
    shasumHash(gradleChecksum) === shasumHash(baseGradleChecksum);

  console.log("New Podfile.lock checksum:", podfileChecksum);
  console.log("Old Podfile.lock checksum:", basePodfileChecksum);
  console.log("New gradle.lockfile checksum:", gradleChecksum);
  console.log("Old gradle.lockfile checksum:", baseGradleChecksum);

  if (podfileChecksumMatch && gradleChecksumMatch) {
    console.log("Checksums match, lockfiles are up to date.");
    process.exit(0);
  } else {
    console.error(
      "Checksums do not match, lockfiles are out of date. Run `yarn native-lock` to update them."
    );
    process.exit(1);
  }
};
