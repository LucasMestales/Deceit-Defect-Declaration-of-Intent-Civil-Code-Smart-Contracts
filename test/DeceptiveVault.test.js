import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("Deceptive Vault - Analysis of the deceit mechanism (under Article 86 of the Polish Civil Code)", function () {
  it("Demonstrating the effectiveness of deceit by manipulating the input parameter", async function () {
    // 1. Definition of Procedural Roles (Signers)
    // 'victim' represents a person making a declaration of intent under the influence of error.
    const [, attacker, victim] = await ethers.getSigners();

    // 2. Initializing the attack
    const Vault = await ethers.getContractFactory("DeceptiveVault");
    const vault = await Vault.deploy(attacker.address);

    const depositAmount = ethers.parseEther("0.01"); // Przedmiot sporu: 1 ETH
    const attackerInitialBalance = await ethers.provider.getBalance(
      attacker.address,
    );

    // =========================================================================
    // OFF-CHAIN ​​MOMENT
    // =========================================================================
    // The following line simulates interaction with a "malicious front-end."
    // The victim signs the transaction convinced they are depositing funds (Internal Will),
    // while the code calls the function with the 'true' flag (Fraudulent statement malformed).

    await vault.connect(victim).deposit(true, { value: depositAmount });

    // =========================================================================
    // TECHNICAL PROOF (ON-CHAIN)
    // =========================================================================

    // Verification of the record status in the smart contract
    const victimVaultBalance = await vault.connect(victim).getBalance();

    // Verification of the perpetrator's actual enrichment
    const attackerFinalBalance = await ethers.provider.getBalance(
      attacker.address,
    );

    // EVIDENCE 1: The victim lost funds but did not acquire any rights under the contract (Balance = 0).
    expect(victimVaultBalance).to.equal(0);

    // EVIDENCE 2: The victim's funds increased the perpetrator's assets without legal basis (deceit).
    expect(attackerFinalBalance - attackerInitialBalance).to.equal(
      depositAmount,
    );

    console.log("--- FRAUD SIMULATION REPORT ---");
    console.log("Status: Attack vector success (Malicious Conditional Logic)");
    console.log("Victim's contribution: 0.01 ETH");
    console.log("Victim's balance in the contract: 0.0 ETH");
    console.log("Perpetrator's profit: 0.01 ETH");
    console.log(
      "Legal conclusion: Declaration of intent affected by a defect under Article 86 of the Civil Code.",
    );
  });
});
