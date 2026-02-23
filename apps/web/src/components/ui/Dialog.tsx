'use client'

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { PropsWithChildren, ReactNode } from 'react'
import { cn } from '~/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description
export const DialogClose = DialogPrimitive.Close

export const DialogContent = ({
  title,
  description,
  children,
  className,
  bodyClassName,
  backdropClassName,
  showCloseButton = true,
}: PropsWithChildren<{
  title?: ReactNode
  description?: ReactNode
  className?: string
  bodyClassName?: string
  backdropClassName?: string
  showCloseButton?: boolean
}>) => {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        className={cn(
          'fixed inset-0 z-10 bg-black/50 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0',
          backdropClassName,
        )}
      />
      <DialogPrimitive.Popup
        className={cn(
          'fixed inset-0 z-10 flex h-dvh max-h-dvh w-screen max-w-none flex-col overflow-hidden rounded-none bg-white text-gray-900 outline-hidden transition-all data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[85vh] sm:w-fit sm:max-w-[90vw] sm:min-w-[20rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-sm dark:border-zinc-700 dark:bg-black dark:text-white sm:dark:border',
          className,
        )}
      >
        {(title || description || showCloseButton) && (
          <div className="relative p-4 pb-0 sm:p-5 sm:pb-0">
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between gap-4">
                {title ? (
                  <DialogPrimitive.Title className="m-0 text-xl font-medium">
                    {title}
                  </DialogPrimitive.Title>
                ) : (
                  <div />
                )}
                {showCloseButton && (
                  <DialogPrimitive.Close
                    aria-label="Close"
                    className="flex size-6 appearance-none items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 focus:shadow-[0_0_0_2px] focus:shadow-gray-400 focus:outline-hidden"
                  >
                    <XMarkIcon className="size-5" />
                  </DialogPrimitive.Close>
                )}
              </div>
            )}
            {description ? (
              <DialogPrimitive.Description className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
        )}
        <div
          className={cn(
            'overflow-y-auto p-4 sm:p-5',
            (title || description || showCloseButton) && 'pt-3 sm:pt-4',
            bodyClassName,
          )}
        >
          {children}
        </div>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}
