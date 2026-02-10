import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { AuthContext } from "@/contexts/authContext";
import { DebugContext } from "@/contexts/debugContext";
import { GetUserQuery } from "@/graphql/generated/types";
import { DebugToggle } from "../DebugToggle";

const adminUser: GetUserQuery["getMe"] = {
  id: "admin1",
  email: "admin@test.fr",
  firstName: "Admin",
  lastName: "User",
  role: "admin",
};

const regularUser: GetUserQuery["getMe"] = {
  id: "user1",
  email: "user1@test.fr",
  firstName: "Regular",
  lastName: "User",
  role: "user",
};

interface RenderOptions {
  user?: GetUserQuery["getMe"] | null;
  isDebugMode?: boolean;
  toggleDebugMode?: () => void;
}

function renderWithProviders({
  user = null,
  isDebugMode = false,
  toggleDebugMode = vi.fn(),
}: RenderOptions = {}) {
  const authValue = {
    user,
    isLoading: false,
    handleSignin: vi.fn(),
    handleSignup: vi.fn(),
    handleLogout: vi.fn(),
  };

  const debugValue = {
    isDebugMode,
    toggleDebugMode,
  };

  return render(
    <MantineProvider>
      <AuthContext.Provider value={authValue}>
        <DebugContext.Provider value={debugValue}>
          <DebugToggle />
        </DebugContext.Provider>
      </AuthContext.Provider>
    </MantineProvider>
  );
}

describe("DebugToggle", () => {
  describe("visibility", () => {
    it("renders for admin user", () => {
      renderWithProviders({ user: adminUser });

      expect(screen.getByText("Debug")).toBeInTheDocument();
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("does NOT render for regular user", () => {
      renderWithProviders({ user: regularUser });

      expect(screen.queryByText("Debug")).not.toBeInTheDocument();
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });

    it("does NOT render when no user (unauthenticated)", () => {
      renderWithProviders({ user: null });

      expect(screen.queryByText("Debug")).not.toBeInTheDocument();
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });
  });

  describe("toggle functionality", () => {
    it("calls toggleDebugMode when clicked", () => {
      const toggleDebugMode = vi.fn();
      renderWithProviders({ user: adminUser, toggleDebugMode });

      const toggle = screen.getByRole("checkbox");
      fireEvent.click(toggle);

      expect(toggleDebugMode).toHaveBeenCalledTimes(1);
    });

    it("reflects isDebugMode state as checked when true", () => {
      renderWithProviders({ user: adminUser, isDebugMode: true });

      const toggle = screen.getByRole("checkbox");
      expect(toggle).toBeChecked();
    });

    it("reflects isDebugMode state as unchecked when false", () => {
      renderWithProviders({ user: adminUser, isDebugMode: false });

      const toggle = screen.getByRole("checkbox");
      expect(toggle).not.toBeChecked();
    });
  });
});
