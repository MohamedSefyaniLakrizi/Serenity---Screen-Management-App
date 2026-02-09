import { useOnboardingStore } from '@/store/onboardingStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Dev overlay for testing onboarding and navigation flows
 * Only visible in development mode
 */
export function DevOverlay() {
  const [isVisible, setIsVisible] = useState(__DEV__);
  const { resetOnboarding } = useOnboardingStore();

  if (!__DEV__ || !isVisible) {
    return __DEV__ && !isVisible ? (
      <TouchableOpacity 
        style={styles.showButton}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.showButtonText}>🛠️</Text>
      </TouchableOpacity>
    ) : null;
  }

  const handleResetOnboarding = async () => {
    Alert.alert(
      'Reset Onboarding',
      'Clear onboarding and return to first screen?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'onboardingCompleted',
                'onboardingData',
                'fox',
                'userPreferences',
                'todayData',
                'appLimits',
                'categoryLimits',
                'streakData',
                '@app_groups',
                '@theme_mode',
              ]);
              // Use the store's reset method which will emit the event
              resetOnboarding();
              console.log('✅ Onboarding reset complete');
            } catch (error) {
              console.error('Error resetting onboarding:', error);
              Alert.alert('Error', 'Failed to reset onboarding');
            }
          },
        },
      ]
    );
  };

  const handleCheckStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem('onboardingCompleted');
      const data = await AsyncStorage.getItem('onboardingData');
      Alert.alert(
        'Onboarding Status',
        `Completed: ${completed}\n\nData exists: ${!!data}`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to check status');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛠️ Dev Tools</Text>
        <TouchableOpacity onPress={() => setIsVisible(false)} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={handleResetOnboarding}>
          <Text style={styles.buttonText}>🔄 Reset Onboarding</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={handleCheckStatus}>
          <Text style={[styles.buttonText, styles.buttonOutlineText]}>ℹ️ Check Status</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  buttons: {
    gap: 8,
  },
  button: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#4ECDC4',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonOutlineText: {
    color: '#FFFFFF',
  },
  showButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  showButtonText: {
    fontSize: 24,
  },
});
