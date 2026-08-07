/**
 * Web Compatibility Component
 * Handles web-specific issues and optimizations
 */

import { Platform } from 'react-native';
import { useEffect } from 'react';

export const WebCompatibility = () => {
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Handle web-specific initialization
      console.log('🌐 Web platform detected - applying web optimizations');
      
      // Disable context menu on long press for better mobile feel
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });
      
      // Add mobile viewport meta tag if not present
      const viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1, shrink-to-fit=no';
        document.head.appendChild(meta);
      }
      
      // Add PWA-like behavior
      if ('serviceWorker' in navigator) {
        console.log('🔧 Service Worker support detected');
      }
    }
  }, []);

  return null;
};

export default WebCompatibility;