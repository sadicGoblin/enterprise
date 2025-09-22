# ---------------------------
# Stage 1: Build Angular App
# ---------------------------
  FROM node:20-alpine as build

  WORKDIR /app
  
  # Copiar package.json y package-lock.json
  COPY package*.json ./
  
  # Instalar todas las dependencias (dev + prod) para poder usar npx y Angular CLI
  RUN npm ci
  
  # Copiar todo el código fuente
  COPY . .
  
  # Compilar la app usando Angular CLI via npx
  RUN npx ng build --configuration production
  
  # ---------------------------
  # Stage 2: Nginx Production
  # ---------------------------
  FROM nginx:alpine as production
  
  # Copiar configuración personalizada de Nginx
  COPY nginx.conf /etc/nginx/nginx.conf
  
  # Copiar los archivos compilados de Angular
  COPY --from=build /app/dist/enterprise-app/browser /usr/share/nginx/html
  
  # Crear usuario nginx y asignar permisos
  RUN addgroup -g 1001 -S nginx && \
      adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx && \
      chown -R nginx:nginx /usr/share/nginx/html && \
      chown -R nginx:nginx /var/cache/nginx && \
      chown -R nginx:nginx /var/log/nginx && \
      chown -R nginx:nginx /etc/nginx/conf.d
  
  # Cambiar a usuario no root
  USER nginx
  
  # Exponer el puerto 4200
  EXPOSE 4200
  
  # Healthcheck opcional (puede comentar si no lo quieres)
  HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4200/ || exit 1
  
  # Iniciar Nginx
  CMD ["nginx", "-g", "daemon off;"]
  