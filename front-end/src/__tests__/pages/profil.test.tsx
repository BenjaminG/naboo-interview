import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';

// Mock router
const mockRouter = { push: vi.fn() };
vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

// Mock next/head
vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock snackbar
const mockSuccess = vi.fn();
const mockError = vi.fn();
vi.mock('@/hooks', () => ({
  useAuth: vi.fn(),
  useSnackbar: () => ({ success: mockSuccess, error: mockError }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === 'string' ? src : ''} alt={alt} {...props} />
  ),
}));

import { useAuth } from '@/hooks';
import Profile from '../../pages/profil';
import GetMyFavorites from '@/graphql/queries/favorite/getMyFavorites';
import GetMyFavoritedActivityIds from '@/graphql/queries/favorite/getMyFavoritedActivityIds';

const mockedUseAuth = vi.mocked(useAuth);

const mockUser = {
  id: 'user-1',
  email: 'test@test.com',
  firstName: 'Test',
  lastName: 'User',
};

const mockFavorites = [
  {
    __typename: 'Favorite',
    id: 'fav-1',
    order: 0,
    createdAt: '2026-02-08T10:00:00Z',
    activity: {
      __typename: 'Activity',
      id: 'activity-1',
      name: 'Activity One',
      description: 'Description one',
      city: 'Paris',
      price: 50,
      owner: { __typename: 'User', firstName: 'Owner', lastName: 'One' },
    },
  },
  {
    __typename: 'Favorite',
    id: 'fav-2',
    order: 1,
    createdAt: '2026-02-08T11:00:00Z',
    activity: {
      __typename: 'Activity',
      id: 'activity-2',
      name: 'Activity Two',
      description: 'Description two',
      city: 'Lyon',
      price: 75,
      owner: { __typename: 'User', firstName: 'Owner', lastName: 'Two' },
    },
  },
];

const createMocks = (favorites = mockFavorites): MockedResponse[] => [
  {
    request: { query: GetMyFavorites },
    result: { data: { getMyFavorites: favorites } },
  },
  {
    request: { query: GetMyFavoritedActivityIds },
    result: {
      data: {
        getMyFavoritedActivityIds: favorites.map((f) => f.activity.id),
      },
    },
  },
];

describe('Profile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      handleSignin: vi.fn(),
      handleSignup: vi.fn(),
      handleLogout: vi.fn(),
    });
  });

  describe('Tab rendering', () => {
    it('should render two tabs: "Mon profil" and "Mes favoris"', async () => {
      const emptyFavorites: typeof mockFavorites = [];
      const mocks = createMocks(emptyFavorites);

      render(
        <MockedProvider mocks={mocks}>
          <Profile />
        </MockedProvider>
      );

      expect(screen.getByRole('tab', { name: 'Mon profil' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Mes favoris' })).toBeInTheDocument();
    });

    it('should show "Mon profil" tab content by default with user info', async () => {
      const emptyFavorites: typeof mockFavorites = [];
      const mocks = createMocks(emptyFavorites);

      render(
        <MockedProvider mocks={mocks}>
          <Profile />
        </MockedProvider>
      );

      expect(screen.getByText('test@test.com')).toBeInTheDocument();
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
    });
  });

  describe('Favorites tab content', () => {
    it('should display favorites list when "Mes favoris" tab is clicked', async () => {
      const user = userEvent.setup();
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks}>
          <Profile />
        </MockedProvider>
      );

      await user.click(screen.getByRole('tab', { name: 'Mes favoris' }));

      await waitFor(() => {
        expect(screen.getByText('Activity One')).toBeInTheDocument();
        expect(screen.getByText('Activity Two')).toBeInTheDocument();
      });
    });

    it('should display favorites in custom order', async () => {
      const user = userEvent.setup();
      const mocks = createMocks();

      render(
        <MockedProvider mocks={mocks}>
          <Profile />
        </MockedProvider>
      );

      await user.click(screen.getByRole('tab', { name: 'Mes favoris' }));

      await waitFor(() => {
        const activityNames = screen.getAllByRole('heading', { level: 3 });
        expect(activityNames[0]).toHaveTextContent('Activity One');
        expect(activityNames[1]).toHaveTextContent('Activity Two');
      });
    });
  });

  describe('Empty state', () => {
    it('should show empty state message when user has no favorites', async () => {
      const user = userEvent.setup();
      const emptyFavorites: typeof mockFavorites = [];
      const mocks = createMocks(emptyFavorites);

      render(
        <MockedProvider mocks={mocks}>
          <Profile />
        </MockedProvider>
      );

      await user.click(screen.getByRole('tab', { name: 'Mes favoris' }));

      await waitFor(() => {
        expect(
          screen.getByText(/Vous n'avez pas encore de favoris/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Loading state', () => {
    it('should show loading indicator while favorites are being fetched', async () => {
      const user = userEvent.setup();
      const mocks: MockedResponse[] = [
        {
          request: { query: GetMyFavorites },
          result: { data: { getMyFavorites: mockFavorites } },
          delay: 100,
        },
        {
          request: { query: GetMyFavoritedActivityIds },
          result: {
            data: {
              getMyFavoritedActivityIds: mockFavorites.map((f) => f.activity.id),
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <Profile />
        </MockedProvider>
      );

      await user.click(screen.getByRole('tab', { name: 'Mes favoris' }));

      expect(screen.getByTestId('favorites-loading')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId('favorites-loading')).not.toBeInTheDocument();
      });
    });
  });
});
