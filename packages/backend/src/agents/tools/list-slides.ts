import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { slideStore } from '../../services/slide-store.js';

export function createListSlidesTool(deckId: string) {
  return tool(
    async () => {
      const slides = slideStore.getSlidesByDeck(deckId);

      const summary = slides.map((slide) => ({
        id: slide.id,
        order: slide.order,
        type: slide.source.type,
        createdAt: slide.createdAt.toISOString(),
        updatedAt: slide.updatedAt.toISOString(),
      }));

      return JSON.stringify({
        deckId,
        slideCount: slides.length,
        slides: summary,
      });
    },
    {
      name: 'list_slides',
      description:
        'List all slides in the current deck. Returns slide IDs, order, and metadata without the full content.',
      schema: z.object({}),
    },
  );
}
