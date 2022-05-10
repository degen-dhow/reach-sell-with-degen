'reach 0.1';
'use strict';

const Common = {
  seeTimeout: Fun([], Null),
  seeTransfer: Fun([], Null),
};

export const main = Reach.App(() => {
  const A = Participant('Alice', {
    ...Common,
    // Tuple
    getSwap: Fun([], Tuple(Token, Token, UInt, UInt)),
    cancel: Fun([], Bool),
  });
  const B = Participant('Bob', {
    ...Common,
    accSwap: Fun([Token, Token, UInt], Bool),
  });
  init();

  A.only(() => {
    const [ nft, degen, price, time ] = declassify(interact.getSwap());
    assume(nft != degen); });
  A.publish(nft, degen, price, time);
  commit();
  A.pay([1, [1, nft] ]);
  commit();
  
  fork()
  .case(A, (() => ({
    msg:1,
    when: declassify(interact.cancel()) })),
    ((v) => v),
    (_) => {
      transfer([balance(), [1, nft] ]).to(A);
      commit();
      exit();
    })
  .case(B, (() => ({
      msg: price,
      when: declassify(interact.accSwap(nft, degen, price)) })),
    ((v) => v),
    (_) => {
      commit();
      B.pay([[ price, degen]]);
      transfer([balance(), [price, degen]]).to(A);
      transfer([[1,nft]]).to(B);
      commit();
      exit();
    }).timeout(absoluteTime(time), () => {
      A.publish();
      transfer([ balance(), [1, nft] ]).to(A);
      commit();
      exit();
    });
});