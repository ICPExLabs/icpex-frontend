import { useContext } from "react";
import { AppStoreContext } from "@/components";

export function useAppStore() {
  const appStore = useContext(AppStoreContext);
  return { appStore };
}
