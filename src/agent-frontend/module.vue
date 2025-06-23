<template>
  <private-view :title="pageTitle">
    <template #navigation>
      <!-- Yan Menü -->
      <v-list nav>
        <v-list-item to="/ai-agent/" :active="isActiveRoute('home')">
          <v-list-item-icon>
            <v-icon name="home" />
          </v-list-item-icon>
          <v-list-item-content>
            <v-text-overflow text="Home" />
          </v-list-item-content>
        </v-list-item>
        <v-list-item
          to="/ai-agent/agent-settings"
          :active="isActiveRoute('agent-settings')"
        >
          <v-list-item-icon>
            <v-icon name="settings" />
          </v-list-item-icon>
          <v-list-item-content>
            <v-text-overflow text="Settings" />
          </v-list-item-content>
        </v-list-item>
        <v-list-item to="/ai-agent/chat" :active="isActiveRoute('chat')">
          <v-list-item-icon>
            <v-icon name="chat" />
          </v-list-item-icon>
          <v-list-item-content>
            <v-text-overflow text="Chat" />
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </template>

    <div class="module-content">
      <component :is="currentPageComponent" v-if="currentPageComponent" />
      <div v-else class="default-content">
        <div class="type-title">AI Agent</div>
        <p>Please select a page from the side menu.</p>
      </div>
    </div>
  </private-view>
</template>

<script>
import SettingsForm from "./components/SettingsForm.vue";
import ChatWindow from "./components/ChatWindow.vue";
import Home from "./components/Home.vue";

export default {
  props: {
    page: {
      type: String,
      default: "home",
    },
  },
  computed: {
    pageTitle() {
      const currentRoute = this.getCurrentRoute();

      switch (currentRoute) {
        case "home":
          return "AI Agent - Home";
        case "agent-settings":
          return "AI Agent - Settings";
        case "chat":
          return "AI Agent - Chat";
        default:
          return "AI Agent";
      }
    },
    currentPageComponent() {
      const currentRoute = this.getCurrentRoute();

      console.log("Current route determined as:", currentRoute);

      switch (currentRoute) {
        case "agent-settings":
          return SettingsForm;
        case "chat":
          return ChatWindow;
        case "home":
        default:
          return Home;
      }
    },
  },
  methods: {
    getCurrentRoute() {
      // Path'e göre route'u belirle
      const path = this.$route.path;

      console.log("Current path:", path);
      console.log("Page prop:", this.page);

      if (path.includes("/agent-settings")) {
        return "agent-settings";
      } else if (path.includes("/chat")) {
        return "chat";
      } else if (
        path === "/ai-agent/" ||
        path === "/ai-agent" ||
        this.page === "home" ||
        this.page === ""
      ) {
        return "home";
      }

      // Fallback - page prop'a bak
      return this.page || "home";
    },

    isActiveRoute(routeName) {
      return this.getCurrentRoute() === routeName;
    },
  },
};
</script>

<style scoped>
.module-content {
  padding: 0;
}

.default-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  color: var(--foreground-subdued);
}

.default-content .type-title {
  margin-bottom: 12px;
  color: var(--foreground-normal);
}
</style>
