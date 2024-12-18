import {
    ActionExample,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    type Action,
} from "@ai16z/eliza";

import { airdrop, DEGENCAST_WEB_URL } from "../utils.ts";
import { ApiRespCode } from "../types/index.ts";

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
                if (result.code === ApiRespCode.SUCCESS) {
                    const id = result.data?.baseCastTokenAddress
                        ? result.data.baseCastTokenAddress
                        : result.data?.solanaCastTokenAddress
                          ? result.data.solanaCastTokenAddress
                          : undefined;
                    const tokenDetailUrl = id
                        ? `${DEGENCAST_WEB_URL}/memes/${id}`
                        : `${DEGENCAST_WEB_URL}`;
                    const txUrls = `${result.data?.baseClaimTxHash || ""}\n${result.data?.solanaClaimTxHash || ""}`;

                    callback({
                        text: `${result.msg}\n View at: \n${tokenDetailUrl}\n\nTx Links: \n${txUrls}`,
                    });
                } else {
                    callback({
                        text: `${result.msg}`,
                    });
                }
            }
            return result.code === ApiRespCode.SUCCESS;
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
