import { useAuth } from "@/hooks";
import {
  Burger,
  Container,
  Drawer,
  Group,
  Header,
  NavLink,
  Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { MenuItem } from "./MenuItem";
import { useTopbarStyles } from "./Topbar.styles";
import { getFilteredRoutes } from "./getFilteredRoutes";
import { Route } from "./types";

interface TopbarProps {
  routes: Route[];
}

export function Topbar({ routes }: TopbarProps) {
  const [opened, { toggle, close }] = useDisclosure(false);
  const { classes } = useTopbarStyles();
  const { user } = useAuth();
  const filteredRoutes = getFilteredRoutes(routes, user);

  const handleDrawerLinkClick = () => {
    close();
  };

  return (
    <>
      <Header height={56} className={classes.header}>
        <Container>
          <div className={classes.inner}>
            <Link href="/" className={classes.mainLink}>
              <h1 className={classes.title} data-testid="header">
                Candidator
              </h1>
            </Link>
            <Group spacing={5} className={classes.links}>
              {filteredRoutes.map((route) => (
                <MenuItem key={route.label} {...route} />
              ))}
            </Group>
            <Burger
              opened={opened}
              onClick={toggle}
              className={classes.burger}
              size="sm"
              color="#fff"
            />
          </div>
        </Container>
      </Header>

      <Drawer
        opened={opened}
        onClose={close}
        size="xs"
        padding="md"
        title="Navigation"
        zIndex={1000}
      >
        <Stack spacing="xs">
          {filteredRoutes.map((route) =>
            typeof route.route === "string" ? (
              <NavLink
                key={route.label}
                label={route.label}
                component={Link}
                href={route.route}
                onClick={handleDrawerLinkClick}
              />
            ) : (
              route.route.map((subRoute) => (
                <NavLink
                  key={subRoute.link}
                  label={subRoute.label}
                  component={Link}
                  href={subRoute.link}
                  onClick={handleDrawerLinkClick}
                />
              ))
            )
          )}
        </Stack>
      </Drawer>
    </>
  );
}
