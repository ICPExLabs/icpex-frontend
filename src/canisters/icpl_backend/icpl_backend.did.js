export const idlFactory = ({ IDL }) => {
  const TokenInfo = IDL.Record({
    decimals: IDL.Nat,
    flat_fee: IDL.Bool,
    owner: IDL.Principal,
    logo: IDL.Text,
    name: IDL.Text,
    mint_on: IDL.Bool,
    platform_token_type: IDL.Text,
    burn_rate: IDL.Nat,
    fee_rate: IDL.Nat,
    address: IDL.Principal,
    flat_burn_fee: IDL.Bool,
    token_type: IDL.Text,
    total_supply: IDL.Nat,
    symbol: IDL.Text,
  });
  const Result = IDL.Variant({ Ok: IDL.Principal, Err: IDL.Text });
  const TokenSymbolInfo = IDL.Record({
    decimals: IDL.Nat,
    logo: IDL.Text,
    platform_token_type: IDL.Text,
    token_type: IDL.Text,
    symbol: IDL.Text,
  });
  return IDL.Service({
    checkToken: IDL.Func([IDL.Principal, IDL.Text], [TokenInfo], []),
    createToken: IDL.Func(
      [
        IDL.Text,
        IDL.Text,
        IDL.Text,
        IDL.Nat8,
        IDL.Nat,
        IDL.Nat,
        IDL.Bool,
        IDL.Nat,
        IDL.Bool,
        IDL.Bool,
        IDL.Text,
        IDL.Opt(IDL.Principal),
      ],
      [Result],
      []
    ),
    cycles: IDL.Func([], [IDL.Nat64], ["query"]),
    getMetadata: IDL.Func(
      [],
      [IDL.Principal, IDL.Principal, IDL.Principal, IDL.Nat],
      ["query"]
    ),
    getSymbolToken: IDL.Func([IDL.Text], [TokenSymbolInfo], ["query"]),
    getToken: IDL.Func([IDL.Principal], [TokenInfo], ["query"]),
    getTokenCnt: IDL.Func([], [IDL.Nat64], ["query"]),
    getTokenIds: IDL.Func([IDL.Nat64], [IDL.Vec(IDL.Text)], ["query"]),
    getTokenInfo: IDL.Func([], [IDL.Vec(TokenInfo)], ["query"]),
    getTokenLogo: IDL.Func([IDL.Principal], [IDL.Text], ["query"]),
    getUserCreateTokenInfo: IDL.Func(
      [IDL.Principal],
      [IDL.Vec(TokenInfo)],
      ["query"]
    ),
    getUserSubWallet: IDL.Func([], [IDL.Vec(TokenInfo)], ["query"]),
    mintToken: IDL.Func([IDL.Principal, IDL.Principal, IDL.Nat], [], []),
    removeTokensControllers: IDL.Func(
      [IDL.Principal, IDL.Opt(IDL.Principal)],
      [],
      []
    ),
  });
};
export const init = ({ IDL }) => {
  return [IDL.Principal, IDL.Principal, IDL.Nat, IDL.Principal];
};
