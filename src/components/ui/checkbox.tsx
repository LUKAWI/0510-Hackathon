import * as React from "react"
import { cn } from "@/lib/utils"

interface CheckboxProps
  extends Omit<React.ComponentProps<"input">, "type" | "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

function Checkbox({
  className,
  checked,
  defaultChecked,
  onCheckedChange,
  ...props
}: CheckboxProps) {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    onCheckedChange?.(event.target.checked);
  }

  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      checked={checked}
      defaultChecked={defaultChecked}
      onChange={handleChange}
      className={cn(
        "size-4 shrink-0 rounded-sm border border-primary ring-offset-background",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "accent-primary",
        className,
      )}
      {...props}
    />
  );
}

export { Checkbox }
export type { CheckboxProps }
