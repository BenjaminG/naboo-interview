import { PageTitle } from '@/components';
import { withAuth } from '@/hocs';
import { Center, Loader } from '@mantine/core';
import dynamic from 'next/dynamic';
import Head from 'next/head';

const FavoriteList = dynamic(
  () => import('@/components/FavoriteList').then((mod) => mod.FavoriteList),
  {
    loading: () => (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    ),
    ssr: false,
  }
);

const Favorites = () => {
  return (
    <>
      <Head>
        <title>Mes favoris | CDTR</title>
      </Head>
      <PageTitle title="Mes favoris" />
      <FavoriteList />
    </>
  );
};

export default withAuth(Favorites);
