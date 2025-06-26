import { spawn } from "child_process";

// MCP Client Class
export default class MCPClient {
  constructor() {
    this.nextId = 1;
    this.pendingRequests = new Map();
    this.child = null;
    this.initialized = false;
    this.connectPromise = null; // CONNECTION PROMISE CACHE
    this.timeout = 60000;
  }

  async connect(directusUrl, directusToken) {
    // EĞER ZATEN CONNECTING İSE, AYNI PROMISE'İ DÖNDER
    if (this.connectPromise) {
      console.log("🔄 Using existing connection promise...");
      return this.connectPromise;
    }

    // EĞER ZATEN CONNECTED İSE, DOĞRUDAN DÖNDER
    if (this.initialized) {
      console.log("✅ Already connected");
      return;
    }

    // CONNECTION PROMISE'İ CACHE'LE
    this.connectPromise = this._doConnect(directusUrl, directusToken);

    try {
      await this.connectPromise;
      this.connectPromise = null; // Başarılı olduğunda temizle
      return;
    } catch (error) {
      this.connectPromise = null; // Hata olduğunda temizle
      this.initialized = false;
      throw error;
    }
  }

  async _doConnect(directusUrl, directusToken) {
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

      // CHILD PROCESS'İ BAŞLAT
      this.child = spawn("npx", ["@directus/content-mcp@latest"], {
        stdio: ["pipe", "pipe", "pipe"],
        env,
        shell: true,
        cwd: process.cwd(),
      });

      let buffer = "";
      let initTimeout;
      let resolved = false; // RESOLVE GUARD

      // STDOUT HANDLER
      this.child.stdout.on("data", (data) => {
        buffer += data.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop();

        lines.forEach((line) => {
          if (line.trim()) {
            try {
              const message = JSON.parse(line);
              console.log("MCP Response:", message);

              // INITIALIZE RESPONSE CHECK
              if (message.id === 1 && message.result && !resolved) {
                clearTimeout(initTimeout);
                this.initialized = true;
                resolved = true;
                console.log("✅ MCP initialized successfully");
                resolve();
              } else {
                this.handleMessage(message);
              }
            } catch (err) {
              console.log("MCP stdout:", line); // For non-JSON outputs
            }
          }
        });
      });

      // STDERR HANDLER
      this.child.stderr.on("data", (data) => {
        const errorMsg = data.toString();
        console.error("MCP stderr:", errorMsg);

        // FATAL ERROR CHECK
        if (
          (errorMsg.includes("Fatal error") || errorMsg.includes("ZodError")) &&
          !resolved
        ) {
          clearTimeout(initTimeout);
          resolved = true;
          reject(new Error("MCP Fatal Error: " + errorMsg));
        }
      });

      // ERROR HANDLER
      this.child.on("error", (error) => {
        console.error("MCP process error:", error);
        if (!resolved) {
          clearTimeout(initTimeout);
          resolved = true;
          reject(error);
        }
      });

      // CLOSE HANDLER
      this.child.on("close", (code) => {
        console.log(`MCP process closed with code ${code}`);
        if (code !== 0 && !this.initialized && !resolved) {
          clearTimeout(initTimeout);
          resolved = true;
          reject(new Error(`MCP process exited with code ${code}`));
        }
      });

      // INITIALIZE AFTER 3 SECONDS
      initTimeout = setTimeout(async () => {
        if (resolved) return; // Already resolved/rejected

        try {
          console.log("🚀 Initializing MCP...");
          await this._sendInitRequest();
        } catch (error) {
          if (!resolved) {
            resolved = true;
            console.error("❌ MCP initialization error:", error);
            reject(error);
          }
        }
      }, 3000);

      // OVERALL TIMEOUT - 60 SECONDS
      setTimeout(() => {
        if (!resolved) {
          clearTimeout(initTimeout);
          resolved = true;
          reject(new Error(`MCP connection timeout after ${this.timeout}ms`));
        }
      }, this.timeout);
    });
  }

  // SEPARATE INIT REQUEST METHOD
  async _sendInitRequest() {
    if (!this.child || !this.child.stdin) {
      throw new Error("MCP child process not ready");
    }

    const request = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "directus-extension-ai-agent",
          version: "1.0.0",
        },
      },
    };

    console.log("MCP Request:", request);

    try {
      this.child.stdin.write(JSON.stringify(request) + "\n");
    } catch (error) {
      throw new Error(`Failed to send init request: ${error.message}`);
    }
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
      // 30 SECOND TIMEOUT FOR REGULAR REQUESTS
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
      this.connectPromise = null; // PROMISE CACHE TEMİZLE
      this.pendingRequests.clear();
    }
  }
}
