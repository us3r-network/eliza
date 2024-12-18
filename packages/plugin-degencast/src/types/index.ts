export type CreateTokenMetadata = {
    name: string;
    symbol: string;
    description?: string;
    imageURL?: string;
    file?: Blob;
};

export enum ApiRespCode {
    SUCCESS = 0,
    ERROR = 1,
}
export type ApiResp<T> = {
    code: ApiRespCode;
    msg: string;
    data?: T;
};

export type AirDropData = {
    baseClaimTxHash: string;
    solanaClaimTxHash: string;
    baseCastTokenAddress: string;
    solanaCastTokenAddress: string;
};

export type CreateTokenData = {
    id: string;
    deployerFcName: string;
    base?: {
        tokenAddress: string;
    };
    solana?: {
        tokenAddress: string;
    };
};
