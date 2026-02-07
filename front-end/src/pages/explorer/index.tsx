import { City, EmptyData, PageTitle } from "@/components";
import { createSSRClient } from "@/graphql/apollo";
import {
  GetCitiesQuery,
  GetCitiesQueryVariables,
} from "@/graphql/generated/types";
import GetCities from "@/graphql/queries/city/getCities";
import { Alert, Flex } from "@mantine/core";
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
  } catch {
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
      {error && (
        <Alert color="red" mb="md">
          Le service est temporairement indisponible. Veuillez réessayer plus
          tard.
        </Alert>
      )}
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
