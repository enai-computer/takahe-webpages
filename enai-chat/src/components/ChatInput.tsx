import { twMerge } from "tailwind-merge";
// import { INPUT_STYLE_CONFIG } from "../utils/config";

export interface ChatInputProps {
  prompt: string;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (e: React.SyntheticEvent<HTMLTextAreaElement, Event>) => void;
  inputStyle: React.CSSProperties;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  inputFormRef: React.RefObject<HTMLFormElement>;
}

export function ChatInput({
  prompt,
  onSubmit,
  onInputChange,
  inputStyle,
  textareaRef,
  inputFormRef
}: ChatInputProps) {
  return (
    <form
      ref={inputFormRef}
      onSubmit={onSubmit}
      className="overflow-hidden relative rounded-lg shadow-enai-drop"
    >
      <div className="bg-white rounded-lg max-h-[300px] overflow-hidden">
        <textarea
          ref={textareaRef}
          rows={1}
          className={twMerge(
            "px-[20px] py-[15px] h-full focus:outline-none resize-none duration-200 font-signifier font-light outline-none w-full scrollbar-webkit-none"
          )}
          style={inputStyle}
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
  );
} 