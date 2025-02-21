export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({
    Ok: IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat)),
    Err: IDL.Text,
  });
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const Result_1 = IDL.Variant({ Ok: IDL.Null, Err: IDL.Text });
  return IDL.Service({
    airdrop: IDL.Func(
      [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat)), IDL.Principal, IDL.Text],
      [Result],
      []
    ),
    cycles: IDL.Func([], [IDL.Nat64], ["query"]),
    getSubaccount: IDL.Func([], [Account], ["query"]),
    withdrawSubAccountToken: IDL.Func([IDL.Principal], [Result_1], []),
  });
};
export const init = ({ IDL }) => {
  return [];
};
