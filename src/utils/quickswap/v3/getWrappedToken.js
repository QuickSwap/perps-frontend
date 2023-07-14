import { getTokens } from "../../../data/Tokens";

export const getWrappedTokenV3 = (token, chainId) => {
  const tokens = getTokens(chainId);
  if (!chainId) return;
  if (token && token.isNative && !token.wrapped) {
    return tokens.find((item) => item.isWrapped);
  }
  return token;
};
