import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { slideStore } from '../../services/slide-store.js';

export const getSlideTool = tool(
  async ({ slideId }) => {
    const slide = slideStore.getSlide(slideId);

    if (!slide) {
      return JSON.stringify({
        success: false,
        error: `Slide ${slideId} not found`,
      });
    }

    return JSON.stringify({
      success: true,
      slide: {
        id: slide.id,
        deckId: slide.deckId,
        order: slide.order,
        dsl: slide.snapshot,
        source: slide.source,
        createdAt: slide.createdAt.toISOString(),
        updatedAt: slide.updatedAt.toISOString(),
      },
    });
  },
  {
    name: 'get_slide',
    description:
      'Get the full content of a specific slide, including its DSL and source.',
    schema: z.object({
      slideId: z.string().describe('The ID of the slide to retrieve'),
    }),
  },
);
