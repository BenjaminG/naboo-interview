import { ActivityFragment } from "@/graphql/generated/types";
import { useGlobalStyles } from "@/utils";
import { Box, Button, Flex, Image, Text } from "@mantine/core";
import Link from "next/link";
import { FavoriteButton } from "./FavoriteButton";

interface ActivityListItemProps {
  activity: ActivityFragment;
}

export function ActivityListItem({ activity }: ActivityListItemProps) {
  const { classes } = useGlobalStyles();

  return (
    <Flex align="center" justify="space-between">
      <Flex gap="md" align="center">
        <Box style={{ position: "relative" }}>
          <Image
            src="https://dummyimage.com/125"
            radius="md"
            alt="random image of city"
            height="125"
            width="125"
          />
          <Box
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              background: "rgba(255, 255, 255, 0.9)",
              borderRadius: "50%",
              padding: 2,
            }}
          >
            <FavoriteButton activityId={activity.id} />
          </Box>
        </Box>
        <Box sx={{ maxWidth: "300px" }}>
          <Text className={classes.ellipsis}>{activity.city}</Text>
          <Text className={classes.ellipsis}>{activity.name}</Text>
          <Text className={classes.ellipsis}>{activity.description}</Text>
          <Text
            weight="bold"
            className={classes.ellipsis}
          >{`${activity.price}€/j`}</Text>
        </Box>
      </Flex>
      <Link href={`/activities/${activity.id}`} className={classes.link}>
        <Button variant="outline" color="dark">
          Voir plus
        </Button>
      </Link>
    </Flex>
  );
}
