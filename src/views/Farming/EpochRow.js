import React, { useState } from "react";
import { getImageUrl } from "../../cloudinary/getImageUrl";
import { Switch } from "@headlessui/react";
import { bigNumberify, expandDecimals, formatAmount, useChainId } from "../../Helpers";
import { dividendsClaim } from "../../Api";
import { useWeb3React } from "@web3-react/core";

export default function EpochRow({ name, symbol,tokenAddress,displayDecimals, amount, isClaim, price }) {
  const { active, account, library } = useWeb3React();
  const { chainId } = useChainId();
  const [withdrawETH, setWithdrawETH] = useState(false);
  const amountInUsd = price && amount ? price.mul(amount).div(expandDecimals(1, 30)) : bigNumberify(0);

  var tokenImage = getImageUrl({
    path: `coins/others/${symbol.toLowerCase()}-original`,
    format: "png",
  });


  function handleClaim() {
    dividendsClaim(chainId, library, tokenAddress, !withdrawETH);
  }

  return (
    <div className="epoch-row" style={{ borderBottom: !isClaim && "1px solid #272D3D" }}>
      <div className="left">
        <div className="token-icon">
          <img style={{ objectFit: "contain" }} src={tokenImage} alt={name} width={40} height={40} />
        </div>
        <div className="epoch-content">
          <h1>{name}</h1>
          <p>
            <span style={{ fontSize: 17 }}>{formatAmount(amount, 18, displayDecimals || 2, true)}</span>
            <span style={{ color: "#696C80" }}>(${formatAmount(amountInUsd, 18, 2, true)})</span>
          </p>
          {isClaim && name === "ETH" && (
            <div style={{ display: "flex", alignItems: "center", marginTop: 5 }}>
              <Switch
                checked={withdrawETH}
                onChange={setWithdrawETH}
                className={`${withdrawETH ? "bg-enabled" : "bg-disabled"} collect-switch`}
              >
                <span
                  aria-hidden="true"
                  className={`${withdrawETH ? "translate-x-9 enabled-thumb" : "translate-x-0 disabled-thumb"} switch-thumb`}
                />
              </Switch>
              <span style={{ color: "#696C80", fontSize: 12, marginLeft: 8 }}>Collect as WETH</span>
            </div>
          )}
        </div>
      </div>

      {isClaim && (
        <div>
          <button onClick={handleClaim} className="App-button-option" style={{ background: "transparent", color: "#696C80" }}>
            Claim
          </button>
        </div>
      )}
    </div>
  );
}
