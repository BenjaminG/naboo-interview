import { ActionIcon, Center, Menu } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import Link from "next/link";
import { useTopbarStyles } from "./Topbar.styles";
import { Route } from "./types";

export function MenuItem({ route, label, icon }: Route) {
  const Icon = icon;
  const { classes } = useTopbarStyles();

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
        {route.map((item) => (
          <Menu.Item key={item.link} component={Link} href={item.link} className={classes.menuItemLink}>
            {item.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
