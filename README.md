# 🤖 AI Agent for Directus

Transform your Directus CMS with intelligent automation, smart data interpretation, and natural language processing.

![Hero Placeholder](./images/hero-placeholder.png)

## ✨ Features

- 💬 **Natural Language Commands**  
  Interact with your Directus CMS using plain English prompts.

- 📊 **Data Insights & Querying**  
  Use AI to **read**, **analyze**, and **summarize** collections, relations, and metadata.

- 🧠 **Semantic Understanding**  
  AI understands schema, relationships, and context — allowing you to **insert**, **update**, and **link** data intelligently.

- ⚙️ **Smart Automation**  
  Automate workflows based on AI decision trees.

- 🔄 **Prompt-to-Action**  
  Instantly convert prompts into structured actions and queries within Directus.

---

## TESTED WITH OPENAI GPT-4o MODEL

AI can make mistakes use it with your own risk.

---

## 🧩 Extension Type

This is a **Bundle Extension** that includes:

- `Module` → Frontend UI (Chat interface, Settings, and Help)
- `Endpoint` → Backend AI agent server (OpenAI / OpenRouter-based)

---

## 📦 Installation

### 1. Install via `npm`

```
npm install directus-extension-ai-agent
```

Or clone manually:

```
git clone https://github.com/uncw3b/directus-extension-ai-agent
```

---

## ⚙️ Configuration

No need for `.env` editing.  
The extension creates a **settings collection** after install.

- Enter your **OpenAI / OpenRouter API key**
- Choose provider (`openai`, `openrouter`, etc.)
- Adjust model, temperature, and stream settings

Settings panel is embedded in the UI.

![Settings Placeholder](./images/settings-placeholder.png)

---

## 🧪 How to Use

Open the **AI Agent** module in Directus. Use prompts like:

- `Show me the total sales from last month`
- `Add a new user named John with role editor`
- `Summarize all feedback from last 7 days`
- `Create 3 product entries with dummy values`
- `What is the average age of users in Germany?`

AI will process the prompt and return or execute it with context awareness.

![Chat UI Placeholder](./images/chat-ui-placeholder.png)

---

## 🔒 Security & Sandbox

- 🛡️ 100% compatible with Directus Cloud sandbox
- ✅ No direct file system access
- ✅ All remote calls routed via sandbox-safe `fetch`
- ✅ Uses `openai` and `openrouter` public endpoints only

---

## 📸 Screenshots

Please include the following (placeholders available):

- Hero section: `images/hero-placeholder.png`
- Settings panel: `images/settings-placeholder.png`
- Chat interface: `images/chat-ui-placeholder.png`

---

## 👨‍💻 About the Developer

This extension is built by [Uncw3b Software](https://uncw3b.com), a boutique AI & Web3 development agency.

- 🌐 Website: [https://uncw3b.com](https://uncw3b.com)
- 💬 Telegram: [https://t.me/cryptoraichu](https://t.me/cryptoraichu)

> Looking for custom AI integrations or Directus development? Reach out to us.

---

## 📄 License

MIT License © [Uncw3b Software](https://uncw3b.com)
