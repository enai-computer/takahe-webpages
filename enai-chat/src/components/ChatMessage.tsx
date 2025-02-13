import Markdown from "react-markdown";
import { Message, MessageType } from "../models";
import { IconEveMark } from "./icons/IconEveMark";
import { twMerge } from "tailwind-merge";

interface ChatMessageProps {
  message: Message;
  isFirst: boolean;
}

export function ChatMessage({ message, isFirst }: ChatMessageProps) {
  return (
    <div
      className={twMerge(
        "relative w-full",
        message.type === MessageType.Prompt
          ? "font-signifier text-[21px] leading-[27px] text-right tracking-[-.63px] italic font-light text-sand-11 pr-[3px]"
          : "text-[17px] leading-[22px] tracking-[0.17px]",
        isFirst ? "mt-[30px] md:mt-[80px]" : ""
      )}
    >
      {message.type === MessageType.Response && (
        <div className="absolute -ml-8 mt-1">
          <IconEveMark
            className={twMerge(
              "w-7 duration-200",
              message.isLoading
                ? "text-birkin"
                : "text-sand-9"
            )}
          />
        </div>
      )}
      {message.type === MessageType.Prompt ? (
        <p className="whitespace-pre-wrap">{message.text}</p>
      ) : (
        <div className="response">
          <Markdown>{message.text}</Markdown>
        </div>
      )}
    </div>
  );
} 