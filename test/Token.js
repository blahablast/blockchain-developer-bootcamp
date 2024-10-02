const { ethers } = require("hardhat");
const { expect } = require("chai");

// A helper function that converts a number into a token amount with 18 decimal places.
const tokens = (n) => ethers.utils.parseUnits(n.toString(), "ether");

// A helper function to verify that the Transfer event has been emitted correctly.
const expectTransferEvent = (result, from, to, value) => {
  const event = result.events.find((e) => e.event === "Transfer");
  expect(event).to.not.be.undefined; // Ensure that a Transfer event was emitted
  const args = event.args;
  expect(args.from).to.equal(from); // Verify 'from' address in the event
  expect(args.to).to.equal(to); // Verify 'to' address in the event
  expect(args.value).to.equal(value); // Verify 'value' (amount) in the event
};

// Main describe block for Token contract tests
describe("Token", () => {
  let token, accounts, deployer, receiver, exchange;

  // This beforeEach hook runs before each test case and deploys the token contract
  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token"); // Fetch token contract
    token = await Token.deploy("Dapp University", "DAPP", "1000000"); // Deploy the token with initial values
    accounts = await ethers.getSigners(); // Get the accounts from the blockchain
    deployer = accounts[0]; // The deployer of the contract
    receiver = accounts[1]; // Receiver account for token transfers
    exchange = accounts[2]; // Exchange account for delegated transfers
  });

  // Test the deployment of the contract
  describe("Deployment", () => {
    it("should set the correct name, symbol, decimals, total supply, and assign total supply to the deployer", async () => {
      // Check that the name, symbol, decimals, and total supply are correctly set during deployment
      expect(await token.name()).to.equal("Dapp University");
      expect(await token.symbol()).to.equal("DAPP");
      expect(await token.decimals()).to.equal("18");
      const totalSupply = tokens(1000000); // 1,000,000 tokens with 18 decimals
      expect(await token.totalSupply()).to.equal(totalSupply);
      expect(await token.balanceOf(deployer.address)).to.equal(totalSupply); // Deployer gets the total supply
    });
  });

  // Group tests related to sending tokens
  describe("Sending Tokens", () => {
    let amount, transaction, result;

    beforeEach(async () => {
      amount = tokens(100); // Set the transfer amount to 100 tokens (with 18 decimals)
    });

    describe("Success", () => {
      beforeEach(async () => {
        // Deployer transfers 100 tokens to the receiver
        transaction = await token
          .connect(deployer)
          .transfer(receiver.address, amount);
        result = await transaction.wait(); // Wait for the transaction to be mined
      });

      it("should transfer token balances", async () => {
        // Check the final balances after the transfer
        expect(await token.balanceOf(deployer.address)).to.equal(
          tokens(999900)
        ); // Deployer loses 100 tokens
        expect(await token.balanceOf(receiver.address)).to.equal(amount); // Receiver gains 100 tokens
      });

      it("should emit a Transfer event", async () => {
        // Verify that a Transfer event was emitted with the correct data
        expectTransferEvent(result, deployer.address, receiver.address, amount);
      });
    });

    describe("Failure", () => {
      it("should reject transfer if balance is insufficient", async () => {
        // Try to transfer more tokens than the deployer has (should fail)
        const invalidAmount = tokens(1000000000); // 1 billion tokens, exceeds the deployer's balance
        await expect(
          token.connect(deployer).transfer(receiver.address, invalidAmount)
        ).to.be.reverted; // Expect revert
      });

      it("should reject transfer to the zero address", async () => {
        // Try to transfer tokens to an invalid address (address(0), should fail)
        await expect(
          token.connect(deployer).transfer(ethers.constants.AddressZero, amount)
        ).to.be.reverted;
      });
    });
  });

  // Group tests related to approving tokens (setting allowances)
  describe("Approving Tokens", () => {
    let amount, transaction, result;

    beforeEach(async () => {
      amount = tokens(100); // Set the approval amount to 100 tokens
      transaction = await token
        .connect(deployer)
        .approve(exchange.address, amount); // Deployer approves exchange to spend 100 tokens
      result = await transaction.wait(); // Wait for the transaction to be mined
    });

    describe("Success", () => {
      it("should allocate an allowance for delegated token spending", async () => {
        // Check that the allowance is correctly set
        expect(
          await token.allowance(deployer.address, exchange.address)
        ).to.equal(amount);
      });

      it("should emit an Approval event", async () => {
        // Verify that an Approval event was emitted with the correct data
        const event = result.events[0];
        expect(event.event).to.equal("Approval");
        const args = event.args;
        expect(args.owner).to.equal(deployer.address); // Owner of the tokens
        expect(args.spender).to.equal(exchange.address); // Spender allowed to spend tokens
        expect(args.value).to.equal(amount); // Approved amount
      });
    });

    describe("Failure", () => {
      it("should reject invalid spender", async () => {
        // Try to approve the zero address as a spender (should fail)
        await expect(
          token.connect(deployer).approve(ethers.constants.AddressZero, amount)
        ).to.be.reverted;
      });
    });
  });

  // Group tests related to delegated token transfers (transferFrom)
  describe("Delegated Token Transfers", () => {
    let amount, transaction, result;

    beforeEach(async () => {
      amount = tokens(100); // Set the transfer amount to 100 tokens
      await token.connect(deployer).approve(exchange.address, amount); // Deployer approves exchange to spend 100 tokens
    });

    describe("Success", () => {
      beforeEach(async () => {
        // Exchange transfers tokens from the deployer to the receiver
        transaction = await token
          .connect(exchange)
          .transferFrom(deployer.address, receiver.address, amount);
        result = await transaction.wait(); // Wait for the transaction to be mined
      });

      it("should transfer token balances", async () => {
        // Check balances after the delegated transfer
        expect(await token.balanceOf(deployer.address)).to.equal(
          tokens(999900)
        ); // Deployer loses 100 tokens
        expect(await token.balanceOf(receiver.address)).to.equal(amount); // Receiver gains 100 tokens
      });

      it("should reset the allowance", async () => {
        // Ensure that the allowance is reset to 0 after the transfer
        expect(
          await token.allowance(deployer.address, exchange.address)
        ).to.equal(0);
      });

      it("should emit a Transfer event", async () => {
        // Verify that a Transfer event was emitted
        expectTransferEvent(result, deployer.address, receiver.address, amount);
      });
    });

    describe("Failure", () => {
      it("should reject transfer if allowance is exceeded", async () => {
        // Try to transfer more tokens than the allowance permits (should fail)
        const invalidAmount = tokens(100000000); // 100 million tokens, exceeds the allowance
        await expect(
          token
            .connect(exchange)
            .transferFrom(deployer.address, receiver.address, invalidAmount)
        ).to.be.reverted;
      });
    });
  });
});
