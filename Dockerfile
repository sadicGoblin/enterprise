# Etapa 1: Build de Angular
FROM node:20-alpine as build

WORKDIR /app

# Copiamos dependencias e instalamos todo (incluyendo devDependencies para poder usar npx)
COPY package*.json ./
RUN npm install

# Copiamos el resto del código
COPY . .

# Compilamos en modo producción
RUN npx ng build --configuration production

# Etapa 2: Imagen de producción con Nginx
FROM nginx:alpine as production

# Configuración de Nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos el build desde la etapa anterior
COPY --from=build /app/dist/enterprise-app/browser /usr/share/nginx/html

# Cambiamos permisos para el usuario de Nginx
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx && \
    chown -R nginx:nginx /usr/share/nginx/html

USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
