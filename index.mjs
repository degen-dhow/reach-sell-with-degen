import {loadStdlib} from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
const stdlib = loadStdlib(process.env);

const startingBalance = stdlib.parseCurrency(100);

const [ accSeller, accBuyer ] =
  await stdlib.newTestAccounts(2, startingBalance);

const ctcSeller = accSeller.contract(backend);
const ctcBuyer = accBuyer.contract(backend, ctcSeller.getInfo());

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

const printBalance = async (name, account) => {
  console.log(`** ${name} balance **`)
  console.log("Algo: " + stdlib.bigNumberToNumber(await stdlib.balanceOf(account))/1_000_000);
  const balance = await stdlib.balancesOf(account, [nft.id, degen.id])
  console.log(`NFT: ${stdlib.bigNumberToNumber(balance[0])} - Degen: ${stdlib.bigNumberToNumber(balance[1])}`);
}

console.log('Before Program Balances');
await printBalance('seller', accSeller);
await printBalance('buyer', accBuyer);
console.log('\n');

const price = 10;
const time = 1000;

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

console.log('After Program Balances');
await printBalance('seller', accSeller);
await printBalance('buyer', accBuyer);
