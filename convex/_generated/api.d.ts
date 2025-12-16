/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as algorithms from "../algorithms.js";
import type * as challengeRooms from "../challengeRooms.js";
import type * as challengeStats from "../challengeStats.js";
import type * as competitionSimulations from "../competitionSimulations.js";
import type * as contactMessages from "../contactMessages.js";
import type * as crons from "../crons.js";
import type * as feedbackResponses from "../feedbackResponses.js";
import type * as pushNodeActions from "../pushNodeActions.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as seedAlgorithms from "../seedAlgorithms.js";
import type * as seedCOLL from "../seedCOLL.js";
import type * as seedF2L from "../seedF2L.js";
import type * as seedOLL from "../seedOLL.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  algorithms: typeof algorithms;
  challengeRooms: typeof challengeRooms;
  challengeStats: typeof challengeStats;
  competitionSimulations: typeof competitionSimulations;
  contactMessages: typeof contactMessages;
  crons: typeof crons;
  feedbackResponses: typeof feedbackResponses;
  pushNodeActions: typeof pushNodeActions;
  pushNotifications: typeof pushNotifications;
  seedAlgorithms: typeof seedAlgorithms;
  seedCOLL: typeof seedCOLL;
  seedF2L: typeof seedF2L;
  seedOLL: typeof seedOLL;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
