# 🚀 Scripts de Deployment

Esta carpeta contiene scripts para automatizar el deployment de la aplicación Enterprise a servidores remotos con Nginx.

## 📁 Archivos

- `deploy.sh` - Script principal de deployment
- `server-config.example.sh` - Configuración de ejemplo para servidores
- `README.md` - Esta documentación

## 🔧 Configuración Inicial

### 1. Configurar Servidores

```bash
# Copiar archivo de configuración
cp scripts/server-config.example.sh scripts/server-config.sh

# Editar configuración con tus datos
nano scripts/server-config.sh
```

### 2. Configurar SSH

```bash
# Generar clave SSH (si no tienes)
ssh-keygen -t rsa -b 4096 -C "deploy@enterprise-app"

# Copiar clave pública al servidor
ssh-copy-id -i ~/.ssh/id_rsa.pub usuario@tu-servidor.com

# Verificar conexión
ssh usuario@tu-servidor.com
```

## 📋 Uso del Script de Deployment

### Comandos Básicos

```bash
# Compilar y hacer deployment a staging
./scripts/deploy.sh staging

# Compilar y hacer deployment a producción
./scripts/deploy.sh production

# Solo compilar (sin deployment)
./scripts/deploy.sh --build

# Deployment sin compilar (usar build existente)
./scripts/deploy.sh production --skip-build

# Mostrar ayuda
./scripts/deploy.sh --help
```

### Ejemplos de Uso

```bash
# Desarrollo típico
./scripts/deploy.sh staging                    # Deploy a staging para testing
./scripts/deploy.sh production                 # Deploy a producción cuando esté listo

# Deployment rápido
./scripts/deploy.sh staging --skip-build       # Usar build existente

# Solo compilar para verificar
./scripts/deploy.sh --build                    # Verificar que compila correctamente
```

## 🔄 Flujo de Trabajo Recomendado

1. **Desarrollo Local**
   ```bash
   ng serve  # Desarrollo local
   ```

2. **Testing en Staging**
   ```bash
   ./scripts/deploy.sh staging
   ```

3. **Deployment a Producción**
   ```bash
   ./scripts/deploy.sh production
   ```

## 🛠 Configuración del Servidor

### Estructura de Directorios en el Servidor

```
/var/www/enterprise-app/          # Aplicación
/var/backups/enterprise-app/      # Backups
/var/log/nginx/                   # Logs de Nginx
/etc/nginx/sites-available/       # Configuración de Nginx
```

### Comandos de Servidor Útiles

```bash
# Ver logs de la aplicación
sudo tail -f /var/log/nginx/enterprise-app.access.log
sudo tail -f /var/log/nginx/enterprise-app.error.log

# Verificar estado de Nginx
sudo systemctl status nginx
sudo nginx -t

# Recargar configuración
sudo systemctl reload nginx

# Ver backups disponibles
ls -la /var/backups/enterprise-app/

# Restaurar backup
sudo tar -xzf /var/backups/enterprise-app/backup-YYYYMMDD-HHMMSS.tar.gz -C /var/www/enterprise-app
```

## 🔒 Seguridad

### Permisos Recomendados

```bash
# Archivos de la aplicación
sudo chown -R www-data:www-data /var/www/enterprise-app
sudo chmod -R 755 /var/www/enterprise-app

# Scripts de deployment
chmod +x scripts/deploy.sh
chmod 600 scripts/server-config.sh  # Solo lectura para el propietario
```

### Configuración SSH

```bash
# En el servidor, configurar SSH para deployment
sudo nano /etc/ssh/sshd_config

# Agregar configuración segura:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

## 🐛 Troubleshooting

### Problemas Comunes

1. **Error de permisos SSH**
   ```bash
   chmod 600 ~/.ssh/id_rsa
   chmod 644 ~/.ssh/id_rsa.pub
   ```

2. **Error de compilación**
   ```bash
   # Limpiar node_modules y reinstalar
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Error de conexión al servidor**
   ```bash
   # Verificar conectividad
   ping tu-servidor.com
   ssh -v usuario@tu-servidor.com
   ```

4. **Nginx no recarga**
   ```bash
   # Verificar configuración
   sudo nginx -t
   
   # Ver logs de error
   sudo journalctl -u nginx -f
   ```

### Logs de Debug

```bash
# Ejecutar script con debug
bash -x scripts/deploy.sh staging

# Ver logs detallados del servidor
ssh usuario@tu-servidor.com "sudo journalctl -u nginx -n 50"
```

## 📊 Monitoreo

### Health Checks

```bash
# Verificar que la aplicación responde
curl -I https://tu-dominio.com

# Verificar SSL
curl -I https://tu-dominio.com

# Verificar tiempo de respuesta
curl -w "@curl-format.txt" -o /dev/null -s https://tu-dominio.com
```

### Archivo curl-format.txt para métricas:

```
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```

## 🔄 Automatización con CI/CD

Para integrar con GitHub Actions o GitLab CI, puedes usar estos scripts:

```yaml
# Ejemplo para GitHub Actions
- name: Deploy to staging
  run: ./scripts/deploy.sh staging

- name: Deploy to production
  run: ./scripts/deploy.sh production
  if: github.ref == 'refs/heads/main'
```

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs del script
2. Verifica la configuración del servidor
3. Consulta la documentación en `DEPLOYMENT.md`
4. Revisa los logs de Nginx en el servidor

---

**¡Happy Deploying!** 🚀
