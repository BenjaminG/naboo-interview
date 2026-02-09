import { Activity, EmptyData, PageTitle, ServiceErrorAlert } from "@/components";
import { createSSRClient, getClientSideClient } from "@/graphql/apollo";
import {
  ActivityFragment as ActivityFragmentType,
  GetActivitiesQuery,
  GetActivitiesQueryVariables,
} from "@/graphql/generated/types";
import GetActivities from "@/graphql/queries/activity/getActivities";
import { useAuth } from "@/hooks";
import { Box, Button, Grid, Group, Text } from "@mantine/core";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";

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

export default function Discover({ activities, total, error }: DiscoverProps) {
  const { user } = useAuth();
  const [displayedActivities, setDisplayedActivities] =
    useState<ActivityFragmentType[]>(activities);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setDisplayedActivities(activities);
    setLoadError(false);
  }, [activities]);

  const hasMore = displayedActivities.length < total;

  const handleLoadMore = async () => {
    setLoadingMore(true);
    setLoadError(false);
    try {
      const client = getClientSideClient();
      const { data } = await client.query<
        GetActivitiesQuery,
        GetActivitiesQueryVariables
      >({
        query: GetActivities,
        variables: {
          limit: PAGE_SIZE,
          offset: displayedActivities.length,
        },
        fetchPolicy: "network-only",
      });
      setDisplayedActivities((prev) => [
        ...prev,
        ...data.getActivities.items,
      ]);
    } catch (err) {
      console.error("Failed to load more activities:", err);
      setLoadError(true);
    } finally {
      setLoadingMore(false);
    }
  };

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
              onClick={handleLoadMore}
              sx={(theme) => ({
                paddingLeft: theme.spacing.xl * 2,
                paddingRight: theme.spacing.xl * 2,
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
