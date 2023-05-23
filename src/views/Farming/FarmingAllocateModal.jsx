import { useState } from "react";
import * as React from "react";
import PercentageSelector from "./PercentageSelector";
import Modal from "../../components/Modal/Modal";
import { approveTokens, fetcher, formatAmount, parseValue, useChainId } from "../../Helpers";
import { dividendsAllocate, dividendsDeallocate } from "../../Api";
import { useWeb3React } from "@web3-react/core";
import { getContract } from "../../Addresses";
import useSWR from "swr";
import FarmingAbi from "../../abis/Farming.json";
import QLPAbi from "../../abis/QLP.json";

const FarmingAllocateModal = ({ isAllocate, isModalVisible, setIsModalVisible }) => {
  const { active, account, library } = useWeb3React();
  const { chainId } = useChainId();
  const [convertAmount, setConvertAmount] = useState("");
  const [isApproving, setIsApproving] = useState("");
  const [isStaking, setIsStaking] = useState("");

  const dividendsAddress = getContract(chainId, "Farming");
  const qlpAddress = getContract(chainId, "QLP");
  const { data: qlpAllowance } = useSWR(account && [`QlpBalance:${active}`, chainId, qlpAddress, "allowance"], {
    fetcher: fetcher(library, QLPAbi, [account, dividendsAddress]),
  });

  const { data: qlpBalance } = useSWR(account && [`QlpBalance:${active}`, chainId, qlpAddress, "balanceOf"], {
    fetcher: fetcher(library, QLPAbi, [account]),
  });

  const { data: stakedQlpBalance } = useSWR(
    account && [`usersAllocation:${active}`, chainId, dividendsAddress, "usersAllocation"],
    {
      fetcher: fetcher(library, FarmingAbi, [account]),
    }
  );
  let convertAmountEth = parseValue(convertAmount, 18);
  const needApproval =
    isAllocate && qlpAllowance && qlpBalance && convertAmountEth && convertAmountEth.gt(qlpAllowance);

  const getError = () => {
    if (!convertAmountEth || convertAmountEth.eq(0)) {
      return "ENTER AN AMOUNT";
    }

    if (isAllocate && qlpBalance && convertAmountEth.gt(qlpBalance)) {
      return "AMOUNT EXCEEDED BALANCE";
    }
    if (!isAllocate && stakedQlpBalance && convertAmountEth.gt(stakedQlpBalance)) {
      return "AMOUNT EXCEEDED BALANCE";
    }
  };

  const isPrimaryEnabled = () => {
    const error = getError();
    if (error) {
      return false;
    }
    if (isApproving) {
      return false;
    }
    if (isStaking) {
      return false;
    }
    return true;
  };

  const getPrimaryText = () => {
    const error = getError();
    if (error) {
      return error;
    }
    if (isApproving) {
      return `Approving QLP...`;
    }
    if (needApproval) {
      return `Approve QLP`;
    }
    if (isStaking) {
      return isAllocate ? "Staking..." : "Unstaking...";
    }
    return isAllocate ? "Stake" : "Unstake";
  };

  const onClickPrimary = () => {
    if (needApproval) {
      approveTokens({
        setIsApproving,
        library,
        tokenAddress: qlpAddress,
        spender: dividendsAddress,
        chainId,
      });
      return;
    }

    setIsStaking(true);
    const stakingFunc = isAllocate ? dividendsAllocate : dividendsDeallocate;
    stakingFunc(chainId, library, convertAmountEth)
      .then()
      .catch()
      .finally(() => {
        setIsStaking(false);
        setIsModalVisible(false);
      });
  };

  return (
    <Modal
      disableBodyScrollLock={false}
      isVisible={isModalVisible}
      setIsVisible={setIsModalVisible}
      label={`${isAllocate ? "Stake" : "Unstake"} QLP`}
      className="FarmingAllocateModal"
    >
      <div id="modalWrapper" className="modalWrapper">
        <div className="dividends-modal-content">
          <h2>Amount</h2>
          <input
            className="dividends-input"
            type="text"
            placeholder="0.00 QLP"
            value={convertAmount}
            onChange={(e) => setConvertAmount(e.target.value)}
          />
          <div className="balance-container">
            <div className="balance">
              <p className="balance-title ">Wallet Balance: </p>
              <p className="balance-value ">
                {formatAmount(isAllocate ? qlpBalance : stakedQlpBalance, 18, 2, true)} QLP
              </p>
            </div>
            <div className="selector">
              <PercentageSelector
                balance={
                  isAllocate
                    ? qlpBalance
                      ? qlpBalance.div(1e12).toNumber() / 1e6
                      : 0
                    : stakedQlpBalance
                    ? stakedQlpBalance.div(1e12).toNumber() / 1e6
                    : 0
                }
                setInputValue={setConvertAmount}
              />
            </div>
          </div>
        </div>
        <div className="">
          <div className="footer-btns">
            <button className="App-button-option" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
              {getPrimaryText()}
            </button>
            <button
              className="App-button-option"
              style={{ background: "transparent" }}
              onClick={() => setIsModalVisible(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
export default FarmingAllocateModal;
