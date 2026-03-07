import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

interface AnimationConfig {
  duration?: number;
  delay?: number;
}

/**
 * Hook for fading in elements with optional upward movement
 * @param config - Animation configuration (duration, delay)
 * @returns Animated style object
 */
export function useFadeInAnimation(config: AnimationConfig = {}) {
  const { duration = 300, delay = 0 } = config;
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (delay > 0) {
      opacity.value = withDelay(delay, withTiming(1, { duration }));
      translateY.value = withDelay(delay, withTiming(0, { duration }));
    } else {
      opacity.value = withTiming(1, { duration });
      translateY.value = withTiming(0, { duration });
    }
  }, [duration, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return animatedStyle;
}

/**
 * Hook for screen fade in/out transitions
 * @param duration - Fade duration in milliseconds
 * @returns Animated style object
 */
export function useScreenFade(duration: number = 400) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration });
  }, [duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return animatedStyle;
}

/**
 * Hook for creating sequential fade-in animations for multiple elements
 * Each element fades in from top to bottom with automatic staggering
 * @param count - Number of animated elements
 * @param config - Animation configuration (duration, stagger delay between elements)
 * @returns Array of animated style objects, one per element
 */
export function useSequentialFadeIn(count: number, config: { duration?: number; stagger?: number; initialDelay?: number } = {}) {
  const { duration = 300, stagger = 100, initialDelay = 0 } = config;
  
  const animations = Array.from({ length: count }, (_, index) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);
    const delay = initialDelay + index * stagger;
    
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (delay > 0) {
        opacity.value = withDelay(delay, withTiming(1, { duration }));
        translateY.value = withDelay(delay, withTiming(0, { duration }));
      } else {
        opacity.value = withTiming(1, { duration });
        translateY.value = withTiming(0, { duration });
      }
    }, [duration, delay]);
    
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    }));
  });
  
  return animations;
}
