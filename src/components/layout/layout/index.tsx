import type { FC } from "react";
import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import Faucet from "../faucet";
import LayoutHeader from "../header";
import LayoutContent from "../content";
import {
  CreatePool,
  CreateToken,
  DashBoard,
  Exchange,
  LiquidPool,
  TokenDetail,
  Wallet,
  AirdropCampaign,
} from "@/views";
import ContentHeaderMenuyout from "../ContentHeaderMenu";
import { createActorOfRouter } from "@/utils/actors/router.ts";

const NotFound = () => {
  return <div>404 - Page Not Found</div>;
};

const Layout: FC = () => {
  return (
    <>
      <LayoutHeader />
      <LayoutContent>
        <ContentHeaderMenuyout></ContentHeaderMenuyout>
        <Routes>
          <Route path="/exchange" element={<Exchange />} />
          <Route path="/createPool" element={<CreatePool />} />
          <Route path="/airdropCampaign" element={<AirdropCampaign />} />
          <Route path="/liquidPool" element={<LiquidPool />} />
          <Route path="/createToken" element={<CreateToken />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/dashboard" element={<DashBoard />} />
          <Route
            path="/:detailType/detail/:tokenId"
            element={<TokenDetail />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </LayoutContent>
    </>
  );
};

export default Layout;
