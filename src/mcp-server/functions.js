function getDefaultSettings() {
  return {
    directus_url: "http://localhost:8055",
    admin_token: "",
    ai_model: "gpt-3.5-turbo",
    ai_base_url: "https://api.openai.com/v1",
    ai_api_key: "",
  };
}

export async function loadSettings(database) {
  try {
    console.log("🔍 Loading settings with raw SQL...");

    // Tablo var mı kontrol et
    const tableExists = await database.raw(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'ai_agent_settings'
    `);

    if (tableExists[0][0].count === 0) {
      console.log("❌ Table doesn't exist");
      return getDefaultSettings();
    }

    // Raw SQL ile data çek
    const result = await database.raw(
      "SELECT * FROM ai_agent_settings LIMIT 1"
    );

    if (result[0].length > 0) {
      console.log("✅ Settings loaded from database");
      return result[0][0];
    } else {
      console.log("⚠️ Table exists but no data");
      return getDefaultSettings();
    }
  } catch (error) {
    console.error("❌ Settings load error:", error.message);
    return getDefaultSettings();
  }
}

export async function executeManualToolCall(content) {
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

// Helper functions
export function fixParameters(toolName, args) {
  if (toolName === "read-items" && !args.query) {
    const { collection, ...queryParams } = args;
    return { collection, query: queryParams };
  }
  return args;
}

export function processResult(rawResult) {
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

export async function createSettingsTable(tableCreated, database, utils) {
  if (tableCreated) return;

  console.log("🔧 Creating settings table with raw SQL...");

  try {
    const tableExists = await database.raw(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'ai_agent_settings'
      `);

    if (tableExists[0][0].count > 0) {
      console.log("✅ Settings table already exists");
    } else {
      await database.raw(`
          CREATE TABLE IF NOT EXISTS ai_agent_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            directus_url VARCHAR(255),
            admin_token TEXT,
            ai_model VARCHAR(100),
            ai_api_key VARCHAR(255),
            ai_base_url VARCHAR(255)
          )
        `);
      console.log("✅ Table created");
    }

    await database.raw(`
        INSERT IGNORE INTO directus_collections (collection, icon, note, singleton)
        VALUES ('ai_agent_settings', 'settings', 'AI Agent settings', true)
      `);

    const fields = [
      ["id", "primary", "input", 1],
      ["directus_url", null, "input", 2],
      ["admin_token", null, "input", 3],
      ["ai_model", null, "input", 4],
      ["ai_api_key", null, "input", 5],
      ["ai_base_url", null, "input", 6],
    ];

    for (const [field, special, iface, sort] of fields) {
      await database.raw(
        `
          INSERT IGNORE INTO directus_fields (
            collection,
            field,
            special,
            interface,
            options,
            display,
            display_options,
            readonly,
            hidden,
            sort,
            width,
            translations,
            note,
            conditions,
            required,
            \`group\`,
            validation,
            validation_message
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          "ai_agent_settings",
          field,
          special,
          iface,
          null,
          null,
          null,
          false,
          false,
          sort,
          "full",
          null,
          null,
          null,
          false,
          null,
          null,
          null,
        ]
      );
    }

    const existing = await database.raw(
      `SELECT COUNT(*) as count FROM ai_agent_settings`
    );
    if (existing[0][0].count === 0) {
      await database.raw(
        `
          INSERT INTO ai_agent_settings (directus_url, ai_model, ai_base_url)
          VALUES (?, ?, ?)
        `,
        ["http://localhost:8055", "gpt-3.5-turbo", "https://api.openai.com/v1"]
      );
      console.log("✅ Default settings inserted");
    }

    console.log("🎉 Table and Directus metadata setup complete");
    tableCreated = true;
    const result = await utils.clearCache({ system: true });
    console.log(result);
  } catch (e) {
    console.error("❌ Table setup failed:", e);
  }
}
