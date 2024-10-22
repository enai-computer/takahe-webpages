import { ComponentProps } from "react";

export const IconEveMark = (props: ComponentProps<"svg">) => {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="14" cy="4" r="4" fill="currentColor" />
      <circle cx="19" cy="12" r="4" fill="currentColor" />
      <circle cx="9" cy="12" r="4" fill="currentColor" />
      <rect x="11" y="17" width="6" height="10" rx="2" fill="currentColor" />
    </svg>
  );
};
