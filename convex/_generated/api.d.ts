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
import type * as contactMessages from "../contactMessages.js";
import type * as crons from "../crons.js";
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

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  algorithms: typeof algorithms;
  challengeRooms: typeof challengeRooms;
  challengeStats: typeof challengeStats;
  contactMessages: typeof contactMessages;
  crons: typeof crons;
  seedAlgorithms: typeof seedAlgorithms;
  seedCOLL: typeof seedCOLL;
  seedF2L: typeof seedF2L;
  seedOLL: typeof seedOLL;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
