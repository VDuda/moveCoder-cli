export interface EcosystemDriver {
  id: string;
  name: string;
  description: string;
  documentation: {
    sources: string[]; // URLs or Repo paths
    systemPromptExtension: string; // Specific instructions for the AI
  };
  toolchain: {
    buildCommand: string;
    testCommand: string;
    deployCommand: string;
    installCommand?: string;
  };
  errorPatterns: Array<{
    pattern: string; // Regex string
    fixStrategy: string;
  }>;
}
