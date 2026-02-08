import { PageTitle } from '@/components';
import { withAuth } from '@/hocs';
import { useAuth } from '@/hooks';
import { Avatar, Center, Flex, Loader, Tabs, Text } from '@mantine/core';
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

const Profile = () => {
  const { user } = useAuth();

  return (
    <>
      <Head>
        <title>Mon profil | CDTR</title>
      </Head>
      <PageTitle title="Mon profil" />
      <Tabs defaultValue="profile">
        <Tabs.List mb="lg">
          <Tabs.Tab value="profile">Mon profil</Tabs.Tab>
          <Tabs.Tab value="favorites">Mes favoris</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="profile">
          <Flex align="center" gap="md">
            <Avatar color="cyan" radius="xl" size="lg">
              {user?.firstName[0]}
              {user?.lastName[0]}
            </Avatar>
            <Flex direction="column">
              <Text>{user?.email}</Text>
              <Text>{user?.firstName}</Text>
              <Text>{user?.lastName}</Text>
            </Flex>
          </Flex>
        </Tabs.Panel>

        <Tabs.Panel value="favorites">
          <FavoriteList />
        </Tabs.Panel>
      </Tabs>
    </>
  );
};

export default withAuth(Profile);
