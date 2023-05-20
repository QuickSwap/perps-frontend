import React from 'react'
import { useState } from "react";
import './Dividends.css'
import DividendsIcon1 from '../../assets/icons/DividendsIcon1'
import DividendsIcon2 from '../../assets/icons/DividendsIcon2'
import DividendsIcon3 from '../../assets/icons/DividendsIcon3'
import EpochRow from './EpochRow'
import { getImageUrl } from "../../cloudinary/getImageUrl";
import { useWeb3React } from "@web3-react/core";
import useComponentVisible from '../../hooks/useComponentVisible'
import ETH from "../../assets/icons/ETH_24.svg";
import WETH from "../../assets/icons/WETH";
import { AnimatePresence } from "framer-motion";
import DividendsAllocateModal from './DividendsAllocateModal'
const epochTokenList = [
    { name: "WETH", symbol: "ETH", value: '123' },
    { name: "BTC", symbol: "BTC", value: '123' },
    { name: "MATIC", symbol: "MATIC", value: '123' },
    { name: "USDC", symbol: "USDC", value: '123' },
    { name: "DAI", symbol: "DAI", value: '123' },
]
const dividendsTokenList = [
    { name: "WETH", symbol: "ETH", value: '123' },
    { name: "BTC", symbol: "BTC", value: '123' },
]
export default function Dividends(props) {
    const { active, } = useWeb3React();
    const { connectWallet } = props
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isAllocate, setIsAllocate] = useState(true)
    const {
        ref: claimModalRef,
        isComponentVisible: isClaimModalOpen,
        setIsComponentVisible: setIsClaimModalOpen,
    } = useComponentVisible(false);
    const {
        ref: claimAllModalRef,
        isComponentVisible: isClaimAllModalOpen,
        setIsComponentVisible: setIsClaimAllModalOpen,
    } = useComponentVisible(false);

    return (
        <div className="default-container dividends-content page-layout">

            <DividendsAllocateModal isModalVisible={isModalVisible} setIsModalVisible={setIsModalVisible} isAllocate={isAllocate} />

            <div className="section-title-content mb-3">
                <div className="Page-title">Dividends</div>
                <div className="dividens-header-container">
                    <div className="dividens-header-item ">
                        <DividendsIcon1 />
                        <div className="dividens-header-item-content">
                            <h1 className="dividens-header-item-content-label">Current Distribution</h1>
                            <p className="dividens-header-item-content-value">$123</p>
                        </div>
                    </div>
                    <div className="dividens-header-item ">
                        <DividendsIcon2 />
                        <div className="dividens-header-item-content">
                            <h1 className="dividens-header-item-content-label">Current APR</h1>
                            <p className="dividens-header-item-content-value">123%</p>
                        </div>
                    </div>
                    <div className="dividens-header-item">
                        <DividendsIcon3 />
                        <div className="dividens-header-item-content">
                            <h1 className="dividens-header-item-content-label">Total QLP staked</h1>
                            <p className="dividens-header-item-content-value">123</p>
                        </div>
                    </div>

                </div>

                <div className="dividens-content-container ">
                    <div className="dividens-card ">
                        <p class="dividens-card-title ">Current epoch</p>
                        {epochTokenList.map((token) => {
                            var tokenImage = null;

                            try {
                                tokenImage = getImageUrl({
                                    path: `coins/others/${token.symbol.toLowerCase()}-original`,
                                    format: "png",
                                });
                            } catch (error) {
                                console.error(error);
                            }
                            return (
                                <EpochRow tokenImage={tokenImage} name={token.name} value={token.value} />
                            )
                        })}
                    </div>
                    <div className="dividens-card " style={{ display: 'flex', flexDirection: 'column' }}>

                        <div>
                            <div className="allocation-header ">
                                <div className="dividens-card-title">Your allocation</div>
                                <div>
                                    <button
                                        className='App-button-option unstake-btn'
                                        onClick={() => { setIsModalVisible(true); setIsAllocate(false) }}
                                    >Unstake</button>
                                    <button
                                        className='App-button-option stake-btn'
                                        onClick={() => { setIsModalVisible(true); setIsAllocate(true) }}
                                    >Stake</button>
                                </div>
                                
                            </div>
                            <div className='allocation-list'>
                                <div className='list-row'>
                                    <p>Total allocation</p>
                                    <p>123 QLP </p>
                                </div>
                                <div className='list-row'>
                                    <p>Total Share</p>
                                    <p>123 % </p>
                                </div>
                                <div className='list-row'>
                                    <p>QLP Staked</p>
                                    <p>123  </p>
                                </div>
                                <div className='list-row'>
                                    <p>QLP not Staked</p>
                                    <p>123  </p>
                                </div>
                            </div>
                        </div>
                        <div style={{marginTop:24}}>
                            <div className="allocation-header  ">
                                <div className="dividens-card-title">Your dividends</div>
                                <div style={{ position: 'relative' }}>
                                <button
                                    className='App-button-option claim-all-btn'
                                        onClick={() => setIsClaimAllModalOpen(true)}
                                >Claim All</button>
                                {isClaimAllModalOpen && (
                                    <div
                                        ref={claimAllModalRef}
                                        className="claim-modal-container"
                                        onBlur={() => setIsClaimAllModalOpen(false)}>
                                        <button
                                        ><WETH /> Claim as WETH</button>
                                        <button

                                        ><img src={ETH} alt="" /> Claim as ETH</button>
                                    </div>
                                    )}</div>
                            </div>
                            <div>
                                {dividendsTokenList.map((token) => {
                                    var tokenImage = null;

                                    try {
                                        tokenImage = getImageUrl({
                                            path: `coins/others/${token.symbol.toLowerCase()}-original`,
                                            format: "png",
                                        });
                                    } catch (error) {
                                        console.error(error);
                                    }
                                    return (
                                        <EpochRow
                                            tokenImage={tokenImage}
                                            name={token.name}
                                            value={token.value}
                                            actionEle={
                                                token.symbol === 'ETH' ?
                                                    <div>
                                                        <button onClick={() => setIsClaimModalOpen(true)} className='App-button-option'>claim</button>
                                                        {isClaimModalOpen && (
                                                            <div
                                                                ref={claimModalRef}
                                                                className="claim-modal-container"
                                                                onBlur={() => setIsClaimModalOpen(false)}>
                                                                <button
                                                                ><WETH /> Claim as WETH</button>
                                                                <button
                                                                
                                                                ><img src={ETH} alt="" /> Claim as ETH</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    : <div><button className='App-button-option'>claim</button></div>
                                            }
                                        />
                                    )
                                })}
                            </div>
                        </div>
                        {/* {active ?
                                <>
                                    
                                </>
                                :
                                <button
                                    className="App-cta action-button"
                                    style={{ marginTop: 30 }}
                                    type="submit"
                                    onClick={connectWallet}
                                >
                                    Connect Wallet
                                </button>
                            } */}

                    </div>
                </div>
            </div>
        </div>
    )
}
