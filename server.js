import express from "express";
import dotenv from "dotenv";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

dotenv.config();

const {
  TELEGRAM_BOT_TOKEN,
  DEFAULT_CHAT_ID,
  PORT = 3000
} = process.env;

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error("Missing TELEGRAM_BOT_TOKEN in environment variables");
}

const app = express();
app.use(express.json());

const mcpServer = new McpServer({
  name: "telegram-mcp",
  version: "1.0.0"
});

async function sendTelegramMessage({
  chat_id,
  text,
  parse_mode,
  disable_web_page_preview,
  message_thread_id
}) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const payload = {
    chat_id,
    text
  };

  if (parse_mode) payload.parse_mode = parse_mode;
  if (typeof disable_web_page_preview === "boolean") {
    payload.disable_web_page_preview = disable_web_page_preview;
  }
  if (message_thread_id) {
    payload.message_thread_id = message_thread_id;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.description || "Telegram API error");
  }

  return data.result;
}

mcpServer.tool(
  "send_telegram_message",
  {
    chat_id: z.string().optional().describe("Telegram chat_id. If omitted, DEFAULT_CHAT_ID is used."),
    text: z.string().describe("Message text to send to Telegram."),
    parse_mode: z.enum(["Markdown", "HTML"]).optional().describe("Optional Telegram parse mode."),
    disable_web_page_preview: z.boolean().optional().describe("Disable link previews."),
    message_thread_id: z.number().optional().describe("Telegram topic/thread ID for forum chats.")
  },
  async ({ chat_id, text, parse_mode, disable_web_page_preview, message_thread_id }) => {
    const finalChatId = chat_id || DEFAULT_CHAT_ID;

    if (!finalChatId) {
      throw new Error("chat_id is required if DEFAULT_CHAT_ID is not set");
    }

    const result = await sendTelegramMessage({
      chat_id: finalChatId,
      text,
      parse_mode,
      disable_web_page_preview,
      message_thread_id
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ok: true,
              message_id: result.message_id,
              chat_id: result.chat?.id ?? finalChatId,
              date: result.date
            },
            null,
            2
          )
        }
      ]
    };
  }
);

const transports = {};

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  transports[transport.sessionId] = transport;

  res.on("close", () => {
    delete transports[transport.sessionId];
  });

  await mcpServer.connect(transport);
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;

  if (!sessionId || !transports[sessionId]) {
    return res.status(400).json({ error: "Invalid or missing sessionId" });
  }

  const transport = transports[sessionId];
  await transport.handlePostMessage(req, res, req.body);
});

app.listen(PORT, () => {
  console.log(`Telegram MCP server running on port ${PORT}`);
});
