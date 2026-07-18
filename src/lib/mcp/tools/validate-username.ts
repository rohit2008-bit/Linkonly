import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const RESERVED = new Set([
  "admin", "api", "auth", "dashboard", "login", "logout", "signup",
  "settings", "profile", "help", "about", "terms", "privacy", "mcp",
]);

export default defineTool({
  name: "validate_username",
  title: "Validate a LinkHub username",
  description:
    "Check whether a proposed LinkHub username is well-formed (length, allowed characters, not reserved). This is a format check only — it does not verify whether the username is already taken.",
  inputSchema: {
    username: z.string().describe("The proposed username to validate."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ username }) => {
    const trimmed = username.trim();
    const issues: string[] = [];
    if (trimmed.length < 3) issues.push("Must be at least 3 characters.");
    if (trimmed.length > 32) issues.push("Must be at most 32 characters.");
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) issues.push("Only letters, numbers, underscore, and hyphen allowed.");
    if (RESERVED.has(trimmed.toLowerCase())) issues.push("This username is reserved.");
    const valid = issues.length === 0;
    return {
      content: [
        {
          type: "text",
          text: valid ? `"${trimmed}" is a valid username.` : `Invalid: ${issues.join(" ")}`,
        },
      ],
      structuredContent: { valid, username: trimmed, issues },
    };
  },
});
