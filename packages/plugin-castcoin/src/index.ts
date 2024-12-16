import { Plugin } from "@ai16z/eliza";
import { createTokenAction } from "./actions/createToken.ts";
import { airdropAction } from "./actions/airdrop.ts";
export * as actions from "./actions";
export * as evaluators from "./evaluators";
export * as providers from "./providers";

export const castcoinPlugin: Plugin = {
    name: "castcoin",
    description: "Castcoin Plugin for Eliza",
    actions: [createTokenAction, airdropAction],
    evaluators: [],
    providers: [],
};
