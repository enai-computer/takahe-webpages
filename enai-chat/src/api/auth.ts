import { AuthInfo, AuthInfoDetails, AuthInfoStatus } from "../models";
import { MOCK_WEBVIEW_ENV } from "../utils/config";
import { ModifiedWindow } from "../utils/types";

  /**
   * @returns Either the new auth details, or `false` in case it failed.
   */
export const waitForAuthDetails = async (setAuthInfo: (info: AuthInfo) => void, authInfo: AuthInfo): Promise<AuthInfoDetails | false> => {
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
        win.updateAuthDetails = (details: AuthInfoDetails) =>
          setAuthInfo({ status: AuthInfoStatus.InUse, details });
      };
    }),
  ])) as AuthInfoDetails | false;
  
  if (details) {
    setAuthInfo({ status: AuthInfoStatus.InUse, details });
  }
  return details;
}; 
