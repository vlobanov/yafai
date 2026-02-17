import type { ValidationError } from '../websocket/types.js';

export interface TrackedSlide {
  slideId: string;
  filePath: string;
  renderStatus: 'pending' | 'success' | 'error';
  nodeId?: string;
  renderError?: string;
  validationErrors: ValidationError[];
  lastRendered: string;
}

export class SlideTracker {
  private slides = new Map<string, TrackedSlide>();

  track(slideId: string, filePath: string): void {
    this.slides.set(slideId, {
      slideId,
      filePath,
      renderStatus: 'pending',
      validationErrors: [],
      lastRendered: new Date().toISOString(),
    });
  }

  updateRender(
    slideId: string,
    result: { success: boolean; nodeId?: string; error?: string },
  ): void {
    const slide = this.slides.get(slideId);
    if (!slide) return;

    slide.renderStatus = result.success ? 'success' : 'error';
    slide.nodeId = result.nodeId;
    slide.renderError = result.error;
    slide.lastRendered = new Date().toISOString();
  }

  updateValidation(slideId: string, errors: ValidationError[]): void {
    const slide = this.slides.get(slideId);
    if (!slide) return;
    slide.validationErrors = errors;
  }

  get(slideId: string): TrackedSlide | undefined {
    return this.slides.get(slideId);
  }

  getAll(): TrackedSlide[] {
    return Array.from(this.slides.values());
  }

  getErrors(slideId?: string): Array<{ slideId: string; errors: ValidationError[] }> {
    if (slideId) {
      const slide = this.slides.get(slideId);
      if (!slide) return [];
      return [{ slideId, errors: slide.validationErrors }];
    }
    return this.getAll()
      .filter((s) => s.validationErrors.length > 0)
      .map((s) => ({ slideId: s.slideId, errors: s.validationErrors }));
  }
}
