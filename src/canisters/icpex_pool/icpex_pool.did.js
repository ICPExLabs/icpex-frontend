export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    cycles: IDL.Func([], [IDL.Nat64], ["query"]),
    retrieve: IDL.Func([IDL.Principal, IDL.Nat, IDL.Principal], [], []),
    transfer: IDL.Func([IDL.Principal, IDL.Principal, IDL.Nat], [], []),
  });
};
export const init = ({ IDL }) => {
  return [IDL.Principal, IDL.Principal, IDL.Principal];
};
