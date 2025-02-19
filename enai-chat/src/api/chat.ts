import { AiModel } from "../models";
import { refreshAuth } from "./auth";
import { ModifiedWindow } from "../utils/types";
import { MessageType, Message } from "../models";
import { API_BASE_URL } from "../App";
import { authInfoStore } from "./auth";


export interface SubmitPromptParams {
    prompt: string;
    messages: Message[];
    selectedModel: AiModel;
    context: string[];
    abortControllerRef: React.MutableRefObject<AbortController | null>;
    retries?: number;
  } 

export const submitPropt = async ({
    prompt,
    messages,
    selectedModel,
    context,
    abortControllerRef,
    retries = 0,
  }: SubmitPromptParams): Promise<void> => {
    console.debug("Submitting prompt", prompt);
    const MAX_RETRIES = 2;
    const win = window as ModifiedWindow;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const sanitizedPrompt = prompt.replace(/^\n+|\n+$/g, "");

    const messagesIds = {
      prompt: Math.random().toString(16).slice(2),
      response: Math.random().toString(16).slice(2),
    };
    const resultMessages: Message[] = [
      ...messages.map((message) => {
        return {
          ...message,
          isLoading: false,
        };
      }),
      {
        id: messagesIds.prompt,
        isLoading: false,
        type: MessageType.Prompt,
        content: {
          text: sanitizedPrompt,
        },
      },
      {
        id: messagesIds.response,
        isLoading: true,
        type: MessageType.Text,
        content: {
          text: "",
        },
      },
    ];
    win.setMessagesV2?.(resultMessages);

    const setFailureMessages = () => {
        const updatedMessages = resultMessages.map(message => {
            if (message.id === messagesIds.response) {
              return {
                ...message,
                isLoading: false,
                content: { text: "[Could not get answer. Please try again.]" }
              };
            }
            return message;
          });
          win.setMessagesV2?.(updatedMessages);
    };

    const handleAuthFailure = async () => {
      console.debug(
        "Retrying authentication, currently at",
        retries,
        "retries"
      );
      if (retries >= MAX_RETRIES) {
        setFailureMessages();
        return;
      }
      
      await refreshAuth();
      
      return await submitPropt({
        prompt,
        messages: messages.filter(
          (m) => m.id !== messagesIds.prompt && m.id !== messagesIds.response
        ),
        selectedModel,
        context,
        abortControllerRef,
        retries: retries + 1,
      });
    };

    // ensure auth info is set
    let lastAuthInfo = authInfoStore.getState().authInfo;
    if (lastAuthInfo.details === null) {
      const success = await refreshAuth();
      if (!success) {
        return await handleAuthFailure();
      }
      lastAuthInfo = authInfoStore.getState().authInfo;
    }

    // fetching title of the chat
    if (messages.length <= 1) {
      try {
        const res = await fetch(
          `${API_BASE_URL()}/${lastAuthInfo.details!.userId}/title?prompt=${encodeURIComponent(sanitizedPrompt)}`,
          {
            signal: abortControllerRef.current.signal,
            method: "GET",
            headers: new Headers({
              Authorization: `Bearer ${lastAuthInfo.details!.bearerToken}`,
            })
          }
        );
        if (res.status === 401) {
          return await handleAuthFailure();
        }
        if (res.ok && res.body) {
          const title = (await res.text()).trim().replace(/^"|"$/g, "");
          document.title = title;
        }
      } catch (error) {
        console.error(
          "An error occurred while fetching a title for the users query",
          error
        );
      }
    }
    // fetching response to user question
    try {
      const win = window as ModifiedWindow;
      const res = await fetch(
        `${win.API_BASE_HOST + "/v2"}/${lastAuthInfo.details!.userId}/chat`,
        {
          signal: abortControllerRef.current.signal,
          method: "POST",
          headers: new Headers({
            "Content-Type": "application/json",
            Authorization: `Bearer ${lastAuthInfo.details!.bearerToken}`,
          }),
          body: JSON.stringify({
            question: sanitizedPrompt,
            model_id: selectedModel.id,
            context: context.map(con => ({
              "type": "website",
              "content": con
            })),
            messages: messages.map(m => ({
              role: m.type === MessageType.Prompt ? "user" : "assistant",
            //   type: m.type,
              content: m.content
            })),
          }),
        }
      );

      if (res.status === 401) {
        return await handleAuthFailure();
      }

      if (!res.ok || !res.body) {
        setFailureMessages();
        return;
      }

      const reader = res.body.getReader();
      const chunks = [];

      while (true) {
        const r = await reader.read();
        if (r.done) {
          resultMessages[resultMessages.length - 1].isLoading = false;
          win.setMessagesV2?.([...resultMessages]);
          break;
        }
        const text = new TextDecoder().decode(r.value);

        if ('text' in resultMessages[resultMessages.length - 1].content) {
            (resultMessages[resultMessages.length - 1].content as { text: string }).text += text;
        }
        win.setMessagesV2?.([...resultMessages]);
        chunks.push(r.value);
      }
    } catch (e) {
      console.error("An error occurred while fetching the prompt response", e);
      setFailureMessages();
    }
  };