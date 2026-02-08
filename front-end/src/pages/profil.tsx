import { PageTitle } from '@/components';
import { FavoriteList } from '@/components/FavoriteList';
import { withAuth } from '@/hocs';
import { useAuth } from '@/hooks';
import { Avatar, Flex, Tabs, Text } from '@mantine/core';
import Head from 'next/head';

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
