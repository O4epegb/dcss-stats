'use client'

import { ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { useEffect, useState, type ComponentType } from 'react'
import { Tooltip } from '~/components/ui/Tooltip'
import { selectableThemes, systemTheme, type SelectableThemeName } from '~/constants'

interface ThemeIconProps {
  className?: string
}

const CrawlThemeIcon = ({ className }: ThemeIconProps) => (
  <Image
    alt=""
    aria-hidden
    width={24}
    height={24}
    src="/stone-soup-icon.png"
    className={className}
  />
)

const themeIcons: Record<SelectableThemeName, ComponentType<ThemeIconProps>> = {
  light: SunIcon,
  dark: MoonIcon,
  crawl: CrawlThemeIcon,
  system: ComputerDesktopIcon,
}

export const ThemeSelector = ({ className }: { className?: string }) => {
  const [mounted, setMounted] = useState(false)
  const { theme, resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-6 w-6" />
  }

  const activeTheme = selectableThemes.find(({ name }) => name === theme) ?? systemTheme
  const activeThemeIndex = selectableThemes.indexOf(activeTheme)
  const nextTheme =
    selectableThemes[(activeThemeIndex + 1) % selectableThemes.length] ?? systemTheme
  const ThemeIcon = themeIcons[activeTheme.name]

  return (
    <Tooltip
      content={
        <div>
          Active theme: <b>{activeTheme.label}</b>{' '}
          {activeTheme.name === 'system' && `(${resolvedTheme})`}
          <hr className="my-1" />
          Click to switch to {nextTheme.label}
        </div>
      }
    >
      <button
        type="button"
        aria-label={`Switch from ${activeTheme.label} theme to ${nextTheme.label} theme`}
        className={className}
        onClick={() => setTheme(nextTheme.name)}
      >
        <ThemeIcon className="h-6 w-6" />
      </button>
    </Tooltip>
  )
}
