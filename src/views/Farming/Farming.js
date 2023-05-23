import React from "react";
import { useState } from "react";
import "./Farming.css";
import FarmingIcon1 from "../../assets/icons/FarmingIcon1";
import FarmingIcon2 from "../../assets/icons/FarmingIcon2";
import FarmingIcon3 from "../../assets/icons/FarmingIcon3";
import EpochRow from "./EpochRow";
import { useWeb3React } from "@web3-react/core";
import useComponentVisible from "../../hooks/useComponentVisible";
import ETH from "../../assets/icons/ETH_24.svg";
import WETH from "../../assets/icons/WETH";
import FarmingAllocateModal from "./FarmingAllocateModal";
import {
  QLP_DECIMALS,
  USD_DECIMALS,
  bigNumberify,
  expandDecimals,
  fetcher,
  formatAmount,
  useChainId,
} from "../../Helpers";
import FarmingAbi from "../../abis/Farming.json";
import QLPAbi from "../../abis/QLP.json";
import QlpManager from "../../abis/QlpManager.json";

import { farmingClaimAll, useInfoTokens, useQuickUsdPrice } from "../../Api";
import { getTokenBySymbol } from "../../data/Tokens";
import { getContract } from "../../Addresses";
import useSWR from "swr";

export default function Farming(props) {
  const { active, account, library } = useWeb3React();
  const { chainId } = useChainId();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAllocate, setIsAllocate] = useState(true);

  const farmingAddress = getContract(chainId, "Farming");
  const qlpAddress = getContract(chainId, "QLP");
  const ethAddress = getTokenBySymbol(chainId, "WETH");
  const quickAddress = getContract(chainId, "QUICK");
  const maticAddress = getTokenBySymbol(chainId, "MATIC");
  const qlpManagerAddress = getContract(chainId, "QlpManager");

  const { infoTokens } = useInfoTokens(library, chainId, active, undefined, undefined);

  const ethTokenInfo = infoTokens[ethAddress.address];
  const maticTokenInfo = infoTokens[maticAddress.address];

  const quickPrice = useQuickUsdPrice();

  const { data: aums } = useSWR([`QlpSwap:getAums:${active}`, chainId, qlpManagerAddress, "getAums"], {
    fetcher: fetcher(library, QlpManager, []),
  });

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

  const { data: qlpBalance } = useSWR(active && [`QlpBalance:${active}`, chainId, qlpAddress, "balanceOf", account], {
    fetcher: fetcher(library, QLPAbi, []),
  });

  const { data: qlpTotalSupply } = useSWR(active && [`QlpTotalSupply:${active}`, chainId, qlpAddress, "totalSupply"], {
    fetcher: fetcher(library, QLPAbi, []),
  });

  const { data: pendingEthAmount } = useSWR(
    active && [`pendingFarmingAmount:eth:${active}`, chainId, farmingAddress, "pendingFarmingAmount", ethAddress.address, account],
    {
      fetcher: fetcher(library, FarmingAbi, []),
    }
  );

  const { data: pendingQuickAmount } = useSWR(
    active && [`pendingFarmingAmount:quick:${active}`, chainId, farmingAddress, "pendingFarmingAmount", quickAddress, account],
    {
      fetcher: fetcher(library, FarmingAbi, []),
    }
  );

  const { data: pendingMaticAmount } = useSWR(
    active && [`pendingFarmingAmount:matic:${active}`, chainId, farmingAddress, "pendingFarmingAmount", maticAddress.address, account],
    {
      fetcher: fetcher(library, FarmingAbi, []),
    }
  );

  const { data: userAllocation } = useSWR(
    active && [`quickFarmingInfo:${active}`, chainId, farmingAddress, "usersAllocation", account],
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

  //QLP PRICE
  let aum;
  if (aums && aums.length > 0) {
    aum = aums[1];
  }
  const qlpPrice =
    aum && aum.gt(0) && qlpTotalSupply && qlpTotalSupply.gt(0)
      ? aum.mul(expandDecimals(1, QLP_DECIMALS)).div(qlpTotalSupply)
      : expandDecimals(1, USD_DECIMALS);

  const currentDistributionAmount = ethAmountInUsd.add(quickAmountInUsd).add(maticAmountInUsd);
  const currentApr =
    totalAllocation && qlpPrice && currentDistributionAmount && totalAllocation.gt(0) && qlpPrice.gt(0)
      ? currentDistributionAmount.mul(expandDecimals(1,30)).mul(365).div(7).mul(100).div(totalAllocation).div(qlpPrice)
      : bigNumberify(0);

  function handleClaimAll(withdrawETH) {
    farmingClaimAll(chainId, library, withdrawETH);
  }

  const {
    ref: claimAllModalRef,
    isComponentVisible: isClaimAllModalOpen,
    setIsComponentVisible: setIsClaimAllModalOpen,
  } = useComponentVisible(false);

  return (
    <div className="default-container farming-content page-layout">
      <FarmingAllocateModal
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
        isAllocate={isAllocate}
      />

      <div className="section-title-content mb-3">
        <div className="Page-title">Farming</div>
        <div className="dividens-header-container">
          <div className="dividens-header-item ">
            <div>
              <FarmingIcon1 />
            </div>
            <div className="dividens-header-item-content">
              <h1 className="dividens-header-item-content-label">Current Distribution</h1>
              <p className="dividens-header-item-content-value">
                ${formatAmount(currentDistributionAmount, 18, 2, true)}
              </p>
            </div>
          </div>
          <div className="dividens-header-item ">
            <div>
              <FarmingIcon2 />
            </div>
            <div className="dividens-header-item-content">
              <h1 className="dividens-header-item-content-label">Current APR</h1>
              <p className="dividens-header-item-content-value">{formatAmount(currentApr, 0, 0, true)}%</p>
            </div>
          </div>
          <div className="dividens-header-item">
            <div>
              <FarmingIcon3 />
            </div>
            <div className="dividens-header-item-content">
              <h1 className="dividens-header-item-content-label">Total QLP staked</h1>
              <p className="dividens-header-item-content-value">{formatAmount(totalAllocation, 18, 2, true)}</p>
            </div>
          </div>
        </div>

        <div className="dividens-content-container ">
          <div className="dividens-card ">
            <p class="dividens-card-title ">Current epoch</p>
            <EpochRow
              name={"ETH"}
              symbol={"WETH"}
              amount={ethFarmingInfo && ethFarmingInfo.currentDistributionAmount}
              price={ethTokenInfo.minPrice}
            />
            <EpochRow
              name={"MATIC"}
              symbol={"MATIC"}
              amount={maticFarmingInfo && maticFarmingInfo.currentDistributionAmount}
              price={maticTokenInfo.minPrice}
            />
            <EpochRow
              name={"QUICK"}
              symbol={"QUICK"}
              amount={quickFarmingInfo && quickFarmingInfo.currentDistributionAmount}
              price={quickPrice}
            />
          </div>
          <div className="dividens-card " style={{ display: "flex", flexDirection: "column" }}>
            <div>
              <div className="allocation-header ">
                <div className="dividens-card-title">Your allocation</div>
                <div>
                  <button
                    className="App-button-option unstake-btn"
                    onClick={() => {
                      setIsModalVisible(true);
                      setIsAllocate(false);
                    }}
                  >
                    Unstake
                  </button>
                  <button
                    className="App-button-option stake-btn"
                    onClick={() => {
                      setIsModalVisible(true);
                      setIsAllocate(true);
                    }}
                  >
                    Stake
                  </button>
                </div>
              </div>
              <div className="allocation-list">
                <div className="list-row">
                  <p>Your allocation</p>
                  <p>{formatAmount(userAllocation, 18, 2, true)} QLP</p>
                </div>
                <div className="allocation-list-divider"></div>
                <div className="list-row">
                  <p>Your share</p>
                  <p>
                    {userAllocation && totalAllocation && totalAllocation.gt(0)
                      ? formatAmount(userAllocation.mul(1000000).div(totalAllocation).toNumber(), 4, 2)
                      : "..."}{" "}
                    %{" "}
                  </p>
                </div>
                <div className="allocation-list-divider"></div>
                <div className="list-row">
                  <p>Available to stake</p>
                  <p>{formatAmount(qlpBalance, 18, 2, true)} </p>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 24 }}>
              <div className="allocation-header  ">
                <div className="dividens-card-title">Your rewards</div>
                <div style={{ position: "relative" }}>
                  <button className="App-button-option claim-all-btn" onClick={() => setIsClaimAllModalOpen(true)}>
                    Claim All
                  </button>
                  {isClaimAllModalOpen && (
                    <div
                      ref={claimAllModalRef}
                      className="claim-modal-container"
                      onBlur={() => setIsClaimAllModalOpen(false)}
                    >
                      <button onClick={() => handleClaimAll(false)}>
                        <WETH /> Claim as WETH
                      </button>
                      <button onClick={() => handleClaimAll(true)}>
                        <img src={ETH} alt="" /> Claim as ETH
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <EpochRow
                  name={"ETH"}
                  symbol={"WETH"}
                  amount={pendingEthAmount}
                  displayDecimals={4}
                  isClaim={true}
                  price={ethTokenInfo.minPrice}
                  tokenAddress={ethAddress.address}
                />
                <EpochRow
                  name={"MATIC"}
                  symbol={"MATIC"}
                  amount={pendingMaticAmount}
                  isClaim={true}
                  price={maticTokenInfo.minPrice}
                  tokenAddress={maticAddress.address}
                />
                <EpochRow
                  name={"QUICK"}
                  symbol={"QUICK"}
                  amount={pendingQuickAmount}
                  isClaim={true}
                  price={quickPrice}
                  tokenAddress={quickAddress}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
