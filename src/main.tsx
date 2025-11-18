import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Desregistrar service workers antigos que podem causar erros
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().catch((error) => {
        console.warn('Erro ao desregistrar service worker:', error);
      });
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
