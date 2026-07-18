import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "generate_qr_code_url",
  title: "Generate QR code image URL",
  description:
    "Return a public QR code image URL that encodes the given text or link. Useful for turning a LinkHub profile URL into a shareable/printable QR image.",
  inputSchema: {
    data: z
      .string()
      .trim()
      .min(1)
      .max(2000)
      .describe("The text or URL to encode in the QR code."),
    size: z
      .number()
      .int()
      .min(64)
      .max(1024)
      .optional()
      .describe("Square image size in pixels. Defaults to 512."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: ({ data, size }) => {
    const px = size ?? 512;
    const imageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${px}x${px}&data=${encodeURIComponent(data)}`;
    return {
      content: [{ type: "text", text: imageUrl }],
      structuredContent: { imageUrl, size: px, data },
    };
  },
});
