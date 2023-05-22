import { useState } from "react";
import * as React from "react";
import PercentageSelector from "./PercentageSelector";
import Modal from "../../components/Modal/Modal";
import { fetcher, formatAmount, useChainId } from "../../Helpers";
import { dividendsAllocate } from "../../Api";
import { useWeb3React } from "@web3-react/core";
import { getContract } from "../../Addresses";
import useSWR from "swr";

const DividendsAllocateModal = ({ isAllocate, isModalVisible, setIsModalVisible }) => {
  const { active, account, library } = useWeb3React();
  const { chainId } = useChainId();
  const [convertAmount, setConvertAmount] = useState("");

  const dividendsAddress = getContract(chainId, "Dividends");
  const qlpAddress = getContract(chainId, "QLP");
  const { data: qlpBalance } = useSWR([`QlpBalance:${active}`, chainId, qlpAddress], {
    fetcher: fetcher(library, qlpAddress, "balanceOf", [account]),
  });

  const { data: stakedQlpBalance } = useSWR([`StakedQlpBalance:${active}`, chainId, dividendsAddress], {
    fetcher: fetcher(library, dividendsAddress, "usersAllocation", [account]),
  });
  const onAllocate = async () => {
    dividendsAllocate(chainId, library, convertAmount);
  };

  const onDeallocate = async () => {};

  const validateConvertAmount = () => {};
  const onAllowance = async () => {
    if (validateConvertAmount()) {
    }
  };

  return (
    <Modal
      disableBodyScrollLock={false}
      isVisible={isModalVisible}
      setIsVisible={setIsModalVisible}
      label={`${isAllocate ? "Stake" : "Unstake"}QLP`}
      className="DividendsAllocateModal"
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
                  isAllocate ? qlpBalance.div(1e12).toNumber() / 1e6 : stakedQlpBalance.div(1e12).toNumber() / 1e6
                }
                setInputValue={setConvertAmount}
              />
            </div>
          </div>
        </div>
        <div className="">
          <div className="footer-btns">
            {convertAmount || !isAllocate ? (
              <button onClick={isAllocate ? onAllocate : onDeallocate} className="App-button-option">
                {isAllocate ? "Stake" : "Unstake"}
              </button>
            ) : (
              <button onClick={onAllowance} className="App-button-option">
                Approve QLP
              </button>
            )}
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
export default DividendsAllocateModal;
