import { existsSync } from "fs";
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

export const checkLockfilesAndExit = async () => {
  const basePodfileChecksum = await $`grep 'PODFILE CHECKSUM: ' Podfile.lock`;
  const baseGradleChecksum = await $`shasum gradle.lockfile`;

  const podfileChecksum = await $`grep 'PODFILE CHECKSUM: ' ios/Podfile.lock`;
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
