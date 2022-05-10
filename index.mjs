import {loadStdlib} from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
const stdlib = loadStdlib(process.env);

const startingBalance = stdlib.parseCurrency(100);

const [ accSeller, accBuyer ] =
  await stdlib.newTestAccounts(2, startingBalance);
console.log('Hello, Seller and Buyer!');

console.log('Launching...');
const ctcSeller = accSeller.contract(backend);
const ctcBuyer = accBuyer.contract(backend, ctcSeller.getInfo());

console.log('Starting backends...');
const common = {
  seeTimeout: () => console.log('timed out'),
  seeTransfer: () => console.log('transfered'),
};

const nft = await stdlib.launchToken(accSeller, 'NFT', 'NFT', {decimals: 0, supply: 1});
const degen = await stdlib.launchToken(accBuyer, 'Degen', "DEGEN", {decimals: 0, supply: 1000});
const optInAccountsToASAs = async () => {
  await accSeller.tokenAccept(nft.id);
  await accSeller.tokenAccept(degen.id);
  await accBuyer.tokenAccept(nft.id);
  await accBuyer.tokenAccept(degen.id);
};
optInAccountsToASAs();

const price = 10;
const time = 1;
await Promise.all([
  backend.Seller(ctcSeller, {
    getSwap: () => {
      return [nft.id, degen.id, price, time];
    },
    cancel: () => {
      return false;
    },
  }),
  backend.Buyer(ctcBuyer, {
    accSwap: (nft, degen, price) => {
      return true;
    }
  }),
]);

const printBalance = async (name, account) => {
  console.log(stdlib.bigNumberToNumber(await stdlib.balanceOf(account)));
  const balance = await stdlib.balancesOf(account, [nft.id, degen.id])
  console.log(`NFT: ${stdlib.bigNumberToNumber(balance[0])} - Degen: ${stdlib.bigNumberToNumber(balance[1])}`);
}

await printBalance('seller', accSeller);
await printBalance('buyer', accBuyer);
