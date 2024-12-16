import {
    ActionExample,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    type Action,
} from "@ai16z/eliza";

import { airdrop } from "../utils.ts";

export const airdropAction: Action = {
    name: "AIRDROP",
    similes: ["AIRDROP"],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },
    description: "request an airdrop.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        console.log("Starting AIRDROP handler...", message);
        // Compose state if not provided
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        try {
            console.log("Executing airdrop api call...");
            const result = await airdrop({
                castHash: message.content.hash as `0x${string}`,
            });

            console.log("airdrop api call result: ", result);

            if (callback) {
                if (result.success) {
                    const id = result.data?.base?.tokenAddress
                        ? result.data.base.tokenAddress
                        : result.data?.solana?.tokenAddress
                          ? result.data.solana.tokenAddress
                          : result.data?.id;
                    const url = id
                        ? `https://dev.degencast.fun/memes/${id}`
                        : `https://dev.degencast.fun`;
                    callback({
                        text: `Airdrop successfully!\n View at: \n${url}`,
                    });
                } else {
                    callback({
                        text: `airdrop failed: ${result.error}\n`,
                        content: {
                            error: result.error,
                        },
                    });
                }
            }
            return result.success;
        } catch (error) {
            console.error("Error during airdrop request: ", error);
            if (callback) {
                callback({
                    text: `Error during airdrop request: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "airdrop",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "",
                    action: "AIRDROP",
                },
            },
        ],
    ] as ActionExample[][],
};
