import { useEffect } from 'react';
import { Platform } from 'react-native';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Pour le web
      window.frameworkReady?.();
    } else {
      // Pour mobile - remplacez par votre logique
      console.log('Framework ready on mobile');
    }
  }, []); // N'oubliez pas le tableau de dépendances !
}