import { EnvironmentConfig } from './environment.config';

/**
 * Development environment configuration
 */
export const environment: EnvironmentConfig = {
  production: false,
  apiBaseUrl: 'https://inarco-ssoma.favric.cl',
  apis: {
    usuario: '/ws/UsuarioSvcImpl.php',
    perfil: '/ws/PerfilSvcImpl.php',
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


