import ActivityFragment from "@/graphql/fragments/activity";
import gql from "graphql-tag";

const GetUserActivities = gql`
  query GetUserActivities($limit: Int, $offset: Int) {
    getActivitiesByUser(limit: $limit, offset: $offset) {
      items {
        ...Activity
      }
      total
    }
  }
  ${ActivityFragment}
`;

export default GetUserActivities;
