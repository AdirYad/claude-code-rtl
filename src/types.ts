export interface ClaudeCodeInstallation {
  /** Full path to the Claude Code extension directory */
  path: string;
  /** Version string (e.g., "2.1.101") */
  version: string;
  /** IDE name (vscode, cursor, antigravity) */
  ide: string;
}

export interface InjectionStatus {
  /** Whether RTL CSS is currently injected */
  cssInjected: boolean;
  /** Whether RTL JS is currently injected */
  jsInjected: boolean;
  /** Path to the installation */
  installation: ClaudeCodeInstallation;
}
