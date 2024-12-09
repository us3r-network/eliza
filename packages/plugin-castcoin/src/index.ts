import { Plugin } from "@ai16z/eliza";
import { createTokenAction } from "./actions";

export * as actions from "./actions";
export * as evaluators from "./evaluators";
export * as providers from "./providers";

export const castcoinPlugin: Plugin = {
    name: "castcoin",
    description: "Agent castcoin with basic actions and evaluators",
    actions: [createTokenAction],
    evaluators: [],
    providers: [],
};
