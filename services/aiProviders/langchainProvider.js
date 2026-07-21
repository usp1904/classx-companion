const config = require('../../lib/config');
const { Client } = require('langsmith');

// Initialize LangSmith client (if API key is set)
let langsmithClient;
if (process.env.LANGSMITH_API_KEY) {
  langsmithClient = new Client({
    apiKey: process.env.LANGSMITH_API_KEY,
    apiUrl: process.env.LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com',
  });
}

class LangChainProvider {
  constructor() {
    this.name = 'langchain';
  }
  async generate({ prompt, systemPrompt, tier, context }) {
    // Prepare metadata for tracing
    const metadata = {
      ls_provider: 'openrouter',
      ls_model: 'openai/gpt-4o-mini',
      ls_temperature: 0.3,
      ls_system_prompt: systemPrompt || 'You are a Class X IIT-JEE/NEET tutor. Answer simply with real-life examples.',
      ls_tier: tier,
      // context could be large, we'll just log a hash if needed
    };
    // If we have a LangSmith client, wrap the call in a trace
    if (langsmithClient) {
      return langsmithClient.trace(
        'llm',
        async () => {
          return this._callLLM(prompt, systemPrompt);
        },
        {
          name: 'ClassX Tutor LLM Call',
          metadata,
        }
      );
    } else {
      // Fallback to direct call if LangSmith not configured
      return this._callLLM(prompt, systemPrompt);
    }
  }

  async _callLLM(prompt, systemPrompt) {
    try {
      const res = await fetch(`${config.ai.openrouter.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.ai.openrouter.apiKey}`
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt || 'You are a Class X IIT-JEE/NEET tutor. Answer simply with real-life examples.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3
        })
      });
      const data = await res.json();
      return { provider: this.name, text: data.choices?.[0]?.message?.content || 'No response', usedContext: false };
    } catch (err) {
      return { provider: this.name, text: `[LangChain error: ${err.message}]`, usedContext: false };
    }
  }
}

module.exports = { LangChainProvider };
