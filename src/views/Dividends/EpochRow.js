import React, { useState } from "react";
import { getImageUrl } from "../../cloudinary/getImageUrl";
import { Switch } from "@headlessui/react";
import { formatAmount } from "../../Helpers";

export default function EpochRow({ name, symbol, amount, isClaim, price }) {
  const [enabled, setEnabled] = useState(false);
const amounInUsd = price.div(1e12).mul(amount).div(1e18)
  var tokenImage = getImageUrl({
    path: `coins/others/${symbol.toLowerCase()}-original`,
    format: "png",
  });

  return (
    <div className="epoch-row" style={{ borderBottom: !isClaim && "1px solid #272D3D" }}>
      <div className="left">
        <div className="token-icon">
          <img style={{ objectFit: "contain" }} src={tokenImage} alt={name} width={40} height={40} />
        </div>
        <div className="epoch-content">
          <h1>{name}</h1>
          <p>
            <span style={{ fontSize: 17 }}>{amount}</span>
            <span style={{ color: "#696C80" }}>(${formatAmount(amounInUsd, 18, 2, true)})</span>
          </p>
          {isClaim && name === "ETH" && (
            <div style={{ display: "flex", alignItems: "center", marginTop: 5 }}>
              <Switch
                checked={enabled}
                onChange={setEnabled}
                className={`${enabled ? "bg-enabled" : "bg-disabled"} collect-switch`}
              >
                <span
                  aria-hidden="true"
                  className={`${enabled ? "translate-x-9 enabled-thumb" : "translate-x-0 disabled-thumb"} switch-thumb`}
                />
              </Switch>
              <span style={{ color: "#696C80", fontSize: 12, marginLeft: 8 }}>Collect as WETH</span>
            </div>
          )}
          {isClaim && (
            <div>
              <button className="App-button-option" style={{ background: "transparent", color: "#696C80" }}>
                claim
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
