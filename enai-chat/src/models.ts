
export enum ExchangeMessageRole {
  User = "user",
  Assistant = "assistant",
}
  
export interface ExchangeMessage {
  role: ExchangeMessageRole;
  content: string;
}
  
export interface AiModel {
  id: string;
  name: string;
  description: string;
  token_limit: number;
}
  
export interface AuthInfoDetails {
  userId: string;
  bearerToken: string;
}
  
export enum AuthInfoStatus {
  NotSet = "NOT_SET",
  Invalid = "INVALID",
  InUse = "IN_USE",
}

export type AuthInfo =
| {
    status: AuthInfoStatus.NotSet | AuthInfoStatus.Invalid;
    details: null;
  }
| {
    status: AuthInfoStatus.InUse;
    details: AuthInfoDetails;
  };

export enum MessageType {
  Prompt = "PROMPT",
  Response = "RESPONSE",
}

export interface Message {
  id: string;
  isLoading: boolean;
  type: MessageType;
  text: string;
}