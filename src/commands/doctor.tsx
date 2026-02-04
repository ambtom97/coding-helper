import { existsSync } from "node:fs";
import { Spinner } from "@inkjs/ui";
import { Box, useApp } from "ink";
import { useEffect, useState } from "react";
import * as settings from "../config/settings.js";
import { BaseCommand } from "../oclif/base.tsx";
import type { Provider } from "../providers/base.js";
import { minimaxProvider } from "../providers/minimax.js";
import { zaiProvider } from "../providers/zai.js";
import {
  Error as ErrorBadge,
  Info,
  Section,
  Success,
  Warning,
} from "../ui/index.js";

const PROVIDERS: Record<string, () => Provider> = {
  zai: () => zaiProvider,
  minimax: () => minimaxProvider,
};

export default class Doctor extends BaseCommand<typeof Doctor> {
  static description = "Diagnose configuration issues";
  static examples = ["<%= config.bin %> doctor"];

  async run(): Promise<void> {
    const activeProvider = settings.getActiveProvider();
    const provider = PROVIDERS[activeProvider]();
    const config = provider.getConfig();
    const configPath = settings.getConfigPath();

    await this.renderApp(
      <DoctorUI config={config} configPath={configPath} provider={provider} />
    );
  }
}

interface DoctorUIProps {
  provider: Provider;
  config: ReturnType<Provider["getConfig"]>;
  configPath: string;
}

interface CheckResult {
  name: string;
  passed: boolean;
  issue?: string;
}

function DoctorUI({
  provider,
  config,
  configPath,
}: DoctorUIProps): React.ReactElement {
  const { exit } = useApp();
  const [running, setRunning] = useState(true);
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => {
    const runDiagnostics = async () => {
      const results: CheckResult[] = [];
      const foundIssues: string[] = [];

      // Check config file
      const configExists = existsSync(configPath);
      results.push({ name: "Config file exists", passed: configExists });

      // Check API key
      const hasApiKey = Boolean(config.apiKey);
      results.push({ name: "API key configured", passed: hasApiKey });

      // Check connection
      if (hasApiKey) {
        const connected = await provider.testConnection();
        results.push({ name: "API connection", passed: connected });
        if (!connected) {
          foundIssues.push("API connection failed. Check your API key.");
        }
      }

      // Check models
      const hasModels = provider.getModels().length > 0;
      results.push({ name: "Models available", passed: hasModels });

      setChecks(results);
      setIssues(foundIssues);
      setRunning(false);

      // Exit after showing results
      setTimeout(() => exit(), 1000);
    };
    runDiagnostics();
  }, [provider, config, configPath, exit]);

  return (
    <Section title="Diagnostics">
      <Box flexDirection="column">
        {running ? (
          <Spinner label="Running diagnostics..." />
        ) : (
          <>
            {checks.map((check) => (
              <Box key={check.name}>
                {check.passed ? (
                  <Success>{check.name}</Success>
                ) : (
                  <ErrorBadge>{check.name}</ErrorBadge>
                )}
              </Box>
            ))}

            {issues.length > 0 ? (
              <Box flexDirection="column" marginTop={1}>
                <Warning>Issues found:</Warning>
                {issues.map((issue) => (
                  <Box key={issue} paddingLeft={2}>
                    <Info>- {issue}</Info>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box marginTop={1}>
                <Success>All checks passed!</Success>
              </Box>
            )}
          </>
        )}
      </Box>
    </Section>
  );
}
