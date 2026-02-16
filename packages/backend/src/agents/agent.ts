import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { config } from '../config.js';
import { systemPrompt } from './prompts.js';
import {
  createSlideTool,
  getSlideTool,
  listComponentsTool,
  listSlidesTool,
  registerComponentTool,
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
 * Custom tools for pitch deck creation
 */
const tools = [
  createSlideTool,
  updateSlideTool,
  updateNodeTool,
  listSlidesTool,
  getSlideTool,
  registerComponentTool,
  listComponentsTool,
];

/**
 * Creates the Yafai agent using LangGraph's createReactAgent
 *
 * This is a simple ReAct agent that:
 * - Takes user messages
 * - Decides which tools to call
 * - Executes tools and returns results
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createYafaiAgent(): any {
  const model = createModel();

  const agent = createReactAgent({
    llm: model,
    tools,
    messageModifier: systemPrompt,
  });

  return agent;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type YafaiAgent = any;
