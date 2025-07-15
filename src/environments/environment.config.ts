/**
 * Environment configuration interface
 * This defines the shape of all environment configuration objects
 */
export interface EnvironmentConfig {
  production: boolean;
  apiBaseUrl: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  };
}
