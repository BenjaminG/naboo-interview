import { Activity, EmptyData, PageTitle, ServiceErrorAlert } from "@/components";
import { createSSRClient } from "@/graphql/apollo";
import {
  GetActivitiesQuery,
  GetActivitiesQueryVariables,
} from "@/graphql/generated/types";
import GetActivities from "@/graphql/queries/activity/getActivities";
import { useAuth } from "@/hooks";
import { Button, Grid, Group } from "@mantine/core";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";

interface DiscoverProps {
  activities: GetActivitiesQuery["getActivities"];
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
    return { props: { activities: response.data.getActivities } };
  } catch (error) {
    console.error("Failed to fetch activities:", error);
    return { props: { activities: [], error: true } };
  }
};

export default function Discover({ activities, error }: DiscoverProps) {
  const { user } = useAuth();

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
        {activities.length > 0 ? (
          activities.map((activity) => (
            <Activity activity={activity} key={activity.id} />
          ))
        ) : (
          <EmptyData />
        )}
      </Grid>
    </>
  );
}
