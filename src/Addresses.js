const CONTRACTS = {
  1101: {
    Vault: "0x99B31498B0a1Dae01fc3433e3Cb60F095340935C",
    Router: "0x1FE9fBA5955Af58C18057213F0151BBE893aB2c8",
    VaultReader: "0x8A8EAFB33011E912952F484E1640f9571dE7C163",
    Reader: "0xf1CFB75854DE535475B88Bb6FBad317eea98c0F9",
    QlpManager: "0x87BcD3914eD3dcd5886BA1c0f0DA25150b56fE54",
    RewardRouter: "0x4D5FEf3C8A78013C4B7a1560c1F3Df7822dE4866",
    QLP: "0xC8E48fD037D1C4232F294b635E74d33A0573265a",
    USDQ: "0x48aC594dd00c4aAcF40f83337fc6dA31F9F439A7",
    OrderBook: "0x7e01238227213C513010F5fAbD0634fEBee93EE5",
    OrderExecutor: "0x0cdda294315412B1Ba25AeE84EdD1d2bB67a0076",
    OrderBookReader: "0x0cdda294315412B1Ba25AeE84EdD1d2bB67a0076",
    PositionRouter: "0x443Cf165B72e4b4331C0101A10553269972Ed4B8",
    ReferralStorage: "0xD0357bae72A794A92c321C78A40a106d503527Be",
    ReferralReader: "0x29B3e948CE2Db1964006ea9f5eA072CE7D008a63",
    Farming: "0xD68E720f3129253d35C00bf1246A2fD894663632",
    QUICK: "0x68286607A1d43602d880D349187c3c48c0fD05E6",
    NATIVE_TOKEN: "0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9",
  },
};




const tryRequire = (path) => {
  try {
    return require(`${path}`);
  } catch (err) {
    return undefined;
  }
};
const devAddresses = tryRequire("./development.Addresses.js");

export function getContract(chainId, name) {
  const contracts = process.env.NODE_ENV === "development" && devAddresses ? devAddresses.CONTRACTS : CONTRACTS;

  if (!contracts[chainId]) {
    throw new Error(`Unknown chainId ${chainId}`);
  }
  if (!contracts[chainId][name]) {
    throw new Error(`Unknown constant "${name}" for chainId ${chainId}`);
  }
  return contracts[chainId][name];
}

