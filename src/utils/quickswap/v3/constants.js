import { Token } from "@uniswap/sdk-core";

export const POOL_INIT_CODE_HASH = process.env.REACT_APP_POOL_INIT_CODE_HASH ?? "";

export const V3_CUSTOM_BASES = {};

export const ADDITIONAL_BASES = {};

const zkEVMChain = 1101;

export const WMATIC_EXTENDED = {
  [zkEVMChain]: new Token(zkEVMChain, "0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9", 18, "WETH", "Wrapped ETHER"),
};

export const USDC = {
  [zkEVMChain]: new Token(zkEVMChain, "0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035", 6, "USDC", "USD Coin"),
};

export const USDT = {
  [zkEVMChain]: new Token(zkEVMChain, "0x1E4a5963aBFD975d8c9021ce480b42188849D41d", 6, "USDT", "Tether USD"),
};

export const WBTC = {
  [zkEVMChain]: new Token(zkEVMChain, "0xEA034fb02eB1808C2cc3adbC15f447B93CbE08e1", 8, "wBTC", "Wrapped Bitcoin"),
};

export const DAI = {
  [zkEVMChain]: new Token(zkEVMChain, "0xC5015b9d9161Dca7e18e32f6f25C4aD850731Fd4", 18, "DAI", "Dai Stablecoin"),
};

export const MATIC = {
  [zkEVMChain]: new Token(zkEVMChain, "0xa2036f0538221a77A3937F1379699f44945018d0", 18, "MATIC", "Matic"),
};

export const V3_BASES_TO_CHECK_TRADES_AGAINST = {
  [zkEVMChain]: [
    WMATIC_EXTENDED[zkEVMChain],
    USDT[zkEVMChain],
    USDC[zkEVMChain],
    MATIC[zkEVMChain],
    DAI[zkEVMChain],
    WBTC[zkEVMChain],
  ],
};

export const POOL_DEPLOYER_ADDRESS = {
  [zkEVMChain]: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
};

export const QUOTER_ADDRESSES = {
  [zkEVMChain]: "0x55BeE1bD3Eb9986f6d2d963278de09eE92a3eF1D",
};

export const PoolState = {
  LOADING: 0,
  NOT_EXISTS: 1,
  EXISTS: 2,
  INVALID: 3,
};

export const V3TradeState = {
  LOADING: 0,
  INVALID: 1,
  NO_ROUTE_FOUND: 2,
  VALID: 3,
  SYNCING: 4,
};
