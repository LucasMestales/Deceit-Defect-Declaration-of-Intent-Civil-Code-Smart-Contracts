const hre = require("hardhat");

async function main() {
  const attackerAddress = "0x520266908126Aa27Afa37fE549E903159a3F4B85";

  // DeceptiveVault
  const Vault = await hre.ethers.getContractFactory("DeceptiveVault");

  // Deploy
  const vault = await Vault.deploy(attackerAddress);

  // Deploy confirmation
  await vault.waitForDeployment();
}

main().catch(console.error);
