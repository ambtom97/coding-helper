import { Box } from "ink";
import { configureRotation } from "../../config/accounts-config.js";
import { BaseCommand } from "../../oclif/base.tsx";
import { Success } from "../../ui/index.js";

export default class AutoDisable extends BaseCommand<typeof AutoDisable> {
  static description = "Disable auto-rotation";
  static examples = ["<%= config.bin %> auto disable"];

  async run(): Promise<void> {
    configureRotation(false);

    await this.renderApp(
      <Box>
        <Success>Auto-rotation disabled.</Success>
      </Box>
    );
  }
}
