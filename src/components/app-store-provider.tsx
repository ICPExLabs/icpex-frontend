import type { ReactNode } from "react";
import React, { createContext } from "react";
import appStore from "@/store/app";

export const AppStoreContext = createContext(appStore);

export const AppStoreProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AppStoreContext.Provider value={appStore}>
      {children}
    </AppStoreContext.Provider>
  );
};
