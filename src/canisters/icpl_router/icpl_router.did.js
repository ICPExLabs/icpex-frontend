export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({
    Ok: IDL.Tuple(IDL.Principal, IDL.Nat),
    Err: IDL.Text,
  });
  const PoolStatus = IDL.Variant({
    CREATE_BASE_INPUT: IDL.Null,
    CREATE_QUOTE_INPUT: IDL.Null,
    OFFLINE: IDL.Null,
    ROLLBACK_UNDONE: IDL.Null,
    CREATED: IDL.Null,
    ROLLBACK_DONE: IDL.Null,
    ONLINE: IDL.Null,
  });
  const PoolInfo = IDL.Record({
    i: IDL.Nat,
    k: IDL.Nat,
    base_reserve: IDL.Nat,
    owner: IDL.Principal,
    block_timestamp_last: IDL.Nat64,
    pool_addr: IDL.Principal,
    lp_amount: IDL.Nat,
    pool_type: IDL.Text,
    lp_lock: IDL.Nat,
    quote_user: IDL.Nat,
    lp_fee_rate: IDL.Nat,
    base_token_decimals: IDL.Nat8,
    quote_token_decimals: IDL.Nat8,
    base_user: IDL.Nat,
    quote_token: IDL.Principal,
    base_price_cumulative_last: IDL.Nat,
    quote_reserve: IDL.Nat,
    base_token: IDL.Principal,
    pool_status: PoolStatus,
    mt_fee_rate: IDL.Nat,
    is_single_pool: IDL.Bool,
    total_supply: IDL.Nat,
    is_my_pool: IDL.Bool,
  });
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const Result_1 = IDL.Variant({ Ok: IDL.Float32, Err: IDL.Text });
  const TokenType = IDL.Variant({
    EXT: IDL.Null,
    UNKOWN: IDL.Null,
    ICRC1: IDL.Null,
    ICRC2: IDL.Null,
    DIP20: IDL.Null,
  });
  const Result_2 = IDL.Variant({ Ok: IDL.Null, Err: IDL.Text });
  const Result_3 = IDL.Variant({ Ok: IDL.Nat, Err: IDL.Text });
  const RState = IDL.Variant({
    ONE: IDL.Null,
    AboveOne: IDL.Null,
    BelowOne: IDL.Null,
  });
  const Result_4 = IDL.Variant({
    Ok: IDL.Tuple(IDL.Nat, IDL.Vec(IDL.Principal), IDL.Nat8, IDL.Nat, IDL.Nat),
    Err: IDL.Text,
  });
  const Result_5 = IDL.Variant({ Ok: IDL.Nat64, Err: IDL.Text });
  return IDL.Service({
    addLiquidity: IDL.Func(
      [IDL.Principal, IDL.Nat, IDL.Nat, IDL.Nat, IDL.Nat64],
      [IDL.Nat, IDL.Nat, IDL.Nat],
      []
    ),
    addPrivateLiquidity: IDL.Func(
      [IDL.Principal, IDL.Nat, IDL.Nat, IDL.Nat64],
      [IDL.Nat, IDL.Nat],
      []
    ),
    addStableLiquidity: IDL.Func(
      [IDL.Principal, IDL.Nat, IDL.Nat, IDL.Nat, IDL.Nat64],
      [IDL.Nat, IDL.Nat, IDL.Nat],
      []
    ),
    createCommonPool: IDL.Func(
      [
        IDL.Principal,
        IDL.Principal,
        IDL.Nat,
        IDL.Nat,
        IDL.Nat,
        IDL.Nat,
        IDL.Nat,
        IDL.Nat64,
        IDL.Opt(IDL.Bool),
      ],
      [Result],
      []
    ),
    createPrivatePool: IDL.Func(
      [
        IDL.Principal,
        IDL.Principal,
        IDL.Nat,
        IDL.Nat,
        IDL.Nat,
        IDL.Nat,
        IDL.Nat,
        IDL.Nat64,
        IDL.Opt(IDL.Bool),
      ],
      [Result],
      []
    ),
    createStablePool: IDL.Func(
      [
        IDL.Principal,
        IDL.Principal,
        IDL.Nat,
        IDL.Nat,
        IDL.Nat,
        IDL.Nat,
        IDL.Nat,
        IDL.Nat64,
        IDL.Opt(IDL.Bool),
      ],
      [Result],
      []
    ),
    cycles: IDL.Func([], [IDL.Nat64], ["query"]),
    getMidPrice: IDL.Func([IDL.Principal], [IDL.Nat], ["query"]),
    getPoolInfo: IDL.Func(
      [IDL.Principal, IDL.Principal],
      [PoolInfo],
      ["query"]
    ),
    getPoolsInfo: IDL.Func([IDL.Principal], [IDL.Vec(PoolInfo)], ["query"]),
    getSubaccount: IDL.Func([], [Account], ["query"]),
    getTimePrice: IDL.Func([IDL.Principal], [IDL.Nat], ["query"]),
    get_deviation_rate: IDL.Func(
      [IDL.Nat, IDL.Nat, IDL.Principal, IDL.Nat64],
      [Result_1],
      ["query"]
    ),
    get_mid_price_extra_decimals: IDL.Func(
      [IDL.Principal, IDL.Nat8],
      [IDL.Nat],
      ["query"]
    ),
    get_token_type_by_principal_with_refresh: IDL.Func(
      [IDL.Principal],
      [TokenType],
      []
    ),
    get_token_type_by_principal_without_refresh: IDL.Func(
      [IDL.Principal],
      [TokenType],
      ["query"]
    ),
    lockLiquidity: IDL.Func(
      [IDL.Principal, IDL.Nat, IDL.Nat64],
      [Result_2],
      []
    ),
    lockLiquidityV2: IDL.Func(
      [IDL.Principal, IDL.Nat, IDL.Nat64],
      [Result_3],
      []
    ),
    queryAddShareBase: IDL.Func(
      [IDL.Nat, IDL.Principal],
      [IDL.Nat, IDL.Nat, IDL.Nat, IDL.Nat],
      ["query"]
    ),
    queryAddShareQuote: IDL.Func(
      [IDL.Nat, IDL.Principal],
      [IDL.Nat, IDL.Nat, IDL.Nat, IDL.Nat],
      ["query"]
    ),
    querySellBase: IDL.Func(
      [IDL.Principal, IDL.Nat],
      [IDL.Nat, IDL.Nat, IDL.Nat, RState, IDL.Nat],
      ["query"]
    ),
    querySellQuote: IDL.Func(
      [IDL.Principal, IDL.Nat],
      [IDL.Nat, IDL.Nat, IDL.Nat, RState, IDL.Nat],
      ["query"]
    ),
    querySellShares: IDL.Func(
      [IDL.Nat, IDL.Principal, IDL.Principal],
      [IDL.Nat, IDL.Nat, IDL.Nat, IDL.Nat],
      ["query"]
    ),
    quote: IDL.Func(
      [IDL.Principal, IDL.Principal, IDL.Nat, IDL.Nat64],
      [Result_4],
      ["query"]
    ),
    resetParamPrivatePool: IDL.Func(
      [IDL.Principal, IDL.Nat, IDL.Nat, IDL.Nat],
      [],
      []
    ),
    sellShares: IDL.Func(
      [IDL.Nat, IDL.Principal, IDL.Nat, IDL.Nat, IDL.Nat, IDL.Nat64],
      [IDL.Nat, IDL.Nat],
      []
    ),
    swapTokenToToken: IDL.Func(
      [
        IDL.Principal,
        IDL.Principal,
        IDL.Nat,
        IDL.Nat,
        IDL.Vec(IDL.Principal),
        IDL.Nat64,
        IDL.Nat64,
      ],
      [Result_5],
      []
    ),
    transferLiquidity: IDL.Func(
      [IDL.Principal, IDL.Principal, IDL.Nat],
      [Result_2],
      []
    ),
    transferLiquidityV2: IDL.Func(
      [IDL.Principal, IDL.Principal, IDL.Nat],
      [Result_3],
      []
    ),
    withdrawSubAccountToken: IDL.Func([IDL.Principal, IDL.Nat], [Result_2], []),
  });
};
export const init = ({ IDL }) => {
  return [IDL.Principal, IDL.Principal];
};
