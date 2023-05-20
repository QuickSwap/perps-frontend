import { motion } from "framer-motion";
import { useState } from "react";
import * as React from "react";
import PercentageSelector from "./PercentageSelector";
import CloseIcon from "../../assets/icons/Close";
import { useDispatch, useSelector } from "react-redux";
import Modal from "../../components/Modal/Modal"
import { helperToast } from "../../Helpers";

const DividendsAllocateModal = ({ isAllocate, isModalVisible, setIsModalVisible }) => {
	
	const [convertAmount, setConvertAmount] = useState("");

	const onAllocate = async () => { };

	const onDeallocate = async () => { };

	
	const validateConvertAmount = () => {
		
	};
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
			className='DividendsAllocateModal'
      >
			<div
				id="modalWrapper"
				className="modalWrapper"
			>

				<div className="dividends-modal-content">
					<h2 >Amount</h2>
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
								{isAllocate ? 123 : 456 || "..."} QLP
							</p>
						</div>
						<div className="selector">
							<PercentageSelector
								balance={isAllocate ? 123 : 456}
								setInputValue={setConvertAmount}
							/>
						</div>
					</div>
				</div>
				<div className="">
					<div className="footer-btns">
						{(convertAmount) || !isAllocate ? (
							<button
								onClick={isAllocate ? onAllocate : onDeallocate}
								className='App-button-option'
							>{isAllocate ? "Stake" : "Unstake"}</button>
						) : (
								<button onClick={onAllowance} className='App-button-option'>Approve QLP</button>
						)}
						<button
							className='App-button-option'
							style={{ background:'transparent'}}
							onClick={() =>setIsModalVisible(false)}
						>Cancel</button>
					</div>
				</div>
			</div>
          
        
      </Modal>
		
	);
};
export default DividendsAllocateModal;
