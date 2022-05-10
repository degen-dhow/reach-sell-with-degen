'reach 0.1';
'use strict';

const Common = {
  seeTimeout: Fun([], Null),
  seeTransfer: Fun([], Null),
};

export const main = Reach.App(() => {
  const Seller = Participant('Seller', {
    ...Common,
    getSwap: Fun([], Tuple(Token, Token, UInt, UInt)),
    cancel: Fun([], Bool),
  });
  const Buyer = Participant('Buyer', {
    ...Common,
    accSwap: Fun([Token, Token, UInt], Bool),
  });
  init();

  Seller.only(() => {
    const [ nft, degen, price, time ] = declassify(interact.getSwap());
    assume(nft != degen); });
  Seller.publish(nft, degen, price, time);
  commit();
  Seller.pay([1, [1, nft] ]);
  commit();
  
  fork()
  .case(Seller, (() => ({
    msg:1,
    when: declassify(interact.cancel()) })),
    ((v) => v),
    (_) => {
      transfer([balance(), [1, nft] ]).to(Seller);
      commit();
      exit();
    })
  .case(Buyer, (() => ({
      msg: price,
      when: declassify(interact.accSwap(nft, degen, price)) })),
    ((v) => v),
    (_) => {
      commit();
      Buyer.pay([[ price, degen]]);
      transfer([balance(), [price, degen]]).to(Seller);
      transfer([[1,nft]]).to(Buyer);
      commit();
      exit();
    }).timeout(absoluteTime(time), () => {
      Seller.publish();
      transfer([ balance(), [1, nft] ]).to(Seller);
      commit();
      exit();
    });
});