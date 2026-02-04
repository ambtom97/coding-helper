export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  models: string[];
}

export interface UsageOptions {
  apiKey?: string;
  groupId?: string; // For MiniMax usage tracking
}

export interface ModelMapping {
  opus: string;
  sonnet: string;
  haiku: string;
}

export interface UsageStats {
  used: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  // For ZAI provider: separate model and MCP usage
  modelUsage?: UsageStats;
  mcpUsage?: UsageStats;
}

export interface Provider {
  name: string;
  displayName: string;
  getConfig(): ProviderConfig;
  getModels(): string[];
  getDefaultModel(type: "opus" | "sonnet" | "haiku"): string;
  testConnection(): Promise<boolean>;
  getUsage(options?: UsageOptions): Promise<UsageStats>;
  getModelMapping(): ModelMapping;
}
