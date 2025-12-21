/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useServiceWorker } from "../useServiceWorker";

// Mock MessageChannel
class MockMessageChannel {
  port1: { onmessage: ((event: { data: unknown }) => void) | null };
  port2: { postMessage: jest.Mock };

  constructor() {
    this.port1 = { onmessage: null };
    this.port2 = { postMessage: jest.fn() };
  }
}

global.MessageChannel = MockMessageChannel as unknown as typeof MessageChannel;

// Mock service worker registration
const createMockRegistration = (overrides = {}) => ({
  scope: "/",
  installing: null,
  waiting: null,
  active: null,
  addEventListener: jest.fn(),
  update: jest.fn(),
  ...overrides,
});

describe("useServiceWorker", () => {
  let mockServiceWorkerRegister: jest.Mock;
  let mockServiceWorkerAddEventListener: jest.Mock;
  let windowAddEventListenerSpy: jest.SpyInstance;
  let windowRemoveEventListenerSpy: jest.SpyInstance;
  let originalServiceWorker: ServiceWorkerContainer | undefined;
  let onlineEventHandlers: Array<() => void> = [];
  let offlineEventHandlers: Array<() => void> = [];

  // Suppress console output during tests
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeAll(() => {
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    onlineEventHandlers = [];
    offlineEventHandlers = [];

    // Store original
    originalServiceWorker = navigator.serviceWorker;

    // Create mock registration
    const mockRegistration = createMockRegistration();
    mockServiceWorkerRegister = jest.fn().mockResolvedValue(mockRegistration);
    mockServiceWorkerAddEventListener = jest.fn();

    // Mock navigator.serviceWorker
    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        register: mockServiceWorkerRegister,
        addEventListener: mockServiceWorkerAddEventListener,
        controller: null,
      },
      writable: true,
      configurable: true,
    });

    // Spy on window event listeners
    windowAddEventListenerSpy = jest.spyOn(window, "addEventListener").mockImplementation((event, handler) => {
      if (event === "online") onlineEventHandlers.push(handler as () => void);
      if (event === "offline") offlineEventHandlers.push(handler as () => void);
    });
    windowRemoveEventListenerSpy = jest.spyOn(window, "removeEventListener").mockImplementation(() => {});

    // Mock navigator.onLine
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });

    // Mock document.readyState
    Object.defineProperty(document, "readyState", {
      value: "complete",
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    windowAddEventListenerSpy.mockRestore();
    windowRemoveEventListenerSpy.mockRestore();
    
    // Restore original service worker
    if (originalServiceWorker !== undefined) {
      Object.defineProperty(navigator, "serviceWorker", {
        value: originalServiceWorker,
        writable: true,
        configurable: true,
      });
    }
  });

  describe("initialization", () => {
    it("should detect service worker support", async () => {
      const { result } = renderHook(() => useServiceWorker());

      expect(result.current.isSupported).toBe(true);
    });

    it("should handle lack of service worker support", async () => {
      // Delete service worker from navigator
      delete (navigator as Partial<Navigator>).serviceWorker;

      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isSupported).toBe(false);
      });
      expect(result.current.isRegistered).toBe(false);
    });

    it("should register service worker when supported", async () => {
      renderHook(() => useServiceWorker());

      // Wait for registration to be called
      await waitFor(() => {
        expect(mockServiceWorkerRegister).toHaveBeenCalledWith("/sw.js", { scope: "/" });
      });
    });

    it("should initialize offline status from navigator.onLine", async () => {
      Object.defineProperty(navigator, "onLine", {
        value: false,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useServiceWorker());

      expect(result.current.isOffline).toBe(true);
    });

    it("should set isRegistered after successful registration", async () => {
      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });
    });
  });

  describe("online/offline handling", () => {
    it("should track online status changes", async () => {
      const { result } = renderHook(() => useServiceWorker());

      // Simulate going offline
      act(() => {
        offlineEventHandlers.forEach(handler => handler());
      });

      expect(result.current.isOffline).toBe(true);

      // Simulate going online
      act(() => {
        onlineEventHandlers.forEach(handler => handler());
      });

      expect(result.current.isOffline).toBe(false);
    });

    it("should clean up event listeners on unmount", async () => {
      const { unmount } = renderHook(() => useServiceWorker());

      unmount();

      expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function));
      expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith("offline", expect.any(Function));
    });
  });

  describe("applyUpdate", () => {
    it("should do nothing if no waiting worker", async () => {
      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      // Should not throw
      act(() => {
        result.current.applyUpdate();
      });
    });

    it("should post SKIP_WAITING message to waiting worker", async () => {
      const mockWaiting = {
        postMessage: jest.fn(),
      };

      mockServiceWorkerRegister.mockResolvedValue(createMockRegistration({ waiting: mockWaiting }));

      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      act(() => {
        result.current.applyUpdate();
      });

      expect(mockWaiting.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    });
  });

  describe("clearCache", () => {
    it("should return false if no active worker", async () => {
      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      let clearResult: boolean | undefined;
      await act(async () => {
        clearResult = await result.current.clearCache();
      });

      expect(clearResult).toBe(false);
    });

    it("should send CLEAR_CACHE message to active worker", async () => {
      const mockActive = {
        postMessage: jest.fn(),
      };

      const mockRegistration = createMockRegistration({ active: mockActive });
      mockServiceWorkerRegister.mockResolvedValue(mockRegistration);

      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      // Start the clearCache call
      const clearPromise = result.current.clearCache();

      // The postMessage should have been called with message and transfer
      await waitFor(() => {
        expect(mockActive.postMessage).toHaveBeenCalled();
      });

      const call = mockActive.postMessage.mock.calls[0];
      expect(call[0]).toEqual({ type: "CLEAR_CACHE" });
    });
  });

  describe("getVersion", () => {
    it("should return null if no active worker", async () => {
      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      let version: string | null | undefined;
      await act(async () => {
        version = await result.current.getVersion();
      });

      expect(version).toBe(null);
    });

    it("should send GET_VERSION message to active worker", async () => {
      const mockActive = {
        postMessage: jest.fn(),
      };

      const mockRegistration = createMockRegistration({ active: mockActive });
      mockServiceWorkerRegister.mockResolvedValue(mockRegistration);

      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      // Start the getVersion call
      result.current.getVersion();

      // The postMessage should have been called
      await waitFor(() => {
        expect(mockActive.postMessage).toHaveBeenCalled();
      });

      const call = mockActive.postMessage.mock.calls[0];
      expect(call[0]).toEqual({ type: "GET_VERSION" });
    });
  });

  describe("update detection", () => {
    it("should listen for updatefound event on registration", async () => {
      const mockRegistration = createMockRegistration();
      mockServiceWorkerRegister.mockResolvedValue(mockRegistration);

      renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(mockRegistration.addEventListener).toHaveBeenCalledWith(
          "updatefound",
          expect.any(Function)
        );
      });
    });

    it("should set isUpdateAvailable when new worker is installed with existing controller", async () => {
      // Set up the mocks
      let updateFoundCallback: (() => void) | null = null;
      let stateChangeCallback: (() => void) | null = null;

      const mockNewWorker = {
        state: "installed",
        addEventListener: jest.fn((event, cb) => {
          if (event === "statechange") stateChangeCallback = cb;
        }),
      };

      const mockRegistration = {
        ...createMockRegistration(),
        get installing() {
          return mockNewWorker;
        },
        addEventListener: jest.fn((event, cb) => {
          if (event === "updatefound") updateFoundCallback = cb;
        }),
      };

      mockServiceWorkerRegister.mockResolvedValue(mockRegistration);

      // Set controller to simulate an existing service worker
      Object.defineProperty(navigator.serviceWorker, "controller", {
        value: { state: "activated" },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useServiceWorker());

      // Wait for registration
      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      // Simulate update found event
      act(() => {
        updateFoundCallback?.();
      });

      // Simulate state change to installed
      act(() => {
        stateChangeCallback?.();
      });

      expect(result.current.isUpdateAvailable).toBe(true);
    });
  });
});
