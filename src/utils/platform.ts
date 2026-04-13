import * as os from "os";
import * as path from "path";
import { IDE_EXTENSION_DIRS } from "../constants";

export type Platform = "win32" | "darwin" | "linux";

export function getPlatform(): Platform {
  return process.platform as Platform;
}

export function getHomeDir(): string {
  // On Windows via WSL, prefer USERPROFILE
  if (process.platform === "win32" && process.env.USERPROFILE) {
    return process.env.USERPROFILE;
  }
  return os.homedir();
}

/** Get all possible extension directories for the current platform */
export function getExtensionDirs(): string[] {
  const home = getHomeDir();
  const platform = getPlatform();
  const dirs = IDE_EXTENSION_DIRS[platform] || IDE_EXTENSION_DIRS.linux;
  return dirs.map((dir) => path.join(home, dir));
}

/** Extract IDE name from an extension directory path */
export function getIdeName(extDir: string): string {
  if (extDir.includes(".antigravity")) return "antigravity";
  if (extDir.includes(".cursor")) return "cursor";
  return "vscode";
}
