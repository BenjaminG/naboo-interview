import ActivityFragment from "@/graphql/fragments/activity";
import gql from "graphql-tag";

const GetActivitiesByCity = gql`
  query GetActivitiesByCity(
    $activity: String
    $city: String!
    $price: Int
    $limit: Int
    $offset: Int
  ) {
    getActivitiesByCity(
      activity: $activity
      city: $city
      price: $price
      limit: $limit
      offset: $offset
    ) {
      items {
        ...Activity
      }
      total
    }
  }
  ${ActivityFragment}
`;

export default GetActivitiesByCity;
