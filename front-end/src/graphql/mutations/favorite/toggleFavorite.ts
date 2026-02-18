import gql from 'graphql-tag';

const ToggleFavorite = gql`
  mutation ToggleFavorite($activityId: ID!) {
    toggleFavorite(activityId: $activityId)
  }
`;

export default ToggleFavorite;
