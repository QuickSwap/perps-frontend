import {
  V3_BASES_TO_CHECK_TRADES_AGAINST,
  V3_CUSTOM_BASES,
  ADDITIONAL_BASES,
} from "../../../utils/quickswap/v3/constants";
import { useMemo } from "react";
import { useChainId } from "../../../Helpers";
import { getWrappedTokenV3 } from "../../../utils/quickswap/v3/getWrappedToken";

export function useAllCurrencyCombinations(currencyA, currencyB) {
  const { chainId } = useChainId();

  const [tokenA, tokenB] = chainId
    ? [getWrappedTokenV3(currencyA, chainId), getWrappedTokenV3(currencyB, chainId)]
    : [undefined, undefined];

  const bases = useMemo(() => {
    if (!chainId) return [];

    const common = V3_BASES_TO_CHECK_TRADES_AGAINST[chainId] ?? [];
    const additionalA = tokenA ? ADDITIONAL_BASES[chainId]?.[tokenA.address] ?? [] : [];
    const additionalB = tokenB ? ADDITIONAL_BASES[chainId]?.[tokenB.address] ?? [] : [];

    return [...common, ...additionalA, ...additionalB];
  }, [chainId, tokenA, tokenB]);

  const basePairs = useMemo(
    () => bases.flatMap((base) => bases.map((otherBase) => [base, otherBase])).filter(([t0, t1]) => !t0.equals(t1)),
    [bases]
  );

  return useMemo(
    () =>
      tokenA && tokenB
        ? [
            // the direct pair
            [tokenA, tokenB],
            // token A against all bases
            ...bases.map((base) => [tokenA, base]),
            // token B against all bases
            ...bases.map((base) => [tokenB, base]),
            // each base against all bases
            ...basePairs,
          ]
            // filter out invalid pairs comprised of the same asset (e.g. WETH<>WETH)
            .filter(([t0, t1]) => t0.address.toLowerCase() !== t1.address.toLowerCase())
            // filter out duplicate pairs
            .filter(([t0, t1], i, otherPairs) => {
              // find the first index in the array at which there are the same 2 tokens as the current
              const firstIndexInOtherPairs = otherPairs.findIndex(([t0Other, t1Other]) => {
                return (
                  (t0.address.toLowerCase() === t0Other.address.toLowerCase() &&
                    t1.address.toLowerCase() === t1Other.address.toLowerCase()) ||
                  (t0.address.toLowerCase() === t1Other.address.toLowerCase() &&
                    t1.address.toLowerCase() === t0Other.address.toLowerCase())
                );
              });
              // only accept the first occurrence of the same 2 tokens
              return firstIndexInOtherPairs === i;
            })
            // optionally filter out some pairs for tokens with custom bases defined
            .filter(([tokenA, tokenB]) => {
              if (!chainId) return true;
              const customBases = V3_CUSTOM_BASES[chainId];

              const customBasesA = customBases?.[tokenA.address];
              const customBasesB = customBases?.[tokenB.address];

              if (!customBasesA && !customBasesB) return true;

              if (customBasesA && !customBasesA.find((base) => tokenB.equals(base))) return false;
              if (customBasesB && !customBasesB.find((base) => tokenA.equals(base))) return false;

              return true;
            })
        : [],
    [tokenA, tokenB, bases, basePairs, chainId]
  );
}
