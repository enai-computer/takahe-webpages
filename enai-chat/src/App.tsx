import {
  SyntheticEvent,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  memo,
  useMemo
} from "react";
// import Markdown from "react-markdown";
import { twMerge } from "tailwind-merge";
import { IconEveMark } from "./components/icons/IconEveMark";
import { Message, AiModel} from "./models";
import { ChatInput } from "./components/ChatInput";
import { ModelSelector } from "./components/ModelSelector";
import { ChatMessage } from "./components/ChatMessage";
import { API_VERSION, INPUT_STYLE_CONFIG, MOCK_WEBVIEW_ENV } from "./utils/config";
import { ModifiedWindow } from "./utils/types";
import { submitPropt } from "./api/chat";

export const API_BASE_URL = (): string => {
  const win = window as ModifiedWindow;
  return win.API_BASE_HOST + API_VERSION;
};

function App() {
  const [inspirationHtml, setInspirationHtml] = useState<string | null>(null);

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

  const [messages, setMessagesV2] = useState<Message[]>([]);
  const memoizedChatMessage = memo(ChatMessage);
  const [context, setContext] = useState<string[]>([]);
  const deferredInputStyle = useDeferredValue(inputStyle);

  // Add new state for managing dropdown
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<AiModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<AiModel>({
    id: "claude-3-5-sonnet", 
    name: "Claude 3.5 Sonnet", 
    description: "Anthropic's latest model.",
    token_limit: 75000
  });

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
    // win.setMessages = (exchangeMessages) => {
    //   setMessages(
    //     exchangeMessages.map((exchangeMessage) => {
    //       return {
    //         id: Math.random().toString(16).slice(2),
    //         isLoading: false,
    //         content: {
    //           text: exchangeMessage.content,
    //         },
    //         type:
    //           exchangeMessage.role === ExchangeMessageRole.User
    //             ? MessageType.Prompt
    //             : MessageType.TextResponse,
    //       };
    //     })
    //   );
    // };
    win.setMessagesV2 = (messages) => {
      setMessagesV2(messages);
    };
    win.setContext = (context) => {
      setContext(context);
    }
    win.setAvailableModels = (models) => setAvailableModels(models);

    if (MOCK_WEBVIEW_ENV.enabled) {
      win.API_BASE_HOST = MOCK_WEBVIEW_ENV.baseUrl;
      win.setAvailableModels(MOCK_WEBVIEW_ENV.availableModels);
      win.updateInfoModal(MOCK_WEBVIEW_ENV.inspiration);
    } else {
      /* @ts-expect-error webkit */
      // eslint-disable-next-line
      window.webkit.messageHandlers.en_ai_handler.postMessage({
        source: "enai-agent",
        version: 1,
        type: "request-history",
      });
      /* @ts-expect-error webkit */
      // eslint-disable-next-line
      window.webkit.messageHandlers.en_ai_handler.postMessage({
        source: "enai-agent",
        version: 1,
        type: "request-context",
        token_limit: selectedModel.token_limit,
      });
    }

    return () => {
      delete win.setMessages;
      delete win.setContext;
      delete win.updateInfoModal;
    };
  }, [selectedModel.token_limit]);

  useEffect(() => {
    const win = window as ModifiedWindow;
    win.getMessages = () => {
      return messages;
    };

    return () => {
      delete win.getMessages;
    };
  }, [messages]);

  const messagesList = useMemo(() => (
    <div className="space-y-5">
      {messages.map((message, i) => (
        <ChatMessage
          key={message.id}
          message={message}
          isFirst={i === 0}
        />
      ))}
    </div>
  ), [messages]); 

  return (
    <div className="h-dvh px-[8px] py-[12px] md:p-[80px] md:pt-0 flex justify-center">
      {messages.length <= 1 && (<div className="fixed inset-0 flex items-center justify-center -z-10">
        <IconEveMark className="text-sand-6" />
      </div>)}

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
          ) : messagesList
          }
        </div>

        <div>
          <ChatInput
            prompt={prompt}
            onSubmit={(e) => {
              e.preventDefault();
              e.currentTarget.querySelector("textarea")!.value = "";
              void submitPropt({ prompt, messages, selectedModel, context, abortControllerRef });
            }}
            onInputChange={onInputChange}
            inputStyle={deferredInputStyle}
            textareaRef={textareaRef}
            inputFormRef={inputFormRef}
          />

          <ModelSelector
            isOpen={isModelSelectorOpen}
            availableModels={availableModels}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            onRequestContext={(tokenLimit) => {
              if (!MOCK_WEBVIEW_ENV.enabled) {
                /* @ts-expect-error webkit */
                // eslint-disable-next-line
                window.webkit.messageHandlers.en_ai_handler.postMessage({
                  source: "enai-agent",
                  version: 1,
                  type: "request-context",
                  token_limit: tokenLimit,
                });
              }
            }}
            onToggle={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
