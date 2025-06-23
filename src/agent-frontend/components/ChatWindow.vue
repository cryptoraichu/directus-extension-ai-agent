<template>
  <div class="chat-container">
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="messages.length === 0" class="empty-state">
        <v-icon name="smart_toy" large />
        <div class="empty-title">Welcome to AI Assistant</div>
        <div class="empty-text">
          Ask questions about your Directus database. The AI Assistant will help
          you manage collections and data.
        </div>
      </div>

      <div
        v-for="msg in messages"
        :key="msg.id"
        class="message-wrapper"
        :class="msg.sender"
      >
        <div class="message-bubble">
          <div class="message-content" v-html="formatMessage(msg.text)"></div>
          <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
        </div>
      </div>

      <div v-if="loading" class="message-wrapper ai typing">
        <div class="message-bubble">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="message-content">AI is thinking...</div>
        </div>
      </div>
    </div>

    <div class="chat-input">
      <v-textarea
        v-model="inputText"
        placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
        :disabled="loading"
        @keydown="handleKeyDown"
        rows="1"
        auto-expand
      />
      <v-button
        @click="sendMessage"
        :disabled="loading || !inputTextTrimmed"
        :loading="loading"
        icon
      >
        <v-icon name="send" />
      </v-button>
    </div>
  </div>
</template>

<script>
import { useApi } from "@directus/extensions-sdk";
import useDirectusToken from "../use-directus-token.js";

export default {
  setup() {
    const api = useApi();
    const { addTokenToURL } = useDirectusToken(api);

    return { api, addTokenToURL };
  },

  data() {
    return {
      messages: [],
      inputText: "",
      loading: false,
    };
  },

  computed: {
    // InputText'in trim edilmiş halini computed olarak tanımla
    inputTextTrimmed() {
      return this.inputText ? this.inputText.trim() : "";
    },
  },

  methods: {
    async sendMessage() {
      if (!this.inputTextTrimmed || this.loading) return;

      const userMessage = {
        id: Date.now(),
        text: this.inputTextTrimmed,
        sender: "user",
        timestamp: new Date(),
      };

      this.messages.push(userMessage);
      const prompt = this.inputTextTrimmed;
      this.inputText = "";
      this.loading = true;

      try {
        // AI prompt gönder
        const response = await fetch(this.addTokenToURL("/mcp-server/prompt"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        });

        const data = await response.json();

        const aiMessage = {
          id: Date.now() + 1,
          text: data.success
            ? data.response
            : `Error: ${data.error || "Unknown error"}`,
          sender: "ai",
          timestamp: new Date(),
        };

        this.messages.push(aiMessage);
      } catch (error) {
        const errorMessage = {
          id: Date.now() + 1,
          text: `Connection error: ${error.message}`,
          sender: "ai",
          timestamp: new Date(),
        };
        this.messages.push(errorMessage);
      } finally {
        this.loading = false;
        this.scrollToBottom();
      }
    },

    handleKeyDown(event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        this.sendMessage();
      }
    },

    clearChat() {
      this.messages = [];
    },

    formatMessage(text) {
      if (!text) return "";

      // Markdown-style formatting
      return text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`(.*?)`/g, "<code>$1</code>")
        .replace(/\n/g, "<br>");
    },

    formatTime(timestamp) {
      if (!timestamp) return "";
      return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(timestamp);
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    },
  },

  updated() {
    this.scrollToBottom();
  },
};
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
  max-height: 800px;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  background-color: var(--background-page);
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--content-padding);
  border-bottom: var(--border-width) solid var(--border-color);
  background-color: var(--background-normal);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--content-padding);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--foreground-subdued);
  gap: 12px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--foreground-normal);
}

.empty-text {
  max-width: 400px;
  line-height: 1.5;
}

.message-wrapper {
  display: flex;
  max-width: 80%;
}

.message-wrapper.user {
  align-self: flex-end;
  justify-content: flex-end;
}

.message-wrapper.ai {
  align-self: flex-start;
  justify-content: flex-start;
}

.message-bubble {
  background-color: var(--primary);
  color: var(--primary-foreground);
  border-radius: 20px; /* Daha oval şekil */
  padding: 14px 18px; /* Biraz daha geniş padding */
  border: var(--border-width) solid var(--primary);
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* Hafif gölge */
}

/* User ve AI mesajları aynı stil */
.message-wrapper.user .message-bubble {
  background-color: var(--primary);
  color: var(--primary-foreground);
  border-color: var(--primary);
  border-radius: 20px 20px 4px 20px; /* Sağ alt köşe kesik */
}

.message-wrapper.ai .message-bubble {
  background-color: var(--primary);
  color: var(--primary-foreground);
  border-color: var(--primary);
  border-radius: 20px 20px 20px 4px; /* Sol alt köşe kesik */
  opacity: 0.9; /* AI mesajları biraz daha şeffaf */
}

.message-content {
  word-wrap: break-word;
  line-height: 1.5;
}

.message-content :deep(code) {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 3px 8px;
  border-radius: 8px;
  font-family: var(--family-monospace);
  font-size: 0.9em;
}

.message-content :deep(strong) {
  font-weight: 600;
}

.message-time {
  font-size: 11px;
  color: var(--primary-foreground);
  opacity: 0.7;
  margin-top: 6px;
  text-align: right;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--primary-foreground);
  opacity: 0.7;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0.3;
  }
  40% {
    transform: scale(1);
    opacity: 0.8;
  }
}

.chat-input {
  display: flex;
  gap: 12px;
  padding: var(--content-padding);
  border-top: var(--border-width) solid var(--border-color);
  background-color: var(--background-normal);
  align-items: flex-end;
}

.chat-input :deep(.v-textarea) {
  flex: 1;
}

/* Scrollbar styling */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: var(--background-normal);
}

.chat-messages::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: var(--foreground-subdued);
}
</style>
