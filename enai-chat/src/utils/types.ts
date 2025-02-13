import { AuthInfo, AuthInfoDetails, ExchangeMessage, Message, AiModel } from "../models";

export type ModifiedWindow = Window &
  typeof globalThis & {
    API_BASE_HOST: string;
    setAvailableModels(models: AiModel[]): void;
    updateInfoModal?(innerHtml: string): void;
    updateAuthDetails?(details: AuthInfoDetails): void;
    setContext?(context: string[]): void;
    getMessages?(): ExchangeMessage[];
    setMessages?(messages: ExchangeMessage[]): void;
  };

export interface SubmitPromptParams {
  prompt: string;
  messages: Message[];
  authInfo: AuthInfo;
  retries?: number;
} 