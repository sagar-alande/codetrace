# CodeTrace — production container image.
#
# App Runner's managed Node.js runtimes are unavailable for this account, so
# the app is deployed as a container image built here and pushed to ECR by
# .github/workflows/deploy.yml. The runtime stage needs no node_modules —
# scripts/serve.mjs is Node built-ins only.

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines these into the client bundle at build time. Both are the
# Supabase project URL and the public "publishable"/anon key — meant to ship
# to the browser and protected by row-level security, not secrets.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts

EXPOSE 8080
ENV PORT=8080

CMD ["node", "scripts/serve.mjs"]
