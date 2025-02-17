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

export const MOCK_WEBVIEW_ENV = {
  enabled: true,
  baseUrl: 'http://127.0.0.1:8000', // Your backend's address
  availableModels: [/*...mock models array...*/],
  inspiration: '<p>Some inspirational message</p>',
  authDetails: { userId: '38db32a3-ef9b-40dd-a5fb-cd9ab4776016', bearerToken: 'your-token' }
}; 