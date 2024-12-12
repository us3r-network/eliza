import { CreateTokenMetadata } from "./types";

const CASTCOIN_API_URL = "https://api-dev.pgf.meme/";
const FIRST_ATTEMPT_DELAY = 3000;
const MAX_ATTEMPTS = 6;
const WAIT_TIME_BETWEEN_ATTEMPTS = 1000;

export const createMeme = async ({
    castHash,
    tokenMetadata,
}: {
    castHash: `0x${string}`;
    tokenMetadata: CreateTokenMetadata;
}) => {
    try {
        console.log("Creating token...", castHash, tokenMetadata);

        // Create token request
        const createTokenResp = await fetch(CASTCOIN_API_URL + "memes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ castHash, ...tokenMetadata }),
        });

        const createTokenRespData = await createTokenResp.json();
        console.log("Create Results:", createTokenRespData);

        if (createTokenRespData.msg !== "ok" || !createTokenRespData.data?.id) {
            console.log("Create failed");
            return {
                success: false,
                error: createTokenRespData.msg || "Unknown error",
                ...createTokenRespData,
            };
        }

        const id = createTokenRespData.data.id;
        console.log("Create successful, checking meme status...", id);

        // Wait initial delay before first status check
        await new Promise((resolve) =>
            setTimeout(resolve, FIRST_ATTEMPT_DELAY)
        );

        // Poll for meme status
        for (let attempts = 0; attempts < MAX_ATTEMPTS; attempts++) {
            const memeResp = await fetch(CASTCOIN_API_URL + "memes/" + id);
            const memeRespData = await memeResp.json();
            console.log("Meme Results:", memeRespData);

            if (memeRespData.msg === "ok") {
                return {
                    success: true,
                    data: memeRespData.data,
                };
            }

            if (attempts < MAX_ATTEMPTS - 1) {
                await new Promise((resolve) =>
                    setTimeout(resolve, WAIT_TIME_BETWEEN_ATTEMPTS)
                );
            }
        }

        return {
            success: false,
            error: "Max attempts reached",
        };
    } catch (error) {
        console.error("Error creating meme:", error);
        return {
            success: false,
            error: error.message || "Unknown error occurred",
        };
    }
};
