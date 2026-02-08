import { useAuth, useSnackbar } from '@/hooks';
import { useMutation, useQuery } from '@apollo/client';
import { ActionIcon } from '@mantine/core';
import { IconHeart, IconHeartFilled } from '@tabler/icons-react';
import { useRouter } from 'next/router';
import { useCallback, useState, useEffect } from 'react';
import ToggleFavorite from '@/graphql/mutations/favorite/toggleFavorite';
import GetMyFavoritedActivityIds from '@/graphql/queries/favorite/getMyFavoritedActivityIds';

interface FavoriteButtonProps {
  activityId: string;
}

export function FavoriteButton({ activityId }: FavoriteButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const snackbar = useSnackbar();

  // Local state for optimistic updates
  const [isFavorited, setIsFavorited] = useState(false);

  // Query for current user's favorited activity IDs
  const { data: favoritesData } = useQuery<{
    getMyFavoritedActivityIds: string[];
  }>(GetMyFavoritedActivityIds, {
    skip: !user,
    fetchPolicy: 'cache-first',
  });

  // Sync local state with server data
  useEffect(() => {
    if (favoritesData?.getMyFavoritedActivityIds) {
      setIsFavorited(
        favoritesData.getMyFavoritedActivityIds.includes(activityId)
      );
    }
  }, [favoritesData, activityId]);

  const [toggleFavorite] = useMutation<
    { toggleFavorite: boolean },
    { activityId: string }
  >(ToggleFavorite, {
    refetchQueries: ['GetMyFavorites'],
    update(cache, { data }) {
      if (!data) return;

      // Update the cache to keep all FavoriteButton instances in sync
      const existingData = cache.readQuery<{
        getMyFavoritedActivityIds: string[];
      }>({
        query: GetMyFavoritedActivityIds,
      });

      if (existingData) {
        const currentIds = existingData.getMyFavoritedActivityIds;
        const newIds = data.toggleFavorite
          ? [...currentIds, activityId]
          : currentIds.filter((id) => id !== activityId);

        cache.writeQuery({
          query: GetMyFavoritedActivityIds,
          data: { getMyFavoritedActivityIds: newIds },
        });
      }
    },
  });

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!user) {
        router.push('/signin');
        return;
      }

      // Optimistic update
      const previousState = isFavorited;
      setIsFavorited(!isFavorited);

      try {
        const result = await toggleFavorite({ variables: { activityId } });
        const wasAdded = result.data?.toggleFavorite;

        if (wasAdded) {
          snackbar.success('Ajouté aux favoris');
        } else {
          snackbar.success('Retiré des favoris');
        }
      } catch {
        // Rollback on error
        setIsFavorited(previousState);
        snackbar.error('Une erreur est survenue');
      }
    },
    [user, router, isFavorited, toggleFavorite, activityId, snackbar]
  );

  return (
    <ActionIcon
      onClick={handleClick}
      variant="transparent"
      aria-label={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      {isFavorited ? (
        <IconHeartFilled
          data-testid="favorite-button-filled"
          color="red"
          size={24}
        />
      ) : (
        <IconHeart data-testid="favorite-button-outlined" size={24} />
      )}
    </ActionIcon>
  );
}
