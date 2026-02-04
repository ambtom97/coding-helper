import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { Box, Text } from "ink";
import { BaseCommand } from "../../oclif/base.tsx";
import {
  Error as ErrorBadge,
  Info,
  Section,
  Success,
  Warning,
} from "../../ui/index.js";

export default class HooksStatus extends BaseCommand<typeof HooksStatus> {
  static description = "Check Claude Code hooks installation status";
  static examples = ["<%= config.bin %> hooks status"];

  async run(): Promise<void> {
    const settingsFilePath = path.join(
      os.homedir(),
      ".claude",
      "settings.json"
    );
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
          for (const hookConfig of settings.hooks.SessionStart) {
            if (
              hookConfig.type === "command" &&
              hookConfig.command &&
              (hookConfig.command === hookScriptPath ||
                hookConfig.command.includes("auto-rotate.sh") ||
                hookConfig.command.includes("auto hook"))
            ) {
              hookRegistered = true;
              hookCommand = hookConfig.command;
              break;
            }
          }
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
    // Hook is fully installed if it's registered in settings (we don't need the script anymore)
    const isFullyInstalled = hookRegistered;
    const isPartiallyInstalled = scriptExists || hookRegistered;
    const _usesBashScript = hookCommand.includes("auto-rotate.sh");
    const usesCoheCommand = hookCommand.includes("auto hook");

    await this.renderApp(
      <Section title="Hooks Status">
        <Box flexDirection="column">
          {/* Overall Status */}
          <Box>
            <Text bold>Overall Status: </Text>
            {isFullyInstalled ? (
              <Success inline>Installed</Success>
            ) : isPartiallyInstalled ? (
              <Warning inline>Partially Installed</Warning>
            ) : (
              <ErrorBadge inline>Not Installed</ErrorBadge>
            )}
          </Box>

          {/* Hook Type */}
          {hookRegistered && (
            <Box marginTop={1}>
              <Text bold>Hook Type: </Text>
              {usesCoheCommand ? (
                <Success inline>CLI Command (auto-updating)</Success>
              ) : (
                <Text color="yellow" inline>
                  Bash Script
                </Text>
              )}
            </Box>
          )}

          {/* Hook Script (legacy) */}
          <Box marginTop={1}>
            <Text bold>Legacy Hook Script: </Text>
            {scriptExists ? (
              <Success inline>
                {scriptExecutable ? "Found" : "Not Executable"}
              </Success>
            ) : (
              <Text dimmed inline>
                Not Found (using CLI command)
              </Text>
            )}
          </Box>
          {scriptExists && (
            <Box marginLeft={2}>
              <Text dimmed>{hookScriptPath}</Text>
            </Box>
          )}

          {/* Settings Registration */}
          <Box marginTop={1}>
            <Text bold>Registered in Settings: </Text>
            {hookRegistered ? (
              <Success inline>Yes</Success>
            ) : (
              <ErrorBadge inline>No</ErrorBadge>
            )}
          </Box>
          {hookRegistered && (
            <Box marginLeft={2}>
              <Text dimmed>{hookCommand}</Text>
            </Box>
          )}
          {settingsFound && !hookRegistered && (
            <Box marginLeft={2}>
              <Text dimmed>{settingsFilePath}</Text>
            </Box>
          )}

          {/* Rotation Configuration */}
          <Box marginTop={1}>
            <Text bold>Rotation Enabled: </Text>
            {rotationEnabled ? (
              <Success inline>Yes</Success>
            ) : (
              <Text color="yellow" inline>
                No
              </Text>
            )}
          </Box>

          <Box marginTop={1}>
            <Text bold>Rotation Strategy: </Text>
            <Text color="cyan" inline>
              {rotationStrategy}
            </Text>
          </Box>

          {/* Actions */}
          <Box flexDirection="column" marginTop={2}>
            {!isFullyInstalled && (
              <Warning>
                Hooks are not fully installed. Run "cohe hooks setup" to
                install.
              </Warning>
            )}

            {isFullyInstalled && !rotationEnabled && (
              <Warning>
                Hooks are installed but rotation is disabled. Enable it with
                "cohe auto enable".
              </Warning>
            )}

            {isFullyInstalled && rotationEnabled && (
              <Success>
                Hooks are installed and rotation is enabled! Auto-rotation will
                work with both Claude CLI and ACP.
              </Success>
            )}
          </Box>

          {/* Debug Info */}
          {process.env.CLAUDE_HOOK_DEBUG && (
            <Box flexDirection="column" marginTop={1}>
              <Info>
                Debug mode enabled. Check ~/.claude/hooks-debug.log for details.
              </Info>
            </Box>
          )}
        </Box>
      </Section>
    );
  }
}
