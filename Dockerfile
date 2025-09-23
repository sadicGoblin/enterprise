FROM nginx:alpine AS production

# Copiar los archivos de build (ajusta la ruta según tu proyecto)
COPY dist/enterprise-app/browser/ /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf

RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
