# ---------------------------
# Stage 1: Build Angular App
# ---------------------------
  FROM node:20-alpine as build

  WORKDIR /app
  
  COPY package*.json ./
  
  # Instalar todas las dependencias (dev + prod) para Angular CLI
  RUN npm ci
  
  COPY . .
  
  # Build usando npx
  RUN npx ng build --configuration production
  
  # ---------------------------
  # Stage 2: Nginx Production
  # ---------------------------
  FROM nginx:alpine as production
  
  COPY nginx.conf /etc/nginx/nginx.conf
  COPY --from=build /app/dist/enterprise-app/browser /usr/share/nginx/html
  
  # Ajustar permisos para usuario existente nginx
  RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d
  
  # Usar usuario no root que ya existe
  USER nginx
  
  # Exponer el puerto 4200
  EXPOSE 4200
  
  HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4200/ || exit 1
  

  USER root
  CMD ["nginx", "-g", "daemon off;"]
  