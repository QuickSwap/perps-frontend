import { CurrencyAmount, TradeType } from "@uniswap/sdk-core";
import { Trade } from "@uniswap/v3-sdk";

import { useEffect, useMemo, useState } from "react";
import { useAllV3Routes } from "./useAllV3Routes";
import { encodeRouteToPath } from "../../../utils/quickswap/v3/encodeRouteToPath";
import { useChainId } from "../../../Helpers";
import { ethers } from "ethers";
import { V3TradeState, QUOTER_ADDRESSES } from "../../../utils/quickswap/v3/constants";
import quoterABI from "../../../abis/quickswap/quoter.json";

const QUOTE_GAS_OVERRIDES = {
  1101: 100_000_000,
};

const DEFAULT_GAS_QUOTE = 2_000_000;

/**
 * Returns the best v3 trade for a desired exact input swap
 * @param amountIn the amount to swap in
 * @param currencyOut the desired output currency
 */
export function useBestV3TradeExactIn(amountIn, currencyOut) {
  const { chainId } = useChainId();

  const { routes, loading: routesLoading } = useAllV3Routes(amountIn?.currency, currencyOut);

  const quoteExactInInputs = useMemo(() => {
    return routes.map((route) => [
      encodeRouteToPath(route, false),
      amountIn ? `0x${amountIn.quotient.toString(16)}` : undefined,
    ]);
  }, [amountIn, routes]);

  const [quotesResults, setQuotesResults] = useState([]);

  useEffect(() => {
    (async () => {
      const quoterAddress = QUOTER_ADDRESSES[chainId];
      const quoteContract = new ethers.Contract(quoterAddress, quoterABI);
      const quoteResults = await Promise.all(
        quoteExactInInputs.map(async (item) => {
          const quoteResult = await quoteContract.quoteExactInput(item, {
            gasRequired: chainId ? QUOTE_GAS_OVERRIDES[chainId] ?? DEFAULT_GAS_QUOTE : undefined,
          });
          return quoteResult;
        })
      );
      setQuotesResults(quoteResults);
    })();
  }, [chainId]);

  const trade = useMemo(() => {
    if (!amountIn || !currencyOut) {
      return {
        state: V3TradeState.INVALID,
        trade: null,
      };
    }

    if (routesLoading || quotesResults.some(({ loading }) => loading)) {
      return {
        state: V3TradeState.LOADING,
        trade: null,
      };
    }

    const { bestRoute, amountOut } = quotesResults.reduce(
      (currentBest, { result }, i) => {
        if (!result) return currentBest;

        if (currentBest.amountOut === null) {
          return {
            bestRoute: routes[i],
            amountOut: result.amountOut,
          };
        } else if (currentBest.amountOut.lt(result.amountOut)) {
          return {
            bestRoute: routes[i],
            amountOut: result.amountOut,
          };
        }

        return currentBest;
      },
      {
        bestRoute: null,
        amountOut: null,
      }
    );

    if (!bestRoute || !amountOut) {
      return {
        state: V3TradeState.NO_ROUTE_FOUND,
        trade: null,
      };
    }

    const isSyncing = quotesResults.some(({ syncing }) => syncing);

    return {
      state: isSyncing ? V3TradeState.SYNCING : V3TradeState.VALID,
      trade: Trade.createUncheckedTrade({
        route: bestRoute,
        tradeType: TradeType.EXACT_INPUT,
        inputAmount: amountIn,
        outputAmount: CurrencyAmount.fromRawAmount(currencyOut, amountOut.toString()),
      }),
    };
  }, [amountIn, currencyOut, quotesResults, routes, routesLoading]);

  return useMemo(() => {
    return trade;
  }, [trade]);
}

/**
 * Returns the best v3 trade for a desired exact output swap
 * @param currencyIn the desired input currency
 * @param amountOut the amount to swap out
 */
export function useBestV3TradeExactOut(currencyIn, amountOut) {
  const { chainId } = useChainId();

  const { routes, loading: routesLoading } = useAllV3Routes(currencyIn, amountOut?.currency);

  const quoteExactOutInputs = useMemo(() => {
    return routes.map((route) => [
      encodeRouteToPath(route, true),
      amountOut ? `0x${amountOut.quotient.toString(16)}` : undefined,
    ]);
  }, [amountOut, routes]);

  const [quotesResults, setQuotesResults] = useState([]);

  useEffect(() => {
    (async () => {
      const quoteContract = new ethers.Contract();
      const quoteResults = await Promise.all(
        quoteExactOutInputs.map(async (item) => {
          const quoteResult = await quoteContract.quoteExactInput(item, {
            gasRequired: chainId ? QUOTE_GAS_OVERRIDES[chainId] ?? DEFAULT_GAS_QUOTE : undefined,
          });
          return quoteResult;
        })
      );
      setQuotesResults(quoteResults);
    })();
  }, []);

  const trade = useMemo(() => {
    if (!amountOut || !currencyIn || quotesResults.some(({ valid }) => !valid)) {
      return {
        state: V3TradeState.INVALID,
        trade: null,
      };
    }

    if (routesLoading || quotesResults.some(({ loading }) => loading)) {
      return {
        state: V3TradeState.LOADING,
        trade: null,
      };
    }

    const { bestRoute, amountIn } = quotesResults.reduce(
      (currentBest, { result }, i) => {
        if (!result) return currentBest;

        if (currentBest.amountIn === null) {
          return {
            bestRoute: routes[i],
            amountIn: result.amountIn,
          };
        } else if (currentBest.amountIn.gt(result.amountIn)) {
          return {
            bestRoute: routes[i],
            amountIn: result.amountIn,
          };
        }

        return currentBest;
      },
      {
        bestRoute: null,
        amountIn: null,
      }
    );

    if (!bestRoute || !amountIn) {
      return {
        state: V3TradeState.NO_ROUTE_FOUND,
        trade: null,
      };
    }

    const isSyncing = quotesResults.some(({ syncing }) => syncing);

    return {
      state: isSyncing ? V3TradeState.SYNCING : V3TradeState.VALID,
      trade: Trade.createUncheckedTrade({
        route: bestRoute,
        tradeType: TradeType.EXACT_OUTPUT,
        inputAmount: CurrencyAmount.fromRawAmount(currencyIn, amountIn.toString()),
        outputAmount: amountOut,
      }),
    };
  }, [amountOut, currencyIn, quotesResults, routes, routesLoading]);

  return useMemo(() => {
    return trade;
  }, [trade]);
}
