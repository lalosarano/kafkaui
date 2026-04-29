import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// JSDOM doesn't implement matchMedia, ResizeObserver, or scrollIntoView.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;

(Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = vi.fn();
