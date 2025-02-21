export const getDashboardTransactionURL = (transactionHash: string) =>
  `https://icscan.io/transaction/${transactionHash}`;
export const getAccountDashboardURL = (accountId: string) =>
  `https://dashboard.internetcomputer.org/account/${accountId}`;
export const getPrincipalDashboardURL = (canisterId: string) =>
  `https://dashboard.internetcomputer.org/canister/${canisterId}`;

export function goBack() {
  window.history.back();
}

export function goTransactions() {
  location.href = "/exchange?tab=transactions";
}

export function goMainWallet() {
  location.href = "/wallet";
}

export function goSubWallet() {
  location.href = "/wallet?tab=subWallet";
}

export function goToken() {
  location.href = "/token";
}

export function goTokenDetail(id: string) {
  location.href = getTokenDetailUrl(id);
}

export function getTokenDetailUrl(id: string) {
  return `/token/detail/${id}`;
}

export function goPoolDetail(id: string) {
  location.href = `/pool/detail/${id}`;
}
