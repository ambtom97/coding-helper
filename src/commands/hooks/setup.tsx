import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { Box, Text } from "ink";
import { BaseCommand } from "../../oclif/base";
import { Error as ErrorBadge, Info, Section, Success } from "../../ui/index";

export default class HooksSetup extends BaseCommand<typeof HooksSetup> {
  static description = "Install Claude Code hooks globally";
  static examples = ["<%= config.bin %> hooks setup"];

  async run(): Promise<void> {
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

      // Check if our hook is already installed
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
        await this.renderApp(
          <Section title="Hooks Setup">
            <Box flexDirection="column">
              <Info>Auto-rotate hook is already installed.</Info>
              <Box marginTop={1}>
                <Text dimmed>Hook command: {hookCommand}</Text>
              </Box>
            </Box>
          </Section>
        );
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

      await this.renderApp(
        <Section title="Hooks Setup">
          <Box flexDirection="column">
            <Success>Auto-rotate hook installed successfully!</Success>
            <Box marginTop={1}>
              <Text dimmed>Hook command: {hookCommand}</Text>
            </Box>
            <Box marginTop={1}>
              <Text dimmed>Settings location: {settingsFilePath}</Text>
            </Box>
            <Box flexDirection="column" marginTop={1}>
              <Info>
                The hook will automatically rotate your API keys when you start
                a Claude session.
              </Info>
              <Info>
                Uses the cohe CLI directly, so updates to the rotation algorithm
                are automatically applied.
              </Info>
            </Box>
            <Box marginTop={1}>
              <Text bold>Current configuration:</Text>
            </Box>
            <Box marginLeft={2}>
              <Text>
                • Rotation:{" "}
                <Text bold color="green">
                  enabled
                </Text>
              </Text>
            </Box>
            <Box marginLeft={2}>
              <Text>
                • Strategy:{" "}
                <Text bold color="cyan">
                  least-used
                </Text>
              </Text>
            </Box>
            <Box marginTop={1}>
              <Text dimmed>
                Run "cohe config" or "cohe auto status" to view or change
                settings.
              </Text>
            </Box>
          </Box>
        </Section>
      );
    } catch (error: any) {
      await this.renderApp(
        <Section title="Hooks Setup">
          <Box flexDirection="column">
            <ErrorBadge>Failed to install hooks</ErrorBadge>
            <Box marginTop={1}>
              <Text color="red">{error.message}</Text>
            </Box>
          </Box>
        </Section>
      );
    }
  }
}
