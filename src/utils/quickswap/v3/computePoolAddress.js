import { defaultAbiCoder } from "@ethersproject/abi";
import { getCreate2Address } from "@ethersproject/address";
import { keccak256 } from "@ethersproject/solidity";
import { POOL_INIT_CODE_HASH } from "./constants";

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

/**
 * Computes a pool address
 * @param poolDeployer The Quickswap factory address
 * @param tokenA The first token of the pair, irrespective of sort order
 * @param tokenB The second token of the pair, irrespective of sort order
 * @param fee The fee tier of the pool
 * @returns The pool address
 */
export function computePoolAddress({ poolDeployer, tokenA, tokenB, initCodeHashManualOverride }) {
  const [token0, token1] =
    tokenA.address.toLowerCase() < tokenB.address.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA]; // does safety checks
  return getCreate2Address(
    poolDeployer,
    keccak256(["bytes"], [defaultAbiCoder.encode(["address", "address"], [token0.address, token1.address])]),
    initCodeHashManualOverride ?? POOL_INIT_CODE_HASH
  );
}
