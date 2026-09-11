// Production static server for the Vite build, used by `npm start`.
// Reads PORT from the environment (set by AWS App Runner, most other
// PaaS hosts, and container runtimes) and falls back to Vite's own
// default preview port for local use.
import { preview } from 'vite'

const port = Number(process.env.PORT) || 4173

const server = await preview({
  preview: {
    host: true, // bind 0.0.0.0 so it's reachable from outside a container
    port,
    strictPort: true,
  },
})

server.printUrls()
