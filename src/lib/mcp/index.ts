import { defineMcp } from "@lovable.dev/mcp-js";
import buildProfileUrl from "./tools/build-profile-url";
import generateQr from "./tools/generate-qr";
import validateUsername from "./tools/validate-username";

export default defineMcp({
  name: "linkhub-mcp",
  title: "LinkHub MCP",
  version: "0.1.0",
  instructions:
    "Utility tools for LinkHub, a Linktree-style link-in-bio app. Build a public profile URL from a username, generate a QR code image URL for any link, and validate the format of a proposed username. These tools operate only on inputs the caller provides — they do not read or modify any user account or database.",
  tools: [buildProfileUrl, generateQr, validateUsername],
});
