import ActivityFragment from "@/graphql/fragments/activity";
import gql from "graphql-tag";

const GetActivities = gql`
  query GetActivities($limit: Int, $offset: Int) {
    getActivities(limit: $limit, offset: $offset) {
      items {
        ...Activity
      }
      total
    }
  }
  ${ActivityFragment}
`;

export default GetActivities;
