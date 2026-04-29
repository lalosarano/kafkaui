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
// @ts-expect-error JSDOM doesn't define ResizeObserver
global.ResizeObserver = ResizeObserverStub;

// @ts-expect-error JSDOM doesn't define scrollIntoView on Element
Element.prototype.scrollIntoView = vi.fn();
