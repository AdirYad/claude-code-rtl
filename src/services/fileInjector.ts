import * as fs from "fs/promises";
import * as path from "path";
import {
  CSS_MARKER_START,
  CSS_MARKER_END,
  JS_MARKER_START,
  JS_MARKER_END,
  WEBVIEW_CSS,
  WEBVIEW_JS,
} from "../constants";
import { ClaudeCodeInstallation, InjectionStatus } from "../types";
import { generateRtlCss } from "./cssGenerator";
import { generateRtlJs } from "./jsGenerator";

function stripInjection(content: string, startMarker: string, endMarker: string): string {
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) return content;
  const endIdx = content.indexOf(endMarker, startIdx);
  if (endIdx === -1) return content;
  const before = content.substring(0, startIdx).replace(/\n+$/, "");
  const after = content.substring(endIdx + endMarker.length).replace(/^\n+/, "");
  return before + (after ? "\n" + after : "");
}

function hasInjection(content: string, startMarker: string): boolean {
  return content.includes(startMarker);
}

async function safeRead(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return "";
  }
}

/** Inject RTL CSS and JS into a Claude Code installation. */
export async function inject(installation: ClaudeCodeInstallation): Promise<void> {
  const cssPath = path.join(installation.path, WEBVIEW_CSS);
  const jsPath = path.join(installation.path, WEBVIEW_JS);

  const cssContent = await safeRead(cssPath);
  const jsContent = await safeRead(jsPath);

  if (!cssContent || !jsContent) {
    throw new Error(`Webview files not found in ${installation.path}`);
  }

  // Create backups if they don't exist yet
  const cssBak = cssPath + ".claude-rtl.bak";
  const jsBak = jsPath + ".claude-rtl.bak";
  try { await fs.access(cssBak); } catch { await fs.writeFile(cssBak, cssContent, "utf-8"); }
  try { await fs.access(jsBak); } catch { await fs.writeFile(jsBak, jsContent, "utf-8"); }

  // Strip any existing injection, then re-inject cleanly
  let cleanCss = stripInjection(cssContent, CSS_MARKER_START, CSS_MARKER_END);
  let cleanJs = stripInjection(jsContent, JS_MARKER_START, JS_MARKER_END);

  cleanCss = cleanCss.replace(/unicode-bidi:\s*bidi-override[^;]*;/g, "");

  await fs.writeFile(cssPath, cleanCss + "\n" + generateRtlCss(), "utf-8");
  await fs.writeFile(jsPath, cleanJs + "\n" + generateRtlJs(), "utf-8");
}

/** Remove RTL injection, restoring from backup. */
export async function remove(installation: ClaudeCodeInstallation): Promise<void> {
  const cssPath = path.join(installation.path, WEBVIEW_CSS);
  const jsPath = path.join(installation.path, WEBVIEW_JS);
  const cssBak = cssPath + ".claude-rtl.bak";
  const jsBak = jsPath + ".claude-rtl.bak";

  try {
    const bakCss = await fs.readFile(cssBak, "utf-8");
    await fs.writeFile(cssPath, bakCss, "utf-8");
    await fs.unlink(cssBak);
  } catch {
    const cssContent = await safeRead(cssPath);
    if (cssContent) {
      await fs.writeFile(cssPath, stripInjection(cssContent, CSS_MARKER_START, CSS_MARKER_END), "utf-8");
    }
  }

  try {
    const bakJs = await fs.readFile(jsBak, "utf-8");
    await fs.writeFile(jsPath, bakJs, "utf-8");
    await fs.unlink(jsBak);
  } catch {
    const jsContent = await safeRead(jsPath);
    if (jsContent) {
      await fs.writeFile(jsPath, stripInjection(jsContent, JS_MARKER_START, JS_MARKER_END), "utf-8");
    }
  }
}

/** Check injection status. */
export async function getStatus(installation: ClaudeCodeInstallation): Promise<InjectionStatus> {
  const cssContent = await safeRead(path.join(installation.path, WEBVIEW_CSS));
  const jsContent = await safeRead(path.join(installation.path, WEBVIEW_JS));

  return {
    cssInjected: hasInjection(cssContent, CSS_MARKER_START),
    jsInjected: hasInjection(jsContent, JS_MARKER_START),
    installation,
  };
}
