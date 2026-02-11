import { Box, Text } from "ink";
import { BaseCommand } from "../../oclif/base";

export default class Mcp extends BaseCommand<typeof Mcp> {
  static description = "MCP server management";
  static examples = [
    "<%= config.bin %> mcp list",
    "<%= config.bin %> mcp add",
    "<%= config.bin %> mcp enable server-name",
  ];

  async run(): Promise<void> {
    await this.renderApp(<McpHelp />);
  }
}

function McpHelp(): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Text bold>COHE MCP Server Management v2.0.0</Text>
      <Text />
      <Text>Usage: cohe mcp &lt;command&gt; [options]</Text>
      <Text />
      <Text bold>Commands:</Text>
      <Text> list List all configured MCP servers</Text>
      <Text> add Add a new MCP server</Text>
      <Text> remove &lt;name&gt; Remove an MCP server</Text>
      <Text> enable &lt;name&gt; Enable an MCP server</Text>
      <Text> disable &lt;name&gt; Disable an MCP server</Text>
      <Text>
        {" "}
        add-predefined &lt;p&gt; Add predefined servers (zai|minimax)
      </Text>
      <Text> export [env|claude] Export configuration</Text>
      <Text> test &lt;name&gt; Test an MCP server connection</Text>
      <Text />
      <Text bold>Examples:</Text>
      <Text> cohe mcp list</Text>
      <Text> cohe mcp add</Text>
      <Text> cohe mcp enable zai-vision</Text>
      <Text> cohe mcp add-predefined zai</Text>
      <Text> eval "$(cohe mcp export env)"</Text>
    </Box>
  );
}
