import type { FC } from "react";
import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./index.module.less";
import type { ContentLeftProps } from "./content-left";
import ContentLeft from "./content-left";
import ContentRight from "./content-right";
import arrowLeft from "@/assets/arrow-left.svg";

const CreatePool: FC = () => {
  const navigate = useNavigate();
  const [type, setType] = useState<ContentLeftProps["type"]>("public-standard");
  const goBack = useCallback(() => {
    navigate(-1);
  }, []);
  return (
    <>
      <div className={styles.back} onClick={goBack}>
        <img src={arrowLeft} alt="arrow" /> Go back
      </div>
      <div className={styles.content}>
        <ContentLeft type={type} />
        <ContentRight onChange={setType} />
      </div>
    </>
  );
};

export default CreatePool;
