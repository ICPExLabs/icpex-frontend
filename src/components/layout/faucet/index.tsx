import type { FC } from "react";
import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { message } from "antd";
import styles from "./index.module.less";
import Modal from "./modal";
import appStore from "@/store/app";
import { createActorOfRouter } from "@/utils/actors/router.ts";
import type { ConnectWalletModallRef } from "@/components/layout/ConnectWalletModal";
import ConnectWalletModal from "@/components/layout/ConnectWalletModal";

const Faucet: FC = observer(
  (effect: React.EffectCallback, deps?: React.DependencyList) => {
    const [open, setOpen] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [status, setStatus] = useState<
      "loading" | "success" | "fail" | "received"
    >("fail");
    const received = useRef(false);
    const connectWalletModalRef = useRef<ConnectWalletModallRef>(null);
    const openConnectModal = () => {
      connectWalletModalRef.current?.showModal();
    };
    const fetchIcpl = async () => {
      if (!appStore.userId) {
        openConnectModal();
        return;
      }

      if (received.current) {
        setStatus("received");
        return;
      }
      if (status === "loading") return;
      setStatus("loading");
      const actor = await createActorOfRouter();
      const err = await actor.withdrawToken();
      if ("Ok" in err) {
        setStatus("success");
        setOpen(false);
        received.current = true;
      } else {
        if (err.Err.includes("receive")) {
          setStatus("received");
          setOpen(false);
        } else {
          setStatus("fail");
          messageApi.error(err.Err);
          setOpen(false);
        }
      }
    };

    const init_open = async () => {
      let open_flag = false;
      if (!appStore.userId) {
        open_flag = true;
      }
      try {
        if (appStore.userId) {
          // const actor = await createActorOfRouter()
          // const chech_res = await actor.getUserClaim()
          // if ('Ok' in chech_res) {
          //   open_flag = true
          // }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setOpen(open_flag);
      }
    };

    useEffect(() => {
      setTimeout(init_open, 1000);
    }, []);
    return (
      <>
        {contextHolder}
        <ConnectWalletModal ref={connectWalletModalRef} />
        <Modal status={status} onClose={() => setStatus("fail")} />
        {open ? (
          <div className={styles.faucet}>
            <div className={styles.receive} onClick={fetchIcpl} />
            <div className={styles.close} onClick={() => setOpen(false)} />
          </div>
        ) : null}
      </>
    );
  }
);

export default Faucet;
