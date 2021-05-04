/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getUserFile = /* GraphQL */ `
  query GetUserFile($id: ID!) {
    getUserFile(id: $id) {
      id
      title
      description
      filePath
      owner
      createdAt
      updatedAt
    }
  }
`;
export const listUserFiles = /* GraphQL */ `
  query ListUserFiles(
    $filter: ModeluserFileFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserFiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
        description
        filePath
        owner
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;
export const MyQuery = /* GraphQL */ `
query MyQuery {
  listUserFiles(filter: {owner: {eq: "Sam"}}) {
    items {
      id
      title
      description
      filePath
      owner
      createdAt
      updatedAt
    }
    nextToken
  }
}
`;