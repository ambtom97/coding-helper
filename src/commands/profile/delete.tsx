import { Args } from "@oclif/core";
import { Box } from "ink";
import * as profiles from "../../config/profiles.js";
import { BaseCommand } from "../../oclif/base.tsx";
import { Error as ErrorBadge, Success } from "../../ui/index.js";

export default class ProfileDelete extends BaseCommand<typeof ProfileDelete> {
  static description = "Delete a profile";
  static examples = ["<%= config.bin %> profile delete work"];

  static args = {
    name: Args.string({
      description: "Profile name to delete",
      required: true,
    }),
  };

  async run(): Promise<void> {
    const name = this.args.name;

    if (profiles.deleteProfile(name)) {
      await this.renderApp(
        <Box>
          <Success>Profile "{name}" deleted.</Success>
        </Box>
      );
    } else {
      await this.renderApp(
        <Box>
          <ErrorBadge>
            Failed to delete profile "{name}". It may be active or not exist.
          </ErrorBadge>
        </Box>
      );
    }
  }
}
