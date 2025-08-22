# Stage 1: build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY src ./src
COPY index.html ./
COPY public ./public
RUN npm ci && npm run build

# Stage 2: serve static files
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Provide SPA fallback
RUN printf "server {\n  listen 8080;\n  server_name _;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri /index.html;\n  }\n}\n" > /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]