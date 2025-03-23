'use client'

import { CheckIcon, ClipboardIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

let timeout: NodeJS.Timeout

export const BitcoinBlock = ({ wallet }: { wallet: string }) => {
  const [isCopied, setIsCopied] = useState(false)

  return (
    <div className="flex w-full items-center justify-center gap-4">
      <div
        className="block rounded-full border border-[#f7931a] px-6 py-3 font-medium text-[#f7931a]"
        style={{
          wordBreak: 'break-all',
        }}
      >
        <b className="select-none">BTC: </b>
        {wallet}
      </div>
      <button
        className="block shrink-0 rounded-full bg-[#f7931a] p-3 font-medium text-white transition-all"
        onClick={async () => {
          await navigator.clipboard.writeText(wallet ?? '')
          setIsCopied(true)
          clearTimeout(timeout)
          timeout = setTimeout(() => {
            setIsCopied(false)
          }, 2000)
        }}
      >
        {isCopied ? <CheckIcon className="size-5" /> : <ClipboardIcon className="size-5" />}
      </button>
    </div>
  )
}
