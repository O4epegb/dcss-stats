'use client'

import { useState, useEffect } from 'react'
import { getFavorites } from '~/screens/Player/utils'
import { List } from './List'

export const FavoritesList = () => {
  const [favorites, setFavorites] = useState<null | string[]>(null)

  useEffect(() => {
    setFavorites(getFavorites().split(',').filter(Boolean))
  }, [])

  return (
    <List
      title="Your favorites"
      placeholder={
        favorites && favorites.length === 0 ? (
          <div className="text-gray-400">
            Nobody added yet
            <div className="mt-1">
              Use <span className="font-medium">star</span> icon on player page next to their name
            </div>
            <div>Data is stored locally on your device</div>
          </div>
        ) : undefined
      }
      items={(favorites ?? []).map((name) => ({
        name,
      }))}
    />
  )
}
