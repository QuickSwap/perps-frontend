import React from "react";
import { useState } from "react";
import "./Dividends.css";
import DividendsIcon1 from "../../assets/icons/DividendsIcon1";
import DividendsIcon2 from "../../assets/icons/DividendsIcon2";
import DividendsIcon3 from "../../assets/icons/DividendsIcon3";
import EpochRow from "./EpochRow";
import { useWeb3React } from "@web3-react/core";
import useComponentVisible from "../../hooks/useComponentVisible";
import ETH from "../../assets/icons/ETH_24.svg";
import WETH from "../../assets/icons/WETH";
import DividendsAllocateModal from "./DividendsAllocateModal";
import { fetcher, formatAmount, useChainId } from "../../Helpers";
import {
  dividendsClaimAll,
  useInfoTokens,
  useQuickUsdPrice,
} from "../../Api";
import { getTokenBySymbol } from "../../data/Tokens";
import { getContract } from "../../Addresses";
import useSWR from "swr";

export default function Dividends(props) {
  const { active, account, library } = useWeb3React();
  const { chainId } = useChainId();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAllocate, setIsAllocate] = useState(true);

  const dividendsAddress = getContract(chainId, "Dividends");
  const qlpAddress = getContract(chainId, "QLP");
  const ethAddress = getTokenBySymbol(chainId, "WETH");
  const quickAddress = getContract(chainId, "QUICK");
  const maticAddress = getTokenBySymbol(chainId, "MATIC");

  const { infoTokens } = useInfoTokens(library, chainId, active, undefined, undefined);

  const ethTokenInfo = infoTokens[ethAddress.address];
  const maticTokenInfo = infoTokens[maticAddress.address];

  const quicpPrice = useQuickUsdPrice();

  const { data: ethDividendsInfo } = useSWR([`ethDividendsInfo:${active}`, chainId, dividendsAddress], {
    fetcher: fetcher(library, dividendsAddress, "dividendsInfo", [0]),
  });

  const { data: maticDividendsInfo } = useSWR([`maticDividendsInfo:${active}`, chainId, dividendsAddress], {
    fetcher: fetcher(library, dividendsAddress, "dividendsInfo", [1]),
  });

  const { data: quickDividendsInfo } = useSWR([`quickDividendsInfo:${active}`, chainId, dividendsAddress], {
    fetcher: fetcher(library, dividendsAddress, "dividendsInfo", [2]),
  });

  const { data: totalAllocation } = useSWR([`quickDividendsInfo:${active}`, chainId, dividendsAddress], {
    fetcher: fetcher(library, dividendsAddress, "totalAllocation", []),
  });

  const { data: qlpBalance } = useSWR([`QlpBalance:${active}`, chainId, qlpAddress], {
    fetcher: fetcher(library, qlpAddress, "balanceOf", [account]),
  });

  const { data: stakedQlpBalance } = useSWR([`StakedQlpBalance:${active}`, chainId, dividendsAddress], {
    fetcher: fetcher(library, dividendsAddress, "usersAllocation", [account]),
  });

  const { data: pendingEthAmount } = useSWR([`StakedQlpBalance:${active}`, chainId, dividendsAddress], {
    fetcher: fetcher(library, dividendsAddress, "pendingDividendsAmount", [ethAddress, account]),
  });

  const { data: pendingQuickAmount } = useSWR([`StakedQlpBalance:${active}`, chainId, dividendsAddress], {
    fetcher: fetcher(library, dividendsAddress, "pendingDividendsAmount", [quickAddress, account]),
  });

  const { data: pendingMaticAmount } = useSWR([`StakedQlpBalance:${active}`, chainId, dividendsAddress], {
    fetcher: fetcher(library, dividendsAddress, "pendingDividendsAmount", [maticAddress, account]),
  });

  const { data: userAllocation } = useSWR([`quickDividendsInfo:${active}`, chainId, dividendsAddress], {
    fetcher: fetcher(library, dividendsAddress, "usersAllocation", [account]),
  });

  function handleClaimAll(withdrawETH) {
    dividendsClaimAll(chainId, library, withdrawETH);
  }

  const {
    ref: claimAllModalRef,
    isComponentVisible: isClaimAllModalOpen,
    setIsComponentVisible: setIsClaimAllModalOpen,
  } = useComponentVisible(false);

  return (
    <div className="default-container dividends-content page-layout">
      <DividendsAllocateModal
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
        isAllocate={isAllocate}
      />

      <div className="section-title-content mb-3">
        <div className="Page-title">Dividends</div>
        <div className="dividens-header-container">
          <div className="dividens-header-item ">
            <div>
              <DividendsIcon1 />
            </div>
            <div className="dividens-header-item-content">
              <h1 className="dividens-header-item-content-label">Current Distribution</h1>
              <p className="dividens-header-item-content-value">$123</p>
            </div>
          </div>
          <div className="dividens-header-item ">
            <div>
              <DividendsIcon2 />
            </div>
            <div className="dividens-header-item-content">
              <h1 className="dividens-header-item-content-label">Current APR</h1>
              <p className="dividens-header-item-content-value">123%</p>
            </div>
          </div>
          <div className="dividens-header-item">
            <div>
              <DividendsIcon3 />
            </div>
            <div className="dividens-header-item-content">
              <h1 className="dividens-header-item-content-label">Total QLP staked</h1>
              <p className="dividens-header-item-content-value">123</p>
            </div>
          </div>
        </div>

        <div className="dividens-content-container ">
          <div className="dividens-card ">
            <p class="dividens-card-title ">Current epoch</p>
            <EpochRow name={"ETH"} symbol={"WETH"} amount={ethDividendsInfo.currentDistributionAmount} price={ethTokenInfo.minPrice}/>
            <EpochRow name={"MATIC"} symbol={"MATIC"} amount={maticDividendsInfo.currentDistributionAmount} price={maticTokenInfo.minPrice}/>
            <EpochRow name={"QUICK"} symbol={"QUICK"} amount={quickDividendsInfo.currentDistributionAmount} price={quicpPrice}/>
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
                  <p>{formatAmount(qlpBalance, 18, 2, true)} QLP</p>
                </div>
                <div className="allocation-list-divider"></div>
                <div className="list-row">
                  <p>Your share</p>
                  <p>{userAllocation.mul(10000).div(totalAllocation).toNumber() / 100} % </p>
                </div>
                <div className="allocation-list-divider"></div>
                <div className="list-row">
                  <p>Available to stake</p>
                  <p>{formatAmount(stakedQlpBalance, 18, 2, true)} </p>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 24 }}>
              <div className="allocation-header  ">
                <div className="dividens-card-title">Your dividends</div>
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
                <EpochRow name={"ETH"} symbol={"WETH"} amount={pendingEthAmount} isClaim={true} price={ethTokenInfo.minPrice} />
                <EpochRow name={"MATIC"} symbol={"MATIC"} amount={pendingMaticAmount} isClaim={true} price={maticTokenInfo.minPrice} />
                <EpochRow name={"QUICK"} symbol={"QUICK"} amount={pendingQuickAmount} isClaim={true} price={quicpPrice} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
