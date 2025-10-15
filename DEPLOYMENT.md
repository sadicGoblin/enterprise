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

---

# 🌐 Deployment Manual con Nginx

## 📋 Guía Paso a Paso para Subir Angular a Nginx

### 1. Compilar el Proyecto Angular

```bash
# En tu máquina local, dentro del proyecto
cd /Users/jmarquez/MyApps/fvx-project/fvx-enterprise

# Instalar dependencias (si no están instaladas)
npm install

# Compilar para producción
npm run build
# O específicamente:
ng build --configuration=production

# Esto genera la carpeta dist/fvx-enterprise/
```

### 2. Preparar Servidor con Nginx

#### Conectar al servidor:
```bash
ssh usuario@tu-servidor.com
```

#### Instalar Nginx:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx -y

# CentOS/RHEL
sudo yum install nginx -y
# o
sudo dnf install nginx -y

# Iniciar y habilitar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 3. Configurar Nginx para Angular

#### Crear configuración del sitio:
```bash
sudo nano /etc/nginx/sites-available/enterprise-app
```

#### Contenido del archivo de configuración:
```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    root /var/www/enterprise-app;
    index index.html;

    # Configuración para Angular SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Configuración para archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Configuración para API (si tienes backend)
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Configuración para WebSocket (si usas)
    location /ws/ {
        proxy_pass http://localhost:3000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Seguridad básica
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Logs
    access_log /var/log/nginx/enterprise-app.access.log;
    error_log /var/log/nginx/enterprise-app.error.log;
}
```

#### Habilitar el sitio:
```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/enterprise-app /etc/nginx/sites-enabled/

# Eliminar configuración por defecto (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

### 4. Subir Archivos al Servidor

#### 🌟 Opción A: Deployment desde GitHub (Recomendado)

Si ya tienes tu proyecto en GitHub, esta es la forma más eficiente:

```bash
# En el servidor
ssh usuario@tu-servidor.com

# Crear directorio de la aplicación
sudo mkdir -p /var/www/enterprise-app
cd /var/www/enterprise-app

# Clonar el repositorio
sudo git clone https://github.com/sadicGoblin/enterprise.git .

# Instalar Node.js y npm (si no están instalados)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version
npm --version

# Instalar Angular CLI globalmente
sudo npm install -g @angular/cli

# Instalar dependencias del proyecto
sudo npm install

# Compilar para producción
sudo npm run build

# Mover archivos compilados al directorio web
sudo cp -r dist/fvx-enterprise/* .

# Limpiar archivos innecesarios
sudo rm -rf dist node_modules src .git .github

# Configurar permisos
sudo chown -R www-data:www-data /var/www/enterprise-app
sudo chmod -R 755 /var/www/enterprise-app
```

#### Script de Deployment Automático desde GitHub:

```bash
# Crear script de deployment
sudo nano /usr/local/bin/deploy-from-github.sh
```

**Contenido del script:**

```bash
#!/bin/bash

# Script de deployment desde GitHub
set -e

APP_DIR="/var/www/enterprise-app"
BACKUP_DIR="/var/backups/enterprise-app"
GIT_REPO="https://github.com/sadicGoblin/enterprise.git"
BRANCH="main"  # Cambia a "develop" para staging
TEMP_DIR="/tmp/enterprise-deploy"

echo "🚀 Iniciando deployment desde GitHub..."

# Crear backup de la versión actual
if [ -d "$APP_DIR" ]; then
    echo "📦 Creando backup..."
    sudo mkdir -p $BACKUP_DIR
    sudo tar -czf $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz -C $APP_DIR . 2>/dev/null || true
    
    # Mantener solo los últimos 5 backups
    sudo find $BACKUP_DIR -name "backup-*.tar.gz" -type f | sort | head -n -5 | xargs -r sudo rm
fi

# Limpiar directorio temporal
echo "🧹 Limpiando directorio temporal..."
sudo rm -rf $TEMP_DIR
sudo mkdir -p $TEMP_DIR

# Clonar repositorio en directorio temporal
echo "📥 Clonando repositorio..."
sudo git clone --branch $BRANCH --single-branch $GIT_REPO $TEMP_DIR

# Cambiar al directorio temporal
cd $TEMP_DIR

# Instalar dependencias
echo "📦 Instalando dependencias..."
sudo npm ci --production=false

# Compilar aplicación
echo "🔨 Compilando aplicación..."
sudo npm run build

# Verificar que la compilación fue exitosa
if [ ! -d "dist/fvx-enterprise" ]; then
    echo "❌ Error: La compilación falló"
    exit 1
fi

# Crear directorio de aplicación si no existe
sudo mkdir -p $APP_DIR

# Limpiar directorio de aplicación
echo "🗑️ Limpiando directorio de aplicación..."
sudo rm -rf $APP_DIR/*

# Copiar archivos compilados
echo "📁 Copiando archivos compilados..."
sudo cp -r dist/fvx-enterprise/* $APP_DIR/

# Configurar permisos
echo "🔒 Configurando permisos..."
sudo chown -R www-data:www-data $APP_DIR
sudo chmod -R 755 $APP_DIR

# Limpiar directorio temporal
echo "🧹 Limpiando archivos temporales..."
sudo rm -rf $TEMP_DIR

# Verificar configuración de Nginx
echo "✅ Verificando configuración de Nginx..."
sudo nginx -t

# Recargar Nginx
echo "🔄 Recargando Nginx..."
sudo systemctl reload nginx

# Verificar que la aplicación responde
echo "🌐 Verificando aplicación..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
    echo "✅ Aplicación desplegada exitosamente"
else
    echo "⚠️ Advertencia: La aplicación podría no estar respondiendo correctamente"
fi

echo "🎉 Deployment completado!"
echo "📊 Estadísticas:"
echo "   - Directorio: $APP_DIR"
echo "   - Backup en: $BACKUP_DIR"
echo "   - Rama desplegada: $BRANCH"
echo "   - Fecha: $(date)"
```

**Hacer ejecutable el script:**

```bash
sudo chmod +x /usr/local/bin/deploy-from-github.sh
```

**Uso del script:**

```bash
# Deployment desde rama main (producción)
sudo /usr/local/bin/deploy-from-github.sh

# Para usar rama develop (staging), editar el script y cambiar BRANCH="develop"
```

#### Automatización con Webhook (Opcional)

Puedes configurar un webhook para deployment automático cuando haces push:

```bash
# Instalar webhook listener
sudo apt install webhook -y

# Crear configuración de webhook
sudo nano /etc/webhook.conf
```

**Configuración del webhook:**

```json
[
  {
    "id": "deploy-enterprise",
    "execute-command": "/usr/local/bin/deploy-from-github.sh",
    "command-working-directory": "/var/www",
    "response-message": "Deployment iniciado",
    "trigger-rule": {
      "match": {
        "type": "payload-hash-sha1",
        "secret": "tu-secreto-webhook",
        "parameter": {
          "source": "header",
          "name": "X-Hub-Signature"
        }
      }
    }
  }
]
```

**Iniciar servicio webhook:**

```bash
# Crear servicio systemd
sudo nano /etc/systemd/system/webhook.service
```

```ini
[Unit]
Description=Small server for creating HTTP endpoints (hooks)
ConditionPathExists=/usr/bin/webhook
After=network.target

[Service]
Type=simple
User=webhook
Group=webhook
ExecStart=/usr/bin/webhook -nopanic -hooks /etc/webhook.conf -verbose
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=webhook
KillMode=mixed
KillSignal=SIGINT

[Install]
WantedBy=multi-user.target
```

```bash
# Habilitar y iniciar servicio
sudo systemctl enable webhook
sudo systemctl start webhook

# Configurar firewall
sudo ufw allow 9000
```

#### Opción B: Usando SCP
```bash
# En tu máquina local
cd /Users/jmarquez/MyApps/fvx-project/fvx-enterprise

# Comprimir archivos compilados
tar -czf enterprise-app.tar.gz -C dist/fvx-enterprise .

# Subir al servidor
scp enterprise-app.tar.gz usuario@tu-servidor.com:/tmp/

# En el servidor
ssh usuario@tu-servidor.com
sudo mkdir -p /var/www/enterprise-app
sudo tar -xzf /tmp/enterprise-app.tar.gz -C /var/www/enterprise-app
sudo chown -R www-data:www-data /var/www/enterprise-app
sudo chmod -R 755 /var/www/enterprise-app
```

#### Opción B: Usando rsync (más eficiente)
```bash
# En tu máquina local
rsync -avz --delete dist/fvx-enterprise/ usuario@tu-servidor.com:/tmp/enterprise-app/

# En el servidor
ssh usuario@tu-servidor.com
sudo mkdir -p /var/www/enterprise-app
sudo rsync -av /tmp/enterprise-app/ /var/www/enterprise-app/
sudo chown -R www-data:www-data /var/www/enterprise-app
sudo chmod -R 755 /var/www/enterprise-app
```

#### Opción C: Usando Git (recomendado para CI/CD)
```bash
# En el servidor
sudo mkdir -p /var/www/enterprise-app
cd /var/www/enterprise-app

# Clonar repositorio
sudo git clone https://github.com/sadicGoblin/enterprise.git .

# Instalar dependencias y compilar
sudo npm install
sudo npm run build

# Mover archivos compilados
sudo mv dist/fvx-enterprise/* .
sudo rm -rf dist node_modules src

# Permisos
sudo chown -R www-data:www-data /var/www/enterprise-app
sudo chmod -R 755 /var/www/enterprise-app
```

### 5. Configurar SSL con Let's Encrypt (Recomendado)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Verificar renovación automática
sudo certbot renew --dry-run
```

### 6. Script de Deployment Automático

#### Crear script de deployment:
```bash
sudo nano /usr/local/bin/deploy-enterprise.sh
```

#### Contenido del script:
```bash
#!/bin/bash

# Script de deployment para Enterprise App
set -e

APP_DIR="/var/www/enterprise-app"
BACKUP_DIR="/var/backups/enterprise-app"
GIT_REPO="https://github.com/sadicGoblin/enterprise.git"
BRANCH="main"

echo "🚀 Iniciando deployment de Enterprise App..."

# Crear backup
echo "📦 Creando backup..."
sudo mkdir -p $BACKUP_DIR
sudo tar -czf $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz -C $APP_DIR .

# Mantener solo los últimos 5 backups
sudo find $BACKUP_DIR -name "backup-*.tar.gz" -type f | sort | head -n -5 | xargs -r sudo rm

# Actualizar código
echo "📥 Actualizando código..."
cd $APP_DIR
sudo git fetch origin
sudo git reset --hard origin/$BRANCH

# Instalar dependencias
echo "📦 Instalando dependencias..."
sudo npm ci --production=false

# Compilar aplicación
echo "🔨 Compilando aplicación..."
sudo npm run build

# Mover archivos compilados
echo "📁 Moviendo archivos..."
sudo cp -r dist/fvx-enterprise/* .
sudo rm -rf dist node_modules/.cache

# Ajustar permisos
echo "🔒 Ajustando permisos..."
sudo chown -R www-data:www-data $APP_DIR
sudo chmod -R 755 $APP_DIR

# Verificar Nginx
echo "✅ Verificando configuración de Nginx..."
sudo nginx -t

# Recargar Nginx
echo "🔄 Recargando Nginx..."
sudo systemctl reload nginx

echo "🎉 Deployment completado exitosamente!"
echo "🌐 Tu aplicación está disponible en: https://tu-dominio.com"
```

#### Hacer ejecutable el script:
```bash
sudo chmod +x /usr/local/bin/deploy-enterprise.sh
```

### 7. Configurar Firewall

```bash
# Configurar UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verificar estado
sudo ufw status
```

### 8. Monitoreo y Logs

```bash
# Ver logs de Nginx
sudo tail -f /var/log/nginx/enterprise-app.access.log
sudo tail -f /var/log/nginx/enterprise-app.error.log

# Ver logs del sistema
sudo journalctl -u nginx -f

# Verificar estado de Nginx
sudo systemctl status nginx

# Verificar configuración
sudo nginx -t
```

### 9. Comandos de Mantenimiento

```bash
# Deployment manual
sudo /usr/local/bin/deploy-enterprise.sh

# Restaurar backup
sudo tar -xzf /var/backups/enterprise-app/backup-YYYYMMDD-HHMMSS.tar.gz -C /var/www/enterprise-app

# Limpiar caché de Nginx
sudo nginx -s reload

# Verificar espacio en disco
df -h

# Limpiar logs antiguos
sudo find /var/log/nginx -name "*.log" -type f -mtime +30 -delete
```

### 10. Troubleshooting

#### Problemas comunes:

1. **404 en rutas de Angular**:
   - Verificar `try_files $uri $uri/ /index.html;` en configuración de Nginx

2. **Archivos estáticos no cargan**:
   - Verificar permisos: `sudo chmod -R 755 /var/www/enterprise-app`
   - Verificar propietario: `sudo chown -R www-data:www-data /var/www/enterprise-app`

3. **Error 502 Bad Gateway**:
   - Verificar que Nginx esté corriendo: `sudo systemctl status nginx`
   - Verificar configuración: `sudo nginx -t`

4. **SSL no funciona**:
   - Renovar certificado: `sudo certbot renew`
   - Verificar configuración SSL en Nginx

#### Verificar deployment:
```bash
# Verificar que el sitio responde
curl -I https://tu-dominio.com

# Verificar configuración de Nginx
sudo nginx -T

# Verificar logs en tiempo real
sudo tail -f /var/log/nginx/enterprise-app.error.log
```

---

## 🎯 Resumen Rápido

1. **Compilar**: `npm run build`
2. **Subir archivos**: `scp` o `rsync` la carpeta `dist/fvx-enterprise/`
3. **Configurar Nginx**: Crear configuración para SPA
4. **SSL**: Usar Let's Encrypt con Certbot
5. **Automatizar**: Script de deployment
6. **Monitorear**: Logs de Nginx y sistema

**¡Tu aplicación Angular estará corriendo en producción con Nginx!** 🚀
