/**
 * @jest-environment jsdom
 */

import { render } from "@testing-library/react";
import StorageInitializer from "../StorageInitializer";

const initializeStorageClient = jest.fn();

jest.mock("@/storage/storage", () => ({
  initializeStorageClient: () => initializeStorageClient(),
}));

describe("StorageInitializer", () => {
  beforeEach(() => {
    initializeStorageClient.mockClear();
  });

  it("renders nothing", () => {
    const { container } = render(<StorageInitializer />);
    expect(container.innerHTML).toBe("");
  });

  it("initializes storage on mount", () => {
    render(<StorageInitializer />);
    expect(initializeStorageClient).toHaveBeenCalledTimes(1);
  });

  it("does not re-initialize when re-rendered", () => {
    const { rerender } = render(<StorageInitializer />);
    rerender(<StorageInitializer />);
    rerender(<StorageInitializer />);

    // The effect has an empty dependency list, so startup detection must run
    // exactly once no matter how often the tree above it re-renders.
    expect(initializeStorageClient).toHaveBeenCalledTimes(1);
  });
});
