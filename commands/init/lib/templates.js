module.exports = [
  {
    id: 1,
    name: 'Dapp: Normal',
    npmName: 'dapp-cli-template-normal',
    version: 'latest',
    disabled: false,
    installCommand: ["yarn"],
    startCommand: [],
    tag: ["project"],
    ignore: ["**/packages/**"]
  },
  {
    id: 2,
    name: 'Dapp: Polygon-Marketplace',
    npmName: 'dapp-cli-template-polygon-marketplace',
    version: 'latest',
    disabled: false,
    installCommand: ["yarn"],
    startCommand: ["yarn", "run", "dev"],
    tag: ["project"],
    ignore: []
  },
  {
    id: 3,
    name: 'Dapp: Moralis-Marketplace',
    npmName: 'dapp-cli-template-moralis-marketplace',
    version: 'latest',
    disabled: false,
    installCommand: ["yarn"],
    startCommand: [],
    tag: ["project"],
    ignore: ["**/Truffle/**"]
  },
  {
    id: 4,
    name: 'Test-Component',
    npmName: 'dapp-cli-component-test',
    version: 'latest',
    disabled: false,
    installCommand: ["yarn"],
    startCommand: [],
    tag: ["component"],
    ignore: []
  }
]