/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createUserFile = /* GraphQL */ `
  mutation CreateUserFile(
    $input: CreateUserFileInput!
    $condition: ModeluserFileConditionInput
  ) {
    createUserFile(input: $input, condition: $condition) {
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
export const updateUserFile = /* GraphQL */ `
  mutation UpdateUserFile(
    $input: UpdateUserFileInput!
    $condition: ModeluserFileConditionInput
  ) {
    updateUserFile(input: $input, condition: $condition) {
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
export const deleteUserFile = /* GraphQL */ `
  mutation DeleteUserFile(
    $input: DeleteUserFileInput!
    $condition: ModeluserFileConditionInput
  ) {
    deleteUserFile(input: $input, condition: $condition) {
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
