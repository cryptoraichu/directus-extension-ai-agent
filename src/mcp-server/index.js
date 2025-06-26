import directusTools from "./directusTools.js";
import MCPClient from "./classes/MCPClient.js";
import OpenAI from "./classes/OpenAI.js";
import {
  createSettingsTable,
  executeManualToolCall,
  fixParameters,
  loadSettings,
  processResult,
} from "./functions.js";

export default (router, context) => {
  const { services, getSchema, database } = context;
  const { ItemsService, UtilsService } = services;

  let initPromise = null;
  let tableCreated = false;
  let utils = null;
  let openaiClient = null;
  let mcpClient = null;
  let agentService = null;
  const initializeServices = async () => {
    agentService = new ItemsService("ai_agent_settings", {
      schema: await getSchema(),
    });
    utils = new UtilsService({
      schema: await getSchema(),
      accountability: { role: "admin", admin: true },
    });

    await createSettingsTable(tableCreated, database, utils);
  };

  initializeServices().catch(console.error);

  async function ensureMCPConnection(database, utils) {
    if (!database || !utils) {
      await initializeServices();
    }

    // RAW SQL İLE LOAD ET - ItemsService değil
    let currentSettings = await loadSettings(database); // database parametresi geç

    console.log("🔍 Current settings check:", {
      has_settings: !!currentSettings,
      has_token: !!currentSettings?.admin_token,
      token_length: currentSettings?.admin_token?.length || 0,
    });

    if (
      !currentSettings?.admin_token ||
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

    return currentSettings;
  }

  router.get("/settings", async (req, res) => {
    try {
      if (req.accountability.admin !== true) {
        return res.status(403).json({
          success: false,
          error: "Admin access required to view settings",
        });
      }

      const settings = await loadSettings(database);
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error("Settings error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post("/settings", async (req, res) => {
    try {
      const freshItemsService = new ItemsService("ai_agent_settings", {
        schema: await getSchema(),
        accountability: req.accountability,
      });

      const existing = await freshItemsService.readByQuery({ limit: 1 });

      if (existing.length > 0) {
        await freshItemsService.updateOne(existing[0].id, req.body);
      } else {
        await freshItemsService.createOne(req.body);
      }

      // GLOBAL SETTINGS'İ TEMİZLE - YENİDEN YÜKLENECEK
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

  router.post("/prompt", async (req, res) => {
    if (req.accountability.admin !== true) {
      return res.status(403).json({
        success: false,
        error: "Admin access required to use AI Agent",
      });
    }
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({
          success: false,
          error: "Prompt is required",
        });
      }

      console.log("User Prompt:", prompt);

      let currentSettings = await ensureMCPConnection(database, utils);

      if (!currentSettings) {
        return res.status(500).json({
          success: false,
          error: "Failed to load settings",
        });
      }

      if (!currentSettings.ai_api_key) {
        return res.status(400).json({
          success: false,
          error: "AI API Key is required in settings",
        });
      }

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
};
