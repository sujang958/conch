import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { Context } from '../gql/index.js';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
};

export type Game = {
  __typename?: 'Game';
  blackId: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  endedAt: Scalars['Date']['output'];
  id: Scalars['String']['output'];
  increment: Scalars['Int']['output'];
  pgn: Scalars['String']['output'];
  reason: Scalars['String']['output'];
  time: Scalars['Int']['output'];
  whiteId: Scalars['String']['output'];
  winnerId?: Maybe<Scalars['String']['output']>;
};

export type GameWithUsers = Game & {
  __typename?: 'GameWithUsers';
  black: User;
  blackId: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  endedAt: Scalars['Date']['output'];
  id: Scalars['String']['output'];
  increment: Scalars['Int']['output'];
  pgn: Scalars['String']['output'];
  reason: Scalars['String']['output'];
  time: Scalars['Int']['output'];
  white: User;
  whiteId: Scalars['String']['output'];
  winner?: Maybe<User>;
  winnerId?: Maybe<Scalars['String']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  changeBio?: Maybe<UserWithGamesWithUsers>;
  changeName?: Maybe<UserWithGamesWithUsers>;
  login?: Maybe<UserWithGamesWithUsers>;
  logout?: Maybe<Scalars['Boolean']['output']>;
};


export type MutationChangeBioArgs = {
  bio: Scalars['String']['input'];
};


export type MutationChangeNameArgs = {
  name: Scalars['String']['input'];
};


export type MutationLoginArgs = {
  idToken: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  me?: Maybe<UserWithGamesWithUsers>;
  user?: Maybe<UserWithGamesWithUsers>;
};


export type QueryUserArgs = {
  id: Scalars['String']['input'];
};

export type User = {
  __typename?: 'User';
  bio: Scalars['String']['output'];
  blitzElo: Scalars['Int']['output'];
  bulletElo: Scalars['Int']['output'];
  country: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  email: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  picture: Scalars['String']['output'];
  rapidElo: Scalars['Int']['output'];
  updatedAt: Scalars['Date']['output'];
};

export type UserWithGamesWithUsers = User & {
  __typename?: 'UserWithGamesWithUsers';
  bio: Scalars['String']['output'];
  blackGames: Array<Maybe<GameWithUsers>>;
  blitzElo: Scalars['Int']['output'];
  bulletElo: Scalars['Int']['output'];
  country: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  email: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  picture: Scalars['String']['output'];
  rapidElo: Scalars['Int']['output'];
  updatedAt: Scalars['Date']['output'];
  whiteGames: Array<Maybe<GameWithUsers>>;
  wonGames: Array<Maybe<GameWithUsers>>;
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Date: ResolverTypeWrapper<Scalars['Date']['output']>;
  Game: ResolverTypeWrapper<Game>;
  GameWithUsers: ResolverTypeWrapper<GameWithUsers>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Mutation: ResolverTypeWrapper<{}>;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  User: ResolverTypeWrapper<User>;
  UserWithGamesWithUsers: ResolverTypeWrapper<UserWithGamesWithUsers>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Boolean: Scalars['Boolean']['output'];
  Date: Scalars['Date']['output'];
  Game: Game;
  GameWithUsers: GameWithUsers;
  Int: Scalars['Int']['output'];
  Mutation: {};
  Query: {};
  String: Scalars['String']['output'];
  User: User;
  UserWithGamesWithUsers: UserWithGamesWithUsers;
}>;

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export type GameResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Game'] = ResolversParentTypes['Game']> = ResolversObject<{
  blackId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  endedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  increment?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pgn?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reason?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  time?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  whiteId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  winnerId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GameWithUsersResolvers<ContextType = Context, ParentType extends ResolversParentTypes['GameWithUsers'] = ResolversParentTypes['GameWithUsers']> = ResolversObject<{
  black?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  blackId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  endedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  increment?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pgn?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reason?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  time?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  white?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  whiteId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  winner?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  winnerId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  changeBio?: Resolver<Maybe<ResolversTypes['UserWithGamesWithUsers']>, ParentType, ContextType, RequireFields<MutationChangeBioArgs, 'bio'>>;
  changeName?: Resolver<Maybe<ResolversTypes['UserWithGamesWithUsers']>, ParentType, ContextType, RequireFields<MutationChangeNameArgs, 'name'>>;
  login?: Resolver<Maybe<ResolversTypes['UserWithGamesWithUsers']>, ParentType, ContextType, RequireFields<MutationLoginArgs, 'idToken'>>;
  logout?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  me?: Resolver<Maybe<ResolversTypes['UserWithGamesWithUsers']>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['UserWithGamesWithUsers']>, ParentType, ContextType, RequireFields<QueryUserArgs, 'id'>>;
}>;

export type UserResolvers<ContextType = Context, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = ResolversObject<{
  bio?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  blitzElo?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  bulletElo?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  country?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  picture?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rapidElo?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserWithGamesWithUsersResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UserWithGamesWithUsers'] = ResolversParentTypes['UserWithGamesWithUsers']> = ResolversObject<{
  bio?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  blackGames?: Resolver<Array<Maybe<ResolversTypes['GameWithUsers']>>, ParentType, ContextType>;
  blitzElo?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  bulletElo?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  country?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  picture?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rapidElo?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  whiteGames?: Resolver<Array<Maybe<ResolversTypes['GameWithUsers']>>, ParentType, ContextType>;
  wonGames?: Resolver<Array<Maybe<ResolversTypes['GameWithUsers']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = Context> = ResolversObject<{
  Date?: GraphQLScalarType;
  Game?: GameResolvers<ContextType>;
  GameWithUsers?: GameWithUsersResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserWithGamesWithUsers?: UserWithGamesWithUsersResolvers<ContextType>;
}>;

