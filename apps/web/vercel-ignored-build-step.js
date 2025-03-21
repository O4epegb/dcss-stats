if (process.env.VERCEL_GIT_COMMIT_MESSAGE.includes('[skip ci]')) {
  process.exit(0)
} else {
  process.exit(1)
}
