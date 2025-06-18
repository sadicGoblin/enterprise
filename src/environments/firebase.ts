// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDC-BfxEZioD2VEgmjtQjrxiYD9ib7ulo4",
  authDomain: "inarco-web.firebaseapp.com",
  projectId: "inarco-web",
  storageBucket: "inarco-web.firebasestorage.app",
  messagingSenderId: "357886997164",
  appId: "1:357886997164:web:ce112e2dcd08659da4e509",
  measurementId: "G-HKFC1THJY2"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
