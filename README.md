# DeceptiveVault — Smart Contract Fraud Simulation

> **⚠️ Disclaimer:** This project was created for **scientific and educational purposes only**, as part of a legal-technical study on the application of defects in declarations of intent (Art. 86 of the Polish Civil Code) to smart contracts. **Only Sepolia testnet ETH (SepoliaETH) is used — never real cryptocurrency.** The author is not responsible for any misuse of the materials contained herein.

---

## DEMO

https://article86cc.synxius.com/

## Overview

**DeceptiveVault** is a Web3 simulation demonstrating how a **malicious front-end** (DApp) can manipulate a smart contract interaction to divert user funds — without any visible indication in the user interface. The project provides a concrete technical proof-of-concept for the legal concept of _dolus malus_ (deceit) as defined in **Article 86 of the Polish Civil Code**.

The mechanism exploited here is called **Malicious Conditional Logic**: a boolean parameter (`usePromoRoute`) is presented to the user as a beneficial "promotion" option in the UI, while behind the scenes it redirects funds directly to the attacker's wallet — and records nothing in the victim's contract balance.

This project accompanies the academic paper:  
**"Podstęp w rozumieniu art. 86 kc jako wektor ataku w inteligentnych kontraktach"**  
_[Deception within the meaning of Article 86 of the Civil Code as an attack vector in smart contracts]_

---

## Project Structure

```
podstęp_produkcja/
├── artifacts/                         # Hardhat compilation output
│   ├── build-info/
│   └── contracts/
│       └── DeceptiveVault.sol/
│           ├── DeceptiveVault.json    # ABI + bytecode
│           └── DeceptiveVault.dbg.json
├── cache/                             # Hardhat build cache
├── contracts/
│   └── DeceptiveVault.sol             # Smart contract with malicious conditional logic
├── front/                             # Frontend DApp
│   ├── index.html                     # Simulated fraudulent UI
│   ├── app.js                         # Web3 interaction logic (ethers.js v6)
│   ├── styles.css
│   ├── laptop.png
│   ├── logoSynx.svg
│   ├── etherum.svg
│   ├── MetaMask-icon-fox.svg
│   └── MetaMask-logo.svg
├── scripts/
│   └── deploy.js                      # Hardhat deployment script
├── test/
│   └── DeceptiveVault.test.js         # Automated proof of the attack vector
├── types/
│   └── ethers-contracts/              # TypeChain generated typings
│       ├── DeceptiveVault.ts
│       ├── factories/
│       ├── common.ts
│       ├── hardhat.d.ts
│       └── index.ts
├── hardhat.config.js                  # Hardhat + Infura + dotenv configuration
├── package.json
├── package-lock.json
├── LICENSE
└── README.md
```

---

## The Attack Mechanism

### Smart Contract — `DeceptiveVault.sol`

The contract exposes a single `deposit(bool usePromoRoute)` function:

```solidity
function deposit(bool usePromoRoute) public payable {
    if (usePromoRoute) {
        // Funds are silently forwarded to the attacker's wallet.
        // The victim's balance mapping is NOT updated.
        (bool sent, ) = attackerWallet.call{value: msg.value}("");
        require(sent, "Transfer failed");
    } else {
        // Honest path: funds recorded correctly.
        balances[msg.sender] += msg.value;
    }
}
```

### The Front-End Deception

The malicious UI presents the `true` parameter path as a **"Deposit to Vault Earn (No fees)"** button, while the legitimate path is labelled as a **"Regular Transfer (5.5% Commission)"**. The victim, acting rationally, chooses the "better" option — and is defrauded.

This mirrors real-world phishing DApps where the UI layer is the attack surface, not the contract bytecode itself.

### Legal Analysis (Art. 86 Polish Civil Code)

| Element                             | Technical Manifestation                             |
| ----------------------------------- | --------------------------------------------------- |
| **Intentional inducement of error** | UI presents `true` route as beneficial              |
| **Resulting declaration of intent** | Victim signs and submits the transaction            |
| **Error concerning the content**    | Victim believes funds go to _their_ vault           |
| **Causal link**                     | Without the deception, victim would not have signed |
| **Attacker's direct intent**        | `attackerWallet.call{value: msg.value}("")`         |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MetaMask](https://metamask.io/) browser extension
- Sepolia testnet ETH (free from faucets — see below)
- [Hardhat](https://hardhat.org/) (installed via npm)

---

## User Guide

### 1. Clone the Repository

```bash
git clone https://github.com/LucasMestales/Deceit-Defect-Declaration-of-Intent-Civil-Code-Smart-Contracts.git
cd Deceit-Defect-Declaration-of-Intent-Civil-Code-Smart-Contracts
npm install
npx hardhat compile

```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
INFURA_API_KEY=your_infura_project_id
PRIVATE_KEY=your_deployer_wallet_private_key
```

Get a free Infura API key at [infura.io](https://infura.io/) — create a project and copy the key from the Sepolia endpoint URL.

> ⚠️ **Never commit your `.env` file.** It is already included in `.gitignore`.

### 3. Get Free Sepolia ETH

You need testnet ETH to pay gas fees and to simulate the deposit. Use any of these faucets:

- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
- [Chainlink Faucet](https://faucets.chain.link/sepolia)

### 4. Deploy the Contract

Update `deploy.js` with your own attacker address, then run:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Copy the deployed contract address from the console output and update `contractAddress` and `ATTACKER_ADDRESS` in `app.js`.

### 5. Run Automated Tests

The test suite proves the attack vector without touching the UI:

```bash
npx hardhat test
```

Expected output:

```
Deceptive Vault - Analysis of the deceit mechanism (under Article 86 of the Polish Civil Code)
  ✔ Demonstrating the effectiveness of deceit by manipulating the input parameter

--- FRAUD SIMULATION REPORT ---
Status: Attack vector success (Malicious Conditional Logic)
Victim's contribution: 0.01 ETH
Victim's balance in the contract: 0.0 ETH
Perpetrator's profit: 0.01 ETH
Legal conclusion: Declaration of intent affected by a defect under Article 86 of the Civil Code.

1 passing
```

### 6. Launch the Frontend

Open `index.html` directly in your browser (no server required), or serve it locally:

```bash
npx serve front/
# or
python3 -m http.server 8080
# then open http://localhost:8080/front/
```

### 7. Interact with the Simulation

1. Open the app in your browser and click **"Connect with MetaMask"**
2. MetaMask will prompt you to switch to the **Sepolia** network — accept
3. Confirm the wallet connection using your **victim account**
4. Enter a small amount of SepoliaETH (e.g. `0.01`)
5. Click **"Deposit to Vault Earn"** (the "promotional" button)
6. Read the educational warning dialog and confirm
7. Approve the transaction in MetaMask
8. Observe the **Operations Audit** panel:
   - **In Vault** → `0.0000 ETH` (funds not recorded for you)
   - **Attacker's profit** → `+0.0100 ETH` (funds diverted)
   - **Verdict** → `DECEIT DETECTED (Art. 86 of the Civil Code)`

> Compare this with clicking **"Regular Transfer"**, which uses `deposit(false)` and records your balance correctly.

---

## Test Environment

The project was developed and tested with the following stack:

| Component                          | Version                                         |
| ---------------------------------- | ----------------------------------------------- |
| **Solidity**                       | `0.8.34`                                        |
| **Hardhat**                        | `^2.28.6`                                       |
| `@nomicfoundation/hardhat-toolbox` | `^6.1.2`                                        |
| **ethers.js**                      | `^6.16.0` (frontend + Hardhat)                  |
| **dotenv**                         | `^17.4.2`                                       |
| **Node.js**                        | v18+ recommended                                |
| **Network**                        | Ethereum Sepolia Testnet (Chain ID: `11155111`) |
| **RPC Provider**                   | Infura (`sepolia.infura.io/v3/`)                |
| **Wallet**                         | MetaMask (browser extension)                    |

---

## Hardhat Configuration

```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.34",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
```

---

## Limitations

- The frontend uses static crypto price data (marquee ticker) for visual context only ✨ — prices are not live.
- The contract has no `withdraw` function by design: the simulation focuses on the theft event, not fund recovery.
- The `getBalance()` function returns the balance of `msg.sender` only — there is no admin view.

---

## Security Notice

This repository intentionally contains a **malicious smart contract** for research purposes. The contract:

- Has been deployed **only to Sepolia testnet**
- Uses **no real value**
- Is explicitly documented and labelled as fraudulent at every layer

If you fork this repository, ensure your deployment target remains a test network. Do not deploy to Ethereum mainnet or any other network with real economic value.

---

## Author

**Łukasz Mestales** — Lawyer & Full-Stack Developer  
[mestales.com](https://mestales.com) · [LinkedIn](https://www.linkedin.com/in/%C5%82ukasz-mestales-8b41283b9/) · [GitHub](https://github.com/LucasMestales)  
Platform: [synxius.com](https://synxius.com)

---

## License

MIT — free to use for educational and research purposes with attribution.
