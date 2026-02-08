import { useQuery } from '@apollo/client';
import { Card, Center, Flex, Grid, Loader, Text, Title } from '@mantine/core';
import Link from 'next/link';
import { FavoriteButton } from '../FavoriteButton';
import GetMyFavorites from '@/graphql/queries/favorite/getMyFavorites';
import type { GetMyFavoritesQuery } from '@/graphql/generated/types';

export function FavoriteList() {
  const { data, loading } = useQuery<GetMyFavoritesQuery>(GetMyFavorites);

  if (loading) {
    return (
      <Center py="xl" data-testid="favorites-loading">
        <Loader size="lg" />
      </Center>
    );
  }

  const favorites = data?.getMyFavorites ?? [];

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
    <Grid>
      {favorites.map((favorite) => (
        <Grid.Col span={6} key={favorite.id}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Flex justify="space-between" align="flex-start">
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
        </Grid.Col>
      ))}
    </Grid>
  );
}
