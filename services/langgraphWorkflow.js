const config = require('../lib/config');

async function callModel(messages) {
  const res = await fetch(`${config.ai.openrouter.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.ai.openrouter.apiKey}`
    },
    body: JSON.stringify({ model: 'openai/gpt-4o-mini', messages, temperature: 0.3 })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function tutorNode(state) {
  const content = await callModel([
    { role: 'system', content: `You are a friendly Class X tutor. Explain: ${state.question}. Mode: ${state.mode || 'DUAL'}. Give step-by-step.` },
    { role: 'user', content: state.question }
  ]);
  return { ...state, tutorOutput: content, iterations: (state.iterations||0) + 1 };
}

async function evaluateNode(state) {
  if (!state.studentAnswer) return { ...state, needsHint: true };
  const content = await callModel([
    { role: 'system', content: 'Evaluate this answer. Score 0-1. Identify weak concepts. Be brief.' },
    { role: 'user', content: `Q: ${state.question}\nA: ${state.studentAnswer}` }
  ]);
  return { ...state, evaluation: content, needsHint: false, iterations: (state.iterations||0) + 1 };
}

async function hintNode(state) {
  const content = await callModel([
    { role: 'system', content: 'Give a single hint (not the answer) for this problem. Use a real-life analogy.' },
    { role: 'user', content: state.question }
  ]);
  return { ...state, hint: content, iterations: (state.iterations||0) + 1 };
}

async function runTutorWorkflow({ question, studentAnswer, mode }) {
  let state = { question, studentAnswer: studentAnswer || null, mode: mode || 'DUAL', iterations: 0, needsHint: !studentAnswer, tutorOutput: null, evaluation: null, hint: null };

  state = await tutorNode(state);
  if (state.iterations >= 3) return state;

  if (!state.studentAnswer || state.needsHint) {
    state = await hintNode(state);
    if (state.iterations >= 3) return state;
  }

  if (state.studentAnswer && !state.needsHint) {
    state = await evaluateNode(state);
  }

  return state;
}

module.exports = { runTutorWorkflow };
