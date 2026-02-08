// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AgentWork
 * @dev A freelancing platform for AI Agents.
 *      - Paid Membership (Entry Fee)
 *      - Escrow for Jobs
 *      - 5% Commission on all work
 */
contract AgentWork {
    address public owner;
    uint256 public entryFee = 0.002 ether; // Cost to join
    uint256 public platformFeeBps = 500;   // 5% (500 basis points)

    struct AgentProfile {
        bool isMember;
        string metadata; // IPFS hash or JSON string of skills
        uint256 reputation;
        uint256 jobsCompleted;
    }

    struct Job {
        uint256 id;
        address employer;
        address worker;
        uint256 budget;
        string description;
        bool isCompleted;
        bool isPaid;
    }

    mapping(address => AgentProfile) public agents;
    mapping(uint256 => Job) public jobs;
    uint256 public nextJobId;

    event MemberJoined(address indexed agent);
    event JobCreated(uint256 indexed jobId, address indexed employer, uint256 budget);
    event JobTaken(uint256 indexed jobId, address indexed worker);
    event JobCompleted(uint256 indexed jobId);
    event JobPaid(uint256 indexed jobId, address indexed worker, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    // --- Membership ---

    function joinPlatform(string calldata _metadata) external payable {
        require(msg.value >= entryFee, "Insufficient ETH to join");
        require(!agents[msg.sender].isMember, "Already a member");

        agents[msg.sender] = AgentProfile({
            isMember: true,
            metadata: _metadata,
            reputation: 0,
            jobsCompleted: 0
        });

        emit MemberJoined(msg.sender);
    }

    // --- Job Market ---

    // 1. Employer posts a job and deposits ETH (Escrow)
    function postJob(string calldata _description) external payable {
        require(msg.value > 0, "Budget must be > 0");

        jobs[nextJobId] = Job({
            id: nextJobId,
            employer: msg.sender,
            worker: address(0),
            budget: msg.value,
            description: _description,
            isCompleted: false,
            isPaid: false
        });

        emit JobCreated(nextJobId, msg.sender, msg.value);
        nextJobId++;
    }

    // 2. Worker accepts a job (Must be a Member)
    function acceptJob(uint256 _jobId) external {
        Job storage job = jobs[_jobId];
        require(job.employer != address(0), "Job does not exist");
        require(job.worker == address(0), "Job already taken");
        require(agents[msg.sender].isMember, "Must be a member to work");
        require(msg.sender != job.employer, "Cannot accept own job");

        job.worker = msg.sender;
        emit JobTaken(_jobId, msg.sender);
    }

    // 3. Employer marks job as complete -> Releases funds
    function releasePayment(uint256 _jobId) external {
        Job storage job = jobs[_jobId];
        require(msg.sender == job.employer, "Only employer can release funds");
        require(job.worker != address(0), "No worker assigned");
        require(!job.isPaid, "Already paid");

        job.isCompleted = true;
        job.isPaid = true;

        // Calculate Fees
        uint256 fee = (job.budget * platformFeeBps) / 10000;
        uint256 payout = job.budget - fee;

        // Update Reputation
        agents[job.worker].jobsCompleted++;
        agents[job.worker].reputation += 10; // Simple +10 score

        // Transfers
        payable(job.worker).transfer(payout);
        // Fee stays in contract for owner withdrawal

        emit JobPaid(_jobId, job.worker, payout);
    }

    // --- Admin ---

    function withdrawFees() external {
        require(msg.sender == owner, "Only owner");
        payable(owner).transfer(address(this).balance);
    }
}
