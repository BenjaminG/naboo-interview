import ActivityFragment from '@/graphql/fragments/activity';
import gql from 'graphql-tag';

const GetMyFavorites = gql`
  query GetMyFavorites {
    getMyFavorites {
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

export default GetMyFavorites;
