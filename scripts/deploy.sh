#!/bin/bash

# Script de deployment para Enterprise App
# Uso: ./scripts/deploy.sh [staging|production]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
PROJECT_NAME="fvx-enterprise"
BUILD_DIR="dist/fvx-enterprise"
TEMP_FILE="enterprise-app.tar.gz"

# Función para mostrar ayuda
show_help() {
    echo "🚀 Script de Deployment para Enterprise App"
    echo ""
    echo "Uso: $0 [ENVIRONMENT] [OPTIONS]"
    echo ""
    echo "ENVIRONMENTS:"
    echo "  staging     Deploy a servidor de staging"
    echo "  production  Deploy a servidor de producción"
    echo ""
    echo "OPTIONS:"
    echo "  -h, --help     Mostrar esta ayuda"
    echo "  -b, --build    Solo compilar sin hacer deploy"
    echo "  -s, --skip-build  Saltar compilación (usar build existente)"
    echo ""
    echo "Ejemplos:"
    echo "  $0 staging                    # Deploy completo a staging"
    echo "  $0 production --skip-build   # Deploy a producción sin compilar"
    echo "  $0 --build                   # Solo compilar"
}

# Función para log con colores
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} ${timestamp} - $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} ${timestamp} - $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} ${timestamp} - $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} ${timestamp} - $message"
            ;;
    esac
}

# Función para verificar dependencias
check_dependencies() {
    log "INFO" "Verificando dependencias..."
    
    if ! command -v npm &> /dev/null; then
        log "ERROR" "npm no está instalado"
        exit 1
    fi
    
    if ! command -v ng &> /dev/null; then
        log "ERROR" "Angular CLI no está instalado. Instálalo con: npm install -g @angular/cli"
        exit 1
    fi
    
    if [ ! -f "package.json" ]; then
        log "ERROR" "No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
        exit 1
    fi
    
    log "SUCCESS" "Todas las dependencias están disponibles"
}

# Función para compilar la aplicación
build_app() {
    log "INFO" "Iniciando compilación de la aplicación..."
    
    # Instalar dependencias si es necesario
    if [ ! -d "node_modules" ]; then
        log "INFO" "Instalando dependencias..."
        npm install
    fi
    
    # Limpiar build anterior
    if [ -d "$BUILD_DIR" ]; then
        log "INFO" "Limpiando build anterior..."
        rm -rf "$BUILD_DIR"
    fi
    
    # Compilar para producción
    log "INFO" "Compilando aplicación para producción..."
    ng build --configuration=production
    
    if [ $? -eq 0 ]; then
        log "SUCCESS" "Compilación completada exitosamente"
    else
        log "ERROR" "Error en la compilación"
        exit 1
    fi
}

# Función para crear archivo comprimido
create_package() {
    log "INFO" "Creando paquete de deployment..."
    
    if [ ! -d "$BUILD_DIR" ]; then
        log "ERROR" "No se encontró el directorio de build: $BUILD_DIR"
        exit 1
    fi
    
    # Crear archivo comprimido
    tar -czf "$TEMP_FILE" -C "$BUILD_DIR" .
    
    if [ $? -eq 0 ]; then
        log "SUCCESS" "Paquete creado: $TEMP_FILE"
        log "INFO" "Tamaño del paquete: $(du -h $TEMP_FILE | cut -f1)"
    else
        log "ERROR" "Error al crear el paquete"
        exit 1
    fi
}

# Función para deploy a servidor
deploy_to_server() {
    local environment=$1
    local server_config=""
    
    case $environment in
        "staging")
            server_config="staging"
            ;;
        "production")
            server_config="production"
            ;;
        *)
            log "ERROR" "Ambiente no válido: $environment"
            exit 1
            ;;
    esac
    
    log "INFO" "Iniciando deployment a $environment..."
    
    # Aquí puedes configurar los detalles de tu servidor
    # Por ahora, solo mostramos los comandos que se ejecutarían
    
    echo ""
    log "INFO" "Para completar el deployment, ejecuta estos comandos en tu servidor:"
    echo ""
    echo -e "${YELLOW}# 1. Subir archivo al servidor:${NC}"
    echo "scp $TEMP_FILE usuario@tu-servidor.com:/tmp/"
    echo ""
    echo -e "${YELLOW}# 2. En el servidor, ejecutar:${NC}"
    echo "ssh usuario@tu-servidor.com"
    echo "sudo mkdir -p /var/www/enterprise-app"
    echo "sudo tar -xzf /tmp/$TEMP_FILE -C /var/www/enterprise-app"
    echo "sudo chown -R www-data:www-data /var/www/enterprise-app"
    echo "sudo chmod -R 755 /var/www/enterprise-app"
    echo "sudo systemctl reload nginx"
    echo ""
    
    # Si tienes configuración SSH, puedes automatizar esto:
    # scp "$TEMP_FILE" "$server_config:/tmp/"
    # ssh "$server_config" "sudo tar -xzf /tmp/$TEMP_FILE -C /var/www/enterprise-app && sudo chown -R www-data:www-data /var/www/enterprise-app && sudo systemctl reload nginx"
}

# Función de limpieza
cleanup() {
    if [ -f "$TEMP_FILE" ]; then
        log "INFO" "Limpiando archivos temporales..."
        rm -f "$TEMP_FILE"
    fi
}

# Trap para limpieza en caso de error
trap cleanup EXIT

# Parsear argumentos
ENVIRONMENT=""
BUILD_ONLY=false
SKIP_BUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -b|--build)
            BUILD_ONLY=true
            shift
            ;;
        -s|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        staging|production)
            ENVIRONMENT=$1
            shift
            ;;
        *)
            log "ERROR" "Argumento desconocido: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validar argumentos
if [ "$BUILD_ONLY" = false ] && [ -z "$ENVIRONMENT" ]; then
    log "ERROR" "Debes especificar un ambiente (staging o production)"
    show_help
    exit 1
fi

# Ejecutar script principal
main() {
    log "INFO" "🚀 Iniciando script de deployment para $PROJECT_NAME"
    
    # Verificar dependencias
    check_dependencies
    
    # Compilar aplicación (si no se salta)
    if [ "$SKIP_BUILD" = false ]; then
        build_app
    else
        log "WARNING" "Saltando compilación - usando build existente"
        if [ ! -d "$BUILD_DIR" ]; then
            log "ERROR" "No se encontró build existente en $BUILD_DIR"
            exit 1
        fi
    fi
    
    # Si solo es build, terminar aquí
    if [ "$BUILD_ONLY" = true ]; then
        log "SUCCESS" "Compilación completada. Build disponible en: $BUILD_DIR"
        exit 0
    fi
    
    # Crear paquete
    create_package
    
    # Deploy a servidor
    deploy_to_server "$ENVIRONMENT"
    
    log "SUCCESS" "🎉 Proceso de deployment completado para $ENVIRONMENT"
    log "INFO" "Archivo de deployment: $TEMP_FILE"
}

# Ejecutar función principal
main
