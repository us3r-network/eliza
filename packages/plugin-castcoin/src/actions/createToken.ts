import {
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    composeContext,
    // generateImage,
    generateObjectDEPRECATED,
    type Action,
} from "@ai16z/eliza";

export interface CreateTokenContent extends Content {
    tokenMetadata: {
        name: string;
        symbol: string;
        description: string;
    };
}

export function isCreateTokenContent(
    runtime: IAgentRuntime,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any
): content is CreateTokenContent {
    console.log("Content for create", content);
    return (
        typeof content.tokenMetadata === "object" &&
        content.tokenMetadata !== null &&
        typeof content.tokenMetadata.name === "string" &&
        typeof content.tokenMetadata.symbol === "string"
    );
}

const promptConfirmation = async (): Promise<boolean> => {
    return true;
};

// Save the base64 data to a file
// import * as fs from "fs";
// import * as path from "path";
import { createTokenTemplate } from "../templetes/index.ts";
import { CreateTokenMetadata } from "../types/index.ts";
import { createMeme } from "../utils.ts";

export const createTokenAction: Action = {
    name: "CREATE_TOKEN",
    similes: ["DEPLOY_TOKEN", "LAUNCH_TOKEN"],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        console.log("Validating CREATE_TOKEN action...", _message);
        return true; //return isCreateTokenContent(runtime, message.content);
    },
    description:
        "Create a new token. Requires deployer farcaster fid and token metadata.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        console.log("Starting CREATE_TOKEN handler...", message);
        // Compose state if not provided
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }
        // console.log("CREATE_TOKEN State: ", state);
        // Generate structured content from natural language
        const context = composeContext({
            state,
            template: createTokenTemplate,
        });

        const content = await generateObjectDEPRECATED({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });
        console.log("CREATE_TOKEN content:", content);

        // Validate the generated content
        if (!isCreateTokenContent(runtime, content)) {
            console.error("Invalid content for CREATE_TOKEN action.");
            return false;
        }

        const { tokenMetadata } = content;
        /*
            // Generate image if tokenMetadata.file is empty or invalid
            if (!tokenMetadata.file || tokenMetadata.file.length < 100) {  // Basic validation
                try {
                    const imageResult = await generateImage({
                        prompt: `logo for ${tokenMetadata.name} (${tokenMetadata.symbol}) token - ${tokenMetadata.description}`,
                        width: 512,
                        height: 512,
                        count: 1
                    }, runtime);

                    if (imageResult.success && imageResult.data && imageResult.data.length > 0) {
                        // Remove the "data:image/png;base64," prefix if present
                        tokenMetadata.file = imageResult.data[0].replace(/^data:image\/[a-z]+;base64,/, '');
                    } else {
                        console.error("Failed to generate image:", imageResult.error);
                        return false;
                    }
                } catch (error) {
                    console.error("Error generating image:", error);
                    return false;
                }
            } */
        /*
        const imageResult = await generateImage(
            {
                prompt: `logo for ${tokenMetadata.name} (${tokenMetadata.symbol}) token - ${tokenMetadata.description}`,
                width: 256,
                height: 256,
                count: 1,
            },
            runtime
        );

        tokenMetadata.image_description = imageResult.data[0].replace(
            /^data:image\/[a-z]+;base64,/,
            ""
        );

        // Convert base64 string to Blob
        const base64Data = tokenMetadata.image_description;
        const outputPath = path.join(
            process.cwd(),
            `generated_image_${Date.now()}.txt`
        );
        fs.writeFileSync(outputPath, base64Data);
        console.log(`Base64 data saved to: ${outputPath}`);

        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/png" });
        */

        // Add the default decimals and convert file to Blob
        const fullTokenMetadata: CreateTokenMetadata = {
            name: tokenMetadata.name,
            symbol: tokenMetadata.symbol,
            description: tokenMetadata.description,
            // file: blob,
        };
        if (callback)
            callback({
                text: `@larrybot @clanker Let's go Larry vs Clanker:\nLaunch this token, \nName: ${tokenMetadata.name}\nTicker: ${tokenMetadata.symbol}`,
            });

        try {
            const createConfirmation = await promptConfirmation();
            if (!createConfirmation) {
                console.log("Create token canceled by user");
                return false;
            }

            console.log("Executing create api call...");
            const result = await createMeme({
                castHash:
                    (message.content.hash as `0x${string}`) ||
                    "0x0000000000000000000000000000000000000000",
                tokenMetadata: fullTokenMetadata,
            });

            console.log("Create api call result: ", result);

            if (callback) {
                if (result.success) {
                    callback({
                        text: `Token ${tokenMetadata.name} (${tokenMetadata.symbol}) created successfully!\n Creator: ${result.data.creator}\n View at: https://castcoin.fun/${result.data.base.tokenAddress}`,
                        content: {
                            tokenInfo: {
                                symbol: tokenMetadata.symbol,
                                address: result.data.address,
                                creator: result.data.creator,
                                name: tokenMetadata.name,
                                description: tokenMetadata.description,
                                timestamp: Date.now(),
                            },
                        },
                    });
                } else {
                    callback({
                        text: `Failed to create token: ${result.error}\n`,
                        content: {
                            error: result.error,
                        },
                    });
                }
            }
            return result.success;
        } catch (error) {
            console.error("Error during token creation: ", error);
            if (callback) {
                callback({
                    text: `Error during token creation: ${error.message}`,
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
                    text: "Create a new token called GLITCHIZA with symbol GLITCHIZA and generate a description about it.",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Token GLITCHIZA (GLITCHIZA) is creating......\n",
                    action: "CREATE_TOKEN",
                    content: {
                        tokenMetadata: {
                            symbol: "GLITCHIZA",
                            // address:
                            //     "EugPwuZ8oUMWsYHeBGERWvELfLGFmA1taDtmY8uMeX6r",
                            // creator:
                            //     "9jW8FPr6BSSsemWPV22UUCzSqkVdTp6HTyPqeqyuBbCa",
                            name: "GLITCHIZA",
                            description: "A GLITCHIZA token",
                        },
                    },
                },
            },
        ],
    ] as ActionExample[][],
};
