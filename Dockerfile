FROM nginx:alpine AS production

# Copiar los archivos de build de Angular
COPY dist/ /usr/share/nginx/html

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Asegurar que nginx pueda leer los archivos (sin recrear usuario/grupo)
RUN chown -R nginx:nginx /usr/share/nginx/html

# Exponer el puerto
EXPOSE 80

# Ejecutar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
