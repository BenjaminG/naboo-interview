import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import type { DragEndEvent } from '@dnd-kit/core';

// Mock router
const mockRouter = { push: vi.fn() };
vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

// Mock snackbar
const mockSuccess = vi.fn();
const mockError = vi.fn();
vi.mock('@/hooks', () => ({
  useAuth: vi.fn(),
  useSnackbar: () => ({ success: mockSuccess, error: mockError }),
}));

// Mock @dnd-kit/core
let capturedOnDragEnd: ((event: DragEndEvent) => void) | null = null;
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({
    children,
    onDragEnd,
  }: {
    children: React.ReactNode;
    onDragEnd: (event: DragEndEvent) => void;
  }) => {
    capturedOnDragEnd = onDragEnd;
    return <div data-testid="dnd-context">{children}</div>;
  },
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
}));

// Mock @dnd-kit/sortable
vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
  verticalListSortingStrategy: 'verticalListSortingStrategy',
}));

// Mock @dnd-kit/utilities
vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => ''),
    },
  },
}));

import { useAuth } from '@/hooks';
import { FavoriteList } from './FavoriteList';
import GetMyFavorites from '@/graphql/queries/favorite/getMyFavorites';
import GetMyFavoritedActivityIds from '@/graphql/queries/favorite/getMyFavoritedActivityIds';
import ReorderFavorites from '@/graphql/mutations/favorite/reorderFavorites';

const mockedUseAuth = vi.mocked(useAuth);

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
      owner: { __typename: 'User', firstName: 'Test', lastName: 'Owner' },
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
      owner: { __typename: 'User', firstName: 'Test', lastName: 'Owner' },
    },
  },
  {
    __typename: 'Favorite',
    id: 'fav-3',
    order: 2,
    createdAt: '2026-02-08T12:00:00Z',
    activity: {
      __typename: 'Activity',
      id: 'activity-3',
      name: 'Activity Three',
      description: 'Description three',
      city: 'Marseille',
      price: 100,
      owner: { __typename: 'User', firstName: 'Test', lastName: 'Owner' },
    },
  },
];

const createBaseMocks = (favorites = mockFavorites): MockedResponse[] => [
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

describe('FavoriteList - Drag and Drop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnDragEnd = null;
    mockedUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
      },
      isLoading: false,
      handleSignin: vi.fn(),
      handleSignup: vi.fn(),
      handleLogout: vi.fn(),
    });
  });

  describe('DnD setup', () => {
    it('should render with DndContext and SortableContext', async () => {
      const mocks = createBaseMocks();

      render(
        <MockedProvider mocks={mocks}>
          <FavoriteList />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
        expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
      });
    });

    it('should render draggable favorite items', async () => {
      const mocks = createBaseMocks();

      render(
        <MockedProvider mocks={mocks}>
          <FavoriteList />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Activity One')).toBeInTheDocument();
        expect(screen.getByText('Activity Two')).toBeInTheDocument();
        expect(screen.getByText('Activity Three')).toBeInTheDocument();
      });

      // Each item should have a drag handle
      const dragHandles = screen.getAllByTestId('drag-handle');
      expect(dragHandles).toHaveLength(3);
    });
  });

  describe('Reorder functionality', () => {
    it('should call reorderFavorites mutation on drag end', async () => {
      let mutationCalled = false;
      const reorderedFavorites = [
        mockFavorites[1], // activity-2 now first
        mockFavorites[0], // activity-1 now second
        mockFavorites[2], // activity-3 stays third
      ].map((f, idx) => ({ ...f, order: idx }));

      const mocks: MockedResponse[] = [
        ...createBaseMocks(),
        {
          request: {
            query: ReorderFavorites,
            variables: {
              activityIds: ['activity-2', 'activity-1', 'activity-3'],
            },
          },
          result: () => {
            mutationCalled = true;
            return { data: { reorderFavorites: reorderedFavorites } };
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <FavoriteList />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Activity One')).toBeInTheDocument();
      });

      // Simulate drag end: move activity-1 (index 0) to position after activity-2 (index 1)
      expect(capturedOnDragEnd).not.toBeNull();
      capturedOnDragEnd!({
        active: { id: 'activity-1' },
        over: { id: 'activity-2' },
      } as DragEndEvent);

      await waitFor(() => {
        expect(mutationCalled).toBe(true);
      });
    });

    it('should apply optimistic update immediately on drag end', async () => {
      const reorderedFavorites = [
        mockFavorites[1],
        mockFavorites[0],
        mockFavorites[2],
      ].map((f, idx) => ({ ...f, order: idx }));

      const mocks: MockedResponse[] = [
        ...createBaseMocks(),
        {
          request: {
            query: ReorderFavorites,
            variables: {
              activityIds: ['activity-2', 'activity-1', 'activity-3'],
            },
          },
          result: { data: { reorderFavorites: reorderedFavorites } },
          delay: 500, // Add delay to test optimistic update
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <FavoriteList />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Activity One')).toBeInTheDocument();
      });

      // Get initial order
      let headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings[0]).toHaveTextContent('Activity One');
      expect(headings[1]).toHaveTextContent('Activity Two');

      // Trigger drag end
      capturedOnDragEnd!({
        active: { id: 'activity-1' },
        over: { id: 'activity-2' },
      } as DragEndEvent);

      // Optimistic update should reorder immediately
      await waitFor(() => {
        headings = screen.getAllByRole('heading', { level: 3 });
        expect(headings[0]).toHaveTextContent('Activity Two');
        expect(headings[1]).toHaveTextContent('Activity One');
      });
    });

    it('should not call mutation when dropping at same position', async () => {
      let mutationCalled = false;
      const mocks: MockedResponse[] = [
        ...createBaseMocks(),
        {
          request: {
            query: ReorderFavorites,
            variables: { activityIds: expect.any(Array) },
          },
          result: () => {
            mutationCalled = true;
            return { data: { reorderFavorites: mockFavorites } };
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <FavoriteList />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Activity One')).toBeInTheDocument();
      });

      // Simulate dropping at same position (no over target)
      capturedOnDragEnd!({
        active: { id: 'activity-1' },
        over: null,
      } as unknown as DragEndEvent);

      // Give time for any async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mutationCalled).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should revert to previous order on mutation failure', async () => {
      const mocks: MockedResponse[] = [
        ...createBaseMocks(),
        {
          request: {
            query: ReorderFavorites,
            variables: {
              activityIds: ['activity-2', 'activity-1', 'activity-3'],
            },
          },
          error: new Error('Network error'),
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <FavoriteList />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Activity One')).toBeInTheDocument();
      });

      // Trigger drag end
      capturedOnDragEnd!({
        active: { id: 'activity-1' },
        over: { id: 'activity-2' },
      } as DragEndEvent);

      // After error, should revert to original order
      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 3 });
        expect(headings[0]).toHaveTextContent('Activity One');
        expect(headings[1]).toHaveTextContent('Activity Two');
      });
    });

    it('should show error snackbar on mutation failure', async () => {
      const mocks: MockedResponse[] = [
        ...createBaseMocks(),
        {
          request: {
            query: ReorderFavorites,
            variables: {
              activityIds: ['activity-2', 'activity-1', 'activity-3'],
            },
          },
          error: new Error('Network error'),
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <FavoriteList />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Activity One')).toBeInTheDocument();
      });

      // Trigger drag end
      capturedOnDragEnd!({
        active: { id: 'activity-1' },
        over: { id: 'activity-2' },
      } as DragEndEvent);

      await waitFor(() => {
        expect(mockError).toHaveBeenCalled();
      });
    });
  });

  describe('Unfavorite from list', () => {
    it('should render FavoriteButton for each item to allow unfavoriting', async () => {
      const mocks = createBaseMocks();

      render(
        <MockedProvider mocks={mocks}>
          <FavoriteList />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Activity One')).toBeInTheDocument();
      });

      // Each item should have a favorite button
      const favoriteButtons = screen.getAllByRole('button');
      // At least 3 favorite buttons (one per item)
      expect(favoriteButtons.length).toBeGreaterThanOrEqual(3);
    });
  });
});
