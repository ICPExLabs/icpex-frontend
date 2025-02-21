export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    addICPLedgerAddr: IDL.Func([IDL.Principal], [IDL.Nat], []),
    addICPPrice: IDL.Func([IDL.Text], [], []),
    cycles: IDL.Func([], [IDL.Nat64], ["query"]),
    mannualRefreshAndGetPrice: IDL.Func(
      [IDL.Opt(IDL.Principal)],
      [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat)), IDL.Nat, IDL.Principal],
      []
    ),
    pricesBatch: IDL.Func(
      [IDL.Vec(IDL.Principal)],
      [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat))],
      ["query"]
    ),
  });
};
export const init = ({ IDL }) => {
  return [IDL.Principal, IDL.Principal, IDL.Principal, IDL.Text];
};
