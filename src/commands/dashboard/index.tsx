import { Box, Text } from "ink";
import * as accountsConfig from "../../config/accounts-config.js";
import { BaseCommand } from "../../oclif/base.tsx";

export default class Dashboard extends BaseCommand<typeof Dashboard> {
  static description = "Web dashboard management";
  static examples = [
    "<%= config.bin %> dashboard start",
    "<%= config.bin %> dashboard status",
    "<%= config.bin %> dashboard stop",
  ];

  async run(): Promise<void> {
    const config = accountsConfig.loadConfigV2();

    if (config.dashboard.enabled) {
      // Dashboard is enabled - show running status
      await this.renderApp(<DashboardRunning port={config.dashboard.port} />);
    } else {
      await this.renderApp(<DashboardHelp />);
    }
  }
}

function DashboardHelp(): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Text bold>ImBIOS Web Dashboard accountsConfig.0</Text>
      <Text />
      <Text>Usage: cohe dashboard &lt;command&gt; [options]</Text>
      <Text />
      <Text bold>Commands:</Text>
      <Text> start [port] Start the web dashboard</Text>
      <Text> stop Stop the dashboard</Text>
      <Text> status Show dashboard configuration</Text>
      <Text />
      <Text bold>Examples:</Text>
      <Text> cohe dashboard start 8080</Text>
      <Text> cohe dashboard status</Text>
      <Text> cohe dashboard stop</Text>
    </Box>
  );
}

function DashboardRunning({ port }: { port: number }): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Text bold color="green">
        Dashboard is running on port {port}
      </Text>
      <Text>Use 'cohe dashboard stop' to stop it.</Text>
    </Box>
  );
}
