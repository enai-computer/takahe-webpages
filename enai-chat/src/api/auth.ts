import { AuthInfo, AuthInfoDetails, AuthInfoStatus } from "../models";
import { MOCK_WEBVIEW_ENV } from "../utils/config";
import { ModifiedWindow } from "../utils/types";
import { create } from "zustand";

export const authInfoStore = create<{
  authInfo: AuthInfo;
  setAuthInfo: (info: AuthInfo) => void;
}>((set) => ({
  authInfo: {
    status: AuthInfoStatus.NotSet,
    details: null,
  },
  setAuthInfo: (info) => set({ authInfo: info }),
}));

/**
 * @returns Either the new auth details, or `false` in case it failed.
 */
export async function refreshAuth(): Promise<boolean> {
  const authInfo = authInfoStore.getState().authInfo;
  const TIME_LIMIT_MS = 10_000;

  if (!MOCK_WEBVIEW_ENV.enabled) {
    /* @ts-expect-error webkit */
    // eslint-disable-next-line
    window.webkit.messageHandlers.en_ai_handler.postMessage({
      source: "enai-agent",
      version: 1,
      type: "token-request",
      sub_type: authInfo.status === AuthInfoStatus.NotSet ? "initial" : "refresh",
    });
  }else{
    authInfoStore.getState().setAuthInfo({ status: AuthInfoStatus.InUse, details: { userId: "DA542425-F2B6-4610-832F-C7AE0FFC02C8", bearerToken: "test" } });
    return Promise.resolve(true);
  }

  console.debug("Waiting for auth details now...");
  const details = (await Promise.race([
    new Promise((resolve) => {
      setTimeout(() => resolve(false), TIME_LIMIT_MS);
    }),
    new Promise((resolve) => {
      const win = window as ModifiedWindow;
      win.updateAuthDetails = (details: AuthInfoDetails) => {
        resolve(details);
      };
    }),
  ])) as AuthInfoDetails | false;
  
  if (details) {
    authInfoStore.getState().setAuthInfo({ status: AuthInfoStatus.InUse, details });
    return Promise.resolve(true);
  }
  return Promise.resolve(false);
}

