import {
  ActivityListItem,
  EmptyData,
  Filters,
  PageTitle,
  ServiceErrorAlert,
} from "@/components";
import { createSSRClient } from "@/graphql/apollo";
import {
  ActivityFragment as ActivityFragmentType,
  GetActivitiesByCityQuery,
  GetActivitiesByCityQueryVariables,
} from "@/graphql/generated/types";
import GetActivitiesByCity from "@/graphql/queries/activity/getActivitiesByCity";
import { useDebounced } from "@/hooks";
import { Box, Divider, Flex, Grid, Loader } from "@mantine/core";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import { Fragment, useEffect, useState } from "react";

interface CityDetailsProps {
  activities: ActivityFragmentType[];
  city: string;
  error?: boolean;
}

export const getServerSideProps: GetServerSideProps<CityDetailsProps> = async ({
  params,
  query,
  req,
}) => {
  if (!params?.city || Array.isArray(params.city)) return { notFound: true };

  if (
    (query.activity && Array.isArray(query.activity)) ||
    (query.price && Array.isArray(query.price))
  )
    return { notFound: true };

  try {
    const client = createSSRClient(req.headers.cookie);
    const response = await client.query<
      GetActivitiesByCityQuery,
      GetActivitiesByCityQueryVariables
    >({
      query: GetActivitiesByCity,
      variables: {
        city: params.city,
        activity: query.activity || null,
        price: query.price ? Number(query.price) : null,
      },
    });
    return {
      props: {
        activities: response.data.getActivitiesByCity.items,
        city: params.city,
      },
    };
  } catch (error) {
    console.error("Failed to fetch activities by city:", error);
    return {
      props: { activities: [], city: params.city, error: true },
    };
  }
};

export default function ActivityDetails({
  activities,
  city,
  error,
}: CityDetailsProps) {
  const searchParams = useSearchParams();

  const [searchActivity, setSearchActivity] = useState<string | undefined>(
    searchParams?.get("activity") || undefined
  );
  const debouncedSearchActivity = useDebounced(searchActivity, 300);

  const [searchPrice, setSearchPrice] = useState<number | undefined>(
    searchParams?.get("price") ? Number(searchParams.get("price")) : undefined
  );
  const debouncedSearchPrice = useDebounced(searchPrice, 300);

  const [hasFilterChanged, setHasFilterChanged] = useState(false);

  useEffect(() => {
    setHasFilterChanged(true);
  }, [debouncedSearchActivity, debouncedSearchPrice]);

  const {
    data: clientData,
    loading: clientLoading,
    error: clientError,
  } = useQuery<GetActivitiesByCityQuery, GetActivitiesByCityQueryVariables>(
    GetActivitiesByCity,
    {
      skip: !hasFilterChanged,
      variables: {
        city,
        activity: debouncedSearchActivity || null,
        price: debouncedSearchPrice ?? null,
      },
    }
  );

  const displayActivities =
    hasFilterChanged && clientData
      ? clientData.getActivitiesByCity.items
      : activities;

  const displayError = error || !!clientError;

  return (
    <>
      <Head>
        <title>{city} | CDTR</title>
      </Head>
      <PageTitle
        title={`Activités pour la ville de ${city}`}
        prevPath="/explorer"
      />
      <ServiceErrorAlert show={displayError} />
      <Grid>
        <Grid.Col span={4}>
          <Filters
            {...{
              activity: searchActivity,
              price: searchPrice,
              setSearchActivity,
              setSearchPrice,
            }}
          />
        </Grid.Col>
        <Grid.Col span={8}>
          {clientLoading ? (
            <Box sx={{ textAlign: "center", marginTop: "2rem" }}>
              <Loader />
            </Box>
          ) : (
            <Flex direction="column" gap="lg">
              {displayActivities.length > 0 ? (
                displayActivities.map((activity, idx) => (
                  <Fragment key={activity.id}>
                    <ActivityListItem activity={activity} />
                    {idx < displayActivities.length - 1 && (
                      <Divider my="sm" />
                    )}
                  </Fragment>
                ))
              ) : (
                <EmptyData />
              )}
            </Flex>
          )}
        </Grid.Col>
      </Grid>
    </>
  );
}
