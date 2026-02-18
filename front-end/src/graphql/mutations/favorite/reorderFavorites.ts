import gql from 'graphql-tag';
import ActivityFragment from '@/graphql/fragments/activity';

const ReorderFavorites = gql`
  mutation ReorderFavorites($activityIds: [String!]!) {
    reorderFavorites(activityIds: $activityIds) {
      id
      order
      createdAt
      activity {
        ...Activity
      }
    }
  }
  ${ActivityFragment}
`;

export default ReorderFavorites;
