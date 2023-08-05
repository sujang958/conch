import { gql } from "mercurius-codegen"

export const schema = gql`
  type User {
    id: String!
    name: String
    picture: String!
    bio: String!
    elo: Int!
    createdAt: String!
    whiteGames: [GameWithoutPlayers]!
    blackGames: [GameWithoutPlayers]!
    wonGames: [GameWithoutPlayers]!
  }

  type UserWithoutGames {
    id: String!
    name: String
    picture: String!
    bio: String!
    elo: Int!
    createdAt: String!
  }

  type Game {
    id: String!
    pgn: String!
    reason: String!
    time: Int!
    increment: Int!
    endedAt: Int!
    createdAt: String!

    white: UserWithoutGames!
    black: UserWithoutGames!
    whiteId: String!
    blackId: String!

    winner: UserWithoutGames
    winnerId: String
  }

  type GameWithoutPlayers {
    id: String!
    pgn: String!
    reason: String!
    time: Int!
    increment: Int!
    endedAt: String!
    createdAt: String!

    whiteId: String!
    blackId: String!
    winnerId: String
  }

  type Query {
    user(id: String!): User
    me: User
  }

  type Mutation {
    login(idToken: String!): Boolean!
    changeName(name: String!) User
    changeBio(bio: String): User
  }
`
