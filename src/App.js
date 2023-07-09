import React, { useState, useEffect, useCallback, useRef } from "react";
import { SWRConfig } from "swr";
import { ethers } from "ethers";

import { motion, AnimatePresence } from "framer-motion";

import Logo from "./assets/logos/QuickswapLogo@2x.png";
import LogoMobile from "./assets/logos/QuickLogoMobile.png";
import NotFound from "./404";
import { Web3Provider } from "@ethersproject/providers";

import HeaderNav from "./HeaderNav";

import { Switch, Route, NavLink, Redirect } from "react-router-dom";

import {
  DEFAULT_SLIPPAGE_AMOUNT,
  SLIPPAGE_BPS_KEY,
  IS_PNL_IN_LEVERAGE_KEY,
  SHOW_PNL_AFTER_FEES_KEY,
  BASIS_POINTS_DIVISOR,
  SHOULD_SHOW_POSITION_LINES_KEY,
  clearWalletConnectData,
  helperToast,
  getAccountUrl,
  useLocalStorageSerializeKey,
  getExplorerUrl,
  clearWalletLinkData,
  SHOULD_EAGER_CONNECT_LOCALSTORAGE_KEY,
  CURRENT_PROVIDER_LOCALSTORAGE_KEY,
  REFERRAL_CODE_KEY,
  REFERRAL_CODE_QUERY_PARAMS,
  POLYGON_ZKEVM,
  DEFAULT_CHAIN_ID
} from "./Helpers";

import Dashboard from "./views/Dashboard/Dashboard";
import { Exchange } from "./views/Exchange/Exchange";
import Actions from "./views/Actions/Actions";
import Referrals from "./views/Referrals/Referrals";
import BuyQlp from "./views/BuyQlp/BuyQlp";
import SellQlp from "./views/SellQlp/SellQlp";
import BeginAccountTransfer from "./views/BeginAccountTransfer/BeginAccountTransfer";
import CompleteAccountTransfer from "./views/CompleteAccountTransfer/CompleteAccountTransfer";

import cx from "classnames";
import { cssTransition, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "./components/Modal/Modal";
import Checkbox from "./components/Checkbox/Checkbox";

import { RiMenuLine } from "react-icons/ri";
import { FaTimes } from "react-icons/fa";
import { FiX } from "react-icons/fi";

import "./Font.css";
import "./Shared.css";
import "./App.css";
import "./Input.css";
import "./AppOrder.css";

import TradeLogo from "./assets/logos/TradeLogo";
import connectWalletImg from "./img/ic_wallet_24.svg";

import AddressDropdown from "./components/AddressDropdown/AddressDropdown";
import { ConnectWalletButton } from "./components/Common/Button";
import useEventToast from "./components/EventToast/useEventToast";
import EventToastContainer from "./components/EventToast/EventToastContainer";
import SEO from "./components/Common/SEO";
import useRouteQuery from "./hooks/useRouteQuery";
import { encodeReferralCode } from "./Api/referrals";

import { getContract } from "./Addresses";

import Vault from "./abis/Vault.json";
import PositionRouter from "./abis/PositionRouter.json";
import ReferralTerms from "./views/ReferralTerms/ReferralTerms";
import { ModalProvider } from "./components/Modal/ModalProvider";
//import { WebSocketProvider } from "./utils/websocket-provider";

import { initWeb3Onboard } from "./web3OnboardService";
import { Web3OnboardProvider, useConnectWallet } from "@web3-onboard/react";

import useWeb3Onboard from "./hooks/useWeb3Onboard";

if ("ethereum" in window) {
  window.ethereum.autoRefreshOnNetworkChange = false;
}

function getLibrary(provider) {
  const library = new Web3Provider(provider);
  return library;
}

const Zoom = cssTransition({
  enter: "zoomIn",
  exit: "zoomOut",
  appendPosition: false,
  collapse: true,
  collapseDuration: 200,
  duration: 200,
});

//const polygonWsProvider = new WebSocketProvider(process.env.REACT_APP_POLYGON_WS);
const polygonWsProvider = new ethers.providers.WebSocketProvider(process.env.REACT_APP_POLYGON_WS);

function getWsProvider(active, chainId) {
  if (!active) {
    return;
  }

  if (chainId === POLYGON_ZKEVM) {
    return polygonWsProvider;
  }
}
function WrongChainButton() {
  const { setChain, wrongChain } = useWeb3Onboard();

  const swithToPolygonZkEVM = () => {
    setChain({ chainId: DEFAULT_CHAIN_ID });
  };

  return (
    <>
      {wrongChain && (
        <>
        <div className="App-header-user-link">
          <div className="btn btn-red address-btn" onClick={() => swithToPolygonZkEVM()}>
            Switch to Polygon zkEVM
          </div>
        </div>

      
        </>
      )}
    </>
  );
}

function AppHeaderLinks({ small, openSettings, clickCloseIcon }) {
  return (
    <div className="App-header-links mobile-header-padding">
      {small && (
        <div className="App-header-links-header">
          <div className="App-header-menu-icon-block" onClick={() => clickCloseIcon()}>
            <FiX className="App-header-menu-icon" />
          </div>
          <a
            style={{ width: 21, height: 21 }}
            className="App-header-link-main"
            href="https://perps.quickswap.exchange"
            rel="noopener noreferrer"
          >
            <img style={{ width: 21, height: 21 }} src={LogoMobile} alt="Logo" />
          </a>
        </div>
      )}
      <div className="App-header-link-container App-header-link-home">
        <a href="https://perps.quickswap.exchange" rel="noopener noreferrer">
          Home
        </a>
      </div>
      {/* {small && (
        <div className="App-header-link-container">
          <a href="https://quickswap.exchange/#/swap" target='_blank' rel="noreferrer">
            Swap
          </a>
        </div>
      )} */}
      <div className="App-header-link-container">
        <a href="https://quickswap.exchange/#/swap" target="_blank" rel="noreferrer">
          Swap
        </a>
      </div>
      <div className="App-header-link-container">
        <NavLink activeClassName="active" to="/trade" className="active">
          Perps
        </NavLink>
      </div>
      <div className="App-header-link-container">
        <a href="https://quickswap.exchange/#/pools" target="_blank" rel="noreferrer">
          Pool
        </a>
      </div>
      <div className="App-header-link-container">
        <a href="https://quickswap.exchange/#/farm" target="_blank" rel="noreferrer">
          Farm
        </a>
      </div>
      <div className="App-header-link-container">
        <a href="https://zksafe.quickswap.exchange/welcome" target="_blank" rel="noreferrer">
          Safe
        </a>
      </div>
      {/* <div className="App-header-link-container">
      <a href="https://quickswap.exchange/#/dragons" target='_blank' rel="noreferrer">
        Dragons Lair
        </a>
      </div>
      <div className="App-header-link-container">
      <a href="https://quickswap.exchange/#/gamehub" target='_blank' rel="noreferrer">
          Gaming Hub
          <img src={NewBadge} alt='new' style={{marginLeft:8}} />
        </a>
      </div>
      <div className="App-header-link-container">
      <a href="https://quickswap.exchange/#/predictions" target='_blank' rel="noreferrer">
          Predictions
          <img src={NewBadge} alt='new' style={{marginLeft:8}} />
        </a>
      </div>
      <div className="App-header-link-container">
      <a href="https://quickswap.exchange/#/convert" target='_blank' rel="noreferrer">
        Convert
        </a>
      </div> */}
      <div className="App-header-link-container">
        <a href="https://quickswap.exchange/#/analytics" target="_blank" rel="noreferrer">
          Analytics
        </a>
      </div>

      {small && (
        <div className="App-header-link-container">
          {/* eslint-disable-next-line */}
          <a href="#" onClick={openSettings}>
            Settings
          </a>
        </div>
      )}
    </div>
  );
}

function AppHeaderUser({
  openSettings,
  small,
  setWalletModalVisible,
  showNetworkSelectorModal,
  disconnectAccountAndCloseSettings,
}) {
  const { account, active, library, chainId } = useWeb3Onboard();

  const [{ wallet }, connect, disconnect] = useConnectWallet();

  useEffect(() => {
    if (active) {
      setWalletModalVisible(false);
    }
  }, [active, setWalletModalVisible]);

  const accountUrl = getAccountUrl(chainId, account);

  const handleConnectWallet = async () => {
    try {
      await connect();
    } catch (e) {
      console.log(e);
    }
  };

  if (!active) {
    return (
      <div className="App-header-user">
        <ConnectWalletButton onClick={() => handleConnectWallet()} imgSrc={connectWalletImg}>
          {small ? "Connect" : "Connect Wallet"}
        </ConnectWalletButton>
      </div>
    );
  }

  return (
    <div className="App-header-user">
      <div className="App-header-user-address">
        <AddressDropdown
          account={account}
          small={small}
          accountUrl={accountUrl}
          disconnectAccountAndCloseSettings={disconnectAccountAndCloseSettings}
          openSettings={openSettings}
        />
      </div>
    </div>
  );
}

function FullApp() {
  const exchangeRef = useRef();

  const { account, active, library, chainId } = useWeb3Onboard();
  const [{ wallet }, connect, disconnect] = useConnectWallet();

  useEventToast();

  const [activatingConnector, setActivatingConnector] = useState();

  const query = useRouteQuery();

  useEffect(() => {
    let referralCode = query.get(REFERRAL_CODE_QUERY_PARAMS);
    if (referralCode && referralCode.length <= 20) {
      const encodedReferralCode = encodeReferralCode(referralCode);
      if (encodeReferralCode !== ethers.constants.HashZero) {
        localStorage.setItem(REFERRAL_CODE_KEY, encodedReferralCode);
      }
    }
  }, [query]);

  useEffect(() => {
    if (window.ethereum) {
      // hack
      // for some reason after network is changed through Metamask
      // it triggers event with chainId = 1
      // reload helps web3 to return correct chain data
      return window.ethereum.on("chainChanged", () => {
        document.location.reload();
      });
    }
  }, []);

  const disconnectAccount = useCallback(async () => {
    // only works with WalletConnect
    clearWalletConnectData();
    // force clear localStorage connection for MM/CB Wallet (Brave legacy)
    clearWalletLinkData();

    await disconnect(wallet);
  }, [wallet]);

  const disconnectAccountAndCloseSettings = () => {
    disconnectAccount();
    localStorage.removeItem(SHOULD_EAGER_CONNECT_LOCALSTORAGE_KEY);
    localStorage.removeItem(CURRENT_PROVIDER_LOCALSTORAGE_KEY);
    setIsSettingsVisible(false);
  };

  const [walletModalVisible, setWalletModalVisible] = useState();

  const connectWallet = async () => {
    await connect();
  };

  const [isDrawerVisible, setIsDrawerVisible] = useState(undefined);
  const [isNativeSelectorModalVisible, setisNativeSelectorModalVisible] = useState(false);
  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };
  const slideVariants = {
    hidden: { x: "-100%" },
    visible: { x: 0 },
  };

  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [savedSlippageAmount, setSavedSlippageAmount] = useLocalStorageSerializeKey(
    [chainId, SLIPPAGE_BPS_KEY],
    DEFAULT_SLIPPAGE_AMOUNT
  );
  const [slippageAmount, setSlippageAmount] = useState(0);
  const [isPnlInLeverage, setIsPnlInLeverage] = useState(false);
  const [showPnlAfterFees, setShowPnlAfterFees] = useState(true);

  const [savedIsPnlInLeverage, setSavedIsPnlInLeverage] = useLocalStorageSerializeKey(
    [chainId, IS_PNL_IN_LEVERAGE_KEY],
    false
  );

  const [savedShowPnlAfterFees, setSavedShowPnlAfterFees] = useLocalStorageSerializeKey(
    [chainId, SHOW_PNL_AFTER_FEES_KEY],
    true
  );

  const [savedShouldShowPositionLines, setSavedShouldShowPositionLines] = useLocalStorageSerializeKey(
    [chainId, SHOULD_SHOW_POSITION_LINES_KEY],
    false
  );

  const openSettings = () => {
    const slippage = parseInt(savedSlippageAmount);
    setSlippageAmount((slippage / BASIS_POINTS_DIVISOR) * 100);
    setIsPnlInLeverage(savedIsPnlInLeverage);
    setShowPnlAfterFees(savedShowPnlAfterFees);
    setIsSettingsVisible(true);
  };

  const showNetworkSelectorModal = (val) => {
    setisNativeSelectorModalVisible(val);
  };

  const saveAndCloseSettings = () => {
    const slippage = parseFloat(slippageAmount);
    if (isNaN(slippage)) {
      helperToast.error("Invalid slippage value");
      return;
    }
    if (slippage > 5) {
      helperToast.error("Slippage should be less than 5%");
      return;
    }

    const basisPoints = (slippage * BASIS_POINTS_DIVISOR) / 100;
    if (parseInt(basisPoints) !== parseFloat(basisPoints)) {
      helperToast.error("Max slippage precision is 0.01%");
      return;
    }

    setSavedIsPnlInLeverage(isPnlInLeverage);
    setSavedShowPnlAfterFees(showPnlAfterFees);
    setSavedSlippageAmount(basisPoints);
    setIsSettingsVisible(false);
  };
  useEffect(() => {
    if (isDrawerVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => (document.body.style.overflow = "unset");
  }, [isDrawerVisible]);

  const [pendingTxns, setPendingTxns] = useState([]);

  useEffect(() => {
    const checkPendingTxns = async () => {
      const updatedPendingTxns = [];
      for (let i = 0; i < pendingTxns.length; i++) {
        const pendingTxn = pendingTxns[i];
        const receipt = await library.getTransactionReceipt(pendingTxn.hash);
        if (receipt) {
          if (receipt.status === 0) {
            const txUrl = getExplorerUrl(chainId) + "tx/" + pendingTxn.hash;
            helperToast.error(
              <div>
                Txn failed.{" "}
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View
                </a>
                <br />
              </div>
            );
          }
          if (receipt.status === 1 && pendingTxn.message) {
            const txUrl = getExplorerUrl(chainId) + "tx/" + pendingTxn.hash;
            helperToast.success(
              <div>
                {pendingTxn.message}{" "}
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View
                </a>
                <br />
              </div>
            );
          }
          continue;
        }
        updatedPendingTxns.push(pendingTxn);
      }

      if (updatedPendingTxns.length !== pendingTxns.length) {
        setPendingTxns(updatedPendingTxns);
      }
    };

    const interval = setInterval(() => {
      checkPendingTxns();
    }, 2 * 1000);
    return () => clearInterval(interval);
  }, [library, pendingTxns, chainId]);

  const vaultAddress = getContract(chainId, "Vault");
  const positionRouterAddress = getContract(chainId, "PositionRouter");

  useEffect(() => {
    const wsVaultAbi = Vault.abi;
    const wsProvider = getWsProvider(active, chainId);
    if (!wsProvider) {
      return;
    }

    const wsVault = new ethers.Contract(vaultAddress, wsVaultAbi, wsProvider);
    const wsPositionRouter = new ethers.Contract(positionRouterAddress, PositionRouter.abi, wsProvider);

    const callExchangeRef = (method, ...args) => {
      if (!exchangeRef || !exchangeRef.current) {
        return;
      }

      exchangeRef.current[method](...args);
    };

    // handle the subscriptions here instead of within the Exchange component to avoid unsubscribing and re-subscribing
    // each time the Exchange components re-renders, which happens on every data update
    const onUpdatePosition = (...args) => callExchangeRef("onUpdatePosition", ...args);
    const onClosePosition = (...args) => callExchangeRef("onClosePosition", ...args);
    const onIncreasePosition = (...args) => callExchangeRef("onIncreasePosition", ...args);
    const onDecreasePosition = (...args) => callExchangeRef("onDecreasePosition", ...args);
    const onCancelIncreasePosition = (...args) => callExchangeRef("onCancelIncreasePosition", ...args);
    const onCancelDecreasePosition = (...args) => callExchangeRef("onCancelDecreasePosition", ...args);

    wsVault.on("UpdatePosition", onUpdatePosition);
    wsVault.on("ClosePosition", onClosePosition);
    wsVault.on("IncreasePosition", onIncreasePosition);
    wsVault.on("DecreasePosition", onDecreasePosition);
    wsPositionRouter.on("CancelIncreasePosition", onCancelIncreasePosition);
    wsPositionRouter.on("CancelDecreasePosition", onCancelDecreasePosition);

    return function cleanup() {
      wsVault.off("UpdatePosition", onUpdatePosition);
      wsVault.off("ClosePosition", onClosePosition);
      wsVault.off("IncreasePosition", onIncreasePosition);
      wsVault.off("DecreasePosition", onDecreasePosition);
      wsPositionRouter.off("CancelIncreasePosition", onCancelIncreasePosition);
      wsPositionRouter.off("CancelDecreasePosition", onCancelDecreasePosition);
    };
  }, [active, chainId, vaultAddress, positionRouterAddress]);

  return (
    <>
      <div className="App">
        {/* <img style={{ position: "absolute" }} src={backgroundLight} alt="background-light" /> */}
        {/* <div className="App-background-side-1"></div>
        <div className="App-background-side-2"></div>
        <div className="App-background"></div>
        <div className="App-background-ball-1"></div>
        <div className="App-background-ball-2"></div>
        <div className="App-highlight"></div> */}
        <div className="App-content">
          {isDrawerVisible && (
            <AnimatePresence>
              {isDrawerVisible && (
                <motion.div
                  className="App-header-backdrop"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={fadeVariants}
                  transition={{ duration: 0.2 }}
                  onClick={() => setIsDrawerVisible(!isDrawerVisible)}
                ></motion.div>
              )}
            </AnimatePresence>
          )}
          {isNativeSelectorModalVisible && (
            <AnimatePresence>
              {isNativeSelectorModalVisible && (
                <motion.div
                  className="selector-backdrop"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={fadeVariants}
                  transition={{ duration: 0.2 }}
                  onClick={() => setisNativeSelectorModalVisible(!isNativeSelectorModalVisible)}
                ></motion.div>
              )}
            </AnimatePresence>
          )}
          <header>
            <div className="App-header large">
              <div className="App-header-container-left">
                <a className="App-header-link-main" href="https://perps.quickswap.exchange">
                  <img style={{ height: "28px", flexBasis: "none" }} src={Logo} alt="Logo" />
                </a>
                <AppHeaderLinks />
              </div>
              <div className="App-header-container-right">
     

                <WrongChainButton />

                <AppHeaderUser
                  disconnectAccountAndCloseSettings={disconnectAccountAndCloseSettings}
                  openSettings={openSettings}
                  setActivatingConnector={setActivatingConnector}
                  walletModalVisible={walletModalVisible}
                  setWalletModalVisible={setWalletModalVisible}
                  showNetworkSelectorModal={showNetworkSelectorModal}
                />
              </div>
            </div>
            <div className={cx("App-header", "small", { active: isDrawerVisible })}>
              <div
                className={cx("App-header-link-container", "App-header-top", {
                  active: isDrawerVisible,
                })}
              >
                <div className="App-header-container-left">
                  <div className="App-header-menu-icon-block" onClick={() => setIsDrawerVisible(!isDrawerVisible)}>
                    {!isDrawerVisible && <RiMenuLine className="App-header-menu-icon" />}
                    {isDrawerVisible && <FaTimes className="App-header-menu-icon" />}
                  </div>
                  <div className="App-header-link-main clickable" onClick={() => setIsDrawerVisible(!isDrawerVisible)}>
                    <img width={24} height={24} src={LogoMobile} alt="Trade Logo" />
                  </div>
                </div>
                <div className="App-header-container-right">
                  <AppHeaderUser
                    disconnectAccountAndCloseSettings={disconnectAccountAndCloseSettings}
                    openSettings={openSettings}
                    small
                    setActivatingConnector={setActivatingConnector}
                    walletModalVisible={walletModalVisible}
                    setWalletModalVisible={setWalletModalVisible}
                    showNetworkSelectorModal={showNetworkSelectorModal}
                  />
                </div>
              </div>
            </div>
            <div className="nav-container">
              <div className="App-header-container-nav">
                <HeaderNav />
              </div>
            </div>
          </header>
          <AnimatePresence>
            {isDrawerVisible && (
              <motion.div
                onClick={() => setIsDrawerVisible(false)}
                className="App-header-links-container App-header-drawer"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={slideVariants}
                transition={{ duration: 0.2 }}
              >
                <AppHeaderLinks small openSettings={openSettings} clickCloseIcon={() => setIsDrawerVisible(false)} />
              </motion.div>
            )}
          </AnimatePresence>

          <Switch>
            <Route exact path="/">
              <Redirect to="/trade" />
            </Route>
            <Route exact path="/trade">
              <ModalProvider>
                <Exchange
                  ref={exchangeRef}
                  savedShowPnlAfterFees={savedShowPnlAfterFees}
                  savedIsPnlInLeverage={savedIsPnlInLeverage}
                  setSavedIsPnlInLeverage={setSavedIsPnlInLeverage}
                  savedSlippageAmount={savedSlippageAmount}
                  setPendingTxns={setPendingTxns}
                  pendingTxns={pendingTxns}
                  savedShouldShowPositionLines={savedShouldShowPositionLines}
                  setSavedShouldShowPositionLines={setSavedShouldShowPositionLines}
                  connectWallet={connectWallet}
                />
              </ModalProvider>
            </Route>
            <Route exact path="/dashboard">
              <Dashboard />
            </Route>
            <Route exact path="/liquidity">
              <BuyQlp
                savedSlippageAmount={savedSlippageAmount}
                setPendingTxns={setPendingTxns}
                connectWallet={connectWallet}
              />
            </Route>
            <Route exact path="/sell_qlp">
              <SellQlp
                savedSlippageAmount={savedSlippageAmount}
                setPendingTxns={setPendingTxns}
                connectWallet={connectWallet}
              />
            </Route>
            <Route exact path="/referrals">
              <Referrals pendingTxns={pendingTxns} connectWallet={connectWallet} setPendingTxns={setPendingTxns} />
            </Route>
            <Route exact path="/actions/:account">
              <Actions />
            </Route>
            {/* <Route exact path="/orders_overview">
              <OrdersOverview />
            </Route>
            <Route exact path="/positions_overview">
              <PositionsOverview />
            </Route> */}
            <Route exact path="/actions">
              <Actions />
            </Route>
            <Route exact path="/begin_account_transfer">
              <BeginAccountTransfer setPendingTxns={setPendingTxns} />
            </Route>
            <Route exact path="/complete_account_transfer/:sender/:receiver">
              <CompleteAccountTransfer setPendingTxns={setPendingTxns} />
            </Route>
            <Route exact path="/referral-terms">
              <ReferralTerms />
            </Route>
            <Route path="*">
              <NotFound />
            </Route>
          </Switch>
        </div>
      </div>
      <ToastContainer
        limit={1}
        transition={Zoom}
        position="bottom-right"
        autoClose={7000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick={false}
        draggable={false}
        pauseOnHover
      />
      <EventToastContainer />

      <Modal
        className="App-settings"
        isVisible={isSettingsVisible}
        setIsVisible={setIsSettingsVisible}
        label="Settings"
      >
        <div className="App-settings-row query-modal">
          <div>Allowed Slippage</div>
          <div className="App-slippage-tolerance-input-container">
            <input
              type="number"
              className="App-slippage-tolerance-input"
              min="0"
              value={slippageAmount}
              onChange={(e) => setSlippageAmount(e.target.value)}
            />
            <div className="App-slippage-tolerance-input-percent">%</div>
          </div>
        </div>
        <div className="Exchange-settings-row">
          <Checkbox isChecked={showPnlAfterFees} setIsChecked={setShowPnlAfterFees}>
            <span style={{ marginLeft: 5 }}>Display PnL after fees</span>
          </Checkbox>
        </div>
        <div className="Exchange-settings-row">
          <Checkbox isChecked={isPnlInLeverage} setIsChecked={setIsPnlInLeverage}>
            <span style={{ marginLeft: 5 }}>Include PnL in leverage display</span>
          </Checkbox>
        </div>
        <div className="Exchange-settings-row" style={{ marginTop: "30px" }}>
          <button
            className="App-cta Exchange-swap-button"
            onClick={saveAndCloseSettings}
            style={{ fontSize: "16px", color: "#F5F6F8", fontWeight: "500" }}
          >
            Save
          </button>
        </div>
      </Modal>
    </>
  );
}

function PreviewApp() {
  const [isDrawerVisible, setIsDrawerVisible] = useState(undefined);
  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };
  const slideVariants = {
    hidden: { x: "-100%" },
    visible: { x: 0 },
  };

  return (
    <>
      <div className="App">
        <div className="App-background-side-1"></div>
        <div className="App-background-side-2"></div>
        <div className="App-background"></div>
        <div className="App-background-ball-1"></div>
        <div className="App-background-ball-2"></div>
        <div className="App-highlight"></div>
        <div className="App-content">
          {isDrawerVisible && (
            <AnimatePresence>
              {isDrawerVisible && (
                <motion.div
                  className="App-header-backdrop"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={fadeVariants}
                  transition={{ duration: 0.2 }}
                  onClick={() => setIsDrawerVisible(!isDrawerVisible)}
                ></motion.div>
              )}
            </AnimatePresence>
          )}
          <header>
            <div className="App-header large preview">
              <div className="App-header-container-left">
                <a className="App-header-link-main" href="https://perps.quickswap.exchange">
                  {/* <img src={logoImg} alt="Quickperp" /> */}
                </a>
              </div>
              <div className="App-header-container-right">
                <AppHeaderLinks />
              </div>
            </div>
            <div className={cx("App-header", "small", { active: isDrawerVisible })}>
              <div
                className={cx("App-header-link-container", "App-header-top", {
                  active: isDrawerVisible,
                })}
              >
                <div className="App-header-container-left">
                  <div className="App-header-link-main">
                    <TradeLogo />
                  </div>
                </div>
                <div className="App-header-container-right">
                  <div onClick={() => setIsDrawerVisible(!isDrawerVisible)}>
                    {!isDrawerVisible && <RiMenuLine className="App-header-menu-icon" />}
                    {isDrawerVisible && <FaTimes className="App-header-menu-icon" />}
                  </div>
                </div>
              </div>
              <AnimatePresence>
                {isDrawerVisible && (
                  <motion.div
                    onClick={() => setIsDrawerVisible(false)}
                    className="App-header-links-container App-header-drawer"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={slideVariants}
                    transition={{ duration: 0.2 }}
                  >
                    <AppHeaderLinks small />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>
        </div>
      </div>
    </>
  );
}

function App() {
  const [web3Onboard, setWeb3Onboard] = useState(null);

  useEffect(() => {
    setWeb3Onboard(initWeb3Onboard);
  }, []);

  if (!web3Onboard) return <div>Loading...</div>;

  return (
    <SWRConfig value={{ refreshInterval: 15000, dedupingInterval: 5000 }}>
      <Web3OnboardProvider web3Onboard={web3Onboard}>
        <SEO>
          <FullApp />
        </SEO>
      </Web3OnboardProvider>
    </SWRConfig>
  );
}

export default App;
