export default // OpenAI Client
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
