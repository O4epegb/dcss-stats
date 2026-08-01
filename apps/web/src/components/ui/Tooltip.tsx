'use client'

import {
  arrow,
  autoUpdate as autoUpdateUtility,
  flip,
  FloatingPortal,
  offset,
  Placement,
  ReferenceType,
  safePolygon,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  UseHoverProps,
  useInteractions,
  useMergeRefs,
  useRole,
} from '@floating-ui/react'
import { useIsomorphicLayoutEffect, useUpdateEffect } from '@react-hookz/web'
import { AnimatePresence, motion } from 'framer-motion'
import { cloneElement, FC, ReactNode, useRef, useState, type JSX } from 'react'
import { XOR } from '~/types'
import { cn } from '~/utils'

export const HelpBubble: FC<{
  interactive?: boolean
  className?: string
  content: ReactNode
}> = ({ interactive, content, className }) => {
  return (
    <Tooltip interactive={interactive} content={content}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={cn('text-muted-foreground h-5 w-5', className)}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    </Tooltip>
  )
}

const arrowStyles = {
  top: { offsetSide: 'bottom', borderClassName: 'border-r border-b' },
  right: { offsetSide: 'left', borderClassName: 'border-b border-l' },
  bottom: { offsetSide: 'top', borderClassName: 'border-t border-l' },
  left: { offsetSide: 'right', borderClassName: 'border-t border-r' },
} as const

type Props = {
  content: ReactNode
  placement?: Placement
  trigger?: 'hover' | 'click'
  interactive?: boolean
  disabled?: boolean
  open?: boolean
  unstyled?: true
  autoUpdate?: boolean
  zIndex?: number
  className?: string
  onOpenChange?(open: boolean): void
} & Pick<UseHoverProps, 'delay' | 'restMs'> &
  XOR<
    {
      children: JSX.Element
    },
    {
      triggerElement: ReferenceType
    }
  >

export const Tooltip = ({
  children,
  content,
  triggerElement,
  open: propsOpen,
  unstyled,
  className,
  trigger = 'hover',
  placement = 'top',
  autoUpdate = true,
  interactive = false,
  disabled = false,
  zIndex = 1000,
  restMs = 50,
  delay = 150,
  onOpenChange,
}: Props) => {
  const arrowRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(propsOpen ?? false)

  useUpdateEffect(() => {
    if (propsOpen !== undefined) {
      setOpen(propsOpen)
    }
  }, [propsOpen])

  const {
    x,
    y,
    refs,
    strategy,
    context,
    placement: finalPlacement,
    middlewareData,
  } = useFloating({
    placement,
    open,
    middleware: [offset(6), flip(), shift({ padding: 16 }), arrow({ element: arrowRef })],
    whileElementsMounted: autoUpdate ? autoUpdateUtility : undefined,
    onOpenChange: (newOpen) => {
      setOpen(newOpen)
      onOpenChange?.(newOpen)
    },
  })

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useFocus(context),
    useRole(context, { role: 'tooltip' }),
    useDismiss(context),
    useClick(context, {
      enabled: trigger === 'click',
    }),
    useHover(context, {
      enabled: trigger === 'hover',
      restMs,
      delay:
        typeof delay === 'number'
          ? {
              open: delay,
              close: 0,
            }
          : delay,
      handleClose: interactive ? safePolygon({ blockPointerEvents: false }) : undefined,
    }),
  ])

  useIsomorphicLayoutEffect(() => {
    if (triggerElement) {
      refs.setReference(triggerElement)
    }
  }, [refs, triggerElement])

  const ref = useMergeRefs(
    triggerElement ? [refs.setReference] : [refs.setReference, (children as any).ref],
  )

  const { x: arrowX, y: arrowY } = middlewareData.arrow ?? {}
  const arrowSide = finalPlacement.split('-')[0] as keyof typeof arrowStyles
  const arrowStyle = arrowStyles[arrowSide]

  return (
    <>
      {children && cloneElement(children, getReferenceProps({ ref, ...children.props }))}
      <FloatingPortal>
        <AnimatePresence>
          {!disabled && open && content != null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              {...getFloatingProps({
                ref: refs.setFloating,
                className: cn(
                  !unstyled &&
                    'max-w-[calc(100vw-8px)] rounded-sm border border-tooltip-border bg-tooltip px-2 py-1.5 font-interface text-sm text-tooltip-foreground',
                  className,
                ),
                style: {
                  position: strategy,
                  top: y ?? 0,
                  left: x ?? 0,
                  zIndex,
                },
              })}
            >
              {content}
              {!unstyled && (
                <div
                  ref={arrowRef}
                  className={cn(
                    'border-tooltip-border bg-tooltip pointer-events-none absolute h-2 w-2 rotate-45',
                    arrowStyle.borderClassName,
                  )}
                  style={{
                    left: arrowX != null ? `${arrowX}px` : '',
                    top: arrowY != null ? `${arrowY}px` : '',
                    right: '',
                    bottom: '',
                    [arrowStyle.offsetSide]: '-5px',
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  )
}
