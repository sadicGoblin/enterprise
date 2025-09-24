# 🚀 Guía de Deployment Automático - Enterprise App

## 📋 Resumen
Sistema de CI/CD con GitHub Actions que automatiza el deployment desde la rama `develop` a staging y desde `main` a producción usando Docker.

## 🔧 Configuración Paso a Paso

### 1. Configurar Secretos en GitHub

Ve a tu repositorio: `https://github.com/sadicGoblin/enterprise/settings/secrets/actions`

#### Secretos Requeridos:

```bash
# Docker Hub
DOCKER_HUB_USERNAME=tu_usuario_dockerhub
DOCKER_HUB_ACCESS_TOKEN=tu_token_dockerhub

# Servidor Staging
STAGING_HOST=tu_servidor_staging.com
STAGING_USER=root
STAGING_SSH_KEY=-----BEGIN PRIVATE KEY-----...

# Servidor Producción
PRODUCTION_HOST=tu_servidor_prod.com
PRODUCTION_USER=root
PRODUCTION_SSH_KEY=-----BEGIN PRIVATE KEY-----...

# Opcional: Notificaciones Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### 2. Configurar Docker Hub

1. Crea cuenta en [Docker Hub](https://hub.docker.com)
2. Crea Access Token: `Account Settings > Security > New Access Token`
3. Crea repositorio: `tu_usuario/enterprise-app`

### 3. Configurar Servidor (VPS/Hostinger)

#### Instalar Docker en el servidor:
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Reiniciar sesión
sudo systemctl enable docker
sudo systemctl start docker
```

#### Configurar SSH Key:
```bash
# En tu máquina local
ssh-keygen -t rsa -b 4096 -C "deploy@enterprise-app"

# Copiar clave pública al servidor
ssh-copy-id -i ~/.ssh/id_rsa.pub usuario@tu_servidor.com

# Agregar clave privada a GitHub Secrets
cat ~/.ssh/id_rsa  # Copiar contenido completo
```

### 4. Configurar Dominios (Opcional)

#### Configurar Nginx Proxy Manager:
```bash
# En tu servidor
docker run -d \
  --name nginx-proxy-manager \
  -p 80:80 \
  -p 81:81 \
  -p 443:443 \
  -v nginx-data:/data \
  -v nginx-letsencrypt:/etc/letsencrypt \
  --restart unless-stopped \
  jc21/nginx-proxy-manager:latest
```

#### Configurar SSL:
- Accede a `http://tu_servidor:81`
- Usuario: `admin@example.com` / Password: `changeme`
- Configura proxy hacia `localhost:3000` (staging) y `localhost:4200` (prod)

## Flujo de Deployment

### Staging (rama develop):
1. Push a `develop` → Trigger automático
2. Tests → Build → Docker Image → Deploy a staging
3. URL: `http://staging.tu-dominio.com`

### Producción (rama main):
1. Merge `develop` → `main` → Trigger automático
2. Tests → Build → Docker Image → Deploy a producción
3. URL: `http://tu-dominio.com`

## 🛠 Comandos Útiles

### Desarrollo Local:
```bash
# Ejecutar con Docker
npm run docker:dev

# Build y ejecutar
npm run docker:build
npm run docker:run

# Parar contenedores
npm run docker:stop
```

### Monitoreo en Servidor:
```bash
# Ver logs
docker logs enterprise-app-prod -f

# Estado de contenedores
docker ps

# Reiniciar aplicación
docker restart enterprise-app-prod

# Limpiar imágenes viejas
docker system prune -af
```

## 🌍 Opciones de Hosting

### 1. VPS (Recomendado)
- **DigitalOcean**: $5-10/mes
- **Linode**: $5-10/mes
- **Vultr**: $5-10/mes

### 2. Hostinger VPS
- **Plan VPS 1**: $3.95/mes
- **Plan VPS 2**: $8.95/mes

### 3. Servidor Dedicado
- Para aplicaciones de alto tráfico
- Mayor control y recursos

## 🔒 Seguridad

### Configuraciones recomendadas:
```bash
# Firewall básico
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Configurar fail2ban
sudo apt install fail2ban -y
```

## 📊 Monitoreo

### Health Checks:
- Aplicación: `http://tu-dominio.com/health`
- Docker: Health check automático cada 30s

### Logs:
```bash
# Aplicación
docker logs enterprise-app-prod

# Nginx
docker exec enterprise-app-prod tail -f /var/log/nginx/access.log
```

## 🚨 Troubleshooting

### Problemas Comunes:

1. **Build falla**: Verificar Node.js version en workflow
2. **Deploy falla**: Verificar SSH keys y permisos
3. **App no carga**: Verificar proxy configuration en nginx.conf
4. **API no funciona**: Verificar configuración de `/ws/` proxy

### Rollback:
```bash
# En caso de problemas, rollback a versión anterior
docker pull tu_usuario/enterprise-app:prod-COMMIT_ANTERIOR
docker stop enterprise-app-prod
docker run -d --name enterprise-app-prod -p 80:80 tu_usuario/enterprise-app:prod-COMMIT_ANTERIOR
```

## 📈 Próximos Pasos

1. Configurar certificados SSL automáticos
2. Implementar base de datos con Docker
3. Configurar backup automático
4. Monitoreo con Prometheus/Grafana
5. Implementar staging environment
