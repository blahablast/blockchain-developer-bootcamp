const { ethers } = require('hardhat')

async function main() {
  // Fetch contract to deploy
  const Token = await ethers.getContractFactory('Token')
  const Exchange = await ethers.getContractFactory('Exchange')

  // Fetch Accounts
  const accounts = await ethers.getSigners()
  console.log(
    `Accounts fetched: \n${accounts[0].address}\n${accounts[1].address}\n`
  )

  // Deploy contracts
  const dapp = await Token.deploy('Dapp University', 'DAPP', '1000000')
  // Fetch a copy of the token that was deployed to BC. Deployed here to get the info back from the BC.
  await dapp.deployed()
  console.log(`Dapp Token deployed to: ${dapp.address}`)

  const mETH = await Token.deploy('mETH', 'mETH', '1000000')
  await mETH.deployed()
  console.log(`mETH Token Deployed to: ${mETH.address}`)

  const mDAI = await Token.deploy('mDAI', 'mDAI', '1000000')
  await mDAI.deployed()
  console.log(`mDAI Token Deployed: ${mDAI.address}`)

  const exchange = await Exchange.deploy(accounts[1].address, 10)
  await exchange.deployed()
  console.log(`Exchange Deployed to: ${exchange.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
