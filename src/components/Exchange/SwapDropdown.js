import { Menu } from "@headlessui/react";
import { FiChevronDown } from "react-icons/fi";
import "./SwapDropdown.css";
import { swapTypes } from "../../Helpers";

function SwapDropdown({swapType, setSwapType}) {
  return (
    <Menu>
      <div className="swap-menu-wrapper">
        <Menu.Button as="div">
          <div className="swap-menu-main">
            <p>{swapTypes[swapType]}</p>
            <FiChevronDown size={20} />
          </div>
        </Menu.Button>
        <Menu.Items as="div" className="swap-menu-items">
          {swapTypes.map((option, index) => 
            <Menu.Item className="swap-menu-item" onClick={() => {setSwapType(index)}}>
              <div>
                <p>{option}</p>
              </div>
            </Menu.Item>)
          }
        </Menu.Items>
      </div>
    </Menu>
  );
}

export default SwapDropdown;
