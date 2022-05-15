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
    name: 'Dapp: Polygon-Marketplace',
    npmName: 'dapp-cli-template-polygon-marketplace',
    version: 'latest',
    disabled: false,
    installCommand: ["yarn"],
    startCommand: ["yarn", "run", "dev"]
  },
  {
    id: 3,
    name: 'Dapp: Moralis-Marketplace',
    npmName: 'dapp-cli-template-moralis-marketplace',
    version: 'latest',
    disabled: false,
    installCommand: ["yarn"],
    startCommand: []
  }
]