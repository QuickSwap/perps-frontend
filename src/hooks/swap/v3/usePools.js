import { POOL_DEPLOYER_ADDRESS, PoolState } from "../../../utils/quickswap/v3/constants";
import { useEffect, useMemo, useState } from "react";
import poolAbi from "../../../abis/quickswap/Pool.json";
import { usePreviousNonErroredArray } from "./usePrevious";
import { Pool } from "@uniswap/v3-sdk";
import { computePoolAddress } from "../../../utils/quickswap/v3/computePoolAddress";
import { getProvider, useChainId } from "../../../Helpers";
import { ethers } from "ethers";
import { getWrappedTokenV3 } from "../../../utils/quickswap/v3/getWrappedToken";

export function usePools(poolKeys) {
  const { chainId } = useChainId();

  const transformed = useMemo(() => {
    return poolKeys.map(([currencyA, currencyB]) => {
      if (!chainId || !currencyA || !currencyB) return null;

      const tokenA = getWrappedTokenV3(currencyA, chainId);
      const tokenB = getWrappedTokenV3(currencyB, chainId);
      if (!tokenA || !tokenB || tokenA.address.toLowerCase() === tokenB.address.toLowerCase()) return null;
      const [token0, token1] =
        tokenA.address.toLowerCase() < tokenB.address.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA];
      return [token0, token1];
    });
  }, [chainId, poolKeys]);

  const poolAddresses = useMemo(() => {
    const poolDeployerAddress = chainId && POOL_DEPLOYER_ADDRESS[chainId];

    return transformed.map((value) => {
      if (!poolDeployerAddress || !value) return undefined;

      return computePoolAddress({
        poolDeployer: poolDeployerAddress,
        tokenA: value[0],
        tokenB: value[1],
      });
    });
  }, [chainId, transformed]);

  const [globalState0s, setGlobalState0s] = useState([]);
  const [liquidities, setLiquidities] = useState([]);

  const poolAddressStr = poolAddresses.filter((address) => !!address).join("_");

  const polygonWsProvider = getProvider(null, chainId);

  useEffect(() => {
    if (!polygonWsProvider) return;
    (async () => {
      const poolAddressArr = poolAddressStr.split("_").filter((address) => !!address);

      const poolData = await Promise.all(
        poolAddressArr.map(async (address) => {
          try {
            const poolContract = new ethers.Contract(address, poolAbi, polygonWsProvider);
            console.log("bbb", poolContract);
            const globalState = await poolContract.globalState();
            console.log("ccc", globalState);
            const liquidity = await poolContract.liquidity();
            return { globalState, liquidity };
          } catch (e) {
            console.log("eer", e);
          }
        })
      );
      setGlobalState0s(poolData.map((item) => item.globalState));
      setLiquidities(poolData.map((item) => item.liquidity));
    })();
  }, [poolAddressStr, polygonWsProvider]);

  // const globalState0s = useMultipleContractSingleData(poolAddresses, POOL_STATE_INTERFACE, "globalState");

  // TODO: This is a bug, if all of the pool addresses error out, and the last call to use pools was from a different hook
  // You will get the results which don't match the pool keys
  const prevGlobalState0s = usePreviousNonErroredArray(globalState0s);

  const _globalState0s = useMemo(() => {
    if (!prevGlobalState0s || !globalState0s || globalState0s.length === 1) return globalState0s;

    if (globalState0s.every((el) => el.error) && !prevGlobalState0s.every((el) => el.error)) return prevGlobalState0s;

    return globalState0s;
  }, [prevGlobalState0s, globalState0s]);

  // const liquidities = useMultipleContractSingleData(poolAddresses, POOL_STATE_INTERFACE, "liquidity");
  const prevLiquidities = usePreviousNonErroredArray(liquidities);

  const _liquidities = useMemo(() => {
    if (!prevLiquidities || !liquidities || liquidities.length === 1) return liquidities;

    if (liquidities.every((el) => el.error) && !prevLiquidities.every((el) => el.error)) return prevLiquidities;

    return liquidities;
  }, [prevLiquidities, liquidities]);

  return useMemo(() => {
    return poolKeys.map((_key, index) => {
      const [token0, token1] = transformed[index] ?? [];
      const globalState0s = _globalState0s.length < index ? undefined : _globalState0s[index];
      const liquidities = _liquidities.length < index ? undefined : _liquidities[index];
      if (!token0 || !token1 || !globalState0s || !liquidities) return [PoolState.INVALID, null];

      const { result: globalState, loading: globalStateLoading, valid: globalStateValid } = globalState0s;
      const { result: liquidity, loading: liquidityLoading, valid: liquidityValid } = liquidities;

      if (!globalStateValid || !liquidityValid) return [PoolState.INVALID, null];
      if (globalStateLoading || liquidityLoading) return [PoolState.LOADING, null];

      if (!globalState || !liquidity) return [PoolState.NOT_EXISTS, null];

      if (!globalState.price || globalState.price.eq(0)) return [PoolState.NOT_EXISTS, null];

      try {
        return [
          PoolState.EXISTS,
          new Pool(token0, token1, globalState.fee, globalState.price, liquidity[0], globalState.tick),
        ];
      } catch (error) {
        return [PoolState.NOT_EXISTS, null];
      }
    });
  }, [_liquidities, poolKeys, _globalState0s, transformed]);
}

export function usePool(currencyA, currencyB) {
  const poolKeys = useMemo(() => [[currencyA, currencyB]], [currencyA, currencyB]);

  return usePools(poolKeys)[0];
}
