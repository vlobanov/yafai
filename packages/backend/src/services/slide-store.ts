import { v4 as uuid } from 'uuid';

export interface SlideSource {
  type: string;
  children: unknown[];
  componentVersions?: Record<string, string>;
}

export interface Slide {
  id: string;
  deckId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  source: SlideSource;
  snapshot: string; // Expanded DSL XML
}

/**
 * Stores slides with both semantic source and expanded snapshot
 * In-memory for PoC - can be swapped for persistent storage later
 */
export class SlideStore {
  private slides: Map<string, Slide> = new Map();

  createSlide(deckId: string, source: SlideSource, snapshot: string): Slide {
    const existingSlides = this.getSlidesByDeck(deckId);
    const slide: Slide = {
      id: uuid(),
      deckId,
      order: existingSlides.length,
      createdAt: new Date(),
      updatedAt: new Date(),
      source,
      snapshot,
    };
    this.slides.set(slide.id, slide);
    return slide;
  }

  getSlide(slideId: string): Slide | undefined {
    return this.slides.get(slideId);
  }

  updateSlide(
    slideId: string,
    updates: Partial<Pick<Slide, 'source' | 'snapshot' | 'order'>>,
  ): Slide | undefined {
    const slide = this.slides.get(slideId);
    if (!slide) return undefined;

    if (updates.source !== undefined) slide.source = updates.source;
    if (updates.snapshot !== undefined) slide.snapshot = updates.snapshot;
    if (updates.order !== undefined) slide.order = updates.order;
    slide.updatedAt = new Date();

    return slide;
  }

  deleteSlide(slideId: string): boolean {
    return this.slides.delete(slideId);
  }

  getSlidesByDeck(deckId: string): Slide[] {
    return Array.from(this.slides.values())
      .filter((slide) => slide.deckId === deckId)
      .sort((a, b) => a.order - b.order);
  }

  reorderSlides(deckId: string, slideIds: string[]): void {
    slideIds.forEach((id, index) => {
      const slide = this.slides.get(id);
      if (slide && slide.deckId === deckId) {
        slide.order = index;
        slide.updatedAt = new Date();
      }
    });
  }
}

export const slideStore = new SlideStore();
