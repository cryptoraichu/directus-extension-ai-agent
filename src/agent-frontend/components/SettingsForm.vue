<template>
  <div class="settings-container">
    <!-- Status Messages - EN ÜSTTE SABİT -->
    <div class="alert-container">
      <transition name="fade">
        <v-notice
          v-if="message"
          :type="messageType"
          :icon="messageType === 'success' ? 'check_circle' : 'error'"
          class="fixed-alert"
        >
          {{ message }}
        </v-notice>
      </transition>
    </div>

    <div class="settings-sections">
      <!-- Directus Configuration -->
      <div class="settings-section">
        <h2 class="section-title">
          <v-icon name="dns" />
          Directus Configuration
        </h2>
        <div class="section-grid">
          <v-input
            v-model="settings.directus_url"
            label="Directus URL"
            placeholder="http://localhost:8055"
            :disabled="loading"
          />
          <v-input
            v-model="settings.admin_token"
            label="Admin Token"
            placeholder="Enter your admin token"
            type="password"
            :disabled="loading"
          />
        </div>
      </div>

      <!-- AI Configuration -->
      <div class="settings-section">
        <h2 class="section-title">
          <v-icon name="smart_toy" />
          AI Configuration
        </h2>
        <div class="section-grid">
          <v-input
            v-model="settings.ai_api_key"
            label="AI API Key"
            placeholder="Enter your OpenAI API key"
            type="password"
            :disabled="loading"
          />
          <v-input
            v-model="settings.ai_model"
            label="AI Model"
            placeholder="gpt-3.5-turbo, gpt-4, gpt-4-turbo, gpt-4o"
            :disabled="loading"
          />
          <v-input
            v-model="settings.ai_base_url"
            label="AI Base URL"
            placeholder="https://api.openai.com/v1"
            :disabled="loading"
          />
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="settings-actions">
      <v-button
        @click="saveSettings"
        :disabled="loading"
        :loading="loading"
        kind="primary"
        large
      >
        {{ loading ? "Saving..." : "Save Settings" }}
      </v-button>

      <v-button
        @click="loadSettings(true)"
        :disabled="loading"
        kind="secondary"
        large
      >
        <v-icon name="refresh" />
        Reload
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
      loading: false,
      message: "",
      messageType: "success",
      settings: {
        directus_url: "",
        admin_token: "",
        ai_api_key: "",
        ai_model: "gpt-3.5-turbo",
        ai_base_url: "https://api.openai.com/v1",
      },
    };
  },

  methods: {
    async saveSettings() {
      this.loading = true;
      this.message = "";

      try {
        const response = await fetch(
          this.addTokenToURL("/mcp-server/settings"),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(this.settings),
          }
        );

        const data = await response.json();

        if (data.success) {
          this.message = "Settings saved successfully!";
          this.messageType = "success";
        } else {
          this.message = "Error: " + data.error;
          this.messageType = "danger";
        }
      } catch (error) {
        this.message = "Save error: " + error.message;
        this.messageType = "danger";
      } finally {
        this.loading = false;

        // Clear message after 5 seconds
        setTimeout(() => {
          this.message = "";
        }, 5000);
      }
    },

    async loadSettings(showMessage = false) {
      // showMessage parametresi eklendi
      this.loading = true;

      try {
        const response = await fetch(
          this.addTokenToURL("/mcp-server/settings")
        );
        const data = await response.json();

        if (data.success && data.data) {
          this.settings = {
            directus_url: data.data.directus_url || "http://localhost:8055",
            admin_token: data.data.admin_token || "",
            ai_api_key: data.data.ai_api_key || "",
            ai_model: data.data.ai_model || "gpt-3.5-turbo",
            ai_base_url: data.data.ai_base_url || "https://api.openai.com/v1",
          };

          // Sadece showMessage true ise mesaj göster
          if (showMessage) {
            this.message = "Settings loaded successfully!";
            this.messageType = "success";
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error);

        // Hata durumunda her zaman göster
        this.message = "Error loading settings";
        this.messageType = "danger";
      } finally {
        this.loading = false;

        // Mesaj varsa 3 saniye sonra temizle
        if (this.message) {
          setTimeout(() => {
            this.message = "";
          }, 3000);
        }
      }
    },
  },

  async mounted() {
    // İlk yüklemede sessiz yap - showMessage = false
    await this.loadSettings(false);
  },
};
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--content-padding);
}

/* Alert container */
.alert-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  pointer-events: none;
}

.fixed-alert {
  margin: 0 1rem;
  pointer-events: all;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: var(--border-radius);
}

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 2rem;
}

.settings-section {
  background: var(--background-page);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 1.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--font-size-large);
  font-weight: 600;
  color: var(--foreground-normal);
  margin: 0 0 1rem 0;
}

.section-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

.section-grid :deep(.v-input) {
  margin-bottom: 0;
}

.settings-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-start;
  margin-bottom: 2rem;
  padding: 1rem 0;
  border-top: var(--border-width) solid var(--border-color);
  border-bottom: var(--border-width) solid var(--border-color);
}

/* Transition for messages */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Responsive design */
@media (min-width: 600px) {
  .section-grid {
    grid-template-columns: 1fr 1fr;
  }

  .settings-actions {
    justify-content: flex-end;
  }
}

@media (min-width: 768px) {
  .settings-container {
    padding: calc(var(--content-padding) * 2);
  }
}

/* Custom styling for better Directus integration */
.settings-section:hover {
  border-color: var(--border-color-alt);
  transition: border-color 0.2s ease;
}

:deep(.v-input .input) {
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

:deep(.v-input .input:focus) {
  box-shadow: 0 0 0 2px var(--primary-25);
}
</style>
