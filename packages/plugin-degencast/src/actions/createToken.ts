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
    generateObjectDeprecated,
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
    similes: [
        "CREATED_TOKEN",
        "TOKEN_CREATION",
        "DEPLOY_TOKEN",
        "LAUNCH_TOKEN",
        "LAUNCHED_TOKEN",
        "TOKEN_CREATED",
    ],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        // console.log("Validating CREATE_TOKEN action...", _message);
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

        const content = await generateObjectDeprecated({
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
                    const deployerName = result.data?.deployerFcName;
                    const id = result.data?.base?.tokenAddress
                        ? result.data.base.tokenAddress
                        : result.data?.solana?.tokenAddress
                          ? result.data.solana.tokenAddress
                          : result.data?.id;
                    const url = id
                        ? `https://dev.degencast.fun/memes/${id}`
                        : `https://dev.degencast.fun`;
                    callback({
                        text: `Token ${tokenMetadata.name} (${tokenMetadata.symbol}) created successfully!\n Creator: ${deployerName}\n View at: \n${url}`,
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
                    text: "Create a new token called GLITCHIZA with symbol GLITCHIZA.",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "",
                    action: "CREATE_TOKEN",
                    content: {
                        tokenMetadata: {
                            symbol: "GLITCHIZA",
                            name: "GLITCHIZA",
                            description: "A GLITCHIZA token",
                        },
                    },
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Launch this token, \nName: test-token\nTicker: TEST",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "",
                    action: "CREATE_TOKEN",
                    content: {
                        tokenMetadata: {
                            symbol: "TEST",
                            name: "test-token",
                            description: "A test token",
                        },
                    },
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create a meme token called PEPE with symbol $PEPE",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "",
                    action: "CREATE_TOKEN",
                    content: {
                        tokenMetadata: {
                            symbol: "PEPE",
                            name: "PEPE",
                            description:
                                "A meme token inspired by the famous Pepe the Frog",
                        },
                    },
                },
            },
        ],
        // [
        //     {
        //         user: "{{user1}}",
        //         content: {
        //             text: "create token", // Invalid example - insufficient info
        //         },
        //     },
        //     {
        //         user: "{{user2}}",
        //         content: {
        //             text: "I need more information to create a token. Please provide:\n- Token name\n- Token symbol/ticker\n- (Optional) Token description",
        //         },
        //     },
        // ],
        // [
        //     {
        //         user: "{{user1}}",
        //         content: {
        //             text: "Create token with symbol !@#$%", // Invalid example - invalid symbol
        //         },
        //     },
        //     {
        //         user: "{{user2}}",
        //         content: {
        //             text: "Invalid token symbol. Token symbols should only contain letters and numbers.",
        //         },
        //     },
        // ],
    ] as ActionExample[][],
};
