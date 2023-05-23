import * as React from "react";

const percentages = [25, 50, 75, 100];

const SelectorButton = ({ percentage, balance, setInputValue, }) => {
  return (
    <button
      id={percentages.toString()}
          className="SelectorButton px-1.5 py-0.5 bg-opacity24 rounded-[50px] cursor-pointer select-none whitespace-nowrap"
      onClick={() => {
        let balancePercentage
        if (percentage === 100) {
          balancePercentage = balance;
        } else {
          balancePercentage = Math.round(balance * percentage) / 100;
        }
        setInputValue(balancePercentage.toString());
      }}>
      % {percentage}
    </button>
  );
};

const PercentageSelector = ({ balance, setInputValue}) => {
  return (
      <div className="PercentageSelector">
      {percentages.map((percentage, index) => (
        <SelectorButton
          key={index}
          percentage={percentage}
          balance={balance}
          setInputValue={setInputValue}></SelectorButton>
      ))}
    </div>
  );
};

export default PercentageSelector;
