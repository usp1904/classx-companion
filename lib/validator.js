const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv({ allErrors: true, strict: false });
const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'schemas', 'question.schema.json'), 'utf8'));
const validate = ajv.compile(schema);

function validateQuestionMetadata(obj) {
  const valid = validate(obj);
  return { valid, errors: validate.errors };
}

function enforceLaTeX(text) {
  // Very small heuristic check: ensure no "a/b" or "x^2" plaintext patterns remain
  const plaintextFraction = /\b\d+\/\d+\b/;
  const caretPower = /\w\^\d/;
  const plainOperators = /\b\w+\s*[\/=]\s*\w+\b/;

  const issues = [];
  if (plaintextFraction.test(text)) issues.push('Found plaintext fraction like 1/2. Use $\\frac{1}{2}$');
  if (caretPower.test(text)) issues.push('Found caret power like x^2. Use $x^2$');
  if (plainOperators.test(text)) issues.push('Found plaintext operator pattern. Use LaTeX for expressions');

  return { ok: issues.length === 0, issues };
}

function autoConvertLaTeX(text) {
  // Simple auto-conversions: fractions like 1/2 -> $\frac{1}{2}$, powers x^2 -> $x^2$
  let converted = text;
  converted = converted.replace(/\b(\d+)\/(\d+)\b/g, '$\\frac{$1}{$2}$');
  converted = converted.replace(/\b([a-zA-Z])\^(\d+)\b/g, '$$1^$2$');
  const report = enforceLaTeX(converted);
  return { converted, ok: report.ok, issues: report.issues };
}

function curriculumGuard(metadata) {
  const issues = [];
  const validTiers = ['TIER_1_BASIC', 'TIER_2_EXTENDED', 'TIER_3_JEE_NEET_CHALLENGE'];
  if (!metadata || typeof metadata !== 'object') {
    return { ok: false, issues: ['metadata object is required'] };
  }
  if (!metadata.source_exam_origin) issues.push('source_exam_origin is required');
  if (!metadata.academic_source_truth) issues.push('academic_source_truth is required');
  if (!metadata.cognitive_complexity_tier) issues.push('cognitive_complexity_tier is required');
  if (metadata.cognitive_complexity_tier && !validTiers.includes(metadata.cognitive_complexity_tier)) {
    issues.push(`cognitive_complexity_tier must be one of ${validTiers.join(', ')}`);
  }
  if (metadata.source_exam_origin && /board|ncert|rd_sharma|rs_aggarwal/i.test(metadata.source_exam_origin)
      && metadata.cognitive_complexity_tier === 'TIER_3_JEE_NEET_CHALLENGE') {
    issues.push('Board-level sources should use TIER_1_BASIC or TIER_2_EXTENDED for curriculum guard compatibility');
  }
  return { ok: issues.length === 0, issues, metadata };
}

function generateHistoricalPaperTags(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return { ok: false, errors: ['metadata object is required'] };
  }
  const tags = new Set();
  if (metadata.source_exam_origin) tags.add(metadata.source_exam_origin);
  if (metadata.academic_source_truth) tags.add(metadata.academic_source_truth);
  if (metadata.cognitive_complexity_tier) tags.add(metadata.cognitive_complexity_tier);
  if (Array.isArray(metadata.prerequisite_nodes)) {
    metadata.prerequisite_nodes.forEach(node => { if (typeof node === 'string') tags.add(node); });
  }
  if (Array.isArray(metadata.tags)) {
    metadata.tags.forEach(tag => { if (typeof tag === 'string') tags.add(tag); });
  }
  return { ok: true, tags: Array.from(tags) };
}

function formatMath(text) {
  if (typeof text !== 'string') {
    return { ok: false, errors: ['text string required'] };
  }
  const result = autoConvertLaTeX(text);
  return { ok: result.ok, formatted: result.converted, issues: result.issues };
}

function dualModeRouter(payload) {
  const mode = typeof payload?.mode === 'string' ? payload.mode.toUpperCase() : null;
  const prompt = typeof payload?.prompt === 'string' ? payload.prompt : null;
  const errors = [];
  if (!mode) errors.push('mode is required');
  if (!prompt) errors.push('prompt is required');
  if (errors.length) return { ok: false, errors };
  const boardText = `Board-style: ${prompt}`;
  const competitiveText = `Competitive IIT-JEE/NEET style: ${prompt}`;
  if (mode === 'BOARD') return { ok: true, mode, output: boardText };
  if (mode === 'COMPETITIVE') return { ok: true, mode, output: competitiveText };
  if (mode === 'DUAL') return { ok: true, mode, board: boardText, competitive: competitiveText };
  return { ok: false, errors: ['mode must be BOARD, COMPETITIVE, or DUAL'] };
}

module.exports = {
  validateQuestionMetadata,
  enforceLaTeX,
  autoConvertLaTeX,
  curriculumGuard,
  generateHistoricalPaperTags,
  formatMath,
  dualModeRouter
};
