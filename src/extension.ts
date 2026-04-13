import * as vscode from "vscode";
import { findClaudeCodeInstallations } from "./services/claudeCodeFinder";
import { inject, remove, getStatus } from "./services/fileInjector";

const STATE_KEY = "claude-rtl.enabled";
const VERSION_KEY = "claude-rtl.lastVersion";

let statusBarItem: vscode.StatusBarItem;
let outputChannel: vscode.OutputChannel;

export async function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel("Claude RTL");

  context.subscriptions.push(
    vscode.commands.registerCommand("claude-rtl.enable", () => enableRtl(context)),
    vscode.commands.registerCommand("claude-rtl.disable", () => disableRtl(context))
  );

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  context.subscriptions.push(statusBarItem);

  const isEnabled = context.globalState.get<boolean>(STATE_KEY, true);
  if (isEnabled) {
    await autoInject(context);
  }
  updateStatusBar(isEnabled);
}

export function deactivate() {}

// ── Commands ──

async function enableRtl(context: vscode.ExtensionContext) {
  const installations = await findClaudeCodeInstallations();
  if (installations.length === 0) {
    vscode.window.showWarningMessage("Claude RTL: No Claude Code installations found.");
    return;
  }

  let injected = 0;
  for (const inst of installations) {
    try {
      await inject(inst);
      injected++;
      log(`Injected RTL into ${inst.ide} (v${inst.version})`);
    } catch (err) {
      log(`Failed to inject into ${inst.ide}: ${err}`);
    }
  }

  await context.globalState.update(STATE_KEY, true);
  updateStatusBar(true);

  if (injected > 0) {
    const reload = await vscode.window.showInformationMessage(
      `Claude RTL: Enabled for ${injected} installation(s). Reload window to apply.`,
      "Reload Now"
    );
    if (reload === "Reload Now") {
      vscode.commands.executeCommand("workbench.action.reloadWindow");
    }
  }
}

async function disableRtl(context: vscode.ExtensionContext) {
  const installations = await findClaudeCodeInstallations();
  let removed = 0;

  for (const inst of installations) {
    try {
      await remove(inst);
      removed++;
      log(`Removed RTL from ${inst.ide} (v${inst.version})`);
    } catch (err) {
      log(`Failed to remove from ${inst.ide}: ${err}`);
    }
  }

  await context.globalState.update(STATE_KEY, false);
  updateStatusBar(false);

  if (removed > 0) {
    const reload = await vscode.window.showInformationMessage(
      `Claude RTL: Disabled for ${removed} installation(s). Reload window to apply.`,
      "Reload Now"
    );
    if (reload === "Reload Now") {
      vscode.commands.executeCommand("workbench.action.reloadWindow");
    }
  }
}

// ── Auto-injection ──

async function autoInject(context: vscode.ExtensionContext) {
  const installations = await findClaudeCodeInstallations();
  if (installations.length === 0) return;

  const currentVersions = installations.map((i) => `${i.ide}:${i.version}`).sort().join(",");
  const lastVersions = context.globalState.get<string>(VERSION_KEY, "");
  const needsReinjection = currentVersions !== lastVersions;

  for (const inst of installations) {
    try {
      const status = await getStatus(inst);
      if (!status.cssInjected || !status.jsInjected || needsReinjection) {
        await inject(inst);
        log(`Auto-injected RTL into ${inst.ide} (v${inst.version})`);
      }
    } catch (err) {
      log(`Auto-inject failed for ${inst.ide}: ${err}`);
    }
  }

  if (needsReinjection) {
    const message = lastVersions === ""
      ? "Claude RTL: Installed. Reload window to apply RTL support."
      : "Claude RTL: Claude Code was updated. Reload to re-apply RTL support.";
    const reload = await vscode.window.showInformationMessage(message, "Reload Now");
    if (reload === "Reload Now") {
      vscode.commands.executeCommand("workbench.action.reloadWindow");
    }
  }

  await context.globalState.update(VERSION_KEY, currentVersions);
}

// ── Helpers ──

function updateStatusBar(enabled: boolean) {
  statusBarItem.text = enabled ? "$(arrow-swap) RTL" : "$(arrow-swap) LTR";
  statusBarItem.tooltip = enabled
    ? "Claude RTL: Active (click to disable)"
    : "Claude RTL: Inactive (click to enable)";
  statusBarItem.command = enabled ? "claude-rtl.disable" : "claude-rtl.enable";
  statusBarItem.show();
}

function log(message: string) {
  outputChannel.appendLine(`[${new Date().toISOString()}] ${message}`);
}
