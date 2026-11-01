import { type RouteDef } from "../../contracts/src/index.js";
export type RouteEntry = readonly [method: RouteDef["method"], path: string, idempotent: boolean];
export declare const routeTable: Record<string, RouteEntry>;
