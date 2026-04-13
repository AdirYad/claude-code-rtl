import * as fs from "fs/promises";
import * as path from "path";
import { CLAUDE_CODE_PREFIX } from "../constants";
import { ClaudeCodeInstallation } from "../types";
import { getExtensionDirs, getIdeName } from "../utils/platform";

/**
 * Find all Claude Code installations across VS Code, Cursor, and Antigravity.
 * Returns only the latest version per IDE.
 */
export async function findClaudeCodeInstallations(): Promise<ClaudeCodeInstallation[]> {
  const extensionDirs = getExtensionDirs();
  const allInstallations: ClaudeCodeInstallation[] = [];

  for (const extDir of extensionDirs) {
    try {
      const entries = await fs.readdir(extDir);
      const claudeDirs = entries.filter((e) => e.startsWith(CLAUDE_CODE_PREFIX));

      for (const dir of claudeDirs) {
        const version = dir.replace(CLAUDE_CODE_PREFIX, "").replace(/-.*$/, "");
        const fullPath = path.join(extDir, dir);

        // Verify webview directory exists
        try {
          await fs.access(path.join(fullPath, "webview"));
          allInstallations.push({
            path: fullPath,
            version,
            ide: getIdeName(extDir),
          });
        } catch {
          // No webview dir — skip
        }
      }
    } catch {
      // Directory doesn't exist — skip
    }
  }

  // Keep only the latest version per IDE
  const latestByIde = new Map<string, ClaudeCodeInstallation>();
  for (const inst of allInstallations) {
    const existing = latestByIde.get(inst.ide);
    if (!existing || compareVersions(inst.version, existing.version) > 0) {
      latestByIde.set(inst.ide, inst);
    }
  }

  return Array.from(latestByIde.values());
}

/** Compare semver-like version strings (e.g., "2.1.101" vs "2.1.88") */
function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na !== nb) return na - nb;
  }
  return 0;
}
