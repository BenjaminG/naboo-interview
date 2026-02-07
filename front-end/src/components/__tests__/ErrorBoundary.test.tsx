import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { ErrorBoundary } from "../ErrorBoundary";

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>Normal content</div>;
};

// Suppress console.error for expected errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});
afterAll(() => {
  console.error = originalError;
});

describe("ErrorBoundary", () => {
  it("renders children when no error is thrown", () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders fallback UI when a child component throws an error", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(
      screen.getByText(/Une erreur inattendue s'est produite/i)
    ).toBeInTheDocument();
    expect(screen.queryByText("Normal content")).not.toBeInTheDocument();
  });

  it("renders a retry button in the fallback UI", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(
      screen.getByRole("button", { name: /réessayer/i })
    ).toBeInTheDocument();
  });

  it("resets error state when retry button is clicked", () => {
    let shouldThrow = true;

    const ControlledError = () => {
      if (shouldThrow) {
        throw new Error("Test error");
      }
      return <div>Recovered content</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ControlledError />
      </ErrorBoundary>
    );

    // Verify error state
    expect(
      screen.getByText(/Une erreur inattendue s'est produite/i)
    ).toBeInTheDocument();

    // Fix the error condition before clicking retry
    shouldThrow = false;

    // Click retry button
    fireEvent.click(screen.getByRole("button", { name: /réessayer/i }));

    // Force rerender to trigger the reset
    rerender(
      <ErrorBoundary>
        <ControlledError />
      </ErrorBoundary>
    );

    // Should now show recovered content
    expect(screen.getByText("Recovered content")).toBeInTheDocument();
  });

  it("does not interfere with normal rendering", () => {
    const { container } = render(
      <ErrorBoundary>
        <div data-testid="nested">
          <span>Nested content</span>
        </div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId("nested")).toBeInTheDocument();
    expect(screen.getByText("Nested content")).toBeInTheDocument();
    // Fallback should not be rendered
    expect(
      screen.queryByText(/Une erreur inattendue s'est produite/i)
    ).not.toBeInTheDocument();
  });

  it("uses inline styles (no Mantine dependency) in fallback UI", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const fallbackContainer = screen.getByText(
      /Une erreur inattendue s'est produite/i
    ).closest("div");

    // Check that the container has inline styles
    expect(fallbackContainer).toHaveStyle({
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    });
  });
});
