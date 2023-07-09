import { usePools } from "./usePools";
import { useMemo } from "react";
import { useAllCurrencyCombinations } from "./useAllCurrencyCombinations";
import { PoolState } from "../../../utils/quickswap/v3/constants";

/**
 * Returns all the existing pools that should be considered for swapping between an input currency and an output currency
 * @param currencyIn the input currency
 * @param currencyOut the output currency
 */
export function useV3SwapPools(currencyIn, currencyOut) {
  const allCurrencyCombinations = useAllCurrencyCombinations(currencyIn, currencyOut);

  const pools = usePools(allCurrencyCombinations);

  return useMemo(() => {
    return {
      pools: pools
        .filter((tuple) => {
          return tuple[0] === PoolState.EXISTS && tuple[1] !== null;
        })
        .map(([, pool]) => pool),
      loading: pools.some(([state]) => state === PoolState.LOADING),
    };
  }, [pools]);
}
