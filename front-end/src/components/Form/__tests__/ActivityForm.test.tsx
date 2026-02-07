import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Track useMutation options
interface MutationOptions {
  refetchQueries?: string[];
}
let capturedMutationOptions: MutationOptions | undefined;

// Mock useMutation BEFORE importing the component
vi.mock('@apollo/client', async () => {
  const actual = await vi.importActual<typeof import('@apollo/client')>(
    '@apollo/client'
  );
  return {
    ...actual,
    useMutation: vi.fn(
      (_mutation: unknown, options?: MutationOptions) => {
        // Capture the options passed to useMutation
        capturedMutationOptions = options;
        return [vi.fn().mockResolvedValue({ data: {} }), { loading: false }];
      }
    ),
  };
});

// Mock other dependencies
vi.mock('next/router', () => ({
  useRouter: () => ({ back: vi.fn() }),
}));

vi.mock('@/hooks', () => ({
  useSnackbar: () => ({ error: vi.fn(), success: vi.fn() }),
  useDebounced: (value: string) => value,
}));

vi.mock('@/services', () => ({
  searchCity: vi.fn().mockResolvedValue([]),
}));

describe('ActivityForm cache invalidation', () => {
  beforeEach(() => {
    capturedMutationOptions = undefined;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('configures useMutation with refetchQueries option', async () => {
    // Dynamic import after mocks are set up
    const { default: ActivityForm } = await import('../ActivityForm');
    const { render } = await import('@testing-library/react');
    const { MockedProvider } = await import('@apollo/client/testing');

    render(
      <MockedProvider addTypename={false}>
        <ActivityForm />
      </MockedProvider>
    );

    // Check that useMutation was called with refetchQueries
    expect(capturedMutationOptions).toBeDefined();
    expect(capturedMutationOptions?.refetchQueries).toBeDefined();
    expect(Array.isArray(capturedMutationOptions?.refetchQueries)).toBe(true);
  });

  it('includes GetActivities in refetchQueries', async () => {
    const { default: ActivityForm } = await import('../ActivityForm');
    const { render } = await import('@testing-library/react');
    const { MockedProvider } = await import('@apollo/client/testing');

    render(
      <MockedProvider addTypename={false}>
        <ActivityForm />
      </MockedProvider>
    );

    expect(capturedMutationOptions?.refetchQueries).toContain('GetActivities');
  });

  it('includes GetLatestActivities in refetchQueries', async () => {
    const { default: ActivityForm } = await import('../ActivityForm');
    const { render } = await import('@testing-library/react');
    const { MockedProvider } = await import('@apollo/client/testing');

    render(
      <MockedProvider addTypename={false}>
        <ActivityForm />
      </MockedProvider>
    );

    expect(capturedMutationOptions?.refetchQueries).toContain('GetLatestActivities');
  });

  it('includes GetActivitiesByCity in refetchQueries', async () => {
    const { default: ActivityForm } = await import('../ActivityForm');
    const { render } = await import('@testing-library/react');
    const { MockedProvider } = await import('@apollo/client/testing');

    render(
      <MockedProvider addTypename={false}>
        <ActivityForm />
      </MockedProvider>
    );

    expect(capturedMutationOptions?.refetchQueries).toContain('GetActivitiesByCity');
  });
});
