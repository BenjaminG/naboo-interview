import gql from 'graphql-tag';

const ReorderFavorites = gql`
  mutation ReorderFavorites($activityIds: [String!]!) {
    reorderFavorites(activityIds: $activityIds) {
      id
      order
      createdAt
      activity {
        id
        name
        description
        city
        price
      }
    }
  }
`;

export default ReorderFavorites;
