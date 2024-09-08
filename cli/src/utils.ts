import { exec } from "child_process";
import { createInterface } from "readline";

export const $ = (cmd: TemplateStringsArray) => {
  const cmdStr = cmd.join(" ");
  console.log(`exec: ${cmdStr}`);
  return new Promise((resolve, reject) => {
    exec(cmdStr, (err, stdout, stderr) => {
      if (err) {
        console.error(`exec error: ${err}`);
        reject(err);
        return;
      }
      console.log(stdout);
      console.error(stderr);
      resolve(stdout);
    });
  });
};

const rl = createInterface({ input: process.stdin, output: process.stdout });
export const prompt = (query: string) =>
  new Promise((resolve) => rl.question(query, resolve)).then((result) => {
    rl.close();
    return result;
  });

export const linebreak = () => console.log("");

export const shasumHash = (shasumOutput: unknown) => {
  if (typeof shasumOutput !== "string") {
    throw new Error("Unexpected gradle checksum output line");
  }
  // in the form of '<checksum>  gradle.lockfile'
  return shasumOutput.trim().split(/\s+/)[0];
};
