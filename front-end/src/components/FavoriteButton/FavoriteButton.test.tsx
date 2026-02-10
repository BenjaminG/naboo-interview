import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';

// Mock router
const mockPush = vi.fn();
vi.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock snackbar
const mockSuccess = vi.fn();
const mockError = vi.fn();
vi.mock('@/hooks', () => ({
  useAuth: vi.fn(),
  useSnackbar: () => ({ success: mockSuccess, error: mockError }),
}));

import { useAuth } from '@/hooks';
import { FavoriteButton } from './FavoriteButton';
import ToggleFavorite from '@/graphql/mutations/favorite/toggleFavorite';
import GetMyFavoritedActivityIds from '@/graphql/queries/favorite/getMyFavoritedActivityIds';

const mockedUseAuth = vi.mocked(useAuth);

describe('FavoriteButton', () => {
  const activityId = 'activity-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('render states', () => {
    it('should render outlined heart when activity is not favorited', async () => {
      mockedUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        isLoading: false,
        handleSignin: vi.fn(),
        handleSignup: vi.fn(),
        handleLogout: vi.fn(),
      });

      const mocks: MockedResponse[] = [
        {
          request: { query: GetMyFavoritedActivityIds },
          result: { data: { getMyFavoritedActivityIds: [] } },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <FavoriteButton activityId={activityId} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('favorite-button-outlined')).toBeInTheDocument();
      });
    });

    it('should render filled red heart when activity is favorited', async () => {
      mockedUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        isLoading: false,
        handleSignin: vi.fn(),
        handleSignup: vi.fn(),
        handleLogout: vi.fn(),
      });

      const mocks: MockedResponse[] = [
        {
          request: { query: GetMyFavoritedActivityIds },
          result: { data: { getMyFavoritedActivityIds: [activityId] } },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <FavoriteButton activityId={activityId} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('favorite-button-filled')).toBeInTheDocument();
      });
    });
  });

  describe('click behavior when logged in', () => {
    it('should call toggleFavorite mutation on click when logged in', async () => {
      mockedUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        isLoading: false,
        handleSignin: vi.fn(),
        handleSignup: vi.fn(),
        handleLogout: vi.fn(),
      });

      let mutationCalled = false;
      const mocks: MockedResponse[] = [
        {
          request: { query: GetMyFavoritedActivityIds },
          result: { data: { getMyFavoritedActivityIds: [] } },
        },
        {
          request: {
            query: ToggleFavorite,
            variables: { activityId },
          },
          result: () => {
            mutationCalled = true;
            return { data: { toggleFavorite: true } };
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <FavoriteButton activityId={activityId} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('favorite-button-outlined')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mutationCalled).toBe(true);
      });
    });

    it('should show "Ajouté aux favoris" snackbar after adding', async () => {
      mockedUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        isLoading: false,
        handleSignin: vi.fn(),
        handleSignup: vi.fn(),
        handleLogout: vi.fn(),
      });

      const mocks: MockedResponse[] = [
        {
          request: { query: GetMyFavoritedActivityIds },
          result: { data: { getMyFavoritedActivityIds: [] } },
        },
        {
          request: {
            query: ToggleFavorite,
            variables: { activityId },
          },
          result: { data: { toggleFavorite: true } },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <FavoriteButton activityId={activityId} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('favorite-button-outlined')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith('Ajouté aux favoris');
      });
    });

    it('should show "Retiré des favoris" snackbar after removing', async () => {
      mockedUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        isLoading: false,
        handleSignin: vi.fn(),
        handleSignup: vi.fn(),
        handleLogout: vi.fn(),
      });

      const mocks: MockedResponse[] = [
        {
          request: { query: GetMyFavoritedActivityIds },
          result: { data: { getMyFavoritedActivityIds: [activityId] } },
        },
        {
          request: {
            query: ToggleFavorite,
            variables: { activityId },
          },
          result: { data: { toggleFavorite: false } },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <FavoriteButton activityId={activityId} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('favorite-button-filled')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith('Retiré des favoris');
      });
    });
  });

  describe('error handling', () => {
    it('should revert heart state and show error snackbar on mutation failure', async () => {
      mockedUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        isLoading: false,
        handleSignin: vi.fn(),
        handleSignup: vi.fn(),
        handleLogout: vi.fn(),
      });

      const mocks: MockedResponse[] = [
        {
          request: { query: GetMyFavoritedActivityIds },
          result: { data: { getMyFavoritedActivityIds: [] } },
        },
        {
          request: {
            query: ToggleFavorite,
            variables: { activityId },
          },
          error: new Error('Network error'),
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <FavoriteButton activityId={activityId} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('favorite-button-outlined')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button'));

      // Optimistic update should show filled heart
      await waitFor(() => {
        expect(screen.getByTestId('favorite-button-filled')).toBeInTheDocument();
      });

      // After error, should revert to outlined
      await waitFor(() => {
        expect(screen.getByTestId('favorite-button-outlined')).toBeInTheDocument();
      });

      expect(mockError).toHaveBeenCalled();
    });
  });

  describe('auth redirect', () => {
    it('should redirect to /signin on click when not logged in', async () => {
      mockedUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        handleSignin: vi.fn(),
        handleSignup: vi.fn(),
        handleLogout: vi.fn(),
      });

      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <FavoriteButton activityId={activityId} />
        </MockedProvider>
      );

      // Should render outlined heart for unauthenticated users
      expect(screen.getByTestId('favorite-button-outlined')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button'));

      expect(mockPush).toHaveBeenCalledWith('/signin');
    });

    it('should not call mutation when not logged in', async () => {
      mockedUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        handleSignin: vi.fn(),
        handleSignup: vi.fn(),
        handleLogout: vi.fn(),
      });

      let mutationCalled = false;
      const mocks: MockedResponse[] = [
        {
          request: {
            query: ToggleFavorite,
            variables: { activityId },
          },
          result: () => {
            mutationCalled = true;
            return { data: { toggleFavorite: true } };
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <FavoriteButton activityId={activityId} />
        </MockedProvider>
      );

      fireEvent.click(screen.getByRole('button'));

      // Give time for any async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mutationCalled).toBe(false);
      expect(mockPush).toHaveBeenCalledWith('/signin');
    });
  });
});
