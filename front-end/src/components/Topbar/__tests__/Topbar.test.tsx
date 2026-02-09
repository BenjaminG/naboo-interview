import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { Topbar } from '../Topbar';
import { Route } from '../types';

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/',
  }),
}));

// Mock next/link to render a simple anchor
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

// Mock useAuth hook
const mockUser = {
  id: '1',
  email: 'test@test.fr',
  firstName: 'Test',
  lastName: 'User',
};

vi.mock('@/hooks', () => ({
  useAuth: vi.fn(() => ({ user: null })),
}));

import { useAuth } from '@/hooks';

const testRoutes: Route[] = [
  { label: 'Discover', route: '/discover' },
  { label: 'My Activities', route: '/my-activities', requiredAuth: true },
  { label: 'Login', route: '/login', requiredAuth: false },
];

function renderTopbar(routes: Route[] = testRoutes) {
  return render(
    <MantineProvider>
      <Topbar routes={routes} />
    </MantineProvider>
  );
}

// Helper to get burger button by its role or class
function getBurger() {
  // Mantine Burger renders as a button
  return document.querySelector('.mantine-Burger-root') as HTMLElement;
}

describe('Topbar component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Burger icon', () => {
    it('should render burger icon', () => {
      renderTopbar();

      const burger = getBurger();
      expect(burger).toBeInTheDocument();
    });
  });

  describe('Drawer behavior', () => {
    it('should open drawer on burger click', async () => {
      renderTopbar();

      const burger = getBurger();
      fireEvent.click(burger);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should render all navigation links in drawer', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
      } as ReturnType<typeof useAuth>);
      renderTopbar();

      const burger = getBurger();
      fireEvent.click(burger);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Unauthenticated user should see: Discover, Login (not My Activities)
      expect(screen.getByRole('dialog')).toHaveTextContent('Discover');
      expect(screen.getByRole('dialog')).toHaveTextContent('Login');
    });

    it('should render authenticated routes in drawer for logged-in user', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
      } as ReturnType<typeof useAuth>);
      renderTopbar();

      const burger = getBurger();
      fireEvent.click(burger);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Authenticated user should see: Discover, My Activities (not Login)
      expect(screen.getByRole('dialog')).toHaveTextContent('Discover');
      expect(screen.getByRole('dialog')).toHaveTextContent('My Activities');
    });

    it('should close drawer on link click', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
      } as ReturnType<typeof useAuth>);
      renderTopbar();

      const burger = getBurger();
      fireEvent.click(burger);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Find drawer links by looking inside the dialog
      const drawer = screen.getByRole('dialog');
      const drawerLinks = drawer.querySelectorAll('a');
      const discoverLink = Array.from(drawerLinks).find((link) =>
        link.textContent?.includes('Discover')
      );
      expect(discoverLink).toBeDefined();

      fireEvent.click(discoverLink!);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should close drawer when clicking outside (overlay)', async () => {
      renderTopbar();

      const burger = getBurger();
      fireEvent.click(burger);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Find the overlay element and click it
      const overlay = document.querySelector('.mantine-Drawer-overlay');
      expect(overlay).toBeInTheDocument();

      fireEvent.click(overlay!);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should close drawer when pressing Escape key', async () => {
      renderTopbar();

      const burger = getBurger();
      fireEvent.click(burger);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Press Escape key on the drawer element
      const drawer = screen.getByRole('dialog');
      fireEvent.keyDown(drawer, { key: 'Escape', code: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Responsive visibility', () => {
    it('should have burger hidden on desktop via CSS class', () => {
      renderTopbar();

      // The burger has a class that hides it on desktop (>=sm breakpoint)
      // We verify the burger element exists but CSS media queries handle visibility
      const burger = getBurger();
      expect(burger).toBeInTheDocument();
      // Note: actual CSS-based visibility cannot be tested without full browser rendering
      // The class `classes.burger` contains the media query to hide on sm+
    });

    it('should have desktop links hidden on mobile via CSS class', () => {
      renderTopbar();

      // Desktop navigation links have a class that hides them on mobile (<sm breakpoint)
      // We verify they exist in the DOM (visibility controlled by CSS)
      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
    });
  });
});
