import { ActivityFragment } from "@/graphql/generated/types";
import { useGlobalStyles } from "@/utils";
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
import { FavoriteButton } from "./FavoriteButton";

interface ActivityProps {
  activity: ActivityFragment;
}

export function Activity({ activity }: ActivityProps) {
  const { classes } = useGlobalStyles();

  return (
    <Grid.Col span={4}>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Card.Section style={{ position: "relative" }}>
          <Image
            src="https://dummyimage.com/480x4:3"
            height={160}
            alt="random image of city"
          />
          <Box
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "rgba(255, 255, 255, 0.9)",
              borderRadius: "50%",
              padding: 4,
            }}
          >
            <FavoriteButton activityId={activity.id} />
          </Box>
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
