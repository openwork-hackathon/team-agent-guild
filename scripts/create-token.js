const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Creating token with account:", deployer.address);

  // Constants
  const BOND_ADDRESS = "0xc5a076cad94176c2996B32d8466Be1cE757FAa27";
  const OPENWORK_TOKEN = "0x299c30DD5974BF4D5bFE42C340CA40462816AB07";

  // ABI for Bond Contract (createToken function)
  const BOND_ABI = [
    "function createToken((string name, string symbol) tokenParams, (uint16 mintRoyalty, uint16 burnRoyalty, address reserveToken, uint128 maxSupply, uint128[] stepRanges, uint128[] stepPrices) bondParams) external payable returns (address)",
    "function creationFee() view returns (uint256)"
  ];

  // ABI for ERC20 (approve function)
  const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
  ];

  const bond = new hre.ethers.Contract(BOND_ADDRESS, BOND_ABI, deployer);
  const openwork = new hre.ethers.Contract(OPENWORK_TOKEN, ERC20_ABI, deployer);

  // 1. Check Creation Fee
  const fee = await bond.creationFee();
  console.log("Creation Fee Required:", hre.ethers.formatEther(fee), "ETH");

  // 2. Approve Bond Contract to spend OPENWORK (if needed)
  console.log("Approving OPENWORK...");
  const txApprove = await openwork.approve(BOND_ADDRESS, hre.ethers.MaxUint256);
  await txApprove.wait();
  console.log("Approved!");

  // 3. Define Token Params
  const tokenParams = {
    name: "Agent Guild Token",
    symbol: "AGUILD"
  };

  // 4. Define Bonding Curve
  // Simple curve: Starts at 0.001 OPENWORK, ends at 0.01 OPENWORK
  const bondParams = {
    mintRoyalty: 50, // 0.5%
    burnRoyalty: 50, // 0.5%
    reserveToken: OPENWORK_TOKEN,
    maxSupply: hre.ethers.parseEther("1000000"), // 1 Million Supply
    stepRanges: [
      hre.ethers.parseEther("100000"), 
      hre.ethers.parseEther("500000"), 
      hre.ethers.parseEther("1000000")
    ],
    stepPrices: [
      hre.ethers.parseEther("0.001"), 
      hre.ethers.parseEther("0.005"), 
      hre.ethers.parseEther("0.01")
    ]
  };

  console.log("Creating Token AGUILD...");
  
  try {
      const tx = await bond.createToken(tokenParams, bondParams, { value: fee });
      console.log("Transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Token Created Successfully!");
      console.log("Check it at: https://mint.club/token/base/AGUILD");
  } catch (error) {
      console.error("Error creating token:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
