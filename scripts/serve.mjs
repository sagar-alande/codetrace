// Production static server for the Vite build, used by `npm start` and by
// the container image. Zero runtime dependencies (Node built-ins only), so
// the production Docker image doesn't need node_modules at all. Binds to
// PORT (set by AWS App Runner, most other PaaS hosts, and container
// runtimes) and falls back to Vite's own default preview port for local use.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST_DIR = new URL('../dist/', import.meta.url)
const PORT = Number(process.env.PORT) || 4173

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

async function resolveFile(pathname) {
  // Strip any parent-directory segments before resolving under DIST_DIR.
  const safePath = normalize(pathname).replace(/^([/\\]?\.\.[/\\])+/, '/')
  const candidate = new URL('.' + safePath, DIST_DIR)
  if (!candidate.pathname.startsWith(DIST_DIR.pathname)) return null
  try {
    const info = await stat(candidate)
    return info.isDirectory() ? new URL('index.html', DIST_DIR) : candidate
  } catch {
    return null
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const filePath = (await resolveFile(url.pathname)) ?? new URL('index.html', DIST_DIR)

  try {
    const body = await readFile(filePath)
    const contentType = MIME_TYPES[extname(fileURLToPath(filePath))] ?? 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': contentType })
    res.end(body)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not found')
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`CodeTrace static server listening on http://0.0.0.0:${PORT}`)
})
