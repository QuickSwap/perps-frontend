import { parseUnits } from "@ethersproject/units";
import { useBestV3TradeExactIn, useBestV3TradeExactOut } from "./useBestV3Trade";

export function useV3SwapInfo(amount, inputCurrency, outputCurrency, isExactIn) {
  const currency = isExactIn ? inputCurrency : outputCurrency;
  const parsedAmount = amount && currency ? parseUnits(amount, currency?.decimals) : undefined;
  const bestV3TradeIn = useBestV3TradeExactIn(parsedAmount, outputCurrency, inputCurrency);
  const bestV3TradeOut = useBestV3TradeExactOut(outputCurrency, !isExactIn ? parsedAmount : undefined);
  const trade = isExactIn ? bestV3TradeIn : bestV3TradeOut;
  return trade;
}
