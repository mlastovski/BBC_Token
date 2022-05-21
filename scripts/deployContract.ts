import { ethers } from "hardhat";

async function main() {
  const BBC = await ethers.getContractFactory("BBC");
  const bbc = await BBC.deploy("Bigblackcoin", "BBC", 18);

  await bbc.deployed();

  console.log("BBC deployed to:", bbc.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
