#!/usr/bin/env bun
/**
 * Example: Using ImBIOS SDK with auto-rotation
 *
 * This example demonstrates how to use the Claude Agent SDK
 * with automatic provider rotation enabled.
 *
 * Usage:
 *   bun run examples/sdk-auto-rotation.ts
 *
 * Prerequisites:
 *   1. Configure accounts: cohe account add
 *   2. Enable auto-rotation: cohe auto enable random --cross-provider
 */

import {
  getActiveCredentials,
  getAutoRotatedEnv,
  performAutoRotation,
  query,
} from "../src/sdk/index.js";

async function main() {
  console.log("=== ImBIOS SDK Auto-Rotation Example ===\n");

  // Show current credentials
  const credentials = getActiveCredentials();
  if (!credentials) {
    console.error("No accounts configured. Run 'cohe config' first.");
    process.exit(1);
  }

  console.log(`Current provider: ${credentials.provider}`);
  console.log(`Account: ${credentials.accountName || "(legacy)"}`);
  console.log(`Model: ${credentials.model}`);
  console.log(`Base URL: ${credentials.baseUrl}`);
  console.log();

  // Demonstrate manual rotation
  console.log("--- Manual Rotation ---");
  const rotation = performAutoRotation();
  console.log(`Rotated: ${rotation.rotated}`);
  console.log(`Previous: ${rotation.previousAccount}`);
  console.log(`Current: ${rotation.currentAccount}`);
  console.log(`Provider: ${rotation.provider}`);
  console.log();

  // Show environment variables
  console.log("--- Environment Variables ---");
  const env = getAutoRotatedEnv(false);
  console.log(
    `ANTHROPIC_AUTH_TOKEN: ${env.ANTHROPIC_AUTH_TOKEN?.slice(0, 10)}...`
  );
  console.log(`ANTHROPIC_BASE_URL: ${env.ANTHROPIC_BASE_URL}`);
  console.log(`ANTHROPIC_MODEL: ${env.ANTHROPIC_MODEL}`);
  console.log();

  // Example query (uncomment to run actual SDK query)
  // Requires Claude Code to be installed

  console.log("--- Running SDK Query ---");
  try {
    for await (const message of query({
      prompt: "What is 2 + 2? Reply with just the number.",
      options: {
        allowedTools: [],
        logRotation: true,
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
      },
    })) {
      if (message.type === "result" && message.subtype === "success") {
        console.log("Result:", message.result);
      }
    }
  } catch (error) {
    console.error("Query failed:", error);
  }

  console.log("=== Example Complete ===");
}

main().catch(console.error);
