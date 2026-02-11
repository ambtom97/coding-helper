import { Args } from "@oclif/core";
import { Box, Text } from "ink";
import type React from "react";
import * as settings from "../config/settings";
import { BaseCommand } from "../oclif/base";
import type { Provider } from "../providers/base";
import { minimaxProvider } from "../providers/minimax";
import { zaiProvider } from "../providers/zai";
import { Error as ErrorBadge, Section } from "../ui/index";

const PROVIDERS: Record<string, () => Provider> = {
  zai: () => zaiProvider,
  minimax: () => minimaxProvider,
};

export default class Models extends BaseCommand<typeof Models> {
  static description = "List available models for a provider";
  static examples = [
    "<%= config.bin %> models",
    "<%= config.bin %> models zai",
    "<%= config.bin %> models minimax",
  ];

  static args = {
    provider: Args.string({
      description: "Provider to list models for (zai or minimax)",
      required: false,
    }),
  };

  async run(): Promise<void> {
    const activeProvider = settings.getActiveProvider();
    const targetProvider = this.args.provider || activeProvider;

    if (!["zai", "minimax"].includes(targetProvider)) {
      await this.renderApp(
        <Box>
          <ErrorBadge>Usage: cohe models [zai|minimax]</ErrorBadge>
        </Box>
      );
      return;
    }

    const provider = PROVIDERS[targetProvider]();
    const mapping = provider.getModelMapping();
    const allModels = provider.getModels();

    await this.renderApp(
      <ModelsUI
        allModels={allModels}
        haiku={mapping.haiku}
        opus={mapping.opus}
        providerName={provider.displayName}
        sonnet={mapping.sonnet}
      />
    );
  }
}

interface ModelsUIProps {
  providerName: string;
  opus: string;
  sonnet: string;
  haiku: string;
  allModels: readonly string[];
}

function ModelsUI({
  providerName,
  opus,
  sonnet,
  haiku,
  allModels,
}: ModelsUIProps): React.ReactElement {
  return (
    <Section title="Available Models">
      <Box flexDirection="column" paddingLeft={2}>
        <Text bold>{providerName}:</Text>
        <Text> Opus: {opus}</Text>
        <Text> Sonnet: {sonnet}</Text>
        <Text> Haiku: {haiku}</Text>
        <Text> All: {allModels.join(", ")}</Text>
      </Box>
    </Section>
  );
}
