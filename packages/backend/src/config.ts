import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 3001,
  host: process.env.HOST || '0.0.0.0',

  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: process.env.MODEL_NAME || 'anthropic/claude-opus-4.6',
  },

  // Agent workspace for file operations
  workspaceDir: process.env.WORKSPACE_DIR || './workspace',
} as const;

export function validateConfig(): void {
  if (!config.openrouter.apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is required');
  }
}
