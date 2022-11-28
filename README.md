# evm-token-bridge
EVM Token Bridge - Transfers ERC20 tokens from source blockchain network to target network.
We are going to use Goerli - Ethereum's Testnet and Mumbai - Polygon's testnet.
## Deployed Bridge contracts
```javascript I'm A tab
GOERLI BRIDGE: 0x2759a3c726cB59b70bb4B80C73bE20Aa3Dd125C0
MUMBAI BRIDGE: 0x6DeFf377FA433F879d2cfDA5F169352b1e4335DD
```
## Installment
Make sure you are in the directory of the cloned project then
```bash
  npm install
```
## Create .env file

Create an `.env` file with the following structure 

```javascript I'm A tab
ETHEREUM_RPC_URL=YOUR ETHEREUM_RPC_URL HERE
MUMBAI_RPC_URL=YOUR MUMBAI_RPC_URL HERE
PRIVATE_KEY=YOUR PRIVATE_KEY HERE
ETHERSCAN_KEY=YOUR ETHERSCAN_KEY HERE
POLYGONSCAN_KEY=YOUR POLYGONSCAN_KEY HERE
```
## Test
If everything from the previous steps was followed it's time to test the project with
the following command: 
```bash
  npx hardhat test
```

## Deployment

First we have to deploy our ERC20 token on desired network. In our case we are going to deploy on Goerli.
Make sure you have some GoerliETH in your wallet.

`deploy-erc20-goerli` is a custom task implemented in `hardhat.config.ts`

```bash
  npx hardhat deploy-erc20-goerli --network goerli
```

Second we have to deploy and verify our `EthereumBridge` contract on Goerli

```bash
  npx hardhat deploy-ethbridge-goerli --network goerli
```
Third we have to deploy and verify our `PolygonBridge` contract on Mumbai
```bash
  npx hardhat deploy-polygonbridge-mumbai --network matic
```