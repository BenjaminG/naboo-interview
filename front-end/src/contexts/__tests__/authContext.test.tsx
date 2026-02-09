import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { AuthProvider, AuthContext } from '../authContext';
import Signin from '@/graphql/mutations/auth/signin';
import Logout from '@/graphql/mutations/auth/logout';
import GetUser from '@/graphql/queries/auth/getUser';
import { useContext } from 'react';

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock useSnackbar hook
vi.mock('@/hooks', () => ({
  useSnackbar: () => ({
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

const LOCAL_STORAGE_KEY = 'isLoggedIn';

const mockUser = {
  id: '1',
  email: 'test@test.fr',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
};

function createMockSigninResponse(): MockedResponse {
  return {
    request: {
      query: Signin,
      variables: {
        signInInput: {
          email: 'test@test.fr',
          password: 'password123',
        },
      },
    },
    result: {
      data: {
        login: {
          access_token: 'jwt-token-here',
        },
      },
    },
  };
}

function createMockGetUserResponse(): MockedResponse {
  return {
    request: {
      query: GetUser,
    },
    result: {
      data: {
        getMe: mockUser,
      },
    },
  };
}

function createMockLogoutResponse(): MockedResponse {
  return {
    request: {
      query: Logout,
    },
    result: {
      data: {
        logout: true,
      },
    },
  };
}

// Test component that triggers signin action
function SigninTestComponent() {
  const { handleSignin } = useContext(AuthContext);

  const doSignin = () => {
    handleSignin({ email: 'test@test.fr', password: 'password123' });
  };

  return (
    <button data-testid="signin-btn" onClick={doSignin}>
      Sign In
    </button>
  );
}

// Test component that triggers logout action
function LogoutTestComponent() {
  const { handleLogout } = useContext(AuthContext);

  const doLogout = () => {
    handleLogout();
  };

  return (
    <button data-testid="logout-btn" onClick={doLogout}>
      Logout
    </button>
  );
}

// Test component that displays user
function UserDisplayComponent() {
  const { user, isLoading } = useContext(AuthContext);

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
    </div>
  );
}

describe('AuthContext localStorage behavior', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('handleSignin', () => {
    it('stores "isLoggedIn" key (not "token") after sign-in', async () => {
      render(
        <MockedProvider
          mocks={[createMockSigninResponse(), createMockGetUserResponse()]}
          addTypename={false}
        >
          <AuthProvider>
            <SigninTestComponent />
          </AuthProvider>
        </MockedProvider>
      );

      // Trigger signin
      fireEvent.click(screen.getByTestId('signin-btn'));

      // Wait for async operations to complete
      await waitFor(
        () => {
          // Should have "isLoggedIn" key
          expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBe('true');
        },
        { timeout: 3000 }
      );

      // Should NOT have "token" key
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('stores "true" as the localStorage value (not a JWT)', async () => {
      render(
        <MockedProvider
          mocks={[createMockSigninResponse(), createMockGetUserResponse()]}
          addTypename={false}
        >
          <AuthProvider>
            <SigninTestComponent />
          </AuthProvider>
        </MockedProvider>
      );

      // Trigger signin
      fireEvent.click(screen.getByTestId('signin-btn'));

      // Wait for async operations to complete
      await waitFor(
        () => {
          const storedValue = localStorage.getItem(LOCAL_STORAGE_KEY);
          // Should be the string "true", not a JWT token
          expect(storedValue).toBe('true');
        },
        { timeout: 3000 }
      );

      const storedValue = localStorage.getItem(LOCAL_STORAGE_KEY);
      // Verify it's NOT a JWT (JWTs have dots separating parts)
      expect(storedValue).not.toContain('.');
    });
  });

  describe('handleLogout', () => {
    it('removes "isLoggedIn" from localStorage after logout', async () => {
      // Pre-set the isLoggedIn flag
      localStorage.setItem(LOCAL_STORAGE_KEY, 'true');

      render(
        <MockedProvider mocks={[createMockLogoutResponse()]} addTypename={false}>
          <AuthProvider>
            <LogoutTestComponent />
          </AuthProvider>
        </MockedProvider>
      );

      // Trigger logout
      fireEvent.click(screen.getByTestId('logout-btn'));

      // Wait for async operations to complete
      await waitFor(
        () => {
          // isLoggedIn should be removed
          expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBeNull();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('initial useEffect', () => {
    it('calls getMe query when isLoggedIn flag is present on page load', async () => {
      // Pre-set the isLoggedIn flag to simulate a returning user
      localStorage.setItem(LOCAL_STORAGE_KEY, 'true');

      render(
        <MockedProvider mocks={[createMockGetUserResponse()]} addTypename={false}>
          <AuthProvider>
            <UserDisplayComponent />
          </AuthProvider>
        </MockedProvider>
      );

      // Wait for the getMe query to resolve and update user state
      await waitFor(
        () => {
          expect(screen.getByTestId('user').textContent).toBe('test@test.fr');
        },
        { timeout: 3000 }
      );
    });

    it('does NOT call getMe query when isLoggedIn flag is absent', async () => {
      // No localStorage flag set
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <AuthProvider>
            <UserDisplayComponent />
          </AuthProvider>
        </MockedProvider>
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('not-loading');
      });

      // Should show no user since no flag is present
      expect(screen.getByTestId('user').textContent).toBe('no-user');
    });
  });
});
