# ---------- Build stage ----------
    FROM node:20-alpine AS build
    WORKDIR /app
    
    # copy package files first for cache; includes package-lock.json if present
    COPY package*.json ./
    
    # prefer npm ci for reproducible installs, fallback to npm install
    RUN npm ci --silent || npm install --silent
    
    # copy source and build
    COPY . .
    # use your normal npm build; if you want a custom output folder use --output-path
    RUN npm run build -- --configuration=production
    
    # ---------- Production stage ----------
    FROM nginx:alpine AS production
    
    # remove default nginx files
    RUN rm -rf /usr/share/nginx/html/*
    
    # copy built files (match whatever folder Angular produced under /app/dist/)
    # Use a wildcard to handle either dist/<projectName> or dist/browser
    COPY --from=build /app/dist/frontend-lotus-academy-angular/browser/ /usr/share/nginx/html/
    
    # simple nginx config with SPA fallback
    RUN rm /etc/nginx/conf.d/default.conf \
     && printf 'server {\n  listen 80;\n  server_name _;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf
    
    EXPOSE 80
    CMD ["nginx", "-g", "daemon off;"]