import { Args } from "@oclif/core";
import { Box } from "ink";
import * as mcp from "../../config/mcp.js";
import { BaseCommand } from "../../oclif/base.tsx";
import { Error as ErrorBadge, Success } from "../../ui/index.js";

export default class McpRemove extends BaseCommand<typeof McpRemove> {
  static description = "Remove an MCP server";
  static examples = ["<%= config.bin %> mcp remove server-name"];

  static args = {
    name: Args.string({
      description: "MCP server name to remove",
      required: true,
    }),
  };

  async run(): Promise<void> {
    const name = this.args.name;

    if (mcp.deleteMcpServer(name)) {
      await this.renderApp(
        <Box>
          <Success>MCP server "{name}" removed.</Success>
        </Box>
      );
    } else {
      await this.renderApp(
        <Box>
          <ErrorBadge>MCP server "{name}" not found.</ErrorBadge>
        </Box>
      );
    }
  }
}
