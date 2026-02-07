import { Activity, EmptyData, PageTitle } from "@/components";
import { createSSRClient } from "@/graphql/apollo";
import {
  GetUserActivitiesQuery,
  GetUserActivitiesQueryVariables,
} from "@/graphql/generated/types";
import GetUserActivities from "@/graphql/queries/activity/getUserActivities";
import { withAuth } from "@/hocs";
import { useAuth } from "@/hooks";
import { Alert, Button, Grid, Group } from "@mantine/core";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";

interface MyActivitiesProps {
  activities: GetUserActivitiesQuery["getActivitiesByUser"];
  error?: boolean;
}

export const getServerSideProps: GetServerSideProps<
  MyActivitiesProps
> = async ({ req }) => {
  try {
    const client = createSSRClient(req.headers.cookie);
    const response = await client.query<
      GetUserActivitiesQuery,
      GetUserActivitiesQueryVariables
    >({
      query: GetUserActivities,
    });
    return { props: { activities: response.data.getActivitiesByUser } };
  } catch {
    return { props: { activities: [], error: true } };
  }
};

const MyActivities = ({ activities, error }: MyActivitiesProps) => {
  const { user } = useAuth();

  return (
    <>
      <Head>
        <title>Mes activités | CDTR</title>
      </Head>
      {error && (
        <Alert color="red" mb="md">
          Le service est temporairement indisponible. Veuillez réessayer plus
          tard.
        </Alert>
      )}
      <Group position="apart">
        <PageTitle title="Mes activités" />
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
};

export default withAuth(MyActivities);
