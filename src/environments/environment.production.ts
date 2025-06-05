import { EnvironmentConfig } from './environment.config';

/**
 * Production environment configuration
 */
export const environment: EnvironmentConfig = {
  production: true,
  apiBaseUrl: 'http://raam-hosting.cl/apissoma',
  apis: {
    // Use full URLs for production to avoid proxy issues
    usuario: 'http://raam-hosting.cl/apissoma/ws/UsuarioSvcImpl.php',
    perfil: 'http://raam-hosting.cl/apissoma/ws/PerfilSvcImpl.php',
    // Add more API endpoints as needed
  },
  firebase: {
    apiKey: "AIzaSyDC-BfxEZioD2VEgmjtQjrxiYD9ib7ulo4",
    authDomain: "inarco-web.firebaseapp.com",
    projectId: "inarco-web",
    storageBucket: "inarco-web.firebasestorage.app",
    messagingSenderId: "357886997164",
    appId: "1:357886997164:web:ce112e2dcd08659da4e509",
    measurementId: "G-HKFC1THJY2"
  }
};
