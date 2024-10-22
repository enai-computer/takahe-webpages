import {
  SyntheticEvent,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
import Markdown from "react-markdown";
import { twMerge } from "tailwind-merge";
import { IconEveMark } from "./components/icons/IconEveMark";

type ModifiedWindow = Window &
  typeof globalThis & {
    API_BASE_URL: string;
    updateInfoModal?(innerHtml: string): void;
    updateAuthDetails?(details: AuthDetails): void;
  };

interface AuthDetails {
  userId: string;
  bearerToken: string;
}

enum AuthDetailsStatus {
  NotSet = "NOT_SET",
  Invalid = "INVALID",
  InUse = "IN_USE",
}

enum MessageType {
  Prompt = "PROMPT",
  Response = "RESPONSE",
}

interface Message {
  id: string;
  isLoading: boolean;
  type: MessageType;
  text: string;
}

/**
 * @dev If you are testing this web app
 * without the Enai wrapper around it,
 * set this to `enabled: true`.
 * It will then mock the necessary `window`
 * function calls.
 */
const MOCK_WEBVIEW_ENV = {
  enabled: false,
  baseUrl: "http://0.0.0.0:80/v1/",
  inspiration:
    "Balancing sweet, salty, sour, bitter, and umami flavors is key to making delicious and memorable dishes.",
  authDetails: {
    userId: "38db32a3-ef9b-40dd-a5fb-cd9ab4776016",
    bearerToken: "test",
  } satisfies AuthDetails,
} as const;

/** Max messages to send to the backend as context. */
const MAX_CONTEXT_MESSAGES_LENGTH = 20;

const INPUT_STYLE_CONFIG = {
  maxHeight: 300,
  initialHeight: 57,
  lineHeight: {
    normal: 27,
    small: 24,
  },
  fontSize: {
    normal: 21,
    small: 18,
  },
} as const;

function App() {
  const [inspirationHtml, setInspirationHtml] = useState<string | null>(null);
  const [authDetails, setAuthDetails] = useState<
    | {
        status: AuthDetailsStatus.NotSet | AuthDetailsStatus.Invalid;
        details: null;
      }
    | {
        status: AuthDetailsStatus.InUse;
        details: AuthDetails;
      }
  >({ status: AuthDetailsStatus.NotSet, details: null });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputFormRef = useRef<HTMLFormElement>(null);

  const [isChatAttached, setIsChatAttached] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [inputStyle, setInputStyle] = useState({
    fontSize: `${INPUT_STYLE_CONFIG.fontSize.normal}px`,
    lineHeight: `${INPUT_STYLE_CONFIG.lineHeight.normal}px`,
  });

  const [messages, setMessages] = useState<Message[]>([]);

  const deferredInputStyle = useDeferredValue(inputStyle);

  /**
   * @returns Either the new auth details, or `false` in case it failed.
   */
  const waitForAuthDetails = async (): Promise<AuthDetails | false> => {
    const TIME_LIMIT_MS = 10_000;

    /* @ts-expect-error webkit */
    // eslint-disable-next-line
    window.webkit.messageHandlers.callbackHandler.postMessage({
      source: "enai-agent",
      version: 1,
      type: "token-request",
      "sub-type":
        authDetails.status === AuthDetailsStatus.NotSet ? "inital" : "refresh",
    });

    console.debug("Waiting for auth details now...");
    const details = (await Promise.race([
      new Promise((resolve) => {
        setTimeout(() => resolve(false), TIME_LIMIT_MS);
      }),
      new Promise((resolve) => {
        const win = window as ModifiedWindow;
        win.updateAuthDetails = (details: AuthDetails) => {
          resolve(details);

          win.updateAuthDetails = (details: AuthDetails) =>
            setAuthDetails({ status: AuthDetailsStatus.InUse, details });
        };
      }),
    ])) as AuthDetails | false;
    console.debug(
      details ? "Received auth details" : "Did not receive auth details in time"
    );
    if (details) {
      setAuthDetails({
        status: AuthDetailsStatus.InUse,
        details: details,
      });
    }
    return details;
  };

  const submitPropt = async (
    prompt: string,
    messages: Message[],
    retries = 0
  ) => {
    const MAX_RETRIES = 2;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const sanitizedPrompt = prompt.replace(/^\n+|\n+$/g, "");

    const messagesIds = {
      prompt: Math.random().toString(16).slice(2),
      response: Math.random().toString(16).slice(2),
    };
    const resultMessages = [
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
        text: sanitizedPrompt,
      },
      {
        id: messagesIds.response,
        isLoading: true,
        type: MessageType.Response,
        text: "",
      },
    ];
    setMessages(resultMessages);

    const setFailureMessages = () => {
      setMessages((messages) => {
        for (const message of messages) {
          if (message.id === messagesIds.response) {
            message.isLoading = false;
            message.text = "[Could not get answer. Please try again.]";
            break;
          }
        }
        return [...messages];
      });
    };

    let lastAuthDetails = authDetails;
    if (lastAuthDetails.status !== AuthDetailsStatus.InUse) {
      const details = await waitForAuthDetails();
      if (!details) {
        setFailureMessages();
        return;
      }
      lastAuthDetails = { status: AuthDetailsStatus.InUse, details };
    }

    const win = window as ModifiedWindow;

    try {
      const res = await fetch(
        `${win.API_BASE_URL}${lastAuthDetails.details.userId}/answer`,
        {
          signal: abortControllerRef.current.signal,
          method: "POST",
          headers: new Headers({
            "Content-Type": "application/json",
            Authorization: `Bearer ${authDetails.details!.bearerToken}`,
          }),
          body: JSON.stringify({
            is_streaming: true,
            question: sanitizedPrompt,
            messages: messages
              .slice(messages.length - MAX_CONTEXT_MESSAGES_LENGTH)
              .map((message) => {
                return {
                  role: message.type === MessageType.Prompt ? "user" : "system",
                  content: message.text,
                };
              }),
          }),
        }
      );

      if (res.status === 401) {
        console.debug(
          "Retrying authentication, currently at",
          retries,
          "retries"
        );
        setAuthDetails({ status: AuthDetailsStatus.Invalid, details: null });
        if (retries >= MAX_RETRIES) {
          setFailureMessages();
          return;
        }
        return await submitPropt(
          prompt,
          messages.filter(
            (m) => m.id !== messagesIds.prompt && m.id !== messagesIds.response
          ),
          retries + 1
        );
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
          setMessages([...resultMessages]);
          break;
        }
        const text = new TextDecoder().decode(r.value);
        resultMessages[resultMessages.length - 1].text += text;
        setMessages([...resultMessages]);
        chunks.push(r.value);
      }
    } catch (e) {
      console.error("An error occurred while fetching the prompt response", e);
      setFailureMessages();
    }
  };

  useEffect(() => {
    if (!chatRef.current || !isChatAttached) return;
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, isChatAttached]);

  const adjustTextAreaHeight = () => {
    const PADDING_PX = 0;

    if (!textareaRef.current) return 0;
    textareaRef.current.style.height = "auto";
    const newHeight = Math.max(
      Math.min(
        textareaRef.current.scrollHeight + PADDING_PX,
        INPUT_STYLE_CONFIG.maxHeight
      ),
      INPUT_STYLE_CONFIG.initialHeight
    );
    textareaRef.current.parentElement!.style.height = newHeight + "px";
    textareaRef.current.style.height = "100%";
    return newHeight;
  };

  const onInputChange = (e: SyntheticEvent<HTMLTextAreaElement, Event>) => {
    /**
     * This is to prevent switching back and forth between the input styles.
     * (Font size gets decreased, textarea height also decreases.)
     */
    const GRACE_FONT_SIZE_SCROLL_DIFFERENCE_PX = 30;

    setPrompt(e.currentTarget.value);
    const newHeightPx = adjustTextAreaHeight();
    const isSmall =
      inputStyle.fontSize === INPUT_STYLE_CONFIG.fontSize.small + "px";
    if (
      isSmall &&
      newHeightPx >=
        INPUT_STYLE_CONFIG.maxHeight - GRACE_FONT_SIZE_SCROLL_DIFFERENCE_PX
    ) {
      return;
    }

    setInputStyle({
      fontSize:
        newHeightPx === INPUT_STYLE_CONFIG.maxHeight
          ? `${INPUT_STYLE_CONFIG.fontSize.small}px`
          : `${INPUT_STYLE_CONFIG.fontSize.normal}px`,
      lineHeight:
        newHeightPx === INPUT_STYLE_CONFIG.maxHeight
          ? `${INPUT_STYLE_CONFIG.lineHeight.small}px`
          : `${INPUT_STYLE_CONFIG.lineHeight.normal}px`,
    });
  };

  useEffect(() => {
    adjustTextAreaHeight();
  }, []);

  useEffect(() => {
    const win = window as ModifiedWindow;
    win.updateInfoModal = (innerHtml: string) => setInspirationHtml(innerHtml);
    win.updateAuthDetails = (details: AuthDetails) =>
      setAuthDetails({ status: AuthDetailsStatus.InUse, details });

    if (MOCK_WEBVIEW_ENV.enabled) {
      win.API_BASE_URL = MOCK_WEBVIEW_ENV.baseUrl;
      win.updateInfoModal(MOCK_WEBVIEW_ENV.inspiration);
      win.updateAuthDetails?.(MOCK_WEBVIEW_ENV.authDetails);
    }

    return () => {
      delete win.updateInfoModal;
      delete win.updateAuthDetails;
    };
  }, []);

  return (
    <div className="h-dvh px-[8px] py-[12px] md:p-[80px] md:pt-0 flex justify-center">
      <div className="fixed inset-0 flex items-center justify-center -z-10">
        <IconEveMark className="text-sand-6" />
      </div>

      <div className="w-full md:max-w-[700px] flex flex-col justify-between h-full">
        <div
          ref={chatRef}
          id="chat"
          className="overflow-y-auto mb-5 md:-ml-8 pl-[calc(2rem+8px)] pr-[8px] h-full scrollbar-styled"
          onScroll={(e) => {
            const GRACE_SCROLL_PX = 5;
            const isScrolledToBottom =
              Math.abs(
                e.currentTarget.scrollHeight -
                  e.currentTarget.scrollTop -
                  e.currentTarget.clientHeight
              ) < GRACE_SCROLL_PX;
            setIsChatAttached(isScrolledToBottom);
          }}
        >
          {messages.length === 0 ? (
            <p
              className={twMerge(
                "text-lg duration-200 mt-[30px] md:mt-[80px]",
                prompt ? "opacity-20" : ""
              )}
            >
              {inspirationHtml ? (
                <span dangerouslySetInnerHTML={{ __html: inspirationHtml }} />
              ) : (
                <span>Thinking...</span>
              )}
            </p>
          ) : (
            <div className="space-y-5">
              {messages.map((message, i) => {
                return (
                  <div
                    key={message.id}
                    className={twMerge(
                      "relative w-full",
                      message.type === MessageType.Prompt
                        ? "font-signifier text-[21px] leading-[27px] text-right tracking-[-.63px] italic font-light text-sand-11 pr-[3px]"
                        : "text-[17px] leading-[22px] tracking-[0.17px]",
                      i === 0 ? "mt-[30px] md:mt-[80px]" : ""
                    )}
                  >
                    {message.type === MessageType.Response ? (
                      <div className="absolute -ml-8 mt-1">
                        <IconEveMark
                          className={twMerge(
                            "w-7 duration-200",
                            message.isLoading
                              ? "text-birkin"
                              : i === messages.length - 1
                              ? "text-sand-9"
                              : "text-sand-6"
                          )}
                        />
                      </div>
                    ) : null}
                    {message.type === MessageType.Prompt ? (
                      <p className="whitespace-pre-wrap">{message.text}</p>
                    ) : (
                      <div className="response">
                        <Markdown>{message.text}</Markdown>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <form
            ref={inputFormRef}
            onSubmit={(e) => {
              e.preventDefault();
              e.currentTarget.querySelector("textarea")!.value = "";
              void submitPropt(prompt, messages);
            }}
            className="overflow-hidden relative"
          >
            <div className="bg-white rounded-lg max-h-[300px] overflow-hidden">
              <textarea
                ref={textareaRef}
                rows={1}
                className={twMerge(
                  "px-[20px] py-[15px] h-full focus:outline-none resize-none duration-200 font-signifier font-light outline-none w-full scrollbar-webkit-none"
                )}
                style={deferredInputStyle}
                placeholder="Ask Enai"
                onChange={onInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    inputFormRef.current?.requestSubmit();
                    e.preventDefault();
                    onInputChange(e);
                  }
                }}
              />
            </div>

            <div className="absolute right-0 bottom-0 flex items-center h-[57px]">
              <button
                type="submit"
                className={twMerge(
                  "duration-200 p-3 rounded-full h-6 w-6 flex justify-center items-center flex-shrink-0 mr-[20px]",
                  prompt ? "bg-birkin" : "bg-sand-7"
                )}
              >
                <svg
                  className={twMerge("flex-none ml-[1px] text-white")}
                  width="8"
                  height="13"
                  viewBox="0 0 8 13"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.09375 12.7273L0 11.6477L4.50284 7.14489V5.58239L0 1.09375L1.09375 0L7.45739 6.36364L1.09375 12.7273Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          </form>

          <div
            className={twMerge(
              "text-center mt-3 text-sm font-light text-sand-9 md:block hidden",

              /* Takes the text itself out of the flex alignment. */
              "-mb-[20px]"
            )}
          >
            Model: <strong className="font-medium">ChatGPT o1 (latest)</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
