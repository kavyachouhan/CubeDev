/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminChallenges from "../adminChallenges.js";
import type * as adminCompetitions from "../adminCompetitions.js";
import type * as adminContact from "../adminContact.js";
import type * as adminNotifications from "../adminNotifications.js";
import type * as adminTimers from "../adminTimers.js";
import type * as algorithms from "../algorithms.js";
import type * as challengeRooms from "../challengeRooms.js";
import type * as challengeStats from "../challengeStats.js";
import type * as coach from "../coach.js";
import type * as competitionSimulations from "../competitionSimulations.js";
import type * as contactMessages from "../contactMessages.js";
import type * as crons from "../crons.js";
import type * as faq from "../faq.js";
import type * as feedbackResponses from "../feedbackResponses.js";
import type * as identifierResolver from "../identifierResolver.js";
import type * as pushNodeActions from "../pushNodeActions.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as seedAlgorithms from "../seedAlgorithms.js";
import type * as seedCLL2x2 from "../seedCLL2x2.js";
import type * as seedCOLL from "../seedCOLL.js";
import type * as seedEG1 from "../seedEG1.js";
import type * as seedEG2 from "../seedEG2.js";
import type * as seedF2L from "../seedF2L.js";
import type * as seedFAQ from "../seedFAQ.js";
import type * as seedOLL from "../seedOLL.js";
import type * as seedZBLL from "../seedZBLL.js";
import type * as updateZBLL from "../updateZBLL.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminChallenges: typeof adminChallenges;
  adminCompetitions: typeof adminCompetitions;
  adminContact: typeof adminContact;
  adminNotifications: typeof adminNotifications;
  adminTimers: typeof adminTimers;
  algorithms: typeof algorithms;
  challengeRooms: typeof challengeRooms;
  challengeStats: typeof challengeStats;
  coach: typeof coach;
  competitionSimulations: typeof competitionSimulations;
  contactMessages: typeof contactMessages;
  crons: typeof crons;
  faq: typeof faq;
  feedbackResponses: typeof feedbackResponses;
  identifierResolver: typeof identifierResolver;
  pushNodeActions: typeof pushNodeActions;
  pushNotifications: typeof pushNotifications;
  seedAlgorithms: typeof seedAlgorithms;
  seedCLL2x2: typeof seedCLL2x2;
  seedCOLL: typeof seedCOLL;
  seedEG1: typeof seedEG1;
  seedEG2: typeof seedEG2;
  seedF2L: typeof seedF2L;
  seedFAQ: typeof seedFAQ;
  seedOLL: typeof seedOLL;
  seedZBLL: typeof seedZBLL;
  updateZBLL: typeof updateZBLL;
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
