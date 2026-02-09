import { useAuth, useDebugMode } from "@/hooks";
import { Group, Switch, useMantineTheme } from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";

export function DebugToggle() {
  const { user } = useAuth();
  const { isDebugMode, toggleDebugMode } = useDebugMode();
  const theme = useMantineTheme();

  if (!user || user.role !== "admin") {
    return null;
  }

  const primaryColor = theme.colors[theme.primaryColor][6];

  return (
    <Group position="apart" noWrap spacing="xs" sx={{ width: "100%" }}>
      <Group spacing={10} noWrap>
        <IconSettings size="1rem" stroke={1.5} color={theme.colors.gray[6]} />
        <span>Debug</span>
      </Group>
      <Switch
        checked={isDebugMode}
        onChange={toggleDebugMode}
        size="sm"
        styles={{
          track: {
            backgroundColor: isDebugMode ? primaryColor : undefined,
            borderColor: isDebugMode ? primaryColor : undefined,
          },
        }}
      />
    </Group>
  );
}
