import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

function stripAssignment(text) {
  const trimmed = text.trim();
  const withoutPrefix = trimmed.replace(/^window\.[A-Z0-9_]+\s*=\s*/i, '');
  return withoutPrefix.replace(/;\s*$/, '');
}

function normalize(value) {
  return String(value).trim().replace(/\s+/g, ' ').toLowerCase();
}

function tokenize(value) {
  return normalize(value)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function jaccard(aTokens, bTokens) {
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  const intersection = [...a].filter((item) => b.has(item)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

function levenshteinRatio(a, b) {
  const left = normalize(a);
  const right = normalize(b);
  if (left === right) {
    return 1;
  }

  const m = left.length;
  const n = right.length;
  if (!m || !n) {
    return 0;
  }

  const prev = Array.from({ length: n + 1 }, (_, i) => i);
  const curr = Array(n + 1).fill(0);

  for (let i = 1; i <= m; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= n; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      );
    }
    for (let j = 0; j <= n; j += 1) {
      prev[j] = curr[j];
    }
  }

  const distance = prev[n];
  return 1 - (distance / Math.max(m, n));
}

function questionSignature(question) {
  return [
    normalize(question.prompt),
    question.options.map((option) => `${normalize(option.id)}:${normalize(option.text)}`).join('|'),
    JSON.stringify((question.answer || []).map(String).sort()),
  ].join('::');
}

function loadQuestions(fileText) {
  return JSON.parse(stripAssignment(fileText));
}

async function loadFileQuestions(filePath) {
  const fileText = await fs.readFile(filePath, 'utf8');
  if (/^window\.[A-Z0-9_]+\s*=\s*\[/.test(fileText.trim())) {
    return loadQuestions(fileText);
  }

  const match = fileText.match(/window\.([A-Z0-9_]+)\s*=\s*/i);
  if (!match) {
    throw new Error(`Could not locate window assignment in ${filePath}`);
  }

  const varName = match[1];
  const context = vm.createContext({ window: {} });
  const script = new vm.Script(fileText, { filename: filePath });
  script.runInContext(context);
  const value = context.window[varName];
  if (!Array.isArray(value)) {
    throw new Error(`Expected ${varName} to be an array in ${filePath}`);
  }
  return value;
}

async function main() {
  const cwd = process.cwd();
  const basePath = path.join(cwd, 'js', 'questions.js');
  const candidatePaths = [
    path.join(cwd, 'js', 'extraQuestions.js'),
    path.join(cwd, 'js', 'extraQuestions2.js'),
  ];

  const [baseQuestions, ...candidateQuestionSets] = await Promise.all([
    loadFileQuestions(basePath),
    ...candidatePaths.map((candidatePath) => loadFileQuestions(candidatePath)),
  ]);

  const candidateQuestions = candidateQuestionSets.flat();

  const baseSeen = new Map();
  for (const question of baseQuestions) {
    baseSeen.set(questionSignature(question), question);
  }

  const candidateSeen = new Map();
  const duplicates = [];
  const nearDuplicates = [];

  for (const question of candidateQuestions) {
    const signature = questionSignature(question);
    if (candidateSeen.has(signature) || baseSeen.has(signature)) {
      duplicates.push(question);
      continue;
    }
    candidateSeen.set(signature, question);
  }

  const baseTokens = baseQuestions.map((question) => ({
    question,
    promptTokens: tokenize(question.prompt),
    signature: questionSignature(question),
  }));

  for (const question of candidateQuestions) {
    const questionSignatureValue = questionSignature(question);
    if (baseSeen.has(questionSignatureValue)) {
      continue;
    }

    const promptTokens = tokenize(question.prompt);
    let best = null;

    for (const base of baseTokens) {
      const promptRatio = levenshteinRatio(question.prompt, base.question.prompt);
      const tokenRatio = jaccard(promptTokens, base.promptTokens);
      const answerOverlap = JSON.stringify((question.answer || []).map(String).sort()) === JSON.stringify((base.question.answer || []).map(String).sort());
      const score = Math.max(promptRatio, tokenRatio);

      if (score >= 0.88 || (score >= 0.72 && answerOverlap)) {
        if (!best || score > best.score) {
          best = { score, base: base.question };
        }
      }
    }

    if (best) {
      nearDuplicates.push({
        question,
        matchedTo: best.base,
        score: best.score,
      });
    }
  }

  console.log(`Base questions: ${baseQuestions.length}`);
  console.log(`Candidate questions: ${candidateQuestions.length}`);
  console.log(`Exact duplicates: ${duplicates.length}`);
  console.log(`Near duplicates: ${nearDuplicates.length}`);

  if (duplicates.length) {
    console.log('\nExact duplicate titles:');
    for (const question of duplicates) {
      console.log(`- ${question.id}: ${question.prompt}`);
    }
  }

  if (nearDuplicates.length) {
    console.log('\nNear duplicates:');
    for (const item of nearDuplicates) {
      console.log(`- ${item.question.id} ~ ${item.matchedTo.id} (${item.score.toFixed(2)})`);
      console.log(`  new: ${item.question.prompt}`);
      console.log(`  old: ${item.matchedTo.prompt}`);
    }
  }

  if (duplicates.length || nearDuplicates.length) {
    process.exitCode = 1;
  }
}

await main();
