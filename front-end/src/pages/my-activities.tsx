import { Activity, EmptyData, PageTitle } from "@/components";
import {
  GetUserActivitiesQuery,
  GetUserActivitiesQueryVariables,
} from "@/graphql/generated/types";
import GetUserActivities from "@/graphql/queries/activity/getUserActivities";
import { withAuth } from "@/hocs";
import { useAuth } from "@/hooks";
import { Alert, Box, Button, Grid, Group, Loader } from "@mantine/core";
import { useQuery } from "@apollo/client";
import Head from "next/head";
import Link from "next/link";

const MyActivities = () => {
  const { user } = useAuth();
  const { data, loading, error } = useQuery<
    GetUserActivitiesQuery,
    GetUserActivitiesQueryVariables
  >(GetUserActivities);

  const activities = data?.getActivitiesByUser ?? [];

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
      {loading ? (
        <Box sx={{ textAlign: "center", marginTop: "2rem" }}>
          <Loader />
        </Box>
      ) : (
        <Grid>
          {activities.length > 0 ? (
            activities.map((activity) => (
              <Activity activity={activity} key={activity.id} />
            ))
          ) : (
            <EmptyData />
          )}
        </Grid>
      )}
    </>
  );
};

export default withAuth(MyActivities);
