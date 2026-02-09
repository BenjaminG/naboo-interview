import { useAuth, useDebugMode } from "@/hooks";
import { ActivityFragment } from "@/graphql/generated/types";
import { formatDebugDate, useGlobalStyles } from "@/utils";
import {
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Group,
  Image,
  Text,
} from "@mantine/core";
import Link from "next/link";

interface ActivityProps {
  activity: ActivityFragment;
}

export function Activity({ activity }: ActivityProps) {
  const { classes } = useGlobalStyles();
  const { user } = useAuth();
  const { isDebugMode } = useDebugMode();

  const showDebugBadge =
    isDebugMode && user?.role === "admin" && activity.createdAt;
  const debugDate = showDebugBadge ? formatDebugDate(activity.createdAt) : null;

  return (
    <Grid.Col span={4}>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Card.Section sx={{ position: "relative" }}>
          <Image
            src="https://dummyimage.com/480x4:3"
            height={160}
            alt="random image of city"
          />
          {debugDate && (
            <Box
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                backgroundColor: "rgba(0, 0, 0, 0.75)",
                color: "#F59E0B",
                fontFamily:
                  "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                fontSize: 11,
                fontWeight: 500,
                padding: "4px 8px",
                borderRadius: 12,
                animation: "debugBadgeFadeIn 200ms ease-out",
                "@keyframes debugBadgeFadeIn": {
                  from: {
                    opacity: 0,
                    transform: "scale(0.9)",
                  },
                  to: {
                    opacity: 1,
                    transform: "scale(1)",
                  },
                },
              }}
            >
              {debugDate}
            </Box>
          )}
        </Card.Section>

        <Group position="apart" mt="md" mb="xs">
          <Text weight={500} className={classes.ellipsis}>
            {activity.name}
          </Text>
        </Group>

        <Group mt="md" mb="xs">
          <Badge color="pink" variant="light">
            {activity.city}
          </Badge>
          <Badge color="yellow" variant="light">
            {`${activity.price}€/j`}
          </Badge>
        </Group>

        <Text size="sm" color="dimmed" className={classes.ellipsis}>
          {activity.description}
        </Text>

        <Link href={`/activities/${activity.id}`} className={classes.link}>
          <Button variant="light" color="blue" fullWidth mt="md" radius="md">
            Voir plus
          </Button>
        </Link>
      </Card>
    </Grid.Col>
  );
}
