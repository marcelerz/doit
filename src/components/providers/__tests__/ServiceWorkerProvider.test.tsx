/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from "@testing-library/react";
import ServiceWorkerProvider from "../ServiceWorkerProvider";

interface ServiceWorkerState {
  isOffline: boolean;
  isUpdateAvailable: boolean;
  isRegistered: boolean;
  applyUpdate: () => void;
}

const applyUpdate = jest.fn();
let state: ServiceWorkerState;

jest.mock("@/hooks/useServiceWorker", () => ({
  useServiceWorker: () => state,
}));

const online: ServiceWorkerState = {
  isOffline: false,
  isUpdateAvailable: false,
  isRegistered: true,
  applyUpdate,
};

describe("ServiceWorkerProvider", () => {
  beforeEach(() => {
    applyUpdate.mockClear();
    state = { ...online };
  });

  it("renders nothing while online with no update pending", () => {
    const { container } = render(<ServiceWorkerProvider />);
    expect(container.innerHTML).toBe("");
  });

  it("announces going offline", () => {
    state = { ...online, isOffline: true };
    render(<ServiceWorkerProvider />);

    expect(screen.getByText("You're offline")).toBeDefined();
    // Connectivity loss changes what the app can do, so it has to reach
    // assistive technology and not only the sighted user.
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
  });

  it("shows the persistent offline indicator only once registered", () => {
    state = { ...online, isOffline: true, isRegistered: false };
    const { queryByText, rerender } = render(<ServiceWorkerProvider />);
    expect(queryByText("Offline")).toBeNull();

    state = { ...online, isOffline: true, isRegistered: true };
    rerender(<ServiceWorkerProvider />);
    expect(screen.getByText("Offline")).toBeDefined();
  });

  it("offers the update when one is available", () => {
    state = { ...online, isUpdateAvailable: true };
    render(<ServiceWorkerProvider />);
    expect(screen.getByText("Update available")).toBeDefined();
  });

  it("applies the update when Update is pressed", () => {
    state = { ...online, isUpdateAvailable: true };
    render(<ServiceWorkerProvider />);

    fireEvent.click(screen.getByText("Update"));
    expect(applyUpdate).toHaveBeenCalledTimes(1);
  });

  it("dismisses the update toast when Later is pressed, without applying it", () => {
    state = { ...online, isUpdateAvailable: true };
    const { queryByText } = render(<ServiceWorkerProvider />);

    fireEvent.click(screen.getByText("Later"));
    expect(queryByText("Update available")).toBeNull();
    expect(applyUpdate).not.toHaveBeenCalled();
  });
});
