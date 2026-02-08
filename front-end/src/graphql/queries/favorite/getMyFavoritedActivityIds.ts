import gql from 'graphql-tag';

const GetMyFavoritedActivityIds = gql`
  query GetMyFavoritedActivityIds {
    getMyFavoritedActivityIds
  }
`;

export default GetMyFavoritedActivityIds;
