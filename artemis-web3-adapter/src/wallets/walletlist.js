import metaMaskPng from "../../assets/metamask.svg";
import { bitfinity } from "./bitfinity";
import { dfinity } from "./dfinity";
import { plug } from "./plug";
import { stoic } from "./stoic";
import { astrox } from "./astroxme";
import { metaMask } from "./msq";
import { nfid } from "./nfid";

export const walletlist = [
  {
    id: "dfinity",
    name: "Internet Identity",
    icon: "https://d15bmhsw4m27if.cloudfront.net/artemis/dfinity.svg",
    adapter: dfinity,
    walletName: "Internet Identity",
  },
  {
    id: "plug",
    name: "Plug Wallet",
    icon: "https://d15bmhsw4m27if.cloudfront.net/artemis/plug.jpg",
    adapter: plug,
    walletName: "Plug",
  },
  {
    id: "astrox",
    name: "AstroX ME",
    icon: "https://d15bmhsw4m27if.cloudfront.net/artemis/astroxme.webp",
    adapter: astrox,
    walletName: "AstroX ME",
  },
  {
    id: "bitfinity",
    name: "Bitfinity Wallet",
    icon: "https://d15bmhsw4m27if.cloudfront.net/artemis/bitfinity.svg",
    adapter: bitfinity,
    walletName: "Bitfinity",
  },
  {
    id: "stoic",
    name: "Stoic Wallet",
    icon: "https://d15bmhsw4m27if.cloudfront.net/artemis/stoic.png",
    adapter: stoic,
    walletName: "Stoic",
  },
  {
    id: "metamask",
    name: "MetaMask",
    icon: metaMaskPng,
    adapter: metaMask,
    walletName: "MetaMask",
  },
  {
    id: "nfid",
    name: "NFID",
    icon: "https://d15bmhsw4m27if.cloudfront.net/artemis/nfid.svg",
    adapter: nfid,
    walletName: "Nfid",
  },
];
