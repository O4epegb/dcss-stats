import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { XMLParser } from 'fast-xml-parser'
import { Metadata } from 'next'
import { cacheLife } from 'next/cache'
import { sharedOGMetadata } from '~/app/shared-metadata'
import { HeaderWithMenu } from '~/components/HeaderWithMenu'
import { defaultMetaTitle } from '~/constants'

const title = `Community | ${defaultMetaTitle}`

export const metadata: Metadata = {
  title,
  openGraph: {
    ...sharedOGMetadata,
    title,
  },
}

type CommunitySection = {
  title?: string
  links: {
    href: string
    label: string
    description: string
  }[]
}

type NewsItem = {
  title: string
  link: string
  pubDate?: string
}

const newsFeedUrl = 'https://crawl.develz.org/wordpress/category/news/feed'
const maxNewsItems = 7

type ParsedFeed = {
  rss?: {
    channel?: {
      item?: ParsedFeedItem | ParsedFeedItem[]
    }
  }
}

type ParsedFeedItem = {
  title?: string
  link?: string
  pubDate?: string
}

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&#x([\da-fA-F]+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

const parseFeed = (xml: string): NewsItem[] => {
  const parser = new XMLParser({
    ignoreAttributes: true,
    trimValues: true,
  })
  const parsed = parser.parse(xml) as ParsedFeed
  const itemsRaw = parsed.rss?.channel?.item

  if (!itemsRaw) {
    return []
  }

  const items = Array.isArray(itemsRaw) ? itemsRaw : [itemsRaw]

  const parsedItems: NewsItem[] = []

  for (const item of items) {
    const title = decodeHtmlEntities(item.title?.trim() ?? '')
    const link = item.link?.trim() ?? ''

    if (!title || !link) {
      continue
    }

    const pubDate = decodeHtmlEntities(item.pubDate?.trim() ?? '')

    parsedItems.push({
      title,
      link,
      pubDate: pubDate || undefined,
    })
  }

  return parsedItems.slice(0, maxNewsItems)
}

const getNewsItems = async () => {
  try {
    const response = await fetch(newsFeedUrl)

    if (!response.ok) {
      return []
    }

    const xml = await response.text()
    return parseFeed(xml)
  } catch {
    return []
  }
}

const sections: CommunitySection[] = [
  {
    links: [
      {
        label: 'Official website',
        href: 'https://crawl.develz.org/',
        description: 'Main DCSS homepage with downloads and general info.',
      },
      {
        label: 'Source code on GitHub',
        href: 'https://github.com/crawl/crawl',
        description: 'Source code repository and bug tracker.',
      },
      {
        label: 'News, blog and updates',
        href: 'https://crawl.develz.org/wordpress/blog/',
        description: 'Official news and development updates from the dev team.',
      },
      {
        label: 'DCSS Wiki',
        href: 'http://crawl.chaosforge.org/',
        description: 'The community-maintained wiki with mechanics and guides.',
      },
      {
        label: "Original Linley's Dungeon Crawl",
        href: 'http://dungeoncrawl.org/',
        description: 'The original version of the game.',
      },
    ],
  },
  {
    title: 'Community hubs',
    links: [
      {
        label: 'Roguelikes Discord (DCSS channels)',
        href: 'https://discord.gg/9pmFGKx',
        description: 'Active chat for DCSS discussions, advices, and memes.',
      },
      {
        label: 'DCSS Tavern forum',
        href: 'https://tavern.dcss.io/',
        description: 'Long-form discussion forum for strategy, feedback, and YASD.',
      },
      {
        label: 'r/dcss on Reddit',
        href: 'https://www.reddit.com/r/dcss/',
        description: 'Community posts, stories, and run highlights.',
      },
      {
        label: 'DCSS IRC channel',
        href: 'https://web.libera.chat/#crawl',
        description: 'Official IRC channel on Libera.Chat',
      },
    ],
  },
  {
    title: 'Tournaments and events',
    links: [
      {
        label: 'Tournament scoreboards',
        href: 'https://crawl.develz.org/tournament/',
        description: 'Official tournament standings and related pages.',
      },
      {
        label: 'Crawl Cosplay Challenge',
        href: 'https://www.crawlcosplay.org/',
        description: 'Community challenge focused on themed runs and progression.',
      },
    ],
  },
]

const CommunityPage = async () => {
  'use cache'

  cacheLife('days')

  const newsItems = await getNewsItems()

  return (
    <div className="container mx-auto flex min-h-screen max-w-6xl flex-col space-y-8 p-4">
      <HeaderWithMenu />

      <div className="w-full max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold lg:text-left">
                Dungeon Crawl Stone Soup Community
              </h2>
              <p className="text-zinc-500 lg:text-left dark:text-zinc-400">
                Useful links for official and community resources.
              </p>
            </div>

            <div className="space-y-6">
              {sections.map((section, index) => (
                <section key={section.title || index}>
                  {section.title && <h3 className="text-lg font-semibold">{section.title}</h3>}

                  <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {section.links.map((link) => (
                      <li key={link.href} className="py-2">
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-start justify-between gap-3 rounded-sm py-1"
                        >
                          <div>
                            <div className="font-medium group-hover:underline">{link.label}</div>
                            <div className="text-sm text-zinc-500 dark:text-zinc-400">
                              {link.description}
                            </div>
                          </div>
                          <ArrowTopRightOnSquareIcon className="mt-0.5 size-5 shrink-0" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>

          <aside className="space-y-3 lg:pl-6">
            <h3 className="text-lg font-semibold">Latest official news</h3>

            {newsItems.length > 0 ? (
              <ul className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
                {newsItems.map((item) => (
                  <li key={item.link} className="py-2">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline"
                    >
                      {item.title}
                    </a>
                    {item.pubDate && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{item.pubDate}</div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                News feed is unavailable.
              </div>
            )}

            <a
              href={newsFeedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm hover:underline"
            >
              RSS feed
              <ArrowTopRightOnSquareIcon className="size-4" />
            </a>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default CommunityPage
