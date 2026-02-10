import { useMutation, useQuery } from '@apollo/client';
import {
  Card,
  Center,
  Flex,
  Grid,
  Loader,
  Text,
  Title,
  ActionIcon,
} from '@mantine/core';
import Link from 'next/link';
import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconGripVertical } from '@tabler/icons-react';
import { FavoriteButton } from '../FavoriteButton';
import GetMyFavorites from '@/graphql/queries/favorite/getMyFavorites';
import ReorderFavorites from '@/graphql/mutations/favorite/reorderFavorites';
import type {
  GetMyFavoritesQuery,
  ReorderFavoritesMutation,
  ReorderFavoritesMutationVariables,
} from '@/graphql/generated/types';
import { useSnackbar } from '@/hooks';

type FavoriteItem = GetMyFavoritesQuery['getMyFavorites'][number];

interface SortableItemProps {
  favorite: FavoriteItem;
}

interface FavoriteCardProps {
  favorite: FavoriteItem;
  dragHandleProps?: Record<string, unknown>;
}

function FavoriteCard({ favorite, dragHandleProps }: FavoriteCardProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Flex justify="space-between" align="flex-start">
        <ActionIcon
          variant="subtle"
          color="gray"
          {...dragHandleProps}
          data-testid="drag-handle"
          style={{ cursor: 'grab', marginRight: 8 }}
        >
          <IconGripVertical size={18} />
        </ActionIcon>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Title order={3} size="h5" mb="xs" lineClamp={1}>
            {favorite.activity.name}
          </Title>
          <Text size="sm" color="dimmed" lineClamp={2} mb="sm">
            {favorite.activity.description}
          </Text>
          <Flex gap="xs">
            <Text size="xs" color="dimmed">
              {favorite.activity.city}
            </Text>
            <Text size="xs" color="dimmed">
              {favorite.activity.price}€/j
            </Text>
          </Flex>
        </div>
        <FavoriteButton activityId={favorite.activity.id} />
      </Flex>
      <Link
        href={`/activities/${favorite.activity.id}`}
        style={{ textDecoration: 'none' }}
      >
        <Text color="blue" size="sm" mt="sm">
          Voir plus
        </Text>
      </Link>
    </Card>
  );
}

function SortableItem({ favorite }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: favorite.activity.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <Grid.Col span={6} ref={setNodeRef} style={style}>
      <FavoriteCard
        favorite={favorite}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </Grid.Col>
  );
}

export function FavoriteList() {
  const { error: showError } = useSnackbar();
  const { data, loading } = useQuery<GetMyFavoritesQuery>(GetMyFavorites, {
    fetchPolicy: 'cache-and-network',
  });
  const [localFavorites, setLocalFavorites] = useState<FavoriteItem[] | null>(
    null
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const [reorderFavorites] = useMutation<
    ReorderFavoritesMutation,
    ReorderFavoritesMutationVariables
  >(ReorderFavorites);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const favorites = localFavorites ?? data?.getMyFavorites ?? [];

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = favorites.findIndex((f) => f.activity.id === active.id);
    const newIndex = favorites.findIndex((f) => f.activity.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reordered = [...favorites];
    const [removed] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, removed);

    setLocalFavorites(reordered);

    const activityIds = reordered.map((f) => f.activity.id);

    try {
      await reorderFavorites({
        variables: { activityIds },
        update(cache, { data: mutationData }) {
          if (mutationData?.reorderFavorites) {
            cache.writeQuery({
              query: GetMyFavorites,
              data: { getMyFavorites: mutationData.reorderFavorites },
            });
            setLocalFavorites(null);
          }
        },
      });
    } catch {
      setLocalFavorites(null);
      showError('Impossible de réordonner les favoris');
    }
  };

  if (loading) {
    return (
      <Center py="xl" data-testid="favorites-loading">
        <Loader size="lg" />
      </Center>
    );
  }

  if (favorites.length === 0) {
    return (
      <Center py="xl">
        <Flex direction="column" align="center" gap="sm">
          <Text color="dimmed">Vous n&apos;avez pas encore de favoris</Text>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Text color="blue" size="sm">
              Explorez les activités
            </Text>
          </Link>
        </Flex>
      </Center>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={favorites.map((f) => f.activity.id)}
        strategy={rectSortingStrategy}
      >
        <Grid>
          {favorites.map((favorite) => (
            <SortableItem key={favorite.id} favorite={favorite} />
          ))}
        </Grid>
      </SortableContext>
      <DragOverlay>
        {activeId
          ? (() => {
              const activeFavorite = favorites.find(
                (f) => f.activity.id === activeId
              );
              return activeFavorite ? (
                <FavoriteCard favorite={activeFavorite} />
              ) : null;
            })()
          : null}
      </DragOverlay>
    </DndContext>
  );
}
