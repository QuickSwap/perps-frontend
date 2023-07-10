import { POOL_DEPLOYER_ADDRESS, PoolState } from "../../../utils/quickswap/v3/constants";
import { useEffect, useMemo, useState } from "react";
import poolAbi from "../../../abis/quickswap/Pool.json";
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

  useEffect(() => {
    const polygonWsProvider = getProvider(null, chainId);
    if (!polygonWsProvider) return;
    (async () => {
      const poolAddressArr = poolAddressStr.split("_").filter((address) => !!address);

      const poolData = await Promise.all(
        poolAddressArr.map(async (address) => {
          const poolContract = new ethers.Contract(address, poolAbi, polygonWsProvider);
          let globalState, liquidity;
          try {
            globalState = await poolContract.globalState();
          } catch {}
          try {
            liquidity = await poolContract.liquidity();
          } catch {}
          return { globalState, liquidity };
        })
      );

      setGlobalState0s(poolData.map((item) => item?.globalState));
      setLiquidities(poolData.map((item) => item?.liquidity));
    })();
  }, [poolAddressStr, chainId]);

  return useMemo(() => {
    return poolKeys.map((_key, index) => {
      const [token0, token1] = transformed[index] ?? [];
      const globalState = globalState0s.length < index ? undefined : globalState0s[index];
      const liquidity = liquidities.length < index ? undefined : liquidities[index];
      if (!token0 || !token1) return [PoolState.INVALID, null];

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
  }, [liquidities, poolKeys, globalState0s, transformed]);
}

export function usePool(currencyA, currencyB) {
  const poolKeys = useMemo(() => [[currencyA, currencyB]], [currencyA, currencyB]);

  return usePools(poolKeys)[0];
}
