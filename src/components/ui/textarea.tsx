import * as React from 'react'
import { cn } from '~/lib/utils'

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentPropsWithoutRef<'textarea'>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      'min-h-[4rem] w-full rounded-md border px-3 py-2 text-sm',
      className
    )}
    {...props}
  />
))

Textarea.displayName = 'Textarea'

export { Textarea }
