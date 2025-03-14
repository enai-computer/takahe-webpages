import { Message, MessageType } from "../models";


export type MaraeMessageContent = MaraeChatMessageAppletContent | MaraeChatMessageTextContent;

export interface MaraeChatMessageAppletContent{
    applet_url: string;
    content: object;
}

export interface MaraeChatMessageTextContent{
    text: string;
}

export interface MaraeChatMessage{
    role: string;
    type: MessageType;
    content: MaraeMessageContent;
}

export function maraeAppletToMesssage(content: MaraeChatMessageAppletContent): Message {
    return {
        id: Math.random().toString(16).slice(2),
        isLoading: false,
        type: MessageType.Applet,
        content: {
            resourceUrl: content.applet_url,
            content: content.content
        }
    }
}
