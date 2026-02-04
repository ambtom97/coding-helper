import { BaseCommand } from "../oclif/base.tsx";
import { handleUsage } from "./index.js";

export default class Usage extends BaseCommand<typeof Usage> {
  static description = "Query quota and usage statistics";
  static examples = [
    "<%= config.bin %> usage",
    "<%= config.bin %> usage --verbose",
  ];

  static flags = {
    verbose: {
      type: "boolean",
      description: "Show detailed usage information",
      default: false,
    },
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Usage);
    await handleUsage(flags.verbose as boolean);
  }
}
