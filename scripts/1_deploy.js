async function main() {
  // Fetch contract to deploy
  const Token = await ethers.getContractFactory('Token')
  // Deploy contract
  const token = await Token.deploy()
  // Fetch a copy of the token that was deployed to BC. Deployed here to get the info back from the BC.
  await token.deployed()
  console.log(`Token deployed to: ${token.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
