/**
 * @jest-environment jsdom
 */

import { render, waitFor } from "@testing-library/react";
import { ThemeProvider } from "../ThemeProvider";

const getItem = jest.fn();

jest.mock("@/storage/storage", () => ({
  STORAGE_KEYS: { SETTINGS: "doit-settings" },
  loadFromStorage: (key: string, fallback: unknown) =>
    Promise.resolve(getItem(key)).then((raw) => {
      if (typeof raw !== "string") return raw ?? fallback;
      try {
        const parsed = JSON.parse(raw);
        return parsed ?? fallback;
      } catch {
        return fallback;
      }
    }),
  waitForStorageInit: jest.fn().mockResolvedValue(undefined),
}));

/** Install a matchMedia stub reporting the given system preference. */
function mockSystemDark(prefersDark: boolean) {
  const listeners: Array<() => void> = [];
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockReturnValue({
      matches: prefersDark,
      addEventListener: (_: string, handler: () => void) => listeners.push(handler),
      removeEventListener: jest.fn(),
    }),
  });
  return listeners;
}

const settings = (theme: string) => JSON.stringify({ general: { theme } });

describe("ThemeProvider", () => {
  beforeEach(() => {
    getItem.mockReset();
    document.documentElement.classList.remove("dark");
    mockSystemDark(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders its children", async () => {
    getItem.mockResolvedValue(settings("light"));
    const { getByText } = render(
      <ThemeProvider>
        <span>content</span>
      </ThemeProvider>
    );
    expect(getByText("content")).toBeDefined();
  });

  it("applies the dark class when the stored theme is dark", async () => {
    getItem.mockResolvedValue(settings("dark"));
    render(<ThemeProvider>{null}</ThemeProvider>);
    await waitFor(() => expect(document.documentElement.classList.contains("dark")).toBe(true));
  });

  it("removes the dark class when the stored theme is light", async () => {
    document.documentElement.classList.add("dark");
    getItem.mockResolvedValue(settings("light"));
    render(<ThemeProvider>{null}</ThemeProvider>);
    await waitFor(() => expect(document.documentElement.classList.contains("dark")).toBe(false));
  });

  it("follows the system preference when the theme is system", async () => {
    mockSystemDark(true);
    getItem.mockResolvedValue(settings("system"));
    render(<ThemeProvider>{null}</ThemeProvider>);
    await waitFor(() => expect(document.documentElement.classList.contains("dark")).toBe(true));
  });

  it("falls back to the system preference when no settings are stored", async () => {
    mockSystemDark(true);
    getItem.mockResolvedValue(null);
    render(<ThemeProvider>{null}</ThemeProvider>);
    await waitFor(() => expect(document.documentElement.classList.contains("dark")).toBe(true));
  });

  it("falls back to the system preference when the stored settings are malformed", async () => {
    mockSystemDark(true);
    getItem.mockResolvedValue("{ not json");
    render(<ThemeProvider>{null}</ThemeProvider>);
    await waitFor(() => expect(document.documentElement.classList.contains("dark")).toBe(true));
  });

  it("stops polling storage once unmounted", async () => {
    jest.useFakeTimers();
    getItem.mockResolvedValue(settings("light"));

    const { unmount } = render(<ThemeProvider>{null}</ThemeProvider>);
    await waitFor(() => expect(getItem).toHaveBeenCalled());

    unmount();
    const callsAtUnmount = getItem.mock.calls.length;
    jest.advanceTimersByTime(5000);

    // The provider re-reads settings on an interval; the cleanup must clear it,
    // or every mount leaks a timer that keeps reading storage forever.
    expect(getItem.mock.calls.length).toBe(callsAtUnmount);
  });
});
