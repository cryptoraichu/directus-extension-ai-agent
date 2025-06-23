import { spawn } from "child_process";
import directusTools from "./directusTools.js";

let openaiClient = null;
let mcpClient = null;
let currentSettings = null;

// OpenAI Client
class OpenAI {
  constructor({ apiKey, baseURL = "https://api.openai.com/v1" }) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async chat(options) {
    const fetch = (await import("node-fetch")).default;
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    return await response.json();
  }
}

// MCP Client Class
class MCPClient {
  constructor() {
    this.nextId = 1;
    this.pendingRequests = new Map();
    this.child = null;
    this.initialized = false;
  }

  async connect(directusUrl, directusToken) {
    return new Promise((resolve, reject) => {
      // Admin token check
      if (!directusToken || directusToken.trim() === "") {
        console.error("❌ Admin token is empty! MCP won't work.");
        reject(new Error("Admin token is required"));
        return;
      }

      const env = {
        ...process.env,
        DIRECTUS_URL: directusUrl,
        DIRECTUS_TOKEN: directusToken,
      };

      console.log(
        `🔧 MCP connecting with URL: ${directusUrl}, Token: ${
          directusToken
            ? "SET (" + directusToken.substring(0, 10) + "...)"
            : "NOT SET"
        }`
      );

      this.child = spawn("npx", ["@directus/content-mcp@latest"], {
        stdio: ["pipe", "pipe", "pipe"],
        env,
        shell: true,
        cwd: process.cwd(),
      });

      let buffer = "";
      let initTimeout;

      this.child.stdout.on("data", (data) => {
        buffer += data.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop();

        lines.forEach((line) => {
          if (line.trim()) {
            try {
              const message = JSON.parse(line);
              console.log("MCP Response:", message);
              this.handleMessage(message);
            } catch (err) {
              console.log("MCP stdout:", line); // For non-JSON outputs
            }
          }
        });
      });

      this.child.stderr.on("data", (data) => {
        const errorMsg = data.toString();
        console.error("MCP stderr:", errorMsg);

        // If there's a fatal error, reject
        if (errorMsg.includes("Fatal error") || errorMsg.includes("ZodError")) {
          clearTimeout(initTimeout);
          reject(new Error("MCP Fatal Error: " + errorMsg));
        }
      });

      this.child.on("error", (error) => {
        console.error("MCP process error:", error);
        clearTimeout(initTimeout);
        reject(error);
      });

      this.child.on("close", (code) => {
        console.log(`MCP process closed with code ${code}`);
        if (code !== 0 && !this.initialized) {
          clearTimeout(initTimeout);
          reject(new Error(`MCP process exited with code ${code}`));
        }
      });

      // Initialize timeout
      initTimeout = setTimeout(async () => {
        try {
          console.log("🚀 Initializing MCP...");
          await this.sendRequest("initialize", {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: {
              name: "directus-extension-ai-agent",
              version: "1.0.0",
            },
          });
          this.initialized = true;
          console.log("✅ MCP initialized successfully");
          resolve();
        } catch (error) {
          console.error("❌ MCP initialization error:", error);
          reject(error);
        }
      }, 3000); // Wait 3 seconds
    });
  }

  async sendRequest(method, params = {}) {
    if (!this.child || !this.child.stdin) {
      throw new Error("MCP client not connected");
    }

    const id = this.nextId++;
    const request = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    console.log("MCP Request:", request);

    return new Promise((resolve, reject) => {
      // Increase timeout to 30 seconds
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        console.error(`❌ MCP Request timeout for ${method}`);
        reject(new Error(`Request timeout for ${method}`));
      }, 30000);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      try {
        this.child.stdin.write(JSON.stringify(request) + "\n");
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  handleMessage(message) {
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject, timeout } = this.pendingRequests.get(message.id);
      clearTimeout(timeout);
      this.pendingRequests.delete(message.id);

      if (message.error) {
        console.error("❌ MCP Error Response:", message.error);
        reject(
          new Error(message.error.message || JSON.stringify(message.error))
        );
      } else {
        resolve(message.result);
      }
    }
  }

  async callTool(name, args) {
    if (!this.initialized) {
      throw new Error("MCP client not initialized");
    }

    console.log(`🔧 Calling tool: ${name} with args:`, args);

    try {
      const result = await this.sendRequest("tools/call", {
        name,
        arguments: args,
      });

      console.log(
        `✅ Tool ${name} result:`,
        JSON.stringify(result).substring(0, 200)
      );
      return result;
    } catch (error) {
      console.error(`❌ Tool ${name} error:`, error.message);
      throw error;
    }
  }

  disconnect() {
    if (this.child) {
      console.log("🔌 Disconnecting MCP");
      this.child.kill();
      this.child = null;
      this.initialized = false;
      this.pendingRequests.clear();
    }
  }
}

// Helper functions
function fixParameters(toolName, args) {
  if (toolName === "read-items" && !args.query) {
    const { collection, ...queryParams } = args;
    return { collection, query: queryParams };
  }
  return args;
}

function processResult(rawResult) {
  try {
    if (rawResult.isError) {
      return {
        success: false,
        error: "Tool failed",
        details: rawResult.content,
      };
    }

    if (rawResult.content && Array.isArray(rawResult.content)) {
      const textContent = rawResult.content.find((c) => c.type === "text");
      if (textContent) {
        const dataMatch = textContent.text.match(/<data>(.*?)<\/data>/s);
        if (dataMatch) {
          try {
            const data = JSON.parse(dataMatch[1]);

            if (Array.isArray(data) && data.length > 0) {
              const firstRecord = data[0];
              const extractedId = firstRecord.id || firstRecord.ID;
              return {
                success: true,
                data: data,
                extracted_id: extractedId,
                message: extractedId
                  ? `ID: ${extractedId} extracted`
                  : "Data retrieved",
              };
            }

            return { success: true, data: data };
          } catch (e) {
            return { success: true, data: textContent.text };
          }
        }
      }
    }

    return { success: true, data: rawResult };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function executeManualToolCall(content) {
  try {
    const readItemsMatch = content.match(
      /read-items.*collection[:\s]*["'](\w+)["']/i
    );
    const createItemMatch = content.match(
      /create-item.*collection[:\s]*["'](\w+)["']/i
    );

    if (readItemsMatch) {
      const collection = readItemsMatch[1];
      console.log(`🔧 Manual read-items: ${collection}`);

      const result = await mcpClient.callTool("read-items", {
        collection,
        query: { sort: ["-id"], limit: 1 },
      });

      return processResult(result);
    }

    if (createItemMatch) {
      console.log(`🔧 Manual create-item detected but needs more params`);
      return { message: "create-item parameters missing" };
    }

    return null;
  } catch (error) {
    console.error("Manual execution error:", error);
    return null;
  }
}

export default (router, { services, getSchema }) => {
  const { CollectionsService, FieldsService, ItemsService } = services;
  let initPromise = null;
  let tableCreated = false; // Flag to create only once

  // Settings loading
  async function loadSettings() {
    try {
      const itemsService = new ItemsService("ai_agent_settings", {
        schema: await getSchema(),
      });

      const settings = await itemsService.readByQuery({ limit: 1 });

      if (settings.length > 0) {
        currentSettings = settings[0];
        console.log("✅ Settings loaded");
        return currentSettings;
      }
    } catch (error) {
      console.log("Settings table doesn't exist, using defaults");
    }

    // Default settings
    currentSettings = {
      directus_url: "http://localhost:8055",
      admin_token: "",
      ai_model: "gpt-3.5-turbo",
      ai_base_url: "https://api.openai.com/v1",
      ai_api_key: "",
    };
    return currentSettings;
  }

  // Table creation - FIXED
  async function createSettingsTable() {
    if (tableCreated) return;

    console.log("🔧 Creating settings table...");

    try {
      // 1. Create collection
      const collectionsService = new CollectionsService({
        schema: await getSchema(),
      });

      await collectionsService.createOne({
        collection: "ai_agent_settings",
        meta: {
          collection: "ai_agent_settings",
          icon: "settings",
          note: "AI Agent settings",
          singleton: true,
        },
        schema: { name: "ai_agent_settings" },
      });
      console.log("✅ Collection created");

      // 2. REFRESH schema - for new collection
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 3. Create FieldsService with FRESH schema
      const freshSchema = await getSchema();
      const fieldsService = new FieldsService({
        schema: freshSchema,
      });

      await fieldsService.createField("ai_agent_settings", {
        field: "directus_url",
        type: "string",
        schema: { default_value: "http://localhost:8055" },
        meta: { interface: "input" },
      });

      await fieldsService.createField("ai_agent_settings", {
        field: "admin_token",
        type: "text",
        meta: { interface: "input" },
      });

      await fieldsService.createField("ai_agent_settings", {
        field: "ai_model",
        type: "string",
        schema: { default_value: "gpt-3.5-turbo" },
        meta: { interface: "input" },
      });

      await fieldsService.createField("ai_agent_settings", {
        field: "ai_api_key",
        type: "string",
        meta: { interface: "input" },
      });

      await fieldsService.createField("ai_agent_settings", {
        field: "ai_base_url",
        type: "string",
        schema: { default_value: "https://api.openai.com/v1" },
        meta: { interface: "input" },
      });

      console.log("✅ Fields created");
      console.log("🎉 Settings table complete!");
      tableCreated = true;
    } catch (error) {
      console.error("❌ Table creation error:", error.message);
      // Continue even if error occurs
    }
  }

  // AUTO CREATE WHEN APP STARTS
  createSettingsTable();

  // MCP connection - Fixed
  async function ensureMCPConnection() {
    await loadSettings();

    // Admin token check
    if (
      !currentSettings.admin_token ||
      currentSettings.admin_token.trim() === ""
    ) {
      throw new Error("Admin token not set! Please go to settings.");
    }

    if (!mcpClient) {
      mcpClient = new MCPClient();
    }

    if (!mcpClient.initialized && !initPromise) {
      console.log("🔄 Starting MCP connection...");
      initPromise = mcpClient.connect(
        currentSettings.directus_url,
        currentSettings.admin_token
      );
    }

    if (initPromise) {
      try {
        await initPromise;
        initPromise = null;
        console.log("✅ MCP connection ready");
      } catch (error) {
        initPromise = null;
        mcpClient = null;
        throw error;
      }
    }
  }

  // API Routes
  router.get("/settings", async (req, res) => {
    try {
      const settings = await loadSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error("Settings error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post("/settings", async (req, res) => {
    try {
      const itemsService = new ItemsService("ai_agent_settings", {
        schema: await getSchema(),
      });

      const existing = await itemsService.readByQuery({ limit: 1 });

      if (existing.length > 0) {
        await itemsService.updateOne(existing[0].id, req.body);
      } else {
        await itemsService.createOne(req.body);
      }

      // Restart MCP
      if (mcpClient?.initialized) {
        mcpClient.disconnect();
        initPromise = null;
      }

      res.json({ success: true, message: "Settings saved" });
    } catch (error) {
      console.error("Save error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Main prompt endpoint
  router.post("/prompt", async (req, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({
          success: false,
          error: "Prompt is required",
        });
      }

      console.log("User Prompt:", prompt);

      // Load settings and start MCP
      await ensureMCPConnection();

      if (!currentSettings.ai_api_key) {
        return res.status(400).json({
          success: false,
          error: "AI API Key is required in settings",
        });
      }

      // Initialize OpenAI client from settings
      openaiClient = new OpenAI({
        apiKey: currentSettings.ai_api_key,
        baseURL: currentSettings.ai_base_url || "https://api.openai.com/v1",
      });

      const systemMessage = {
        role: "system",
        content: `You are a Directus CMS expert. MANDATORY OPERATION ORDER:

1️⃣ read-collections → What collections exist?
2️⃣ read-fields collection="X" → What fields does collection X have?
3️⃣ Perform operation based on fields

🔧 CREATE/UPDATE RULES:
- NEVER guess fields!
- First learn real fields with read-fields
- Only use existing fields
- Always fill mandatory fields

🎯 TOOL ORDER:
❌ WRONG: create-item → error
✅ CORRECT: read-collections → read-fields → create-item

💡 SMART LOGIC:
- "Add new X" → read-fields collection="X" → create-item with real fields
- "Link to latest Y" → read-items collection="Y" → get ID → use in create-item
- "Update Z" → read-fields collection="Z" → update-item

📋 FORMAT:
read-items: {"collection": "X", "query": {"sort": ["-id"], "limit": 1}}
read-fields: {"collection": "X"}

START WITH: read-collections!`,
      };

      let conversation = [systemMessage, { role: "user", content: prompt }];
      let iteration = 0;
      const maxIterations = 10;

      while (iteration < maxIterations) {
        console.log(`\n--- AI Iteration ${iteration + 1} ---`);

        try {
          let completionOptions = {
            model: currentSettings.ai_model,
            messages: conversation,
            temperature: 0.3,
            max_tokens: 2000,
          };

          try {
            completionOptions.tools = directusTools;
            completionOptions.tool_choice = "auto";
          } catch (toolError) {
            console.log("⚠️ Tools not supported, using text-only mode");
            completionOptions.messages.push({
              role: "system",
              content:
                "Tools not supported. Please directly explain what operation you want to perform.",
            });
          }

          const completion = await openaiClient.chat(completionOptions);
          const assistantMessage = completion.choices[0].message;

          console.log(
            "Assistant message:",
            JSON.stringify(assistantMessage, null, 2)
          );
          conversation.push(assistantMessage);

          if (
            assistantMessage.tool_calls &&
            assistantMessage.tool_calls.length > 0
          ) {
            console.log(`🔧 Tool calls: ${assistantMessage.tool_calls.length}`);

            for (const toolCall of assistantMessage.tool_calls) {
              try {
                let args = {};

                if (toolCall.function.arguments) {
                  args = JSON.parse(toolCall.function.arguments);
                }

                console.log(`🚀 Calling: ${toolCall.function.name}`, args);

                args = fixParameters(toolCall.function.name, args);
                const toolResult = await mcpClient.callTool(
                  toolCall.function.name,
                  args
                );
                let processedResult = processResult(toolResult);

                console.log(
                  `✅ Result:`,
                  JSON.stringify(processedResult).substring(0, 300)
                );

                if (processedResult.extracted_id) {
                  conversation.push({
                    role: "system",
                    content: `🎯 ID extracted: ${processedResult.extracted_id} - You can use this in relational fields!`,
                  });
                }

                conversation.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: JSON.stringify(processedResult),
                });
              } catch (error) {
                console.error(`❌ Tool error:`, error.message);
                conversation.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: JSON.stringify({ error: error.message }),
                });
              }
            }

            iteration++;
          } else if (assistantMessage.content) {
            console.log("🎯 Final response:", assistantMessage.content);

            if (
              assistantMessage.content.includes("read-items") ||
              assistantMessage.content.includes("create-item") ||
              assistantMessage.content.includes("read-collections")
            ) {
              console.log(
                "🔍 AI tool request detected, trying manual execution..."
              );

              const manualResult = await executeManualToolCall(
                assistantMessage.content
              );
              if (manualResult) {
                conversation.push({
                  role: "system",
                  content: `Tool result: ${JSON.stringify(manualResult)}`,
                });
                iteration++;
                continue;
              }
            }

            return res.status(200).json({
              success: true,
              response: assistantMessage.content,
              iterations: iteration + 1,
            });
          } else {
            return res.status(200).json({
              success: true,
              response: "Operation completed but result is empty.",
              iterations: iteration + 1,
            });
          }
        } catch (error) {
          console.error("🔥 Error:", error);

          if (
            error.message.includes("tools") ||
            error.message.includes("unmarshal")
          ) {
            console.log("🔄 Tools error, retrying without tools...");

            const fallbackCompletion = await openaiClient.chat({
              model: currentSettings.ai_model,
              messages: conversation,
              temperature: 0.3,
              max_tokens: 2000,
            });

            return res.status(200).json({
              success: true,
              response: fallbackCompletion.choices[0].message.content,
              iterations: iteration + 1,
              note: "Tools not supported, text-only response",
            });
          }

          return res.status(500).json({
            success: false,
            error: error.message,
            iterations: iteration + 1,
          });
        }
      }

      return res.status(200).json({
        success: true,
        response: "Operation completed.",
        iterations: maxIterations,
      });
    } catch (error) {
      console.error("💥 Error:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Health check
  router.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      mcp_connected: mcpClient?.initialized || false,
      settings_loaded: currentSettings ? true : false,
    });
  });
};
