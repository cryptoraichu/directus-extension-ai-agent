<template>
  <div class="home-container">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">AI Agent for Directus</h1>
        <p class="hero-subtitle">
          Transform your Directus CMS with intelligent automation and natural
          language processing
        </p>
        <div class="hero-badge">
          <span class="badge">Powered by Uncw3b Software</span>
        </div>
      </div>
      <div class="hero-visual">
        <div class="ai-icon">🤖</div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="features-section">
      <h2 class="section-title">Key Features</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">💬</div>
          <h3>Natural Language Commands</h3>
          <p>
            Interact with your Directus CMS using plain English. Create, update,
            and query data effortlessly.
          </p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔄</div>
          <h3>Smart Automation</h3>
          <p>
            Automate complex workflows and data operations with intelligent
            AI-powered decision making.
          </p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h3>Real-time Processing</h3>
          <p>
            Get instant responses and execute operations in real-time with
            advanced MCP integration.
          </p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🎯</div>
          <h3>Context-Aware</h3>
          <p>
            AI understands your data structure and relationships for more
            accurate operations.
          </p>
        </div>
      </div>
    </div>

    <!-- Getting Started Section -->
    <div class="getting-started">
      <h2 class="section-title">Getting Started</h2>
      <div class="steps-grid">
        <div class="step-card">
          <div class="step-number">1</div>
          <h4>Configure Settings</h4>
          <p>
            Set up your AI API key and Directus connection in the Settings tab
          </p>
        </div>
        <div class="step-arrow">→</div>
        <div class="step-card">
          <div class="step-number">2</div>
          <h4>Start Chatting</h4>
          <p>
            Use natural language to interact with your data and automate tasks
          </p>
        </div>
        <div class="step-arrow">→</div>
        <div class="step-card">
          <div class="step-number">3</div>
          <h4>Explore & Automate</h4>
          <p>
            Discover powerful automation possibilities and streamline your
            workflow
          </p>
        </div>
      </div>
    </div>

    <!-- About Section -->
    <div class="footer">
      <div class="footer-content">
        <div class="footer-brand">
          <strong>Uncw3b Software</strong>
          <span>AI-powered tools for modern Directus projects</span>
        </div>
        <div class="footer-disclaimer">
          <small>
            This extension is created and maintained by Uncw3b. Visit our
            website for open-source contributions, support, and updates.
          </small>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Home",
};
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* Hero Section */
.hero-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4rem;
  padding: 3rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  color: white;
  padding: 3rem;
}

.hero-content {
  flex: 1;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  line-height: 1.6;
}

.hero-badge {
  margin-top: 1rem;
}

.badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 500;
}

.hero-visual {
  flex: 0 0 auto;
  margin-left: 2rem;
}

.ai-icon {
  font-size: 6rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* Features Section */
.features-section {
  margin-bottom: 4rem;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 3rem;
  color: var(--foreground-normal);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: var(--background-page);
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  border: 1px solid var(--border-color);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--foreground-normal);
}

.feature-card p {
  color: var(--foreground-subdued);
  line-height: 1.6;
}

/* Advanced Solutions Section */
.advanced-section {
  margin-bottom: 4rem;
  background: var(--background-page);
  padding: 3rem;
  border-radius: 16px;
  border: 1px solid var(--border-color);
}

.advanced-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 3rem;
  align-items: start;
}

.advanced-text h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--foreground-normal);
}

.advanced-text p {
  color: var(--foreground-subdued);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.advanced-list {
  list-style: none;
  padding: 0;
}

.advanced-list li {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
  color: var(--foreground-subdued);
  line-height: 1.5;
}

.advanced-list li:last-child {
  border-bottom: none;
}

.contact-card {
  background: linear-gradient(135deg, #6c5ce7 0%, #74b9ff 100%);
  padding: 2rem;
  border-radius: 12px;
  color: white;
  text-align: center;
}

.contact-card h4 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.contact-card p {
  margin-bottom: 1.5rem;
  opacity: 0.9;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.contact-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.contact-icon {
  font-size: 1.1rem;
}

/* Getting Started Section */
.getting-started {
  margin-bottom: 4rem;
}

.steps-grid {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.step-card {
  background: var(--background-page);
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  border: 1px solid var(--border-color);
  min-width: 200px;
  flex: 1;
  max-width: 300px;
}

.step-number {
  width: 40px;
  height: 40px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.25rem;
  margin: 0 auto 1rem;
}

.step-card h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--foreground-normal);
}

.step-card p {
  color: var(--foreground-subdued);
  font-size: 0.9rem;
  line-height: 1.5;
}

.step-arrow {
  font-size: 2rem;
  color: var(--foreground-subdued);
  font-weight: bold;
}

/* Footer */
.footer {
  border-top: 1px solid var(--border-color);
  padding-top: 2rem;
  margin-top: 2rem;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.footer-brand strong {
  color: var(--foreground-normal);
  font-size: 1.1rem;
}

.footer-brand span {
  color: var(--foreground-subdued);
  font-size: 0.9rem;
}

.footer-disclaimer {
  max-width: 400px;
  text-align: right;
}

.footer-disclaimer small {
  color: var(--foreground-subdued);
  font-size: 0.8rem;
  line-height: 1.4;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-section {
    flex-direction: column;
    text-align: center;
  }

  .hero-visual {
    margin-left: 0;
    margin-top: 2rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .advanced-content {
    grid-template-columns: 1fr;
  }

  .steps-grid {
    flex-direction: column;
  }

  .step-arrow {
    transform: rotate(90deg);
  }

  .footer-content {
    flex-direction: column;
    text-align: center;
  }

  .footer-disclaimer {
    text-align: center;
  }
}
</style>
