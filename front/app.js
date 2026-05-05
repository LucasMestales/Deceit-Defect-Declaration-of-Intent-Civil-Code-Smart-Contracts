// 1. ADDRESS OF IMPLEMENTED CONTRACT
const contractAddress = "0xAdCe477a680eEcACe91178E43e51ae946F899e53";

// 2. PERPETRATOR'S WALLET ADDRESS
const ATTACKER_ADDRESS = "0x520266908126Aa27Afa37fE549E903159a3F4B85";

// ABI
const abi = [
  "function deposit(bool usePromoRoute) public payable",
  "function getBalance() public view returns (uint256)",
];

let provider;
let signer;
let contract;
let userAddress;

const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7"; // 11155111 in decimal

// --- SECURITY: Listening for real-time network changes ---
if (window.ethereum) {
  window.ethereum.on("chainChanged", (chainId) => {
    if (chainId !== SEPOLIA_CHAIN_ID_HEX) {
      alert(
        "WARNING: The simulation only runs on the Sepolia test network. The page will be refreshed.",
      );
      window.location.reload();
    }
  });
}

// ---------- CHART ----------
const ctx = document.getElementById("yieldChart").getContext("2d");

const gradient = ctx.createLinearGradient(0, 0, 0, 220);
gradient.addColorStop(0, "rgba(77, 163, 255, 0.55)");
gradient.addColorStop(0.6, "rgba(77, 163, 255, 0.18)");
gradient.addColorStop(1, "rgba(77, 163, 255, 0)");

const lineGlow = ctx.createLinearGradient(0, 0, 300, 0);
lineGlow.addColorStop(0, "#7c5cff");
lineGlow.addColorStop(0.45, "#4da3ff");
lineGlow.addColorStop(1, "#2ee59d");

new Chart(ctx, {
  type: "line",
  data: {
    labels: ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"],
    datasets: [
      {
        label: "Yours APY (%)",
        data: [12.1, 12.5, 12.3, 13.1, 14.2, 14.5, 14.8],
        borderColor: lineGlow,
        backgroundColor: gradient,
        fill: true,
        tension: 0.42,
        borderWidth: 3,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointHitRadius: 14,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: "#4da3ff",
        pointBorderWidth: 2,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(10, 14, 24, 0.92)",
        titleColor: "#ffffff",
        bodyColor: "#eaf2ff",
        padding: 12,
        cornerRadius: 14,
        displayColors: false,
        borderColor: "rgba(255,255,255,0.12)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: true,
        ticks: {
          color: "rgba(237, 244, 255, 0.55)",
          font: {
            size: 11,
            weight: "500",
          },
          padding: 10,
        },
        grid: {
          display: true,
          color: "rgba(255, 255, 255, 0.06)",
          lineWidth: 1,
          borderDash: [3, 6],
          drawTicks: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        display: true,
        min: 10,
        max: 20,
        ticks: {
          color: "rgba(237, 244, 255, 0.42)",
          font: {
            size: 11,
            weight: "500",
          },
          stepSize: 2,
          padding: 10,
          callback: (value) => `${value}%`,
        },
        grid: {
          display: true,
          color: "rgba(255, 255, 255, 0.07)",
          lineWidth: 1,
          borderDash: [4, 6],
          drawTicks: false,
        },
        border: {
          display: false,
        },
      },
    },
    elements: {
      line: {
        capBezierPoints: true,
      },
    },
  },
});

// ---------- UI ----------
const connectBtns = [
  document.getElementById("connect-wallet-nav"),
  document.getElementById("connect-wallet-main"),
];
const promoBtn = document.getElementById("btn-promo");
const standardBtn = document.getElementById("btn-standard");
const statusContainer = document.getElementById("status-container");
const statusText = document.getElementById("status");
const loader = document.querySelector(".loader");
const balanceBox = document.getElementById("balance-box");

const auditAmountEl = document.getElementById("audit-amount");
const vaultInternalEl = document.getElementById("vault-internal-balance");
const attackerGainEl = document.getElementById("attacker-gain");
const attackerBalanceEl = document.getElementById("attacker-balance");
const verdictBadge = document.getElementById("verdict-badge");
const legalCommentEl = document.getElementById("legal-comment");

const walletBeforeEl = document.getElementById("wallet-before");
const walletAfterEl = document.getElementById("wallet-after");
const vaultPhysicalEl = document.getElementById("vault-physical-balance");

// ---------- HELPERS ----------
function formatAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatEth(value) {
  return `${Number(ethers.formatEther(value)).toFixed(4)} ETH`;
}

function showStatus(msg, color, border, bg) {
  statusContainer.classList.remove("hidden");
  statusText.innerText = msg;
  statusText.style.color = color;
  statusContainer.style.borderColor = border;
  statusContainer.style.background = bg;
}

// --- NEW SAFETY CHECK FUNCTION ---
async function runSafetyCheck() {
  try {
    if (!window.ethereum) {
      alert("Error: No Web3 wallet detected.");
      return false;
    }

    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId !== SEPOLIA_CHAIN_ID_HEX) {
      alert("STOP: Switch to Sepolia Test Network!");
      return false;
    }

    // Używamy właściwej nazwy zmiennej: contractAddress
    return confirm(
      "⚠️ EDUCATIONAL WARNING ⚠️\n\n" +
        "You are about to test a 'Malicious Conditional Logic' mechanism.\n\n" +
        "Target Contract: " +
        contractAddress +
        "\n" +
        "The UI suggests a 'Promotion', but the contract may divert funds.\n\n" +
        "Proceed on Sepolia?",
    );
  } catch (error) {
    return false;
  }
}

// ---------- BALANCE SYNCHRONIZATION ----------
async function refreshBalances() {
  if (!provider || !contract || !userAddress) return;
  try {
    const [walletBal, vaultPhysicalBal, vaultInternalBal, attackerBal] =
      await Promise.all([
        provider.getBalance(userAddress),
        provider.getBalance(contractAddress),
        contract.getBalance(),
        provider.getBalance(ATTACKER_ADDRESS),
      ]);

    const elements = [
      walletAfterEl,
      vaultPhysicalEl,
      vaultInternalEl,
      attackerBalanceEl,
    ];
    const values = [walletBal, vaultPhysicalBal, vaultInternalBal, attackerBal];

    elements.forEach((el, i) => {
      el.innerText = formatEth(values[i]);
      el.classList.add("updated");
      setTimeout(() => el.classList.remove("updated"), 800);
    });
  } catch (err) {
    console.error("Błąd odświeżania sald:", err);
  }
}

// ---------- METAMASK CONNECTION (WITH SEPOLIA FORCING) ----------
async function connectWallet() {
  if (!window.ethereum) {
    alert("Zainstaluj MetaMask!");
    return;
  }

  try {
    // Attempt to switch network to Sepolia
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
    } catch (switchError) {
      // If the network is not added to the wallet
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: SEPOLIA_CHAIN_ID_HEX,
              chainName: "Sepolia Test Network",
              rpcUrls: ["https://rpc.sepolia.org"],
              nativeCurrency: {
                name: "Sepolia Ether",
                symbol: "SEP",
                decimals: 18,
              },
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    signer = await provider.getSigner();
    userAddress = await signer.getAddress();
    contract = new ethers.Contract(contractAddress, abi, signer);

    document.getElementById("user-address").innerText =
      formatAddress(userAddress);
    document.getElementById("setup-section").classList.add("hidden");
    document.getElementById("vault-section").classList.remove("hidden");
    balanceBox.classList.remove("hidden");

    await refreshBalances();
  } catch (err) {
    console.error("Connection error:", err);
    alert("Connection interrupted or Sepolia network rejected.");
  }
}

// ---------- DEPOSIT LOGIC (WITH AN ANALYSIS OF ART. 86 OF THE CC) ----------
async function handleDeposit(usePromo) {
  // Additional network verification before transaction
  const network = await provider.getNetwork();
  if (network.chainId !== 11155111n) {
    alert("☠️ You must be on the Sepolia network!");
    return;
  }

  const input = document.getElementById("deposit-amount").value;
  if (!input || Number(input) <= 0) {
    alert("Please enter the correct ETH amount");
    return;
  }

  const amountEth = input.replace(",", ".");
  const value = ethers.parseEther(amountEth);

  try {
    // Pre-transaction state measurements
    const attackerBefore = await provider.getBalance(ATTACKER_ADDRESS);
    const vaultInternalBefore = await contract.getBalance();
    const walletBefore = await provider.getBalance(userAddress);
    walletBeforeEl.innerText = formatEth(walletBefore);

    showStatus(
      "Signing a declaration of intent...",
      "#1199FA",
      "#1199FA",
      "transparent",
    );
    loader.style.display = "block";

    // Execution of the transaction (declaration of intent externalized on the blockchain)
    const tx = await contract.deposit(usePromo, { value });
    await tx.wait();

    // Post-transaction state measurements
    const attackerAfter = await provider.getBalance(ATTACKER_ADDRESS);
    const vaultInternalAfter = await contract.getBalance();

    const actualGain = attackerAfter - attackerBefore;
    const internalIncrement = vaultInternalAfter - vaultInternalBefore;

    await refreshBalances();

    auditAmountEl.innerText = `${amountEth} ETH`;
    attackerGainEl.innerText = `+ ${ethers.formatEther(actualGain)} ETH`;
    loader.style.display = "none";

    // --- LEGAL OPINION: Analysis for Deception ---
    const isDeception = usePromo && internalIncrement === 0n && actualGain > 0n;

    if (isDeception) {
      verdictBadge.innerText =
        "STATUS: DECEIT DETECTED (Art. 86 of the Civil Code)";
      verdictBadge.style.background = "#ff453a";
      legalCommentEl.innerHTML = `
        <strong>Analysis:</strong> <em>Malicious Conditional Logic</em> detected. <br>
Your funds were physically transferred to the perpetrator.
The contract mapping remained unchanged (+0 ETH), confirming the victim's mistake.
      `;
      showStatus(
        "An anomaly has been detected!",
        "#ff453a",
        "#ff453a",
        "rgba(255,69,58,0.05)",
      );
    } else {
      verdictBadge.innerText = "STATUS: VALID DEPOSIT";
      verdictBadge.style.background = "#00c853";
      legalCommentEl.innerHTML =
        "<strong>Analysis:</strong> No signs of mistake. Funds recorded correctly.";
      showStatus(
        "Analysis completed successfully",
        "#00c853",
        "#00c853",
        "rgba(0,200,83,0.05)",
      );
    }
  } catch (err) {
    console.error(err);
    loader.style.display = "none";
    showStatus("Transaction canceled", "#ff453a", "#ff453a", "transparent");
  }
}

// ---------- EVENT LISTENERS ----------
connectBtns.forEach((btn) => {
  if (btn) btn.onclick = connectWallet;
});
promoBtn.onclick = async () => {
  const isSafe = await runSafetyCheck(); // Warning
  if (isSafe) {
    handleDeposit(true); // deposit(true) - atak
  }
};

// Standard deposit
standardBtn.onclick = () => handleDeposit(false);

// Mobile Navigation and UI Interactions
const navToggle = document.getElementById("nav-toggle");
const navLinks = document.getElementById("nav-links");

navToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
  navToggle.classList.toggle("open");
});

document.querySelectorAll("#nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle.classList.remove("open");
  });
});

// ---------- Marquee ----------

const coins = [
  { sym: "BTC", price: "$68,421", chg: "+2.41%", dir: "up" },
  { sym: "ETH", price: "$3,612", chg: "+1.18%", dir: "up" },
  { sym: "SOL", price: "$142.88", chg: "-0.64%", dir: "down" },
  { sym: "BNB", price: "$587.90", chg: "+0.83%", dir: "up" },
  { sym: "XRP", price: "$0.61", chg: "+3.02%", dir: "up" },
  { sym: "ADA", price: "$0.54", chg: "+0.44%", dir: "up" },
  { sym: "DOGE", price: "$0.16", chg: "-1.12%", dir: "down" },
  { sym: "AVAX", price: "$36.44", chg: "-1.14%", dir: "down" },
  { sym: "TON", price: "$7.12", chg: "+4.21%", dir: "up" },
  { sym: "LINK", price: "$16.83", chg: "+1.62%", dir: "up" },
  { sym: "DOT", price: "$7.19", chg: "-0.28%", dir: "down" },
  { sym: "MATIC", price: "$0.74", chg: "+0.96%", dir: "up" },
  { sym: "LTC", price: "$74.08", chg: "+0.57%", dir: "up" },
  { sym: "SHIB", price: "$0.000024", chg: "-2.03%", dir: "down" },
  { sym: "ATOM", price: "$11.62", chg: "+1.09%", dir: "up" },
  { sym: "BCH", price: "$410.31", chg: "+0.31%", dir: "up" },
  { sym: "NEAR", price: "$5.43", chg: "+2.76%", dir: "up" },
  { sym: "ICP", price: "$13.28", chg: "-0.74%", dir: "down" },
  { sym: "UNI", price: "$10.96", chg: "+1.46%", dir: "up" },
  { sym: "SUI", price: "$1.82", chg: "+5.14%", dir: "up" },
  { sym: "PEPE", price: "$0.000009", chg: "+7.22%", dir: "up" },
  { sym: "INJ", price: "$28.41", chg: "-0.53%", dir: "down" },
  { sym: "APT", price: "$10.77", chg: "+2.18%", dir: "up" },
  { sym: "ARB", price: "$1.03", chg: "+0.91%", dir: "up" },
  { sym: "OP", price: "$2.84", chg: "-0.37%", dir: "down" },
];

const track = document.getElementById("cryptoTrack");

function createPill(c) {
  const pill = document.createElement("div");
  pill.className = "crypto-pill";

  const dot = document.createElement("span");
  dot.className = `dot ${c.dir}`;

  const sym = document.createElement("strong");
  sym.textContent = c.sym;

  const price = document.createElement("span");
  price.className = "price";
  price.textContent = c.price;

  const chg = document.createElement("span");
  chg.className = `chg ${c.dir}`;
  chg.textContent = c.chg;

  pill.append(dot, sym, price, chg);
  return pill;
}

coins.forEach((c) => {
  track.appendChild(createPill(c));
});

coins.forEach((c) => {
  track.appendChild(createPill(c));
});

function ensureFill() {
  const trackWidth = track.scrollWidth;
  const containerWidth = track.parentElement.offsetWidth;

  if (trackWidth < containerWidth * 2) {
    const items = Array.from(track.children);
    items.forEach((el) => {
      track.appendChild(el.cloneNode(true));
    });
  }
}
window.addEventListener("load", ensureFill);
window.addEventListener("resize", ensureFill);

function setMarqueeSpeed() {
  const track = document.getElementById("cryptoTrack");
  const distance = track.scrollWidth / 2;
  const speed = 20;
  const duration = distance / speed;
  track.style.setProperty("--marquee-duration", `${duration}s`);
}
window.addEventListener("load", setMarqueeSpeed);
window.addEventListener("resize", setMarqueeSpeed);

// ---------- Tips box ----------

const tips = {
  login:
    "Enable 2FA or passkeys and do not log in via links in emails – always enter the website yourself.",
  register:
    "Use a unique password for this account and verify that the domain is real before entering your details.",
  wallet:
    "Before connecting your wallet, carefully check the domain and scope of permissions – only sign what you understand.",
};

const modal = document.getElementById("cyberTipModal");
const tipText = document.getElementById("cyberTipText");
const buttons = document.querySelectorAll(".tip-btn");

function openModal(message) {
  tipText.textContent = message;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.tip;
    openModal(tips[key] || "Dbaj o bezpieczeństwo i zawsze weryfikuj źródło.");
  });
});

modal.addEventListener("click", (e) => {
  if (e.target.matches("[data-close]")) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});
