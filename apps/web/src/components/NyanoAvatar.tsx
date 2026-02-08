import React from "react";
import type { ExpressionName, EyeVariant } from "@/lib/expression_map";
import { expressionImageUrl } from "@/lib/expression_map";
import { NYANO_IMAGE_WEBP_URL } from "@/lib/nyano_assets";

type Props = {
  variant?: EyeVariant;
  expression?: ExpressionName;
  size?: number;
  className?: string;
  alt?: string;
};

/**
 * Nyano avatar with expression support.
 * Displays the appropriate expression image based on variant + expression.
 * Falls back to the default Nyano image if the expression image fails to load.
 */
export function NyanoAvatar({
  variant = "eyeWhite",
  expression = "calm",
  size = 72,
  className = "",
  alt = "Nyano",
}: Props) {
  const [failed, setFailed] = React.useState(false);
  const prevExpression = React.useRef(expression);

  const url = failed ? NYANO_IMAGE_WEBP_URL : expressionImageUrl(variant, expression);

  // Reset failed state when expression changes
  React.useEffect(() => {
    if (prevExpression.current !== expression) {
      setFailed(false);
      prevExpression.current = expression;
    }
  }, [expression]);

  return (
    <div
      className={[
        "overflow-hidden rounded-2xl border border-surface-200 bg-surface-100",
        "shadow-soft-sm transition-all duration-300",
        className,
      ].join(" ")}
      style={{ width: size, height: size }}
      title={`${alt} (${expression})`}
    >
      {!failed ? (
        <img
          key={`${variant}-${expression}`}
          src={url}
          alt={`${alt} - ${expression}`}
          loading="lazy"
          className="h-full w-full object-contain transition-opacity duration-200"
          onError={() => setFailed(true)}
        />
      ) : (
        <img
          src={NYANO_IMAGE_WEBP_URL}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => {}}
        />
      )}
    </div>
  );
}
