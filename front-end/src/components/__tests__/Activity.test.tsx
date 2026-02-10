import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Grid, MantineProvider } from '@mantine/core';
import { AuthContext } from '@/contexts/authContext';
import { DebugContext } from '@/contexts/debugContext';
import { GetUserQuery, ActivityFragment } from '@/graphql/generated/types';
import { Activity } from '../Activity';

const adminUser: GetUserQuery['getMe'] = {
  id: 'admin1',
  email: 'admin@test.fr',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
};

const regularUser: GetUserQuery['getMe'] = {
  id: 'user1',
  email: 'user1@test.fr',
  firstName: 'Regular',
  lastName: 'User',
  role: 'user',
};

const baseActivity: ActivityFragment = {
  id: 'activity1',
  name: 'Test Activity',
  city: 'Paris',
  description: 'A test activity description',
  price: 100,
  createdAt: '2026-01-15T10:30:00.000Z',
  owner: {
    firstName: 'John',
    lastName: 'Doe',
  },
};

interface RenderOptions {
  user?: GetUserQuery['getMe'] | null;
  isDebugMode?: boolean;
  activity?: ActivityFragment;
}

function renderWithProviders({
  user = null,
  isDebugMode = false,
  activity = baseActivity,
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
    toggleDebugMode: vi.fn(),
  };

  return render(
    <MantineProvider>
      <AuthContext.Provider value={authValue}>
        <DebugContext.Provider value={debugValue}>
          <Grid>
            <Activity activity={activity} />
          </Grid>
        </DebugContext.Provider>
      </AuthContext.Provider>
    </MantineProvider>
  );
}

describe('Activity debug badge', () => {
  describe('badge visibility', () => {
    it('shows debug badge for admin user with debug mode enabled and createdAt present', () => {
      renderWithProviders({
        user: adminUser,
        isDebugMode: true,
        activity: baseActivity,
      });

      expect(screen.getByText('15 janv. 2026')).toBeInTheDocument();
    });

    it('does NOT show debug badge when debug mode is off', () => {
      renderWithProviders({
        user: adminUser,
        isDebugMode: false,
        activity: baseActivity,
      });

      expect(screen.queryByText('15 janv. 2026')).not.toBeInTheDocument();
    });

    it('does NOT show debug badge for non-admin user even with debug mode on', () => {
      renderWithProviders({
        user: regularUser,
        isDebugMode: true,
        activity: baseActivity,
      });

      expect(screen.queryByText('15 janv. 2026')).not.toBeInTheDocument();
    });

    it('does NOT show debug badge when createdAt is null', () => {
      const activityWithoutCreatedAt: ActivityFragment = {
        ...baseActivity,
        createdAt: null,
      };

      renderWithProviders({
        user: adminUser,
        isDebugMode: true,
        activity: activityWithoutCreatedAt,
      });

      expect(screen.queryByText('15 janv. 2026')).not.toBeInTheDocument();
    });

    it('does NOT show debug badge for unauthenticated user', () => {
      renderWithProviders({
        user: null,
        isDebugMode: true,
        activity: baseActivity,
      });

      expect(screen.queryByText('15 janv. 2026')).not.toBeInTheDocument();
    });
  });

  describe('regular user localStorage manipulation', () => {
    it('does NOT show debug badge for regular user even when localStorage debug_mode is "true"', () => {
      localStorage.setItem('debug_mode', 'true');

      renderWithProviders({
        user: regularUser,
        isDebugMode: true,
        activity: baseActivity,
      });

      expect(screen.queryByText('15 janv. 2026')).not.toBeInTheDocument();

      localStorage.removeItem('debug_mode');
    });
  });

  describe('basic activity rendering', () => {
    it('renders activity card without debug badge by default', () => {
      renderWithProviders({
        user: null,
        isDebugMode: false,
        activity: baseActivity,
      });

      expect(screen.getByText('Test Activity')).toBeInTheDocument();
      expect(screen.getByText('Paris')).toBeInTheDocument();
      expect(screen.getByText('100€/j')).toBeInTheDocument();
      expect(screen.queryByText('15 janv. 2026')).not.toBeInTheDocument();
    });
  });
});
