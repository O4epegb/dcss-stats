import { useState } from 'react'

export const useSlicedList = <T>(items: Array<T>, max = 3) => {
  const [showAll, setShowAll] = useState(false)

  const additionalItemsCount = items.length - max
  // if there is only item 1 left in additional items
  // we'll show 1 item less in total instead
  const shouldShowLessThanMax = additionalItemsCount === 1
  const itemsToShow = showAll ? items : items.slice(0, shouldShowLessThanMax ? max - 1 : max)

  return {
    items: itemsToShow,
    extraItemsCount: items.length - itemsToShow.length,
    showAll,
    hasMore: showAll || itemsToShow.length < items.length,
    toggleShowAll: () => setShowAll((state) => !state),
  }
}
