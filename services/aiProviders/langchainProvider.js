const config = require('../../lib/config');

class LangChainProvider {
  constructor() {
    this.name = 'langchain';
  }
  async generate({ prompt, systemPrompt }) {
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
