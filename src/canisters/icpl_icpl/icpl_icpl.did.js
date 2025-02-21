export const idlFactory = ({ IDL }) => {
  const TxError = IDL.Variant({
    InsufficientAllowance: IDL.Null,
    InsufficientBalance: IDL.Null,
    ErrorOperationStyle: IDL.Null,
    Unauthorized: IDL.Null,
    LedgerTrap: IDL.Null,
    ErrorTo: IDL.Null,
    Other: IDL.Null,
    BlockUsed: IDL.Null,
    AmountTooSmall: IDL.Null,
  });
  const Result = IDL.Variant({ Ok: IDL.Nat, Err: TxError });
  const FeeInfo = IDL.Record({
    decimals: IDL.Nat8,
    flat_fee: IDL.Bool,
    burn_rate: IDL.Nat,
    fee_rate: IDL.Nat,
    flat_burn_fee: IDL.Bool,
    total_supply: IDL.Nat,
  });
  const Metadata = IDL.Record({
    fee: IDL.Nat,
    decimals: IDL.Nat8,
    owner: IDL.Principal,
    logo: IDL.Text,
    name: IDL.Text,
    totalSupply: IDL.Nat,
    symbol: IDL.Text,
  });
  return IDL.Service({
    addToWhiteList: IDL.Func([IDL.Principal], [], []),
    allowance: IDL.Func([IDL.Principal, IDL.Principal], [IDL.Nat], ["query"]),
    approve: IDL.Func([IDL.Principal, IDL.Nat], [Result], []),
    balanceOf: IDL.Func([IDL.Principal], [IDL.Nat], ["query"]),
    cycles: IDL.Func([], [IDL.Nat64], ["query"]),
    decimals: IDL.Func([], [IDL.Nat8], ["query"]),
    getAllowanceSize: IDL.Func([], [IDL.Nat64], ["query"]),
    getExtInfo: IDL.Func(
      [],
      [IDL.Bool, IDL.Bool, IDL.Nat, IDL.Principal],
      ["query"]
    ),
    getFee: IDL.Func([IDL.Nat], [IDL.Nat], ["query"]),
    getFeeInfo: IDL.Func([], [FeeInfo], ["query"]),
    getHolders: IDL.Func(
      [IDL.Nat64, IDL.Nat64],
      [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat))],
      ["query"]
    ),
    getHoldersNum: IDL.Func([], [IDL.Nat64], ["query"]),
    getMetadata: IDL.Func([], [Metadata], ["query"]),
    getUserApprovals: IDL.Func(
      [IDL.Principal],
      [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat))],
      ["query"]
    ),
    logo: IDL.Func([], [IDL.Text], ["query"]),
    mint: IDL.Func([IDL.Principal, IDL.Nat], [Result], []),
    name: IDL.Func([], [IDL.Text], ["query"]),
    owner: IDL.Func([], [IDL.Principal], ["query"]),
    removeFromWhiteList: IDL.Func([IDL.Principal], [], []),
    setBurnRate: IDL.Func([IDL.Nat], [], []),
    setFee: IDL.Func([IDL.Nat], [], []),
    setFeeTo: IDL.Func([IDL.Principal], [], []),
    setLiquidFeeN: IDL.Func([IDL.Nat], [], []),
    setLogo: IDL.Func([IDL.Text], [], []),
    setName: IDL.Func([IDL.Text], [], []),
    setOwner: IDL.Func([IDL.Principal], [], []),
    setSwapRouter: IDL.Func([IDL.Principal], [], []),
    setSymbol: IDL.Func([IDL.Text], [], []),
    setTxBucket: IDL.Func([IDL.Principal], [], []),
    symbol: IDL.Func([], [IDL.Text], ["query"]),
    totalSupply: IDL.Func([], [IDL.Nat], ["query"]),
    transfer: IDL.Func([IDL.Principal, IDL.Nat], [Result], []),
    transferFrom: IDL.Func(
      [IDL.Principal, IDL.Principal, IDL.Nat],
      [Result],
      []
    ),
    whiteList: IDL.Func([], [IDL.Vec(IDL.Principal)], ["query"]),
  });
};
export const init = ({ IDL }) => {
  return [
    IDL.Text,
    IDL.Text,
    IDL.Text,
    IDL.Nat8,
    IDL.Nat,
    IDL.Nat,
    IDL.Bool,
    IDL.Principal,
  ];
};
