import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "build_profile_url",
  title: "Build LinkHub profile URL",
  description:
    "Given a LinkHub username, return the public profile URL a visitor can open to see that user's links.",
  inputSchema: {
    username: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .regex(/^[a-zA-Z0-9_-]+$/, "Letters, numbers, underscore, or hyphen only.")
      .describe("The LinkHub username (the slug after the domain)."),
    baseUrl: z
      .string()
      .url()
      .optional()
      .describe("Optional base URL to build against. Defaults to https://linkhub.app."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ username, baseUrl }) => {
    const base = (baseUrl ?? "https://linkhub.app").replace(/\/+$/, "");
    const url = `${base}/${username}`;
    return {
      content: [{ type: "text", text: url }],
      structuredContent: { url, username },
    };
  },
});
