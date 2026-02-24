"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

const AppLabel = React.forwardRef<
    React.ElementRef<typeof LabelPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { required?: boolean }
>(({ className, required, children, ...props }, ref) => (
    <LabelPrimitive.Root
        ref={ref}
        className={cn(
            "text-[12px] font-semibold text-zinc-500 tracking-wider mb-1 px-1 flex items-center gap-1",
            className
        )}
        {...props}
    >
        {children}
        {required && <span className="text-red-500 text-sm">*</span>}
    </LabelPrimitive.Root>
));

AppLabel.displayName = "AppLabel";

export { AppLabel as AppLabel };
