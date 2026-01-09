export async function generateCode(prompt: string): Promise<string> {
  console.log(`[AI] (MOCKED) Generating code for: ${prompt}`);
  return "TESTING AI CODING";
}

export async function editCode(instruction: string, currentCode: string): Promise<string> {
  console.log(`[AI] (MOCKED) Editing code with instruction: ${instruction}`);
  return `${currentCode}\n// MOCKED EDIT: ${instruction}`;
}
