#!/usr/bin/env node

/**
 * Test LLM Text Cleanup
 *
 * Tests various transcription scenarios to validate cleanup behavior
 */

const ollama = require('ollama').default;

const SYSTEM_PROMPT = `You are a text formatting tool in an audio transcription pipeline. The text you receive is already transcribed speech from Whisper. Your ONLY job is to output a cleaned version.

CRITICAL: You MUST output text based on the input. DO NOT respond conversationally. DO NOT say things like "I'll wait" or "Go ahead". Just output the cleaned text.

WHAT TO FIX:
- Fix awkward repetitions (e.g., "so so" → "so", "gonna gonna" → "gonna", "if if" → "if")
- Clean up restarts and false starts (e.g., "I want to I need to" → "I need to")
- Remove excessive filler words when they disrupt flow ("you know", "like", "um")
- Format lists properly (add colons, bullets, or line breaks where appropriate)
- Fix obvious typos/transcription errors (e.g., "yhis" → "this")

WHAT TO PRESERVE:
- ALL introductory phrases and context (e.g., "I have a to-do list", "So I have a list of cars")
- The complete sentence structure and meaning
- Natural conversational flow - only remove fillers when excessive

EXAMPLES:
Input: "I have a to-do list, clean bathroom, clean kitchen"
Output: "I have a to-do list: clean bathroom, clean kitchen."

Input: "so so I'm gonna gonna go"
Output: "So I'm gonna go."

Input: "This is already clean."
Output: "This is already clean."

RULES:
- Output ONLY the cleaned text
- NO explanations or commentary
- NO conversational responses
- If the text is already clean, output it unchanged`;

const TEST_CASES = [
  {
    name: 'Simple list with context',
    input: "So I have a list of cars, Honda's, Toyota's, BMW's. and CNS.",
  },
  {
    name: 'To-do list incomplete',
    input: 'I have a to-do list, clean the bathroom, clean the kitchen, clean the living room.',
  },
  {
    name: 'Simple sentence',
    input: 'hello yhis is a tst',
  },
  {
    name: 'Already clean',
    input: 'This is already clean.',
  },
  {
    name: 'List with numbers',
    input: 'my grocery list apples 3 bananas 5 milk 2 gallons',
  },
  {
    name: 'Run-on sentence',
    input: 'i need to call john then email sarah and finally submit the report',
  },
  {
    name: 'Multiple sentences',
    input: 'the meeting is tomorrow we should prepare the slides john will present',
  },
  {
    name: 'Stream of consciousness with restarts',
    input:
      "the thing is the thing is we need to finish this project by Friday so we should probably you know start working on it like today or tomorrow at the latest I mean we could wait but that's probably not a good idea",
  },
  {
    name: 'Mid-sentence corrections',
    input:
      "I want to I need to call my mom and then or actually first I should email her because she doesn't always answer the phone you know what I mean so yeah email first then call",
  },
  {
    name: 'Repeated words and phrases',
    input:
      "so so I'm gonna gonna go to the meeting and and present the slides but but I'm not sure if if they're ready yet like are they ready I don't know I don't know",
  },
];

function validateCleanup(original, cleaned) {
  const issues = [];

  // Check length ratio
  const lengthRatio = cleaned.length / original.length;
  if (lengthRatio < 0.5 || lengthRatio > 2.0) {
    issues.push(`Length ratio ${lengthRatio.toFixed(2)} outside bounds [0.5, 2.0]`);
  }

  // Check numbers are preserved
  const originalNumbers = original.match(/\d+/g) || [];
  const cleanedNumbers = cleaned.match(/\d+/g) || [];
  if (originalNumbers.length !== cleanedNumbers.length) {
    issues.push(`Number count mismatch: ${originalNumbers.length} -> ${cleanedNumbers.length}`);
  } else {
    for (let i = 0; i < originalNumbers.length; i++) {
      if (originalNumbers[i] !== cleanedNumbers[i]) {
        issues.push(`Number changed: ${originalNumbers[i]} -> ${cleanedNumbers[i]}`);
      }
    }
  }

  // Check for common explanation phrases (warnings, not failures)
  const explanationPhrases = ['here is', 'here are', 'corrected text', 'cleaned text'];
  const cleanedLower = cleaned.toLowerCase();
  for (const phrase of explanationPhrases) {
    if (cleanedLower.includes(phrase)) {
      issues.push(`⚠️  Contains explanation phrase: "${phrase}"`);
    }
  }

  return issues;
}

async function testCleanup(testCase) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📝 ${testCase.name}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Input:  "${testCase.input}"`);

  try {
    const response = await ollama.generate({
      model: 'llama3.1:8b',
      prompt: testCase.input,
      system: SYSTEM_PROMPT,
    });

    const cleaned = response.response.trim();
    console.log(`Output: "${cleaned}"`);

    // Validate
    const issues = validateCleanup(testCase.input, cleaned);

    if (issues.length > 0) {
      console.log(`⚠️  Validation warnings:`);
      issues.forEach((issue) => console.log(`   - ${issue}`));
    }

    return {
      passed: issues.length === 0,
      issues,
      output: cleaned,
    };
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return {
      passed: false,
      issues: [error.message],
      output: null,
    };
  }
}

async function main() {
  console.log('🧪 LLM Text Cleanup Test Suite');
  console.log('Testing model: llama3.1:8b via Ollama\n');

  const results = [];

  for (const testCase of TEST_CASES) {
    const result = await testCleanup(testCase);
    results.push(result);
  }

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 SUMMARY');
  console.log(`${'='.repeat(80)}`);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total tests: ${TEST_CASES.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success rate: ${((passed / TEST_CASES.length) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n💡 Tip: If many tests fail, consider adjusting the system prompt');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
