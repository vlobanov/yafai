import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { componentRegistry } from '../../services/component-registry.js';

export function createRegisterComponentTool(deckId: string) {
  return tool(
    async ({ name, version, description, parameters, expansion }) => {
      const component = componentRegistry.registerDeckComponent(deckId, {
        name,
        version,
        description,
        parameters,
        expansion,
      });

      return JSON.stringify({
        success: true,
        component: {
          name: component.name,
          version: component.version,
          createdAt: component.createdAt.toISOString(),
        },
        message: `Registered component "${name}" v${version}`,
      });
    },
    {
      name: 'register_component',
      description: `Register a new reusable component for the current deck. Use this when you've created a pattern that could be reused across multiple slides.

Example: If you create a "Pipeline Timeline" visualization, register it as a component so you can easily reuse it.

The expansion template uses JSX-like syntax with {params.paramName} for parameters and {children} for nested content.`,
      schema: z.object({
        name: z
          .string()
          .describe('Component name in PascalCase (e.g., PipelineTimeline)'),
        version: z.string().default('1.0.0').describe('Semantic version'),
        description: z
          .string()
          .describe('Clear description of what the component does'),
        parameters: z
          .array(
            z.object({
              name: z.string(),
              type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
              description: z.string().optional(),
              required: z.boolean().optional(),
              default: z.unknown().optional(),
            }),
          )
          .describe('Component parameters'),
        expansion: z
          .string()
          .describe(
            'Template that expands to primitives using {params.x} syntax',
          ),
      }),
    },
  );
}
