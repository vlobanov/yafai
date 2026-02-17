import { MemorySaver } from '@langchain/langgraph-checkpoint';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { config } from '../config.js';
import { systemPrompt } from './prompts.js';
import {
  createCreateSlideTool,
  createListComponentsTool,
  createListSlidesTool,
  createRegisterComponentTool,
  getSlideTool,
  searchIconsTool,
  updateNodeTool,
  updateSlideTool,
} from './tools/index.js';

/**
 * Creates the OpenRouter-backed model using OpenAI adapter
 */
function createModel() {
  return new ChatOpenAI({
    model: config.openrouter.model,
    apiKey: config.openrouter.apiKey,
    configuration: {
      baseURL: config.openrouter.baseUrl,
    },
  });
}

/**
 * Creates the Yafai agent using LangGraph's createReactAgent
 *
 * Each session gets its own agent with deckId-bound tools so
 * the LLM never needs to pass deck IDs — they're injected automatically.
 *
 * Uses MemorySaver checkpointer so the agent remembers previous turns
 * within a session (pass thread_id in config when streaming).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createYafaiAgent(deckId: string): any {
  const model = createModel();

  const tools = [
    createCreateSlideTool(deckId),
    updateSlideTool,
    updateNodeTool,
    createListSlidesTool(deckId),
    getSlideTool,
    createRegisterComponentTool(deckId),
    createListComponentsTool(deckId),
    searchIconsTool,
  ];

  const checkpointer = new MemorySaver();

  const agent = createReactAgent({
    llm: model,
    tools,
    messageModifier: systemPrompt,
    checkpointer,
  });

  return agent;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type YafaiAgent = any;
