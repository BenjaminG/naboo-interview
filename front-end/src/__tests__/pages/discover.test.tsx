import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockQuery = vi.fn();
const mockCreateSSRClient = vi.fn(() => ({ query: mockQuery }));
const mockClientSideQuery = vi.fn();
const mockGetClientSideClient = vi.fn(() => ({ query: mockClientSideQuery }));

vi.mock("@/graphql/apollo", () => ({
  createSSRClient: (...args: unknown[]) => mockCreateSSRClient(...args),
  getClientSideClient: () => mockGetClientSideClient(),
  graphqlClient: { query: vi.fn() },
}));

vi.mock("@/hooks", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("@mantine/core", () => ({
  Box: ({ children, ...props }: { children: React.ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  Button: ({
    children,
    onClick,
    loading,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    loading?: boolean;
  }) => (
    <button onClick={onClick} disabled={loading} {...props}>
      {loading ? "Loading..." : children}
    </button>
  ),
  Grid: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Group: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Text: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

vi.mock("@/components", () => ({
  Activity: ({ activity }: { activity: { id: string; name: string } }) => (
    <div data-testid="activity">{activity.name}</div>
  ),
  EmptyData: () => <div data-testid="empty-data">Aucune donnée</div>,
  PageTitle: ({ title }: { title: string }) => <h1>{title}</h1>,
  ServiceErrorAlert: ({ show }: { show?: boolean }) =>
    show ? <div data-testid="error-alert">Erreur</div> : null,
}));

function makeActivity(id: string, name: string) {
  return {
    id,
    name,
    city: "Paris",
    description: "desc",
    price: 50,
    owner: { firstName: "John", lastName: "Doe" },
  };
}

describe("Discover Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateSSRClient.mockReturnValue({ query: mockQuery });
    mockGetClientSideClient.mockReturnValue({ query: mockClientSideQuery });
  });

  describe("getServerSideProps", () => {
    it("returns activities and total on success", async () => {
      const { getServerSideProps } = await import("@/pages/discover");
      const items = [makeActivity("1", "A1"), makeActivity("2", "A2")];
      mockQuery.mockResolvedValueOnce({
        data: { getActivities: { items, total: 45 } },
      });

      const result = await getServerSideProps({
        req: { headers: { cookie: "" } },
        res: {},
        resolvedUrl: "/discover",
        query: {},
      } as any);

      expect(result).toEqual({
        props: { activities: items, total: 45 },
      });
    });

    it("returns empty with error on failure", async () => {
      const { getServerSideProps } = await import("@/pages/discover");
      mockQuery.mockRejectedValueOnce(new Error("fail"));

      const result = await getServerSideProps({
        req: { headers: { cookie: "" } },
        res: {},
        resolvedUrl: "/discover",
        query: {},
      } as any);

      expect(result).toEqual({
        props: { activities: [], total: 0, error: true },
      });
    });
  });

  describe("Component rendering", () => {
    it("shows activities and count when items exist", async () => {
      const { default: Discover } = await import("@/pages/discover");
      const activities = [makeActivity("1", "A1"), makeActivity("2", "A2")];

      render(<Discover activities={activities} total={5} />);

      expect(screen.getAllByTestId("activity")).toHaveLength(2);
      expect(screen.getByText("2 sur 5 activités")).toBeInTheDocument();
    });

    it("shows load more button when hasMore", async () => {
      const { default: Discover } = await import("@/pages/discover");

      render(
        <Discover activities={[makeActivity("1", "A1")]} total={10} />,
      );

      expect(screen.getByText("Charger plus")).toBeInTheDocument();
    });

    it("hides load more button when all loaded", async () => {
      const { default: Discover } = await import("@/pages/discover");
      const activities = [makeActivity("1", "A1")];

      render(<Discover activities={activities} total={1} />);

      expect(screen.queryByText("Charger plus")).not.toBeInTheDocument();
      expect(screen.getByText("1 activités affichées")).toBeInTheDocument();
    });

    it("shows EmptyData when no activities", async () => {
      const { default: Discover } = await import("@/pages/discover");

      render(<Discover activities={[]} total={0} />);

      expect(screen.getByTestId("empty-data")).toBeInTheDocument();
      expect(screen.queryByText("Charger plus")).not.toBeInTheDocument();
    });
  });

  describe("Load more interaction", () => {
    it("appends new activities on load more click", async () => {
      const { default: Discover } = await import("@/pages/discover");
      const initial = [makeActivity("1", "A1")];
      const nextPage = [makeActivity("2", "A2"), makeActivity("3", "A3")];

      mockClientSideQuery.mockResolvedValueOnce({
        data: { getActivities: { items: nextPage, total: 3 } },
      });

      render(<Discover activities={initial} total={3} />);
      fireEvent.click(screen.getByText("Charger plus"));

      await waitFor(() => {
        expect(screen.getAllByTestId("activity")).toHaveLength(3);
      });
    });

    it("shows error text on load more failure", async () => {
      const { default: Discover } = await import("@/pages/discover");

      mockClientSideQuery.mockRejectedValueOnce(new Error("network"));

      render(
        <Discover activities={[makeActivity("1", "A1")]} total={10} />,
      );
      fireEvent.click(screen.getByText("Charger plus"));

      await waitFor(() => {
        expect(
          screen.getByText(/Erreur lors du chargement/),
        ).toBeInTheDocument();
      });
    });
  });
});
