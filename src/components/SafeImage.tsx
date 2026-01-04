import * as React from "react";

type SafeImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc?: string;
};

export function SafeImage({ fallbackSrc, onError, ...props }: SafeImageProps) {
  return (
    <img
      {...props}
      loading={props.loading ?? "lazy"}
      decoding={props.decoding ?? "async"}
      onError={(e) => {
        if (fallbackSrc && e.currentTarget.src !== fallbackSrc) {
          e.currentTarget.src = fallbackSrc;
        }
        onError?.(e);
      }}
    />
  );
}
