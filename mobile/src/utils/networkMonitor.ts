/**
 * Network Status Monitor
 * Monitors internet connectivity and handles offline scenarios
 */

import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

class NetworkMonitor {
  private isOnline: boolean = true;
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private unsubscribe: (() => void) | null = null;

  // Initialize network monitoring
  initialize() {
    this.unsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Notify listeners of status change
      if (wasOnline !== this.isOnline) {
        console.log(`Network status changed: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}`);
        this.notifyListeners();

        // Show alert when going offline
        if (!this.isOnline) {
          Alert.alert(
            'No Internet Connection',
            'Please check your internet connection and try again.',
            [{ text: 'OK' }]
          );
        }
      }
    });
  }

  // Check if currently online
  getStatus(): boolean {
    return this.isOnline;
  }

  // Add listener for status changes
  addListener(callback: (isOnline: boolean) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  // Check connectivity before making request
  async checkBeforeRequest(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
    
    if (!this.isOnline) {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  }

  // Cleanup
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners.clear();
  }
}

export const networkMonitor = new NetworkMonitor();
export default networkMonitor;
