import { ethers } from "hardhat";

async function main() {
  const Farming = await ethers.getContractFactory("Farming");
  const farming = await Farming.deploy();

  await farming.deployed();

  console.log("Farming deployed to:", farming.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
