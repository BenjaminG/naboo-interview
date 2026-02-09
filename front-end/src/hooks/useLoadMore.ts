import { DocumentNode } from "graphql";
import { useCallback, useEffect, useState } from "react";
import { getClientSideClient } from "@/graphql/apollo";

interface PaginatedResult<TItem> {
  items: TItem[];
  total: number;
}

interface UseLoadMoreOptions<TQuery, TItem> {
  query: DocumentNode;
  initialItems: TItem[];
  initialTotal: number;
  pageSize: number;
  getResult: (data: TQuery) => PaginatedResult<TItem>;
}

interface UseLoadMoreReturn<TItem> {
  items: TItem[];
  total: number;
  loadingMore: boolean;
  loadError: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

export function useLoadMore<TQuery, TItem>({
  query,
  initialItems,
  initialTotal,
  pageSize,
  getResult,
}: UseLoadMoreOptions<TQuery, TItem>): UseLoadMoreReturn<TItem> {
  const [items, setItems] = useState<TItem[]>(initialItems);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setItems(initialItems);
    setLoadError(false);
  }, [initialItems]);

  const hasMore = items.length < initialTotal;

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    setLoadError(false);
    try {
      const client = getClientSideClient();
      const { data } = await client.query<TQuery>({
        query,
        variables: {
          limit: pageSize,
          offset: items.length,
        },
        fetchPolicy: "network-only",
      });
      const result = getResult(data);
      setItems((prev) => [...prev, ...result.items]);
    } catch (err) {
      console.error("Failed to load more:", err);
      setLoadError(true);
    } finally {
      setLoadingMore(false);
    }
  }, [query, pageSize, items.length, getResult]);

  return {
    items,
    total: initialTotal,
    loadingMore,
    loadError,
    hasMore,
    loadMore,
  };
}
