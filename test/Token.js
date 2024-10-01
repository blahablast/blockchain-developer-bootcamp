const { ethers } = require('hardhat')
const { expect } = require('chai')

// A helper function that converts a num into a token amount with 18 decimal places.
const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Token', () => {
  let token, accounts, deployer, receiver

  // Deploys the token contract before each test.
  beforeEach(async () => {
    // Fetch token from BC using ethers JS. You first need to pull Ethers into this file.
    const Token = await ethers.getContractFactory('Token')
    // Now you need a deployed instance of this
    token = await Token.deploy('Dapp University', 'DAPP', '1000000')

    // Get the top account from the BC
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    receiver = accounts[1]
  })

  describe('Deployment', () => {
    const name = 'Dapp University'
    const symbol = 'DAPP'
    const decimals = '18'
    const totalSupply = tokens('1000000')

    it('has correct name', async () => {
      // Check that the name is correct
      expect(await token.name()).to.equal(name)
    })

    it('has correct symbol', async () => {
      expect(await token.symbol()).to.equal(symbol)
    })

    it('has correct decimals', async () => {
      expect(await token.decimals()).to.equal(decimals)
    })

    it('has correct total supply', async () => {
      expect(await token.totalSupply()).to.equal(totalSupply)
    })

    it('assigns total supply to the deployer', async () => {
      expect(await token.balanceOf(deployer.address)).to.equal(totalSupply)
    })
  })

  describe('Sending Tokens', () => {
    let amount, transaction, result

    describe('Success', () => {
      beforeEach(async () => {
        amount = tokens(100)

        transaction = await token
          .connect(deployer)
          .transfer(receiver.address, amount)
        result = await transaction.wait()
      })

      it('transfers Token Balances', async () => {
        expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900))
        expect(await token.balanceOf(receiver.address)).to.equal(amount)
      })

      it('emits a transfer event', async () => {
        const event = result.events[0]
        expect(event.event).to.equal('Transfer')

        const args = event.args
        expect(args.from).to.equal(deployer.address)
        expect(args.to).to.equal(receiver.address)
        expect(args.value).to.equal(amount)
      })
    })

    describe('Failure', () => {
      it('rejects insufficient balances', async () => {
        // Transfer more tokens than deployer has -100M
        const invalidAmount = tokens(1000000000)
        await expect(
          token.connect(deployer).transfer(receiver.address, invalidAmount)
        ).to.be.reverted
      })

      it('rejects invalid recipient', async () => {
        // Transfer more tokens than deployer has -100M
        const amount = tokens(100)
        await expect(
          token
            .connect(deployer)
            .transfer('0x0000000000000000000000000000000000000000', amount)
        ).to.be.reverted
      })
    })
  })
})
