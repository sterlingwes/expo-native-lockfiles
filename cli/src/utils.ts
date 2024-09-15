import fs from "fs/promises";
import { exec } from "child_process";
import { createInterface } from "readline";

const coerceValue = (value: any) =>
  typeof value === "string" ? value : JSON.stringify(value);

const interpolate = (strings: TemplateStringsArray, ...values: any[]) =>
  strings.reduce((acc, str, i) => acc + str + coerceValue(values[i] ?? ""), "");

export const $ = (cmd: TemplateStringsArray, ...args: any[]) => {
  const cmdStr = args.length ? interpolate(cmd, ...args) : cmd.join(" ");
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

export const replaceInFile = async ({
  path,
  search,
  replace,
}: {
  path: string;
  search: string;
  replace: string;
}) => {
  const contents = await fs.readFile(path, "utf8");
  const updatedContents = contents.replace(search, replace);
  await fs.writeFile(path, updatedContents);
};
