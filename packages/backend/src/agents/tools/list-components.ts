import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { componentRegistry } from '../../services/component-registry.js';

export function createListComponentsTool(deckId: string) {
  return tool(
    async () => {
      const coreComponents = componentRegistry.listCoreComponents();
      const deckComponents = componentRegistry.listDeckComponents(deckId);

      const formatComponent = (c: (typeof coreComponents)[0]) => ({
        name: c.name,
        version: c.version,
        description: c.description,
        parameters: c.parameters.map((p) => ({
          name: p.name,
          type: p.type,
          required: p.required,
          description: p.description,
        })),
      });

      return JSON.stringify({
        core: coreComponents.map(formatComponent),
        deck: deckComponents.map(formatComponent),
      });
    },
    {
      name: 'list_components',
      description:
        'List all available components (both core system components and deck-specific custom components).',
      schema: z.object({}),
    },
  );
}
