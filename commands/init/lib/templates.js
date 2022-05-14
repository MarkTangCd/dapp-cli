module.exports = [
  {
    id: 1,
    name: 'Dapp: Normal',
    npmName: 'dapp-cli-template-normal',
    version: 'latest',
    disabled: false,
    installCommand: ["yarn"],
    startCommand: []
  },
  {
    id: 2,
    name: 'Dapp: NFT-Market',
    npmName: 'dapp-cli-template-nft-market',
    version: 'latest',
    disabled: true,
    installCommand: ["npm", "install"],
    startCommand: []
  },

]