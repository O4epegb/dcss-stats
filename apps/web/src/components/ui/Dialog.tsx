import * as DialogPrimitive from '@radix-ui/react-dialog'
import { PropsWithChildren, ReactNode } from 'react'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogTitle = DialogPrimitive.Title

export const DialogContent = ({
  title,
  children,
}: PropsWithChildren<{
  title?: ReactNode
}>) => {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="data-[state=open]:animate-overlay-show fixed inset-0 z-10 bg-black/50" />
      <DialogPrimitive.Content
        aria-describedby={undefined}
        className="//w-[750px] //w-full data-[state=open]:animate-content-show fixed top-[50%] left-[50%] z-10 flex max-h-[85vh] max-w-[90vw] translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-sm bg-white text-gray-900 focus:outline-hidden dark:border dark:border-zinc-700 dark:bg-black dark:text-white"
      >
        <div className="relative flex items-center justify-between p-5">
          {title && (
            <DialogPrimitive.Title className="m-0 text-xl font-medium">
              {title}
            </DialogPrimitive.Title>
          )}
          <DialogPrimitive.Close asChild>
            <button
              aria-label="Close"
              className="flex size-6 appearance-none items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 focus:shadow-[0_0_0_2px] focus:shadow-gray-400 focus:outline-hidden"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </DialogPrimitive.Close>
        </div>
        {
          // remove aria-describedby={undefined} is description will be used
        }
        {/* <DialogPrimitive.Description className="text-gray-600 mt-[10px] mb-5 text-[15px] leading-normal">
            Description
          </DialogPrimitive.Description> */}
        <div className="overflow-y-auto px-5 pb-5">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
