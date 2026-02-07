import { City, EmptyData, PageTitle, ServiceErrorAlert } from "@/components";
import { createSSRClient } from "@/graphql/apollo";
import {
  GetCitiesQuery,
  GetCitiesQueryVariables,
} from "@/graphql/generated/types";
import GetCities from "@/graphql/queries/city/getCities";
import { Flex } from "@mantine/core";
import { GetServerSideProps } from "next";
import Head from "next/head";

interface ExplorerProps {
  cities: GetCitiesQuery["getCities"];
  error?: boolean;
}

export const getServerSideProps: GetServerSideProps<ExplorerProps> = async ({
  req,
}) => {
  try {
    const client = createSSRClient(req.headers.cookie);
    const response = await client.query<
      GetCitiesQuery,
      GetCitiesQueryVariables
    >({
      query: GetCities,
    });
    return { props: { cities: response.data.getCities } };
  } catch (error) {
    console.error("[SSR] Failed to fetch cities:", error);
    return { props: { cities: [], error: true } };
  }
};

export default function Explorer({ cities, error }: ExplorerProps) {
  return (
    <>
      <Head>
        <title>Explorer | CDTR</title>
      </Head>
      <PageTitle title="Trouvez une activité dans votre ville" />
      <ServiceErrorAlert show={error} />
      <Flex direction="column" gap="1rem">
        {cities.length > 0 ? (
          cities.map((city) => <City city={city} key={city} />)
        ) : (
          <EmptyData />
        )}
      </Flex>
    </>
  );
}
