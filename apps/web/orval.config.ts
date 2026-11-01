import { defineConfig } from 'orval'

export default defineConfig({
  api: {
    input: '../api/openapi.json',
    output: {
      target: './src/api/generated/axios.ts',
      schemas: { path: './src/api/generated/models.ts', mode: 'single' },
      client: 'axios-functions',
      urlEncodeParameters: true,
      override: {
        header: false,
        mutator: { path: './src/api/request.ts', name: 'apiRequest' },
      },
    },
  },
})
