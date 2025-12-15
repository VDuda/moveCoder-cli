import OpenAI from 'openai';
import { CONFIG } from './config.js';

// Initialize OpenAI client for Grok (or other compatible APIs)
// Defaults to looking for GROK_API_KEY or OPENAI_API_KEY
const apiKey = process.env.GROK_API_KEY || process.env.OPENAI_API_KEY;

// Base configuration for Grok (xAI) or fallback
const baseURL = process.env.GROK_API_KEY ? 'https://api.x.ai/v1' : undefined;

const client = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
});

const MOVE_SYSTEM_PROMPT = `
You are MoveCoder, an expert smart contract developer for the Movement Network. 
The Movement Network is a high-performance Layer 1 blockchain powered by the MoveVM.

Your goal is to generate safe, idiomatic, and compilable Move code based on user prompts.

Guidelines:
1. **Safety First:** Always prioritize resource safety. Use strictly typed resources for assets.
2. **Idiomatic Move:** Use standard patterns for initialization, error handling, and capability management.
3. **Movement Specifics:** When applicable, use Movement Network specific standard libraries or frameworks if mentioned in the prompt.
4. **Completeness:** Generate full modules including imports (use 'use' syntax), struct definitions, and public/entry functions.
5. **Comments:** Add brief comments explaining key logic, especially for resource transfers and access control.

Output Format:
Return ONLY the Move code block. Do not wrap it in markdown code fences (\`\\]) unless specifically asked.
`;

export async function generateCode(prompt: string): Promise<string> {
  if (!apiKey) {
    throw new Error('API Key not found. Please set GROK_API_KEY or OPENAI_API_KEY in your .env file.');
  }

  console.log(`[AI] sending request to ${CONFIG.defaultModel} model...`);

  try {
    const completion = await client.chat.completions.create({
      model: 'grok-beta', // Or 'grok-2' depending on availability, using a safe default for now
      messages: [
        { role: 'system', content: MOVE_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2, // Low temperature for code precision
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Received empty response from AI provider.');
    }

    return content;
  } catch (error: any) {
    console.error('[AI] Generation failed:', error.message);
    throw error;
  }
}
