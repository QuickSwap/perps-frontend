import { useEffect, useState } from "react";
import { ethers } from "ethers";

import { DEFAULT_CHAIN_ID, POLYGON_ZKEVM } from "../Helpers";

import { useConnectWallet, useSetChain, useWallets } from "@web3-onboard/react";

export default function useWeb3Onboard() {
  const [{ wallet }, connect, disconnect] = useConnectWallet();
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain();
  const [chainId, setChainId] = useState(DEFAULT_CHAIN_ID);
  const [active, setActive] = useState(false);
  const [account, setAccount] = useState("");
  const [ensName, setEnsName] = useState("");
  const [library, setLibrary] = useState(undefined);
  const [wrongChain, setWrongChain] = useState(false);

  const SUPPORTED_CHAINS = [POLYGON_ZKEVM];

  useEffect(async () => {
    if (!wallet) {
      setWrongChain(false);
    }
    if (wallet && connectedChain) {
      const cId = +BigInt(connectedChain.id).toString();
      // state variable

      if (SUPPORTED_CHAINS.includes(cId)) {
        setWrongChain(false);
        setChainId(cId);
      } else {
        // not supported chain == wrong chain
        setWrongChain(true);
      }
    }
  }, [wallet, connectedChain]);

  useEffect(() => {
    if (wallet?.provider) {
      const account = wallet.accounts[0].address;
      const { name, avatar } = wallet?.accounts[0].ens ?? {};

      setActive(true);
      setAccount(account);
      setEnsName(name);
    } else {
      setActive(false);
      setAccount(null);
      setEnsName(null);
    }
  }, [wallet]);

  useEffect(() => {
    if (!wallet?.provider) {
      setLibrary(null);
    } else {
      const provider = new ethers.providers.Web3Provider(wallet.provider, "any");
      setLibrary(provider);
    }
  }, [wallet]);

  return { active, account, library, chainId, activate: connect, connect, disconnect, setChain, wrongChain };
}
