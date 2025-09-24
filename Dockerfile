# Etapa 1: Build de Angular
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# Etapa 2: Servir con Nginx
FROM nginx:alpine
COPY --from=build /app/dist/enterprise-app/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
