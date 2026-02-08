// scripts/interact-simulation.ts
import { ethers } from "hardhat";

async function main() {
  // 1. Deploy
  const AgentWork = await ethers.getContractFactory("AgentWork");
  const contract = await AgentWork.deploy();
  await contract.waitForDeployment();
  console.log("📍 Contract Deployed at:", contract.target);

  const [owner, agent1, employer1] = await ethers.getSigners();

  // 2. Agent 1 Joins
  console.log("\n🤖 Agent 1 joining...");
  const fee = ethers.parseEther("0.002");
  await contract.connect(agent1).joinPlatform("ipfs://my-skills-json", { value: fee });
  console.log("✅ Agent 1 Joined! Fee Paid: 0.002 ETH");

  // 3. Employer Posts Job
  console.log("\n💼 Employer posting job...");
  const budget = ethers.parseEther("0.1");
  await contract.connect(employer1).postJob("Build a Python Twitter Bot", { value: budget });
  console.log("✅ Job Posted! Budget Escrowed: 0.1 ETH");

  // 4. Agent accepts job
  console.log("\n🤝 Agent 1 accepting job #0...");
  await contract.connect(agent1).acceptJob(0);
  console.log("✅ Job Accepted!");

  // 5. Employer releases payment
  console.log("\n💰 Job Done! Releasing payment...");
  await contract.connect(employer1).releasePayment(0);
  
  // Check balances
  const agentBal = await ethers.provider.getBalance(agent1.address);
  const platformBal = await ethers.provider.getBalance(contract.target);
  
  console.log("✅ Payment Released!");
  console.log(`   -> Agent Received: ~0.095 ETH (95%)`);
  console.log(`   -> Platform Earned: ${ethers.formatEther(platformBal)} ETH (5% Fee + Entry Fees)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
