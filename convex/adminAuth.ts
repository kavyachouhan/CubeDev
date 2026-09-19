import {
  query as rawQuery,
  mutation as rawMutation,
  action as rawAction,
} from "./_generated/server";
import { requireAdmin, requireAdminIdentity } from "./auth";

type QueryConfig = Parameters<typeof rawQuery>[0];
type MutationConfig = Parameters<typeof rawMutation>[0];
type ActionConfig = Parameters<typeof rawAction>[0];

function isObjectConfig(
  config: QueryConfig | MutationConfig | ActionConfig,
): config is Exclude<typeof config, (...args: never[]) => unknown> {
  return typeof config === "object" && config !== null && "handler" in config;
}

export const query = ((config: QueryConfig) => {
  if (!isObjectConfig(config)) {
    throw new Error("admin query must use the object form");
  }
  return rawQuery({
    ...config,
    handler: async (ctx, ...args) => {
      await requireAdmin(ctx);
      return config.handler(ctx, ...args);
    },
  });
}) as unknown as typeof rawQuery;

export const mutation = ((config: MutationConfig) => {
  if (!isObjectConfig(config)) {
    throw new Error("admin mutation must use the object form");
  }
  return rawMutation({
    ...config,
    handler: async (ctx, ...args) => {
      await requireAdmin(ctx);
      return config.handler(ctx, ...args);
    },
  });
}) as unknown as typeof rawMutation;

export const action = ((config: ActionConfig) => {
  if (!isObjectConfig(config)) {
    throw new Error("admin action must use the object form");
  }
  return rawAction({
    ...config,
    handler: async (ctx, ...args) => {
      await requireAdminIdentity(ctx);
      return config.handler(ctx, ...args);
    },
  });
}) as unknown as typeof rawAction;
