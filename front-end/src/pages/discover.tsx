import { Activity, EmptyData, PageTitle, ServiceErrorAlert } from "@/components";
import { createSSRClient } from "@/graphql/apollo";
import {
  ActivityFragment as ActivityFragmentType,
  GetActivitiesQuery,
  GetActivitiesQueryVariables,
} from "@/graphql/generated/types";
import GetActivities from "@/graphql/queries/activity/getActivities";
import { useAuth, useLoadMore } from "@/hooks";
import { Box, Button, Grid, Group, Text } from "@mantine/core";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
const PAGE_SIZE = 15;

interface DiscoverProps {
  activities: ActivityFragmentType[];
  total: number;
  error?: boolean;
}

export const getServerSideProps: GetServerSideProps<DiscoverProps> = async ({
  req,
}) => {
  try {
    const client = createSSRClient(req.headers.cookie);
    const response = await client.query<
      GetActivitiesQuery,
      GetActivitiesQueryVariables
    >({
      query: GetActivities,
    });
    return {
      props: {
        activities: response.data.getActivities.items,
        total: response.data.getActivities.total,
      },
    };
  } catch (error) {
    console.error("Failed to fetch activities:", error);
    return { props: { activities: [], total: 0, error: true } };
  }
};

const getResult = (data: GetActivitiesQuery) => data.getActivities;

export default function Discover({ activities, total, error }: DiscoverProps) {
  const { user } = useAuth();
  const {
    items: displayedActivities,
    loadingMore,
    loadError,
    hasMore,
    loadMore,
  } = useLoadMore<GetActivitiesQuery, ActivityFragmentType>({
    query: GetActivities,
    initialItems: activities,
    initialTotal: total,
    pageSize: PAGE_SIZE,
    getResult,
  });

  return (
    <>
      <Head>
        <title>Discover | CDTR</title>
      </Head>
      <ServiceErrorAlert show={error} />
      <Group position="apart">
        <PageTitle title="Découvrez des activités" />
        {user && (
          <Link href="/activities/create">
            <Button>Ajouter une activité</Button>
          </Link>
        )}
      </Group>
      <Grid>
        {displayedActivities.length > 0 ? (
          displayedActivities.map((activity) => (
            <Activity activity={activity} key={activity.id} />
          ))
        ) : (
          <EmptyData />
        )}
      </Grid>
      {displayedActivities.length > 0 && (
        <Box mt="xl" mb="md" sx={{ textAlign: "center" }}>
          <Text color="dimmed" size="sm" mb="sm">
            {hasMore
              ? `${displayedActivities.length} sur ${total} activités`
              : `${total} activités affichées`}
          </Text>
          {loadError && (
            <Text color="red" size="sm" mb="sm">
              Erreur lors du chargement. Veuillez réessayer.
            </Text>
          )}
          {hasMore && (
            <Button
              variant="outline"
              color="teal"
              size="md"
              radius="xl"
              loading={loadingMore}
              onClick={loadMore}
              sx={(theme) => ({
                paddingLeft: `calc(${theme.spacing.xl} * 2)`,
                paddingRight: `calc(${theme.spacing.xl} * 2)`,
                borderWidth: 2,
                "&:hover": {
                  backgroundColor: theme.colors.teal[0],
                },
              })}
            >
              Charger plus
            </Button>
          )}
        </Box>
      )}
    </>
  );
}
