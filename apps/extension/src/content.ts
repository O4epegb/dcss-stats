import browser from 'webextension-polyfill'

import { webUrl } from './env'

type PlayerStats = {
  games: number
  wins: number
}

const webTilesTitle = 'WebTiles - Dungeon Crawl Stone Soup'

const formatPercent = (number: number) => number.toFixed(2).padStart(6, ' ')

const insertAfter = (newNode: Element, referenceNode: Element) => {
  referenceNode.parentNode?.insertBefore(newNode, referenceNode.nextSibling)
}

const isPlayerStats = (value: unknown): value is PlayerStats => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'games' in value &&
    typeof value.games === 'number' &&
    'wins' in value &&
    typeof value.wins === 'number'
  )
}

const addStatsColumn = (playerList: HTMLElement) => {
  if (!document.querySelector('.dcss-ext-th')) {
    const usernameHeader = document.querySelector('#player_list thead th.username')

    if (usernameHeader) {
      const statsHeader = document.createElement('th')
      statsHeader.classList.add('dcss-ext-th')
      statsHeader.textContent = 'Stats WR%/G/W'
      statsHeader.style.whiteSpace = 'nowrap'
      insertAfter(statsHeader, usernameHeader)
    }
  }

  playerList.querySelectorAll<HTMLTableCellElement>('td.username').forEach((usernameCell) => {
    const row = usernameCell.parentElement
    const name = usernameCell.querySelector('a')?.textContent?.trim()

    if (!row || !name) {
      return
    }

    let statsCell = row.querySelector<HTMLTableCellElement>('.dcss-ext-info')
    let statsContent = statsCell?.querySelector('span')

    if (!statsCell) {
      const firstCell = row.querySelector('td')
      if (!firstCell) {
        return
      }

      statsCell = document.createElement('td')
      statsCell.classList.add('dcss-ext-info')
      statsCell.style.whiteSpace = 'nowrap'
      insertAfter(statsCell, firstCell)

      statsContent = document.createElement('span')
      statsCell.append(statsContent)

      const link = document.createElement('a')
      link.textContent = '↗'
      link.href = `${webUrl}/players/${encodeURIComponent(name)}`
      link.target = '_blank'
      link.rel = 'noreferrer'
      link.style.textDecoration = 'none'
      link.style.display = 'inline-block'
      link.style.padding = '0 4px'
      statsCell.prepend(link)
    }

    void browser.runtime
      .sendMessage({ name })
      .then((response: unknown) => {
        if (!statsContent || !isPlayerStats(response)) {
          return
        }

        const { wins, games } = response
        statsContent.textContent = `${formatPercent((games ? wins / games : 0) * 100)}% ${games}/${wins}`
      })
      .catch(() => {
        if (statsContent) {
          statsContent.textContent = 'Unavailable'
        }
      })
  })
}

const main = () => {
  const existingPlayerList = document.querySelector<HTMLElement>('#player_list')
  if (existingPlayerList && document.title === webTilesTitle) {
    addStatsColumn(existingPlayerList)
  }

  const observer = new MutationObserver((mutationList) => {
    if (document.title !== webTilesTitle) {
      return
    }

    mutationList.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement && node.id === 'player_list') {
          addStatsColumn(node)
        }
      })
    })
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main, { once: true })
} else {
  main()
}
