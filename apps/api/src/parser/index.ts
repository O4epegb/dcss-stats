import { startFetchQueue } from './loader'
import { startParseQueue } from './reader'

export const startParsing = async () => {
  if (!process.env.DCSS_SKIP_PARSING) {
    startParseQueue()
  }

  if (!process.env.DCSS_SKIP_FETCHING) {
    startFetchQueue()
  }
}
