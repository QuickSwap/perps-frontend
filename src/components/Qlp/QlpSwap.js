import React, { useState, useEffect, useMemo } from "react";
import { useHistory } from "react-router-dom";

import { useWeb3React } from "@web3-react/core";
import useSWR from "swr";
import { ethers } from "ethers";

import Tab from "../Tab/Tab";
import cx from "classnames";

import {
  getToken,
  getTokens,
  getWhitelistedTokens,
  getWrappedToken,
  getNativeToken,
  getTokenBySymbol,
} from "../../data/Tokens";
import { getContract } from "../../Addresses";
import {
  helperToast,
  useLocalStorageByChainId,
  getTokenInfo,
  // getChainName,
  useChainId,
  expandDecimals,
  fetcher,
  bigNumberify,
  formatAmount,
  formatAmountFree,
  formatKeyAmount,
  // formatDateTime,
  getBuyQlpToAmount,
  getBuyQlpFromAmount,
  getSellQlpFromAmount,
  getSellQlpToAmount,
  parseValue,
  approveTokens,
  getUsd,
  adjustForDecimals,
  QLP_DECIMALS,
  USD_DECIMALS,
  BASIS_POINTS_DIVISOR,
  QLP_COOLDOWN_DURATION,
  SECONDS_PER_YEAR,
  USDQ_DECIMALS,
  POLYGON_ZKEVM,
  PLACEHOLDER_ACCOUNT,
  QPXQLP_DISPLAY_DECIMALS,
} from "../../Helpers";

import { callContract, useInfoTokens, useQuickUsdPrice } from "../../Api";

import TokenSelector from "../Exchange/TokenSelector";
import BuyInputSection from "../BuyInputSection/BuyInputSection";
import Tooltip from "../Tooltip/Tooltip";

import Reader from "../../abis/Reader.json";
import Vault from "../../abis/Vault.json";
import QlpManager from "../../abis/QlpManager.json";
import QLPAbi from "../../abis/QLP.json";
import RewardRouter from "../../abis/RewardRouter.json";
import Token from "../../abis/Token.json";
import FarmingAbi from "../../abis/Farming.json";

import qlp24Icon from "../../img/ic_qlp_24.svg";
import qlp40Icon from "../../assets/icons/qlpCoin.svg";
import arrowIcon from "../../img/ic_convert_down.svg";

import "./QlpSwap.css";
import AssetDropdown from "../../views/Dashboard/AssetDropdown";
import { getImageUrl } from "../../cloudinary/getImageUrl";

const { AddressZero } = ethers.constants;

export default function QlpSwap(props) {
  const { savedSlippageAmount, isBuying, setPendingTxns, connectWallet, setIsBuying } = props;
  const history = useHistory();
  const swapLabel = isBuying ? "Add Liquidity" : "Withdraw Liquidity";
  const tabLabel = isBuying ? "Add Liquidity" : "Withdraw Liquidity";
  const { active, library, account } = useWeb3React();
  const { chainId } = useChainId();
  // const chainName = getChainName(chainId)
  const tokens = getTokens(chainId);
  const whitelistedTokens = getWhitelistedTokens(chainId);
  const tokenList = whitelistedTokens.filter((t) => !t.isWrapped);
  const [swapValue, setSwapValue] = useState("");
  const [qlpValue, setQlpValue] = useState("");
  const [swapTokenAddress, setSwapTokenAddress] = useLocalStorageByChainId(
    chainId,
    `${swapLabel}-swap-token-address`,
    AddressZero
  );
  const [isApproving, setIsApproving] = useState(false);
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [anchorOnSwapAmount, setAnchorOnSwapAmount] = useState(true);
  const [feeBasisPoints, setFeeBasisPoints] = useState("");

  const readerAddress = getContract(chainId, "Reader");

  const vaultAddress = getContract(chainId, "Vault");
  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");
  const stakedQlpTrackerAddress = getContract(chainId, "StakedQlpTracker");

  const qlpAddress = getContract(chainId, "QLP");
  const usdqAddress = getContract(chainId, "USDQ");
  const qlpManagerAddress = getContract(chainId, "QlpManager");
  const rewardRouterAddress = getContract(chainId, "RewardRouter");
  const tokensForBalanceAndSupplyQuery = [stakedQlpTrackerAddress, usdqAddress];
  const farmingAddress = getContract(chainId, "Farming");
  const ethAddress = getTokenBySymbol(chainId, "WETH");
  const quickAddress = getContract(chainId, "QUICK");
  const maticAddress = getTokenBySymbol(chainId, "MATIC");
  const tokenAddresses = tokens.map((token) => token.address);
  const { data: tokenBalances } = useSWR(
    [`QlpSwap:getTokenBalances:${active}`, chainId, readerAddress, "getTokenBalances", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, Reader, [tokenAddresses]),
    }
  );
  const { infoTokens } = useInfoTokens(library, chainId, active, tokenBalances, undefined);

  const ethTokenInfo = infoTokens[ethAddress.address];
  const maticTokenInfo = infoTokens[maticAddress.address];
  const quickPrice = useQuickUsdPrice();

  const { data: balancesAndSupplies } = useSWR(
    [
      `QlpSwap:getTokenBalancesWithSupplies:${active}`,
      chainId,
      readerAddress,
      "getTokenBalancesWithSupplies",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: fetcher(library, Reader, [tokensForBalanceAndSupplyQuery]),
    }
  );

  const { data: aums } = useSWR([`QlpSwap:getAums:${active}`, chainId, qlpManagerAddress, "getAums"], {
    fetcher: fetcher(library, QlpManager),
  });

  const { data: totalTokenWeights } = useSWR(
    [`QlpSwap:totalTokenWeights:${active}`, chainId, vaultAddress, "totalTokenWeights"],
    {
      fetcher: fetcher(library, Vault),
    }
  );

  const tokenAllowanceAddress = swapTokenAddress === AddressZero ? nativeTokenAddress : swapTokenAddress;
  const { data: tokenAllowance } = useSWR(
    [active, chainId, tokenAllowanceAddress, "allowance", account || PLACEHOLDER_ACCOUNT, qlpManagerAddress],
    {
      fetcher: fetcher(library, Token),
    }
  );

  const { data: lastPurchaseTime } = useSWR(
    [`QlpSwap:lastPurchaseTime:${active}`, chainId, qlpManagerAddress, "lastAddedAt", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, QlpManager),
    }
  );

  const { data: qlpBalance } = useSWR(
    [`QlpSwap:qlpBalance:${active}`, chainId, qlpAddress, "balanceOf", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, QLPAbi),
    }
  );

  const { data: qlpSupply = bigNumberify(0) } = useSWR(active && [`QlpTotalSupply:${active}`, chainId, qlpAddress, "totalSupply"], {
    fetcher: fetcher(library, QLPAbi, []),
  });

  const redemptionTime = lastPurchaseTime ? lastPurchaseTime.add(QLP_COOLDOWN_DURATION) : undefined;
  const inCooldownWindow = redemptionTime && parseInt(Date.now() / 1000) < redemptionTime;

  const usdqSupply = balancesAndSupplies ? balancesAndSupplies[3] : bigNumberify(0);
  let aum;
  if (aums && aums.length > 0) {
    aum = isBuying ? aums[0] : aums[1];
  }
  const qlpPrice =
    aum && aum.gt(0) && qlpSupply.gt(0)
      ? aum.mul(expandDecimals(1, QLP_DECIMALS)).div(qlpSupply)
      : expandDecimals(1, USD_DECIMALS);

  const qlpMinPrice =
    aums && aums.length > 0 && qlpSupply && qlpSupply.gt(0)
      ? aums[1].mul(expandDecimals(1, QLP_DECIMALS)).div(qlpSupply)
      : expandDecimals(1, USD_DECIMALS);

  let qlpBalanceUsd;
  if (qlpBalance) {
    qlpBalanceUsd = qlpBalance.mul(qlpPrice).div(expandDecimals(1, QLP_DECIMALS));
  }
  const qlpSupplyUsd = qlpSupply ? qlpSupply.mul(qlpPrice).div(expandDecimals(1, QLP_DECIMALS)): bigNumberify(0);

  const reservedAmount = bigNumberify(0);

  const swapToken = getToken(chainId, swapTokenAddress);
  const swapTokenInfo = getTokenInfo(infoTokens, swapTokenAddress);

  const swapTokenBalance = swapTokenInfo && swapTokenInfo.balance ? swapTokenInfo.balance : bigNumberify(0);

  const swapAmount = parseValue(swapValue, swapToken && swapToken.decimals);
  const qlpAmount = parseValue(qlpValue, QLP_DECIMALS);

  const needApproval =
    isBuying && swapTokenAddress !== AddressZero && tokenAllowance && swapAmount && swapAmount.gt(tokenAllowance);

  const swapUsdMin = getUsd(swapAmount, swapTokenAddress, false, infoTokens);
  const qlpUsdMax = qlpAmount && qlpPrice ? qlpAmount.mul(qlpPrice).div(expandDecimals(1, QLP_DECIMALS)) : undefined;

  let isSwapTokenCapReached;
  if (swapTokenInfo.managedUsd && swapTokenInfo.maxUsdqAmount) {
    isSwapTokenCapReached = swapTokenInfo.managedUsd.gt(
      adjustForDecimals(swapTokenInfo.maxUsdqAmount, USDQ_DECIMALS, USD_DECIMALS)
    );
  }

  const { data: ethFarmingInfo } = useSWR([`ethFarmingInfo:${active}`, chainId, farmingAddress, "farmingInfo"], {
    fetcher: fetcher(library, FarmingAbi, [ethAddress.address]),
  });

  const { data: maticFarmingInfo } = useSWR(
    [`maticFarmingInfo:${active}`, chainId, farmingAddress, "farmingInfo"],
    {
      fetcher: fetcher(library, FarmingAbi, [maticAddress.address]),
    }
  );

  const { data: quickFarmingInfo } = useSWR(
    [`quickFarmingInfo:${active}`, chainId, farmingAddress, "farmingInfo"],
    {
      fetcher: fetcher(library, FarmingAbi, [quickAddress]),
    }
  );

  const { data: totalAllocation } = useSWR(
    [`totalAllocation:${active}`, chainId, farmingAddress, "totalAllocation"],
    {
      fetcher: fetcher(library, FarmingAbi, []),
    }
  );
  const ethAmountInUsd =
    ethTokenInfo && ethTokenInfo.minPrice && ethFarmingInfo && ethFarmingInfo.currentDistributionAmount
      ? ethTokenInfo.minPrice.mul(ethFarmingInfo.currentDistributionAmount).div(expandDecimals(1, 30))
      : bigNumberify(0);

  const quickAmountInUsd =
    quickPrice && quickFarmingInfo && quickFarmingInfo.currentDistributionAmount
      ? quickPrice.mul(quickFarmingInfo.currentDistributionAmount).div(expandDecimals(1, 30))
      : bigNumberify(0);

  const maticAmountInUsd =
    maticTokenInfo && maticTokenInfo.minPrice && maticFarmingInfo && maticFarmingInfo.currentDistributionAmount
      ? maticTokenInfo.minPrice.mul(maticFarmingInfo.currentDistributionAmount).div(expandDecimals(1, 30))
      : bigNumberify(0);

  const currentDistributionAmount = ethAmountInUsd.add(quickAmountInUsd).add(maticAmountInUsd);

  const currentApr =
    totalAllocation && qlpMinPrice && currentDistributionAmount && totalAllocation.gt(0) && qlpMinPrice.gt(0)
      ? currentDistributionAmount.mul(expandDecimals(1, 30)).mul(365).div(7).mul(100).div(totalAllocation).div(qlpMinPrice)
      : bigNumberify(0);

  const onSwapValueChange = (e) => {
    setAnchorOnSwapAmount(true);
    setSwapValue(e.target.value);
  };

  const onQlpValueChange = (e) => {
    setAnchorOnSwapAmount(false);
    setQlpValue(e.target.value);
  };

  const onSelectSwapToken = (token) => {
    setSwapTokenAddress(token.address);
    setIsWaitingForApproval(false);
  };

  useEffect(() => {
    const updateSwapAmounts = () => {
      if (anchorOnSwapAmount) {
        if (!swapAmount) {
          setQlpValue("");
          setFeeBasisPoints("");
          return;
        }

        if (isBuying) {
          const { amount: nextAmount, feeBasisPoints: feeBps } = getBuyQlpToAmount(
            swapAmount,
            swapTokenAddress,
            infoTokens,
            qlpPrice,
            usdqSupply,
            totalTokenWeights
          );
          const nextValue = formatAmountFree(nextAmount, QLP_DECIMALS, QLP_DECIMALS);
          setQlpValue(nextValue);
          setFeeBasisPoints(feeBps);
        } else {
          const { amount: nextAmount, feeBasisPoints: feeBps } = getSellQlpFromAmount(
            swapAmount,
            swapTokenAddress,
            infoTokens,
            qlpPrice,
            usdqSupply,
            totalTokenWeights
          );
          const nextValue = formatAmountFree(nextAmount, QLP_DECIMALS, QLP_DECIMALS);
          setQlpValue(nextValue);
          setFeeBasisPoints(feeBps);
        }

        return;
      }

      if (!qlpAmount) {
        setSwapValue("");
        setFeeBasisPoints("");
        return;
      }

      if (swapToken) {
        if (isBuying) {
          const { amount: nextAmount, feeBasisPoints: feeBps } = getBuyQlpFromAmount(
            qlpAmount,
            swapTokenAddress,
            infoTokens,
            qlpPrice,
            usdqSupply,
            totalTokenWeights
          );
          const nextValue = formatAmountFree(nextAmount, swapToken.decimals, swapToken.decimals);
          setSwapValue(nextValue);
          setFeeBasisPoints(feeBps);
        } else {
          const { amount: nextAmount, feeBasisPoints: feeBps } = getSellQlpToAmount(
            qlpAmount,
            swapTokenAddress,
            infoTokens,
            qlpPrice,
            usdqSupply,
            totalTokenWeights,
            true
          );

          const nextValue = formatAmountFree(nextAmount, swapToken.decimals, swapToken.decimals);
          setSwapValue(nextValue);
          setFeeBasisPoints(feeBps);
        }
      }
    };

    updateSwapAmounts();
  }, [
    isBuying,
    anchorOnSwapAmount,
    swapAmount,
    qlpAmount,
    swapToken,
    swapTokenAddress,
    infoTokens,
    qlpPrice,
    usdqSupply,
    totalTokenWeights,
  ]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const switchSwapOption = (hash = "") => {
    history.push(`${history.location.pathname}#${hash}`);
    props.setIsBuying(hash === "redeem" ? false : true);
  };

  const fillMaxAmount = () => {
    if (isBuying) {
      setAnchorOnSwapAmount(true);
      setSwapValue(formatAmountFree(swapTokenBalance, swapToken.decimals, swapToken.decimals));
      return;
    }

    setAnchorOnSwapAmount(false);
    setQlpValue(formatAmountFree(maxSellAmount, QLP_DECIMALS, QLP_DECIMALS));
  };

  const getError = () => {
    if (!isBuying && inCooldownWindow) {
      return [`Redemption time not yet reached`];
    }

    if (!swapAmount || swapAmount.eq(0)) {
      return ["Enter an amount"];
    }
    if (!qlpAmount || qlpAmount.eq(0)) {
      return ["Enter an amount"];
    }

    if (isBuying) {
      const swapTokenInfo = getTokenInfo(infoTokens, swapTokenAddress);
      if (swapTokenInfo && swapTokenInfo.balance && swapAmount && swapAmount.gt(swapTokenInfo.balance)) {
        return [`Insufficient ${swapTokenInfo.symbol} Balance`];
      }

      if (swapTokenInfo.maxUsdqAmount && swapTokenInfo.usdqAmount && swapUsdMin) {
        const usdqFromAmount = adjustForDecimals(swapUsdMin, USD_DECIMALS, USDQ_DECIMALS);
        const nextUsdqAmount = swapTokenInfo.usdqAmount.add(usdqFromAmount);
        if (swapTokenInfo.maxUsdqAmount.gt(0) && nextUsdqAmount.gt(swapTokenInfo.maxUsdqAmount)) {
          return [`${swapTokenInfo.symbol} pool exceeded, try different token`, true];
        }
      }
    }

    if (!isBuying) {
      if (maxSellAmount && qlpAmount && qlpAmount.gt(maxSellAmount)) {
        return [`Insufficient QLP Balance`];
      }

      const swapTokenInfo = getTokenInfo(infoTokens, swapTokenAddress);
      if (
        swapTokenInfo &&
        swapTokenInfo.availableAmount &&
        swapAmount &&
        swapAmount.gt(swapTokenInfo.availableAmount)
      ) {
        return [`Insufficient Liquidity`];
      }
    }

    return [false];
  };

  const isPrimaryEnabled = () => {
    if (!active) {
      return true;
    }
    const [error, modal] = getError();
    if (error) {
      // console.error(error);
    }
    if (error && !modal) {
      return false;
    }
    if ((needApproval && isWaitingForApproval) || isApproving) {
      return false;
    }
    if (isApproving) {
      return false;
    }
    if (isSubmitting) {
      return false;
    }
    if (isBuying && isSwapTokenCapReached) {
      return false;
    }

    return true;
  };

  const getPrimaryText = () => {
    if (!active) {
      return "Connect Wallet";
    }
    const [error, modal] = getError();
    if (error) {
      // console.error(error);
    }

    if (error && !modal) {
      return error;
    }
    if (isBuying && isSwapTokenCapReached) {
      return `Max Capacity for ${swapToken.symbol} Reached`;
    }

    if (needApproval && isWaitingForApproval) {
      return "Waiting for Approval";
    }
    if (isApproving) {
      return `Approving ${swapToken.symbol}...`;
    }
    if (needApproval) {
      return `Approve ${swapToken.symbol}`;
    }

    if (isSubmitting) {
      return isBuying ? `Providing...` : `Removing Liquidity ...`;
    }

    return isBuying ? "Add Liquidity" : "Withdraw Liquidity";
  };

  const approveFromToken = () => {
    approveTokens({
      setIsApproving,
      library,
      tokenAddress: swapToken.address,
      spender: qlpManagerAddress,
      chainId: chainId,
      onApproveSubmitted: () => {
        setIsWaitingForApproval(true);
      },
      infoTokens,
      getTokenInfo,
    });
  };

  const buyQlp = () => {
    setIsSubmitting(true);

    const minQlp = qlpAmount.mul(BASIS_POINTS_DIVISOR - savedSlippageAmount).div(BASIS_POINTS_DIVISOR);

    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
    const method = swapTokenAddress === AddressZero ? "mintAndStakeQlpETH" : "mintAndStakeQlp";
    const params = swapTokenAddress === AddressZero ? [0, minQlp] : [swapTokenAddress, swapAmount, 0, minQlp];
    const value = swapTokenAddress === AddressZero ? swapAmount : 0;

    callContract(chainId, contract, method, params, {
      value,
      sentMsg: "Providing...",
      failMsg: "Add Liquidity failed.",
      successMsg: `${formatAmount(swapAmount, swapTokenInfo.decimals, 4, true)} ${
        swapTokenInfo.symbol
      } provided for ${formatAmount(qlpAmount, 18, 4, true)} QLP !`,
      setPendingTxns,
    })
      .then(async () => {})
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const sellQlp = () => {
    setIsSubmitting(true);

    const minOut = swapAmount.mul(BASIS_POINTS_DIVISOR - savedSlippageAmount).div(BASIS_POINTS_DIVISOR);

    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
    const method = swapTokenAddress === AddressZero ? "unstakeAndRedeemQlpETH" : "unstakeAndRedeemQlp";
    const params =
      swapTokenAddress === AddressZero ? [qlpAmount, minOut, account] : [swapTokenAddress, qlpAmount, minOut, account];

    callContract(chainId, contract, method, params, {
      sentMsg: "Remove Liquidity submitted!",
      failMsg: "Remove Liquidity failed.",
      successMsg: `${formatAmount(qlpAmount, 18, 4, true)} QLP removed for ${formatAmount(
        swapAmount,
        swapTokenInfo.decimals,
        4,
        true
      )} ${swapTokenInfo.symbol}!`,
      setPendingTxns,
    })
      .then(async () => {})
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const onClickPrimary = () => {
    if (!active) {
      connectWallet();
      return;
    }

    if (needApproval) {
      approveFromToken();
      return;
    }

    const [error, modal] = getError();
    if (error) {
      // console.error(error);
    }

    if (modal) {
      return;
    }

    if (isBuying) {
      buyQlp();
    } else {
      sellQlp();
    }
  };

  let payLabel = "Pay";
  let receiveLabel = "Receive";
  let payBalance = "$0.00";
  let receiveBalance = "$0.00";
  if (isBuying) {
    if (swapUsdMin) {
      payBalance = `$${formatAmount(swapUsdMin, USD_DECIMALS, 2, true)}`;
    }
    if (qlpUsdMax) {
      receiveBalance = `$${formatAmount(qlpUsdMax, USD_DECIMALS, 2, true)}`;
    }
  } else {
    if (qlpUsdMax) {
      payBalance = `$${formatAmount(qlpUsdMax, USD_DECIMALS, 2, true)}`;
    }
    if (swapUsdMin) {
      receiveBalance = `$${formatAmount(swapUsdMin, USD_DECIMALS, 2, true)}`;
    }
  }

  const selectToken = (token) => {
    setAnchorOnSwapAmount(false);
    setSwapTokenAddress(token.address);
    helperToast.success(`${token.symbol} selected in order form`);
  };

  let feePercentageText = formatAmount(feeBasisPoints, 2, 2, true, "-");
  if (feeBasisPoints !== undefined && feeBasisPoints.toString().length > 0) {
    feePercentageText += "%";
  }

  let maxSellAmount = qlpBalance;
  if (qlpBalance && reservedAmount) {
    maxSellAmount = qlpBalance.sub(reservedAmount);
  }

  const onSwapOptionChange = (opt) => {
    if (opt === "Withdraw Liquidity") {
      switchSwapOption("redeem");
    } else {
      switchSwapOption();
    }
  };

  return (
    <div className="QlpSwap">
      <div className="QlpSwap-content">
        <div className="App-card QlpSwap-stats-card">
          <div className="App-card-title" style={{ marginBottom: 24 }}>
            <div className="App-card-title-mark">
              <div className="App-card-title-mark-icon">
                <img style={{ width: 48, height: 48 }} src={qlp40Icon} alt="qlp40Icon" />
              </div>
              <div className="App-card-title-mark-info">
                <div className="App-card-title-mark-title">QLP</div>
              </div>
            </div>
          </div>
          <div className="App-card-divider"></div>
          <div className="App-card-content">
            <div className="App-card-row">
              <div className="label">Price</div>
              <div className="value">${formatAmount(qlpPrice, USD_DECIMALS, QPXQLP_DISPLAY_DECIMALS, true)}</div>
            </div>
            <div className="App-card-row" style={{ marginTop: 12 }}>
              <div className="label">APR</div>
              <div className="value flex">
                <span className="positive" style={{ marginRight: 6 }}>
                  {formatAmount(currentApr, 0, 0, true)}%
                </span>
              </div>
            </div>
          </div>
          <div className="App-card-content">
            <div className="App-card-row">
              <div className="label">In Wallet</div>
              <div className="value">
                {formatAmount(qlpBalance, QLP_DECIMALS, 4, true)} QLP ($
                {formatAmount(qlpBalanceUsd, USD_DECIMALS, 2, true)})
              </div>
            </div>
          </div>
          <div className="App-card-content">
            <div className="App-card-row" style={{ paddingBottom: 28 }}>
              <div className="label">Staked</div>
              <div className="value">...</div>
            </div>
            <div className="App-card-row">
              <div className="label">Total Supply</div>
              <div className="value">
                {formatAmount(qlpSupply, QLP_DECIMALS, 4, true)} QLP ($
                {formatAmount(qlpSupplyUsd, USD_DECIMALS, 2, true)})
              </div>
            </div>
          </div>

          <div className="App-card-divider"></div>
        </div>
        <div className="QlpSwap-box App-box basis-mobile">
          <Tab
            options={["Add Liquidity", "Withdraw Liquidity"]}
            option={tabLabel}
            onChange={onSwapOptionChange}
            className="Exchange-swap-option-tabs"
          />
          {isBuying && (
            <BuyInputSection
              topLeftLabel={payLabel}
              topRightLabel={`Balance: `}
              tokenBalance={`${formatAmount(swapTokenBalance, swapToken.decimals, 4, true)}`}
              inputValue={swapValue}
              onInputValueChange={onSwapValueChange}
              showMaxButton={swapValue !== formatAmountFree(swapTokenBalance, swapToken.decimals, swapToken.decimals)}
              onClickTopRightLabel={fillMaxAmount}
              onClickMax={fillMaxAmount}
              selectedToken={swapToken}
              balance={payBalance}
            >
              <TokenSelector
                label="Pay"
                chainId={chainId}
                tokenAddress={swapTokenAddress}
                onSelectToken={onSelectSwapToken}
                tokens={whitelistedTokens}
                infoTokens={infoTokens}
                className="QlpSwap-from-token"
                showSymbolImage={true}
                showTokenImgInDropdown={true}
              />
            </BuyInputSection>
          )}

          {!isBuying && (
            <BuyInputSection
              topLeftLabel={payLabel}
              topRightLabel={`Available: `}
              tokenBalance={`${formatAmount(maxSellAmount, QLP_DECIMALS, 4, true)}`}
              inputValue={qlpValue}
              onInputValueChange={onQlpValueChange}
              showMaxButton={qlpValue !== formatAmountFree(maxSellAmount, QLP_DECIMALS, QLP_DECIMALS)}
              onClickTopRightLabel={fillMaxAmount}
              onClickMax={fillMaxAmount}
              balance={payBalance}
              defaultTokenName={"QLP"}
            >
              <div className="selected-token">
                <img width={24} height={24} src={qlp24Icon} alt="qlp24Icon" />
                QLP
              </div>
            </BuyInputSection>
          )}

          <div className="AppOrder-ball-container">
            <div className="AppOrder-ball">
              <img
                src={arrowIcon}
                alt="arrowIcon"
                onClick={() => {
                  setIsBuying(!isBuying);
                  switchSwapOption(isBuying ? "redeem" : "");
                }}
              />
            </div>
          </div>

          {isBuying && (
            <BuyInputSection
              topLeftLabel={receiveLabel}
              topRightLabel={`Balance: `}
              tokenBalance={`${formatAmount(qlpBalance, QLP_DECIMALS, 4, true)}`}
              inputValue={qlpValue}
              onInputValueChange={onQlpValueChange}
              balance={receiveBalance}
              defaultTokenName={"QLP"}
            >
              <div className="selected-token">
                <img width={24} height={24} src={qlp24Icon} alt="qlp24Icon" /> QLP
              </div>
            </BuyInputSection>
          )}

          {!isBuying && (
            <BuyInputSection
              topLeftLabel={receiveLabel}
              topRightLabel={`Balance: `}
              tokenBalance={`${formatAmount(swapTokenBalance, swapToken.decimals, 4, true)}`}
              inputValue={swapValue}
              onInputValueChange={onSwapValueChange}
              balance={receiveBalance}
              selectedToken={swapToken}
            >
              <TokenSelector
                label="Receive"
                chainId={chainId}
                tokenAddress={swapTokenAddress}
                onSelectToken={onSelectSwapToken}
                tokens={whitelistedTokens}
                infoTokens={infoTokens}
                className="QlpSwap-from-token"
                showSymbolImage={true}
                showTokenImgInDropdown={true}
              />
            </BuyInputSection>
          )}
          <div>
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">{feeBasisPoints > 50 ? "Warning: High Fees" : "Fees"}</div>
              <div className="align-right fee-block">
                {isBuying && (
                  <Tooltip
                    handle={isBuying && isSwapTokenCapReached ? "NA" : feePercentageText}
                    position="right-bottom"
                    renderContent={() => {
                      return (
                        <>
                          {feeBasisPoints > 50 && (
                            <div>Select an alternative asset for providing liquidity to reduce fees.</div>
                          )}
                          To get the lowest fee percentages, look in the "Save Fees" section below.
                        </>
                      );
                    }}
                  />
                )}
                {!isBuying && (
                  <Tooltip
                    handle={feePercentageText}
                    position="right-bottom"
                    renderContent={() => {
                      return (
                        <>
                          {feeBasisPoints > 50 && (
                            <div>To reduce fees, select a different asset to remove liquidity.</div>
                          )}
                          To get the lowest fee percentages, look in the "Save Fees" section below.
                        </>
                      );
                    }}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="QlpSwap-cta Exchange-swap-button-container">
            <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
              {getPrimaryText()}
            </button>
          </div>
        </div>
      </div>
      {/* <Stake/> */}
      <div className="Tab-title-section" style={{ marginLeft: -12 }}>
        <div className="Page-title">Save Fees</div>
        {isBuying && (
          <div className="Page-description">
            The fees can vary based on the asset you wish to add liquidity for QLP.
            <br /> Enter the requested amount of QLP or asset to be added into the interface and compare the fees here.
          </div>
        )}
        {!isBuying && (
          <div className="Page-description">
            The fees can vary based on the asset you wish to add liquidity for QLP.
            <br /> Enter the requested amount of QLP or asset to be added into the interface and compare the fees here.
          </div>
        )}
      </div>
      <div className="QlpSwap-token-list">
        {/* <div className="QlpSwap-token-list-content"> */}
        <table className="token-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Price</th>
              <th>
                {isBuying ? (
                  <Tooltip
                    handle={"Available"}
                    tooltipIconPosition="right"
                    position="right-bottom text-none"
                    renderContent={() => "Available amount to deposit into QLP."}
                  />
                ) : (
                  <Tooltip
                    handle={"Available"}
                    tooltipIconPosition="right"
                    position="right-bottom text-none"
                    renderContent={() => {
                      return (
                        <>
                          <div>Available amount to -LIQ. from QLP.</div>
                          <div>Funds that are not being utilized by current open positions.</div>
                        </>
                      );
                    }}
                  />
                )}
              </th>
              <th>Wallet</th>
              <th>
                <Tooltip
                  handle={"Fees"}
                  tooltipIconPosition="right"
                  position="right-bottom text-none"
                  renderContent={() => {
                    return (
                      <>
                        <div>Fees will be shown once you have entered an amount in the order form.</div>
                      </>
                    );
                  }}
                />
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tokenList.map((token) => {
              let tokenFeeBps;
              if (isBuying) {
                const { feeBasisPoints: feeBps } = getBuyQlpFromAmount(
                  qlpAmount,
                  token.address,
                  infoTokens,
                  qlpPrice,
                  usdqSupply,
                  totalTokenWeights
                );
                tokenFeeBps = feeBps;
              } else {
                const { feeBasisPoints: feeBps } = getSellQlpToAmount(
                  qlpAmount,
                  token.address,
                  infoTokens,
                  qlpPrice,
                  usdqSupply,
                  totalTokenWeights
                );
                tokenFeeBps = feeBps;
              }
              const tokenInfo = getTokenInfo(infoTokens, token.address);
              let managedUsd;
              if (tokenInfo && tokenInfo.managedUsd) {
                managedUsd = tokenInfo.managedUsd;
              }
              let availableAmountUsd;
              if (tokenInfo && tokenInfo.minPrice && tokenInfo.availableAmount) {
                availableAmountUsd = tokenInfo.availableAmount
                  .mul(tokenInfo.minPrice)
                  .div(expandDecimals(1, token.decimals));
              }
              let balanceUsd;
              if (tokenInfo && tokenInfo.minPrice && tokenInfo.balance) {
                balanceUsd = tokenInfo.balance.mul(tokenInfo.minPrice).div(expandDecimals(1, token.decimals));
              }

              var tokenImage = null;

              try {
                tokenImage = getImageUrl({
                  path: `coins/others/${token.symbol.toLowerCase()}-original`,
                  format: "png",
                });
              } catch (error) {
                console.error(error);
              }
              let isCapReached = tokenInfo.managedAmount?.gt(tokenInfo.maxUsdqAmount);

              let amountLeftToDeposit;
              if (tokenInfo.maxUsdqAmount && tokenInfo.maxUsdqAmount.gt(0)) {
                amountLeftToDeposit = adjustForDecimals(tokenInfo.maxUsdqAmount, USDQ_DECIMALS, USD_DECIMALS).sub(
                  tokenInfo.managedUsd
                );
              }
              function renderFees() {
                const swapUrl =
                  chainId === POLYGON_ZKEVM
                    ? `https://quickswap.exchange/#/swap?currency0=${token.address}`
                    : `https://quickswap.exchange/#/swap?currency0=${token.address}`;
                switch (true) {
                  case (isBuying && isCapReached) || (!isBuying && managedUsd?.lt(1)):
                    return (
                      <Tooltip
                        handle="NA"
                        position="right-bottom"
                        renderContent={() => (
                          <div>
                            Max pool capacity reached for {tokenInfo.symbol}
                            <br />
                            <br />
                            Please mint QLP using another token
                            <br />
                            <p>
                              <a href={swapUrl} target="_blank" rel="noreferrer">
                                Swap on {chainId === POLYGON_ZKEVM ? "Quickswap" : "Trader Joe"}
                              </a>
                            </p>
                          </div>
                        )}
                      />
                    );
                  case (isBuying && !isCapReached) || (!isBuying && managedUsd?.gt(0)):
                    return `${formatAmount(tokenFeeBps, 2, 2, true, "-")}${
                      tokenFeeBps !== undefined && tokenFeeBps.toString().length > 0 ? "%" : ""
                    }`;
                  default:
                    return "";
                }
              }

              return (
                <tr key={token.symbol}>
                  <td>
                    <div className="App-card-title-info">
                      <div className="App-card-title-info-icon">
                        <img
                          style={{ objectFit: "contain" }}
                          src={tokenImage || tokenImage.default}
                          alt={token.symbol}
                          width="40px"
                          height="40px"
                        />
                      </div>
                      <div className="App-card-title-info-text">
                        <div style={{ display: "flex", alignItems: "center" }} className="App-card-info-title">
                          {token.symbol}
                          {token.symbol === "BUSD" && (
                            <span
                              style={{
                                background: "#ffaa27",
                                fontWeight: "bold",
                                fontSize: 12,
                                padding: "0 10px",
                                color: "black",
                                borderRadius: 30,
                                userSelect: "none",
                              }}
                            >
                              NEW
                            </span>
                          )}
                          <div>
                            <AssetDropdown assetSymbol={token.symbol} assetInfo={token} />
                          </div>
                        </div>
                        <div
                          style={{ display: "flex", alignItems: "center", gap: 13 }}
                          className="App-card-info-subtitle"
                        >
                          {token.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>${formatKeyAmount(tokenInfo, "minPrice", USD_DECIMALS, tokenInfo.displayDecimals, true)}</td>
                  <td>
                    {isBuying && (
                      <div>
                        <Tooltip
                          handle={
                            amountLeftToDeposit && amountLeftToDeposit.lt(0)
                              ? "$0.00"
                              : `$${formatAmount(amountLeftToDeposit, USD_DECIMALS, 2, true)}`
                          }
                          position="right-bottom"
                          tooltipIconPosition="right"
                          renderContent={() => {
                            return (
                              <>
                                Current Pool Amount: ${formatAmount(managedUsd, USD_DECIMALS, 2, true)} (
                                {formatKeyAmount(tokenInfo, "poolAmount", token.decimals, 2, true)} {token.symbol})
                                <br />
                                <br />
                                Max Pool Capacity: ${formatAmount(tokenInfo.maxUsdqAmount, 18, 0, true)}
                              </>
                            );
                          }}
                        />
                      </div>
                    )}
                    {!isBuying && (
                      <div>
                        {formatKeyAmount(tokenInfo, "availableAmount", token.decimals, 2, true)} {token.symbol} ($
                        {formatAmount(availableAmountUsd, USD_DECIMALS, 2, true)})
                      </div>
                    )}
                  </td>
                  <td>
                    {formatKeyAmount(tokenInfo, "balance", tokenInfo.decimals, 2, true)} {tokenInfo.symbol} ($
                    {formatAmount(balanceUsd, USD_DECIMALS, 2, true)})
                  </td>
                  <td>{renderFees()}</td>
                  <td>
                    <button
                      className={cx("App-button-option action-btn", isBuying ? "buying" : "selling")}
                      onClick={() => selectToken(token)}
                    >
                      {isBuying ? "+ Liquidity with " + token.symbol : "- Liquidity for " + token.symbol}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="token-grid">
          {tokenList.map((token) => {
            let tokenFeeBps;
            if (isBuying) {
              const { feeBasisPoints: feeBps } = getBuyQlpFromAmount(
                qlpAmount,
                token.address,
                infoTokens,
                qlpPrice,
                usdqSupply,
                totalTokenWeights
              );
              tokenFeeBps = feeBps;
            } else {
              const { feeBasisPoints: feeBps } = getSellQlpToAmount(
                qlpAmount,
                token.address,
                infoTokens,
                qlpPrice,
                usdqSupply,
                totalTokenWeights
              );
              tokenFeeBps = feeBps;
            }
            const tokenInfo = getTokenInfo(infoTokens, token.address);
            let managedUsd;
            if (tokenInfo && tokenInfo.managedUsd) {
              managedUsd = tokenInfo.managedUsd;
            }
            let availableAmountUsd;
            if (tokenInfo && tokenInfo.minPrice && tokenInfo.availableAmount) {
              availableAmountUsd = tokenInfo.availableAmount
                .mul(tokenInfo.minPrice)
                .div(expandDecimals(1, token.decimals));
            }
            let balanceUsd;
            if (tokenInfo && tokenInfo.minPrice && tokenInfo.balance) {
              balanceUsd = tokenInfo.balance.mul(tokenInfo.minPrice).div(expandDecimals(1, token.decimals));
            }

            let amountLeftToDeposit;
            if (tokenInfo.maxUsdqAmount && tokenInfo.maxUsdqAmount.gt(0)) {
              amountLeftToDeposit = adjustForDecimals(tokenInfo.maxUsdqAmount, USDQ_DECIMALS, USD_DECIMALS).sub(
                tokenInfo.managedUsd
              );
            }
            let isCapReached = tokenInfo.managedAmount?.gt(tokenInfo.maxUsdqAmount);

            var tokenImage = null;

            try {
              tokenImage = getImageUrl({
                path: `coins/others/${token.symbol.toLowerCase()}-original`,
                format: "png",
              });
            } catch (error) {
              console.error(error);
            }

            function renderFees() {
              switch (true) {
                case (isBuying && isCapReached) || (!isBuying && managedUsd?.lt(1)):
                  return (
                    <Tooltip
                      handle="NA"
                      position="right-bottom"
                      renderContent={() =>
                        `Maximum pool capacity reached for ${tokenInfo.symbol}. Please add Liquidity with another token for the QLP`
                      }
                    />
                  );
                case (isBuying && !isCapReached) || (!isBuying && managedUsd?.gt(0)):
                  return `${formatAmount(tokenFeeBps, 2, 2, true, "-")}${
                    tokenFeeBps !== undefined && tokenFeeBps.toString().length > 0 ? "%" : ""
                  }`;
                default:
                  return "";
              }
            }

            return (
              <div className="App-card" key={token.symbol}>
                <div
                  style={{
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: 8,
                    display: "flex",
                  }}
                  className="App-card-title"
                >
                  <img src={tokenImage || tokenImage.default} alt={token.symbol} width="40px" />

                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span>{token.name}</span>
                    {token.symbol === "BUSD" && (
                      <span
                        style={{
                          background: "#ffaa27",
                          fontWeight: "bold",
                          fontSize: 12,
                          padding: "0 10px",
                          color: "black",
                          borderRadius: 30,
                          userSelect: "none",
                        }}
                      >
                        NEW
                      </span>
                    )}
                  </div>
                </div>
                <div className="App-card-divider"></div>
                <div className="App-card-content">
                  <div className="App-card-row">
                    <div className="label">Price</div>
                    <div>${formatKeyAmount(tokenInfo, "minPrice", USD_DECIMALS, tokenInfo.displayDecimals, true)}</div>
                  </div>
                  {isBuying && (
                    <div className="App-card-row">
                      <Tooltip
                        className="label"
                        handle="Available"
                        position="right-bottom"
                        renderContent={() => "Available amount to deposit into QLP."}
                      />
                      <div>
                        <Tooltip
                          handle={amountLeftToDeposit && `$${formatAmount(amountLeftToDeposit, USD_DECIMALS, 2, true)}`}
                          position="right-bottom"
                          tooltipIconPosition="right"
                          renderContent={() => {
                            return (
                              <>
                                Current Pool Amount: ${formatAmount(managedUsd, USD_DECIMALS, 2, true)} (
                                {formatKeyAmount(tokenInfo, "poolAmount", token.decimals, 2, true)} {token.symbol})
                                <br />
                                <br />
                                Maximum Pool Capacity: ${formatAmount(tokenInfo.maxUsdqAmount, 18, 0, true)}
                              </>
                            );
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {!isBuying && (
                    <div className="App-card-row">
                      <Tooltip
                        handle="Available"
                        position="right-bottom"
                        renderContent={() => {
                          return (
                            <>
                              <div>Available amount to withdraw from QLP.</div>
                              <div>Funds not utilized by current open positions.</div>
                            </>
                          );
                        }}
                      />
                      <div>
                        {formatKeyAmount(tokenInfo, "availableAmount", token.decimals, 2, true)} {token.symbol} ($
                        {formatAmount(availableAmountUsd, USD_DECIMALS, 2, true)})
                      </div>
                    </div>
                  )}

                  <div className="App-card-row">
                    <div className="label">Wallet</div>
                    <div>
                      {formatKeyAmount(tokenInfo, "balance", tokenInfo.decimals, 2, true)} {tokenInfo.symbol} ($
                      {formatAmount(balanceUsd, USD_DECIMALS, 2, true)})
                    </div>
                  </div>
                  <div className="App-card-row">
                    <div className="label">
                      {tokenFeeBps ? (
                        "Fees"
                      ) : (
                        <Tooltip
                          handle={`Fees`}
                          renderContent={() => `Please enter an amount to see fee percentages`}
                        />
                      )}
                    </div>
                    <div>{renderFees()}</div>
                  </div>
                  <div className="App-card-divider"></div>
                  <div style={{ paddingLeft: 0 }} className="App-card-options">
                    {isBuying && (
                      <button
                        style={{ marginLeft: 0, marginRight: 0 }}
                        className="App-button-option App-card-option"
                        onClick={() => selectToken(token)}
                      >
                        Add Liquidity with {token.symbol}
                      </button>
                    )}
                    {!isBuying && (
                      <button
                        style={{ marginLeft: 0, marginRight: 0 }}
                        className="App-button-option App-card-option"
                        onClick={() => selectToken(token)}
                      >
                        Withdraw Liquidity for {token.symbol}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* </div> */}
      </div>
    </div>
  );
}
