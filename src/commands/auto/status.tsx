import { Box } from "ink";
import * as accountsConfig from "../../config/accounts-config.js";
import { BaseCommand } from "../../oclif/base.tsx";
import { Info, Section, Table } from "../../ui/index.js";

export default class AutoStatus extends BaseCommand<typeof AutoStatus> {
  static description = "Show current rotation status";
  static examples = ["<%= config.bin %> auto status"];

  async run(): Promise<void> {
    const config = accountsConfig.loadConfig();
    const activeAccount = accountsConfig.getActiveAccount();

    await this.renderApp(
      <Section title="Auto-Rotation Status">
        <Box flexDirection="column">
          <Table
            data={{
              Enabled: config.rotation.enabled ? "Yes" : "No",
              Strategy: config.rotation.strategy,
              "Cross-provider": config.rotation.crossProvider ? "Yes" : "No",
              "Last rotation": config.rotation.lastRotation || "Never",
            }}
          />
          {activeAccount && (
            <Box marginTop={1}>
              <Info>
                Active account: {activeAccount.name} ({activeAccount.provider})
              </Info>
            </Box>
          )}
        </Box>
      </Section>
    );
  }
}
