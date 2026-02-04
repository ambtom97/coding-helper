import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { error, info, section, success, warning } from "../../utils/logger";

export async function handleHooksSetup(): Promise<void> {
  const claudeSettingsPath = path.join(os.homedir(), ".claude");
  const settingsFilePath = path.join(claudeSettingsPath, "settings.json");

  // The hook command - using cohe CLI directly
  // This ensures auto-updates when the cohe package is updated
  const hookCommand = "cohe auto hook --silent";

  try {
    // Read existing settings or create new
    let settings: any = {};
    if (fs.existsSync(settingsFilePath)) {
      const content = fs.readFileSync(settingsFilePath, "utf-8");
      try {
        settings = JSON.parse(content);
      } catch {
        // Invalid JSON, start fresh
        settings = {};
      }
    }

    // Initialize hooks object if it doesn't exist
    if (!settings.hooks) {
      settings.hooks = {};
    }

    // Initialize SessionStart hooks array if it doesn't exist
    if (!settings.hooks.SessionStart) {
      settings.hooks.SessionStart = [];
    }

    // Check if our hook is already installed (either old bash or new cohe command)
    const hookExists = settings.hooks.SessionStart.some((hookConfig: any) => {
      return (
        hookConfig.type === "command" &&
        hookConfig.command &&
        (hookConfig.command === hookCommand ||
          hookConfig.command.includes("auto hook") ||
          hookConfig.command.includes("auto-rotate.sh"))
      );
    });

    if (hookExists) {
      section("Hooks Setup");
      info("Auto-rotate hook is already installed.");
      info(`Hook command: ${hookCommand}`);
      return;
    }

    // Add the hook configuration
    settings.hooks.SessionStart.push({
      matcher: "startup|resume|clear|compact",
      hooks: [
        {
          type: "command",
          command: hookCommand,
        },
      ],
    });

    // Write updated settings
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));

    section("Hooks Setup");
    success("Auto-rotate hook installed successfully!");
    info(`Hook command: ${hookCommand}`);
    info(`Settings location: ${settingsFilePath}`);
    info("");
    info(
      "The hook will automatically rotate your API keys when you start a Claude session."
    );
    info(
      "Uses the cohe CLI directly, so updates to the rotation algorithm are automatically applied."
    );
    info("");
    info("Current configuration:");
    info("  • Rotation: enabled");
    info("  • Strategy: least-used");
    info("");
    info('Run "cohe config" or "cohe auto status" to view or change settings.');
  } catch (err: any) {
    section("Hooks Setup");
    error("Failed to install hooks");
    error(err.message);
  }
}

export async function handleHooksUninstall(): Promise<void> {
  const settingsFilePath = path.join(os.homedir(), ".claude", "settings.json");
  const hooksDir = path.join(os.homedir(), ".claude", "hooks");
  const hookScriptPath = path.join(hooksDir, "auto-rotate.sh");

  try {
    let hookRemoved = false;
    let settingsModified = false;

    // Remove hook script if it exists (legacy)
    if (fs.existsSync(hookScriptPath)) {
      fs.unlinkSync(hookScriptPath);
      hookRemoved = true;
    }

    // Update settings.json to remove hook configuration
    if (fs.existsSync(settingsFilePath)) {
      const content = fs.readFileSync(settingsFilePath, "utf-8");
      let settings: any;

      try {
        settings = JSON.parse(content);
      } catch {
        settings = {};
      }

      if (settings.hooks?.SessionStart) {
        const originalLength = settings.hooks.SessionStart.length;

        // Filter out our auto-rotate hook (either old bash or new cohe command)
        // Each SessionStart entry has a "hooks" array containing the actual hooks
        settings.hooks.SessionStart = settings.hooks.SessionStart.filter(
          (hookGroup: any) => {
            // Check if this hook group contains our hook
            if (!(hookGroup.hooks && Array.isArray(hookGroup.hooks))) {
              return true; // Keep entries that don't have a hooks array
            }

            // Check if any hook in the group is our auto-rotate hook
            const hasOurHook = hookGroup.hooks.some((hookConfig: any) => {
              if (hookConfig.type !== "command") {
                return false;
              }
              if (!hookConfig.command) {
                return false;
              }

              return (
                hookConfig.command === hookScriptPath ||
                hookConfig.command.includes("auto-rotate.sh") ||
                hookConfig.command.includes("auto hook") ||
                hookConfig.command === "cohe auto hook --silent"
              );
            });

            // Filter out the entry if it contains our hook
            return !hasOurHook;
          }
        );

        if (settings.hooks.SessionStart.length !== originalLength) {
          settingsModified = true;

          // Clean up empty SessionStart array
          if (settings.hooks.SessionStart.length === 0) {
            settings.hooks.SessionStart = undefined;

            // Clean up empty hooks object
            if (Object.keys(settings.hooks).length === 0) {
              settings.hooks = undefined;
            }
          }

          // Write updated settings
          fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
        }
      }
    }

    section("Hooks Uninstall");

    if (!(hookRemoved || settingsModified)) {
      info("No auto-rotate hooks found.");
      info("Hooks may have already been removed or were never installed.");
      return;
    }

    success("Auto-rotate hooks removed successfully!");

    if (hookRemoved) {
      info("Removed legacy hook script");
    }
    if (settingsModified) {
      info(`Updated Claude settings: ${settingsFilePath}`);
    }

    info("");
    info(
      "Auto-rotation is no longer automatic. You can still manually rotate with 'cohe auto rotate'."
    );
    info("To re-enable hooks, run 'cohe hooks setup'.");
  } catch (err: any) {
    section("Hooks Uninstall");
    error("Failed to uninstall hooks");
    error(err.message);
  }
}

export async function handleHooksStatus(): Promise<void> {
  const settingsFilePath = path.join(os.homedir(), ".claude", "settings.json");
  const hooksDir = path.join(os.homedir(), ".claude", "hooks");
  const hookScriptPath = path.join(hooksDir, "auto-rotate.sh");

  // Check various status indicators
  const scriptExists = fs.existsSync(hookScriptPath);
  const scriptExecutable =
    scriptExists && (fs.statSync(hookScriptPath).mode & 0o755) !== 0;

  let settingsFound = false;
  let hookRegistered = false;
  let hookCommand = "";
  let rotationEnabled = false;
  let rotationStrategy = "unknown";

  // Check settings.json
  if (fs.existsSync(settingsFilePath)) {
    try {
      const content = fs.readFileSync(settingsFilePath, "utf-8");
      const settings = JSON.parse(content);
      settingsFound = true;

      // Check if hook is registered (either old bash script or new cohe command)
      if (settings.hooks?.SessionStart) {
        hookRegistered = settings.hooks.SessionStart.some((hookGroup: any) => {
          // Each SessionStart entry has a "hooks" array containing the actual hooks
          if (!(hookGroup.hooks && Array.isArray(hookGroup.hooks))) {
            return false;
          }

          return hookGroup.hooks.some((hookConfig: any) => {
            if (hookConfig.type !== "command") {
              return false;
            }
            if (!hookConfig.command) {
              return false;
            }

            const cmd = hookConfig.command;
            // Check if command is our hook (old bash or new cohe command)
            if (
              cmd === hookScriptPath ||
              cmd === `"${hookScriptPath}"` ||
              cmd.includes("auto-rotate.sh") ||
              cmd.includes("auto hook")
            ) {
              hookCommand = cmd;
              return true;
            }
            return false;
          });
        });
      }
    } catch {
      // Invalid JSON
    }
  }

  // Check rotation config
  const configPath = path.join(os.homedir(), ".claude", "imbios.json");
  if (fs.existsSync(configPath)) {
    try {
      const configContent = fs.readFileSync(configPath, "utf-8");
      const config = JSON.parse(configContent);
      rotationEnabled = config.rotation?.enabled ?? false;
      rotationStrategy = config.rotation?.strategy ?? "unknown";
    } catch {
      // Invalid JSON
    }
  }

  // Determine overall status
  // Hook is fully installed if it's registered (we don't need the script anymore)
  const isFullyInstalled = hookRegistered;
  const isPartiallyInstalled = scriptExists || hookRegistered;
  const usesCoheCommand = hookCommand.includes("auto hook");

  section("Hooks Status");

  // Overall Status
  console.log(
    "Overall Status: " +
      (isFullyInstalled
        ? "✓ Installed"
        : isPartiallyInstalled
          ? "⚠ Partially Installed"
          : "✗ Not Installed")
  );

  // Hook Type
  if (hookRegistered) {
    console.log("");
    console.log(
      "Hook Type: " +
        (usesCoheCommand
          ? "✓ CLI Command (auto-updating)"
          : "○ Bash Script (legacy)")
    );
    console.log(`  ${hookCommand}`);
  }

  // Legacy Hook Script
  console.log("");
  console.log(
    "Legacy Hook Script: " +
      (scriptExists
        ? scriptExecutable
          ? "✓ Found"
          : "⚠ Not Executable"
        : "○ Not Found (using CLI command)")
  );
  if (scriptExists) {
    console.log(`  ${hookScriptPath}`);
  }

  // Settings Registration
  console.log("");
  console.log(`Registered in Settings: ${hookRegistered ? "✓ Yes" : "✗ No"}`);
  if (settingsFound && !hookRegistered) {
    console.log(`  ${settingsFilePath}`);
  }

  // Rotation Configuration
  console.log("");
  console.log(`Rotation Enabled: ${rotationEnabled ? "✓ Yes" : "○ No"}`);
  console.log(`Rotation Strategy: ${rotationStrategy}`);

  // Actions
  console.log("");
  if (!isFullyInstalled) {
    warning(
      "Hooks are not fully installed. Run 'cohe hooks setup' to install."
    );
  } else if (rotationEnabled) {
    success(
      "Hooks are installed and rotation is enabled! Auto-rotation will work with both Claude CLI and ACP."
    );
  } else {
    warning(
      "Hooks are installed but rotation is disabled. Enable it with 'cohe auto enable'."
    );
  }

  // Debug Info
  if (process.env.CLAUDE_HOOK_DEBUG) {
    info("");
    info("Debug mode enabled. Check ~/.claude/hooks-debug.log for details.");
  }
}
