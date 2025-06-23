import ModuleComponent from "./module.vue";

export default {
  id: "ai-agent",
  name: "AI Agent",
  icon: "smart_toy",
  routes: [
    {
      name: "home",
      path: "",
      props: true,
      component: ModuleComponent,
    },
    {
      name: "agent-settings",
      path: "agent-settings",
      props: true,
      component: ModuleComponent,
    },
    {
      name: "chat",
      path: "chat",
      props: true,
      component: ModuleComponent,
    },
  ],
};
