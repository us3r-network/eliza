import { Plugin } from "@ai16z/eliza";
import { noneAction } from "./actions/none.ts";
import { factEvaluator } from "./evaluators/fact.ts";
import { factsProvider } from "./providers/facts.ts";

export * as actions from "./actions";
export * as evaluators from "./evaluators";
export * as providers from "./providers";

export const bootstrapPlugin: Plugin = {
    name: "castcoin",
    description: "Agent castcoin with basic actions and evaluators",
    actions: [noneAction],
    evaluators: [factEvaluator],
    providers: [factsProvider],
};
