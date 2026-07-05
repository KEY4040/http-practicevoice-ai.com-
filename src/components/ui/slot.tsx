import { cloneElement, forwardRef, isValidElement } from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal Radix-style `Slot`: merges the component's props/className onto its
 * single child element. Lets `<Button asChild><Link/></Button>` render the link
 * with button styling. Kept dependency-free on purpose.
 */
export const Slot = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ children, className, ...props }, ref) => {
    if (!isValidElement(children)) return null;
    const child = children as React.ReactElement<Record<string, unknown>>;
    return cloneElement(child, {
      ...props,
      ...child.props,
      ref,
      className: cn(className, child.props.className as string | undefined),
    });
  }
);
Slot.displayName = "Slot";
