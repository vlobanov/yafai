import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { iconCount, searchIcons } from '../../services/icon-registry.js';

export const searchIconsTool = tool(
  async ({ query, limit }) => {
    const results = searchIcons(query, limit);

    if (results.length === 0) {
      return JSON.stringify({
        success: true,
        query,
        matches: [],
        message: `No icons found for "${query}". Try a different keyword (e.g., "arrow", "chart", "user", "check").`,
        totalAvailable: iconCount,
      });
    }

    return JSON.stringify({
      success: true,
      query,
      matches: results,
      message: `Found ${results.length} icon(s). Use in DSL: <Icon name="${results[0]}" size={24} color="#2A9D8F" />`,
    });
  },
  {
    name: 'search_icons',
    description: `Search the Lucide icon library by keyword. Returns matching icon names that can be used in <Icon> tags within slide DSL.

Use this to find icons for features lists, cards, section headers, etc.

Examples:
- search_icons("check") → check, check-circle, check-square, ...
- search_icons("arrow") → arrow-up, arrow-right, arrow-down, ...
- search_icons("chart") → chart-bar, chart-line, chart-pie, ...
- search_icons("user") → user, user-check, user-plus, users, ...`,
    schema: z.object({
      query: z
        .string()
        .describe(
          'Keyword to search for (e.g., "check", "arrow", "chart", "star", "shield")',
        ),
      limit: z
        .number()
        .optional()
        .default(20)
        .describe('Maximum number of results to return (default 20)'),
    }),
  },
);
