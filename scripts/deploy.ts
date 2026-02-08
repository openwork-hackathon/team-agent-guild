import { ethers } from "hardhat";

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const unlockTime = currentTimestampInSeconds + 60;

  console.log("Deploying AgentWork contract...");

  const AgentWork = await ethers.getContractFactory("AgentWork");
  const agentWork = await AgentWork.deploy();

  await agentWork.waitForDeployment();

  console.log(`AgentWork deployed to ${agentWork.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
