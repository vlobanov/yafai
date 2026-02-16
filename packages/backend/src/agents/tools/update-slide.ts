import { tool } from '@langchain/core/tools';
import { collectNodeIds, validateDSL } from '@yafai/primitives';
import { z } from 'zod';
import { slideStore } from '../../services/slide-store.js';

export const updateSlideTool = tool(
  async ({ slideId, dsl, source }) => {
    // Validate DSL syntax before accepting
    const validation = validateDSL(dsl);
    if (!validation.success) {
      return JSON.stringify({
        success: false,
        error: 'Invalid DSL',
        details: validation.error,
        line: validation.line,
        column: validation.column,
        context: validation.context,
        hint: 'Please fix the DSL syntax and try again.',
      });
    }

    const slide = slideStore.updateSlide(slideId, {
      snapshot: dsl,
      source: source,
    });

    if (!slide) {
      return JSON.stringify({
        success: false,
        error: `Slide ${slideId} not found`,
      });
    }

    const nodeIds = collectNodeIds(validation.primitive!);

    return JSON.stringify({
      success: true,
      slideId: slide.id,
      nodeIds,
      message: `Updated slide ${slide.id}. Node IDs: ${nodeIds.join(', ')}`,
    });
  },
  {
    name: 'update_slide',
    description:
      "Update an existing slide's ENTIRE content. Use this only when you need to replace the whole slide. For small changes, use update_node instead.",
    schema: z.object({
      slideId: z.string().describe('The ID of the slide to update'),
      dsl: z
        .string()
        .describe(
          'The new XML DSL markup for the slide (ALL nodes must have unique id attributes)',
        ),
      source: z
        .object({
          type: z.string(),
          children: z.array(z.unknown()),
        })
        .optional()
        .describe('Optional updated semantic source'),
    }),
  },
);
