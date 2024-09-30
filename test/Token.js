const { ethers } = require('hardhat')
const { expect } = require('chai')

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Token', () => {
  let token

  beforeEach(async () => {
    // Fetch token from BC using ethers JS. You first need to pull Ethers into this file.
    const Token = await ethers.getContractFactory('Token')
    // Now you need a deployed instance of this
    token = await Token.deploy('Dapp University', 'DAPP', '1000000')
  })

  describe('Deployment', () => {
    const name = 'Dapp University'
    const symbol = 'DAPP'
    const decimals = '18'
    const totalSupply = '1000000'

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
      expect(await token.totalSupply()).to.equal(tokens(totalSupply))
    })
  })
})
