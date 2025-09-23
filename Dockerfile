FROM nginx:alpine

# Copiamos los archivos compilados de Angular
COPY dist/enterprise-app/browser /usr/share/nginx/html

# Copiamos la configuración de Nginx
COPY nginx.conf /etc/nginx/nginx.conf
