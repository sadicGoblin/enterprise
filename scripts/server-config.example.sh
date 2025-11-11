#!/bin/bash

# Configuración de servidores para deployment
# Copia este archivo como server-config.sh y configura tus servidores

# Configuración de Staging
STAGING_HOST="staging.tu-dominio.com"
STAGING_USER="deploy"
STAGING_PATH="/var/www/enterprise-app"
STAGING_SSH_KEY="~/.ssh/id_rsa"

# Configuración de Producción
PRODUCTION_HOST="tu-dominio.com"
PRODUCTION_USER="deploy"
PRODUCTION_PATH="/var/www/enterprise-app"
PRODUCTION_SSH_KEY="~/.ssh/id_rsa"

# Configuración de Nginx
NGINX_CONFIG_PATH="/etc/nginx/sites-available/enterprise-app"
NGINX_SERVICE="nginx"

# Configuración de backup
BACKUP_PATH="/var/backups/enterprise-app"
BACKUP_RETENTION_DAYS=7

# Configuración de logs
LOG_PATH="/var/log/nginx"
APP_LOG_FILE="enterprise-app"

# Función para ejecutar comandos remotos
remote_exec() {
    local host=$1
    local user=$2
    local ssh_key=$3
    local command=$4
    
    ssh -i "$ssh_key" "$user@$host" "$command"
}

# Función para subir archivos
upload_file() {
    local host=$1
    local user=$2
    local ssh_key=$3
    local local_file=$4
    local remote_path=$5
    
    scp -i "$ssh_key" "$local_file" "$user@$host:$remote_path"
}

# Función para deployment automático
auto_deploy() {
    local environment=$1
    local package_file=$2
    
    case $environment in
        "staging")
            HOST=$STAGING_HOST
            USER=$STAGING_USER
            PATH=$STAGING_PATH
            SSH_KEY=$STAGING_SSH_KEY
            ;;
        "production")
            HOST=$PRODUCTION_HOST
            USER=$PRODUCTION_USER
            PATH=$PRODUCTION_PATH
            SSH_KEY=$PRODUCTION_SSH_KEY
            ;;
        *)
            echo "Ambiente no válido: $environment"
            return 1
            ;;
    esac
    
    echo "🚀 Desplegando a $environment ($HOST)..."
    
    # Crear backup
    echo "📦 Creando backup..."
    remote_exec "$HOST" "$USER" "$SSH_KEY" "sudo mkdir -p $BACKUP_PATH && sudo tar -czf $BACKUP_PATH/backup-\$(date +%Y%m%d-%H%M%S).tar.gz -C $PATH ."
    
    # Subir archivo
    echo "📤 Subiendo archivos..."
    upload_file "$HOST" "$USER" "$SSH_KEY" "$package_file" "/tmp/"
    
    # Extraer y configurar
    echo "📁 Extrayendo archivos..."
    remote_exec "$HOST" "$USER" "$SSH_KEY" "sudo tar -xzf /tmp/$(basename $package_file) -C $PATH && sudo chown -R www-data:www-data $PATH && sudo chmod -R 755 $PATH"
    
    # Recargar Nginx
    echo "🔄 Recargando Nginx..."
    remote_exec "$HOST" "$USER" "$SSH_KEY" "sudo nginx -t && sudo systemctl reload nginx"
    
    # Limpiar archivos temporales
    echo "🧹 Limpiando..."
    remote_exec "$HOST" "$USER" "$SSH_KEY" "rm -f /tmp/$(basename $package_file)"
    
    echo "✅ Deployment completado en $environment"
}

# Función para verificar estado del servidor
check_server_status() {
    local environment=$1
    
    case $environment in
        "staging")
            HOST=$STAGING_HOST
            USER=$STAGING_USER
            SSH_KEY=$STAGING_SSH_KEY
            ;;
        "production")
            HOST=$PRODUCTION_HOST
            USER=$PRODUCTION_USER
            SSH_KEY=$PRODUCTION_SSH_KEY
            ;;
        *)
            echo "Ambiente no válido: $environment"
            return 1
            ;;
    esac
    
    echo "🔍 Verificando estado de $environment ($HOST)..."
    
    # Verificar conectividad
    if ! ssh -i "$SSH_KEY" -o ConnectTimeout=5 "$USER@$HOST" "echo 'Conexión exitosa'"; then
        echo "❌ No se puede conectar al servidor"
        return 1
    fi
    
    # Verificar Nginx
    if remote_exec "$HOST" "$USER" "$SSH_KEY" "sudo systemctl is-active nginx"; then
        echo "✅ Nginx está corriendo"
    else
        echo "❌ Nginx no está corriendo"
    fi
    
    # Verificar aplicación
    if remote_exec "$HOST" "$USER" "$SSH_KEY" "curl -s -o /dev/null -w '%{http_code}' http://localhost"; then
        echo "✅ Aplicación responde"
    else
        echo "❌ Aplicación no responde"
    fi
    
    # Mostrar logs recientes
    echo "📋 Logs recientes:"
    remote_exec "$HOST" "$USER" "$SSH_KEY" "sudo tail -n 5 $LOG_PATH/$APP_LOG_FILE.error.log"
}
