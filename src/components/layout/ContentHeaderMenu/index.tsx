import React from "react";
import { FC } from "react";
import deploymentPng from "@/assets/deployment.png";
import transactionPng from "@/assets/transaction.png";
import styles from "./index.module.less";
import { useNavigate } from "react-router-dom";
import { Dropdown } from "antd";
import { CaretDownOutlined } from "@ant-design/icons";
import Airdrop from "@/assets/Airdrop.svg";
interface MenuItem {
  title: string;
  desc?: string;
  href?: string;
  icon?: string;
  children?: MenuItem[];
}
const menus: MenuItem[] = [
  {
    title: "Exchange",
    href: "/exchange",
  },
  {
    title: "Pools",
    href: "/liquidPool",
  },
  {
    title: "Tools",
    children: [
      {
        title: "Create Token",
        desc: "One-click creation of tokens without coding.",
        icon: deploymentPng,
        href: "/createToken",
      },
      {
        title: "Create Liquidity Pool",
        desc: "Create and manager liquidity markets and customize your market making strategies.",
        icon: transactionPng,
        href: "/createPool",
      },
      {
        title: "Create Airdrop Campaign",
        desc: "Create an airdrop campaign with one click.",
        icon: Airdrop,
        href: "/airdropCampaign",
      },
    ],
  },
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Wallet",
    href: "/wallet",
  },
  {
    title: "Feedback",
    href: "https://forms.gle/6nb1QNtvG1TKKVxz9",
  },
];
const ContentHeaderMenuyout: FC = () => {
  const navigate = useNavigate();
  const handleClick = (href = "/") => {
    navigate(href);
  };
  const getMenuItems = (children: MenuItem[]) => {
    return children.map((item) => {
      const { icon, title, desc, href } = item;
      return {
        key: title,
        label: (
          <div
            key={href}
            className={styles.href}
            onClick={() => handleClick(href)}
            style={{ display: "flex", alignItems: "center" }}
          >
            <img src={icon} alt="logo" style={{ height: "30px" }} />
            <div style={{ marginLeft: "20px" }}>
              <div className={styles.title}>{title}</div>
              <div className={styles.desc}>{desc}</div>
            </div>
          </div>
        ),
      };
    });
  };
  const Meuns = menus.map((item) => {
    const { title, href, children } = item;
    if (!children) {
      if (href?.includes("http")) {
        return (
          <a
            className={styles["menu-item-a"]}
            key={title}
            target="_blank"
            rel="noopener noreferrer"
            href={href}
          >
            {title}
          </a>
        );
      }
      return (
        <div
          className={styles["menu-item"]}
          key={title}
          onClick={() => handleClick(href)}
        >
          {title}
        </div>
      );
    } else {
      return (
        <Dropdown
          placement="bottomCenter"
          menu={{ items: getMenuItems(children) }}
          key={title}
          arrow
        >
          <div className={styles["menu-item"]}>
            {title} <CaretDownOutlined />
          </div>
        </Dropdown>
      );
    }
  });
  return <div className={styles.menu}>{Meuns}</div>;
};

export default ContentHeaderMenuyout;
