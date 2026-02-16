export interface ComponentParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  required?: boolean;
  default?: unknown;
  items?: string; // For array types
}

export interface ComponentDefinition {
  name: string;
  version: string;
  createdBy: 'system' | 'agent';
  createdAt: Date;
  description: string;
  parameters: ComponentParameter[];
  expansion: string; // Template for expanding to primitives
}

/**
 * Manages reusable components that agents can create and use
 * In-memory for PoC - can be swapped for persistent storage later
 */
export class ComponentRegistry {
  // Global components (ship with system)
  private coreComponents: Map<string, ComponentDefinition> = new Map();
  // Per-deck custom components
  private deckComponents: Map<string, Map<string, ComponentDefinition>> =
    new Map();

  constructor() {
    this.initializeCoreComponents();
  }

  private initializeCoreComponents(): void {
    // These are the base components that ship with the system
    const coreComponents: ComponentDefinition[] = [
      {
        name: 'Slide',
        version: '1.0.0',
        createdBy: 'system',
        createdAt: new Date(),
        description: 'Base slide container (1920×1080)',
        parameters: [
          {
            name: 'background',
            type: 'string',
            default: '#ffffff',
            description: 'Background color',
          },
        ],
        expansion: `<Frame width={1920} height={1080} fill={params.background || "#F8F9FB"}>{children}</Frame>`,
      },
      {
        name: 'SlideTitle',
        version: '1.0.0',
        createdBy: 'system',
        createdAt: new Date(),
        description: 'Main slide heading - uses LIGHT weight for elegant look',
        parameters: [
          { name: 'text', type: 'string', required: true },
          { name: 'color', type: 'string', default: '#1D1D1D' },
        ],
        expansion: `<Text x={110} y={80} fontFamily="Inter" fontSize={60} fontWeight={300} fill={params.color || "#1D1D1D"}>{params.text}</Text>`,
      },
      {
        name: 'Card',
        version: '1.0.0',
        createdBy: 'system',
        createdAt: new Date(),
        description:
          'Content container with background, padding, border-radius',
        parameters: [
          { name: 'x', type: 'number', default: 110 },
          { name: 'y', type: 'number', default: 228 },
          { name: 'width', type: 'number', default: 800 },
          { name: 'height', type: 'number' },
          { name: 'background', type: 'string', default: '#F8F8F8' },
        ],
        expansion: `<Frame x={params.x} y={params.y} width={params.width} height={params.height} fill={params.background || "#F8F8F8"} cornerRadius={16} padding={24}>{children}</Frame>`,
      },
      {
        name: 'StatNumber',
        version: '1.0.0',
        createdBy: 'system',
        createdAt: new Date(),
        description: 'Large metric with label',
        parameters: [
          { name: 'x', type: 'number', required: true },
          { name: 'y', type: 'number', required: true },
          { name: 'value', type: 'string', required: true },
          { name: 'label', type: 'string', required: true },
        ],
        expansion: `<Frame x={params.x} y={params.y} layoutMode="vertical" itemSpacing={8}>
  <Text fontFamily="Inter" fontSize={54} fontWeight={400} fill="#DC3C44">{params.value}</Text>
  <Text fontFamily="Inter" fontSize={20} fontWeight={400} fill="#6B7280">{params.label}</Text>
</Frame>`,
      },
      {
        name: 'BulletList',
        version: '1.0.0',
        createdBy: 'system',
        createdAt: new Date(),
        description: 'Styled list items with checkmarks',
        parameters: [
          { name: 'x', type: 'number', default: 110 },
          { name: 'y', type: 'number', default: 228 },
          { name: 'items', type: 'array', items: 'string', required: true },
        ],
        expansion: `<Frame x={params.x} y={params.y} layoutMode="vertical" itemSpacing={16}>
  {params.items.map((item, i) => (
    <Frame key={i} layoutMode="horizontal" itemSpacing={12}>
      <Text fontFamily="Helvetica" fontSize={20} fontWeight={700} fill="#2A9D8F">✓</Text>
      <Text fontFamily="Inter" fontSize={20} fill="#444444">{item}</Text>
    </Frame>
  ))}
</Frame>`,
      },
    ];

    for (const component of coreComponents) {
      this.coreComponents.set(component.name, component);
    }
  }

  getCoreComponent(name: string): ComponentDefinition | undefined {
    return this.coreComponents.get(name);
  }

  getDeckComponent(
    deckId: string,
    name: string,
  ): ComponentDefinition | undefined {
    return this.deckComponents.get(deckId)?.get(name);
  }

  getComponent(name: string, deckId?: string): ComponentDefinition | undefined {
    // Deck-specific components take precedence
    if (deckId) {
      const deckComponent = this.getDeckComponent(deckId, name);
      if (deckComponent) return deckComponent;
    }
    return this.getCoreComponent(name);
  }

  registerDeckComponent(
    deckId: string,
    component: Omit<ComponentDefinition, 'createdAt' | 'createdBy'>,
  ): ComponentDefinition {
    const fullComponent: ComponentDefinition = {
      ...component,
      createdBy: 'agent',
      createdAt: new Date(),
    };

    if (!this.deckComponents.has(deckId)) {
      this.deckComponents.set(deckId, new Map());
    }
    const deckMap = this.deckComponents.get(deckId);
    if (deckMap) {
      deckMap.set(component.name, fullComponent);
    }

    return fullComponent;
  }

  listCoreComponents(): ComponentDefinition[] {
    return Array.from(this.coreComponents.values());
  }

  listDeckComponents(deckId: string): ComponentDefinition[] {
    return Array.from(this.deckComponents.get(deckId)?.values() || []);
  }

  listAllComponents(deckId?: string): ComponentDefinition[] {
    const core = this.listCoreComponents();
    const deck = deckId ? this.listDeckComponents(deckId) : [];
    return [...core, ...deck];
  }
}

export const componentRegistry = new ComponentRegistry();
