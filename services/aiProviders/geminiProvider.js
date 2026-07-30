const config = require('../../lib/config');

class GeminiProvider {
  constructor() {
    this.name = 'gemini';
  }

  async generate({ prompt, systemPrompt, tier, context }) {
    const apiKey = process.env.GEMINI_API_KEY || config.ai.aliases.gemini;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY env variable is not set. Please add it to your .env file.');
    }

    // Perform hybrid RAG search to fetch relevant curriculum details
    let ragContext = '';
    try {
      const ragService = require('../../lib/ragService');
      const searchResults = ragService.searchHybrid(prompt);
      if (searchResults.problems && searchResults.problems.length > 0) {
        const details = ragService.getProblemDetails(searchResults.problems[0].id);
        if (details) {
          ragContext = `\n\n[RAG Context - Verified Curriculum Solution]:\n` +
            `Question: ${details.problem.question_text}\n` +
            `Solution Steps:\n` +
            details.steps.map(s => `Step ${s.step_number}: ${s.step_explanation} (${s.step_latex || ''})`).join('\n');
        }
      }
    } catch (e) {
      console.warn('RAG Context retrieval failed, proceeding with prompt only.', e);
    }

    const fullPrompt = `${systemPrompt}${ragContext}\n\nStudent Question: ${prompt}`;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: fullPrompt }] }
          ],
          generationConfig: {
            temperature: 0.3
          }
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API returned status ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini API.';
      return { provider: this.name, text, usedContext: !!ragContext };
    } catch (err) {
      return { provider: this.name, text: `[Gemini API Error: ${err.message}]`, usedContext: false };
    }
  }
}

module.exports = { GeminiProvider };
