import { useEffect, useState } from "react";
import { ethers } from "ethers";

import { useConnectWallet, useSetChain, useWallets } from "@web3-onboard/react";

export default function useWeb3Onboard() {
  const [{ wallet }, connect, disconnect] = useConnectWallet();
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain();
  const [chainId, setChainId] = useState(1101);
  const [active, setActive] = useState(false);
  const [account, setAccount] = useState("");
  const [library, setLibrary] = useState(undefined);

  useEffect(() => {
    if (connectedChain) {
      const cId = BigInt(connectedChain.id).toString();
      console.log({ cId });

      if (cId === 1101) {
        setChainId(+cId);
      }
    }
  }, [connectedChain]);

  useEffect(() => {
    if (wallet?.provider) {
      const account = wallet.accounts[0].address;
      setActive(true);
      setAccount(account);
    } else {
      setActive(false);
      setAccount(null);
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

  return { active, account, library, chainId, activate: connect };
}
