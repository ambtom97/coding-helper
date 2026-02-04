export { confirm } from "./Confirm.js";
export { checkbox } from "./MultiSelect.js";
export { password } from "./PasswordInput.js";
export { select } from "./Select.js";
export { input } from "./TextInput.js";

// Re-export convenience functions for provider and model selection
export async function providerSelection(): Promise<"zai" | "minimax"> {
  const { select } = await import("./Select.js");
  return select("Select API provider:", ["zai", "minimax"] as const, 0);
}

export async function modelSelection(
  models: readonly string[]
): Promise<string> {
  const { select } = await import("./Select.js");
  return select("Select model:", models, 0);
}
