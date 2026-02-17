import { tool } from '@langchain/core/tools';
import { collectNodeIds, validateDSL } from '@yafai/primitives';
import { z } from 'zod';
import { resolveIconsInDSL } from '../../services/resolve-icons.js';
import { slideStore } from '../../services/slide-store.js';

export const createSlideTool = tool(
  async ({ deckId, dsl, source }) => {
    // Resolve <Icon> tags to <Vector> before validation
    const { resolvedDsl, errors: iconErrors } = resolveIconsInDSL(dsl);
    if (iconErrors.length > 0) {
      return JSON.stringify({
        success: false,
        error: 'Icon resolution failed',
        details: iconErrors.join('; '),
        hint: 'Use search_icons to find valid icon names.',
      });
    }

    // Validate DSL syntax before accepting
    const validation = validateDSL(resolvedDsl);
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

    const slide = slideStore.createSlide(
      deckId,
      source || { type: 'Slide', children: [] },
      resolvedDsl,
    );

    // Return node IDs so the agent knows what can be edited
    const nodeIds = collectNodeIds(validation.primitive!);

    return JSON.stringify({
      success: true,
      slideId: slide.id,
      order: slide.order,
      nodeIds,
      message: `Created slide ${slide.id} at position ${slide.order}. Node IDs available for editing: ${nodeIds.join(', ')}`,
    });
  },
  {
    name: 'create_slide',
    description: `Create a NEW slide in the pitch deck. Only use for new slides - for edits, use update_node instead!

CRITICAL RULES:
1. EVERY element MUST have a unique id attribute (e.g., id="title", id="stat-revenue")
2. ALWAYS use layoutMode="vertical" or "horizontal" - NO x/y positioning
3. Text MUST have width="fill" inside auto-layout containers (prevents clipping)
4. Containers should use width="hug" / height="hug" to size to content

Example DSL (note: every element has an id!):
<Slide id="slide-market">
  <Frame id="content" layoutMode="vertical" gap={48} padding={80} width={1920} height={1080}>
    <Text id="title" width="fill" fontFamily="Inter" fontSize={48} fontWeight={600} fill="#1a1a2e">
      Market Opportunity
    </Text>
    
    <Frame id="stats-row" layoutMode="horizontal" gap={48} width="fill">
      <Frame id="stat-market" layoutMode="vertical" gap={8} width="hug">
        <Text id="stat-market-value" fontSize={48} fontWeight={700} fill="#2563eb">$50B</Text>
        <Text id="stat-market-label" fontSize={14} fill="#6b7280">Market Size</Text>
      </Frame>
      <Frame id="stat-users" layoutMode="vertical" gap={8} width="hug">
        <Text id="stat-users-value" fontSize={48} fontWeight={700} fill="#2563eb">10M+</Text>
        <Text id="stat-users-label" fontSize={14} fill="#6b7280">Users</Text>
      </Frame>
    </Frame>
    
    <Frame id="two-col" layoutMode="horizontal" gap={48} width="fill" height="fill">
      <Frame id="col-left" layoutMode="vertical" gap={16} width="fill">
        <Text id="left-title" width="fill" fontSize={24} fontWeight={600}>Why Now?</Text>
        <Text id="left-body" width="fill" fontSize={18} fill="#6b7280">Description text.</Text>
      </Frame>
      <Frame id="col-right" layoutMode="vertical" gap={16} width="fill" padding={32} fill="#f8fafc" cornerRadius={12}>
        <Text id="right-title" width="fill" fontSize={24} fontWeight={600}>Our Edge</Text>
        <Text id="right-body" width="fill" fontSize={18} fill="#6b7280">Another column.</Text>
      </Frame>
    </Frame>
  </Frame>
</Slide>`,
    schema: z.object({
      deckId: z.string().describe('The deck ID to add the slide to'),
      dsl: z
        .string()
        .describe(
          'The XML DSL markup for the slide (EVERY element must have a unique id attribute!)',
        ),
      source: z
        .object({
          type: z.string(),
          children: z.array(z.unknown()),
        })
        .optional()
        .describe('Optional semantic source representation'),
    }),
  },
);
