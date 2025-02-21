import type { FC } from "react";
import React from "react";
import styles from "./index.module.less";
import { Image } from "antd";
import TwitterIcon from "@/assets/twitter-icon.png";
import WebsiteIcon from "@/assets/website-icon.png";
import classNames from "classnames";
import { Link } from "react-router-dom";

interface SocialMediaLinksProps {
  basicInfo: any;
}
const CANISTER_MEIDA_MAP: Record<string, { website: string; twitter: string }> =
  {
    "ezu5v-7qaaa-aaaam-acpbq-cai": {
      website: "https://friescoin.xyz/",
      twitter: "https://x.com/FriesCoin",
    },
  };
const SocialMediaLinks: FC<SocialMediaLinksProps> = (props) => {
  const { basicInfo } = props;
  console.debug("🚀 ~ basicInfo:", basicInfo.address.toText());
  const address = basicInfo?.address.toText() as string;
  const IconList = [
    {
      label: "Website",
      icon: <Image src={WebsiteIcon} preview={false} />,
      link: CANISTER_MEIDA_MAP[address]?.website,
    },
    {
      label: "Twitter",
      icon: <Image src={TwitterIcon} preview={false} />,
      link: CANISTER_MEIDA_MAP[address]?.twitter,
    },
  ];

  return (
    <div className={styles.socialContainer}>
      {IconList.map((item) => {
        return (
          <Link
            key={item.label}
            className={classNames({
              [styles.iconContainer]: true,
              [styles.editStyle]: basicInfo?.symbol === "IEXT",
            })}
            to={item.link}
            target="_blank"
          >
            <div className={styles.iconStyle}>{item.icon}</div>
            <div className={styles.iconLabel}>{item.label}</div>
          </Link>
        );
      })}
    </div>
  );
};

export default SocialMediaLinks;
