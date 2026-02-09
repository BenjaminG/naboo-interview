import { useAuth } from "@/hooks";
import { ActionIcon, Center, Group, Menu, useMantineTheme } from "@mantine/core";
import { IconChevronDown, IconLogout, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import { DebugToggle } from "./DebugToggle";
import { useTopbarStyles } from "./Topbar.styles";
import { Route } from "./types";

const MENU_ITEM_ICONS: Record<string, typeof IconUser> = {
  "/profil": IconUser,
  "/logout": IconLogout,
};

export function MenuItem({ route, label, icon }: Route) {
  const Icon = icon;
  const { classes } = useTopbarStyles();
  const theme = useMantineTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return typeof route === "string" ? (
    <Link href={route} className={classes.link}>
      {Icon ? (
        <ActionIcon>
          <Icon size="1.125rem" />
        </ActionIcon>
      ) : (
        label
      )}
    </Link>
  ) : (
    <Menu
      key={label}
      trigger="hover"
      transitionProps={{ exitDuration: 0 }}
      withinPortal
    >
      <Menu.Target>
        <p className={classes.link}>
          {Icon ? (
            <Icon size="1.25rem" />
          ) : (
            <Center>
              <span className={classes.linkLabel}>{label}</span>
              <IconChevronDown size="0.9rem" stroke={1.5} />
            </Center>
          )}
        </p>
      </Menu.Target>
      <Menu.Dropdown>
        {route.map((item, index) => {
          const isLogoutItem = item.link === "/logout";
          const ItemIcon = MENU_ITEM_ICONS[item.link];
          const primaryColor = theme.colors[theme.primaryColor][6];

          return (
            <div key={item.link}>
              {isLogoutItem && isAdmin && (
                <>
                  <Menu.Divider />
                  <Menu.Item closeMenuOnClick={false}>
                    <DebugToggle />
                  </Menu.Item>
                  <Menu.Divider />
                </>
              )}
              <Menu.Item>
                <Link
                  href={item.link}
                  className={classes.menuItemLink}
                  style={isLogoutItem ? { color: primaryColor } : undefined}
                >
                  <Group spacing={10} noWrap>
                    {ItemIcon && (
                      <ItemIcon
                        size="1rem"
                        stroke={1.5}
                        color={
                          isLogoutItem ? primaryColor : theme.colors.gray[6]
                        }
                      />
                    )}
                    <span>{item.label}</span>
                  </Group>
                </Link>
              </Menu.Item>
            </div>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}
