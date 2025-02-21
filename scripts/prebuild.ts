import { existsSync, lstatSync, readdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const firstDir = path.join(__dirname, "..", "src/canisters");
const secondDirs = readdirSync(firstDir).filter((dir) =>
  lstatSync(path.join(firstDir, dir)).isDirectory()
);
const changeFile = async (fileName: string) => {
  const exists = existsSync(fileName);
  if (!exists) return true;
  let text = await readFile(fileName, { encoding: "utf-8" });
  if (text.includes("host")) return;
  text = `import { host } from "@/utils/env"\n${text}`;
  text = text.replaceAll(
    "...options.agentOptions",
    "...options.agentOptions, host"
  );
  await writeFile(fileName, text);
};
const changeFiles = secondDirs.map((secondDir) =>
  changeFile(path.join(firstDir, secondDir, "index.js"))
);
Promise.all(changeFiles).then(() => {
  console.log("inject success");
});
