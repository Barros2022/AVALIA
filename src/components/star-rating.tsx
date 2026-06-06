import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
  className?: string;
}

export function StarRating({ value, onChange, size = 28, readOnly = false, className }: StarRatingProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={cn(
            "transition-transform",
            !readOnly && "hover:scale-110 cursor-pointer",
            readOnly && "cursor-default",
          )}
          aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(
              "transition-colors",
              star <= Math.round(value)
                ? "fill-primary text-primary"
                : "fill-transparent text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}
