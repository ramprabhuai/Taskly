import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../utils/constants';

const CONFETTI_COLORS = [COLORS.primary, COLORS.accent, COLORS.success, COLORS.warning, '#FF69B4', '#00CED1'];
const PARTICLE_COUNT = 30;

interface ConfettiProps {
  visible: boolean;
  onComplete?: () => void;
}

export function ConfettiEffect({ visible, onComplete }: ConfettiProps) {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      x: new Animated.Value(Math.random() * 350),
      y: new Animated.Value(-20),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 8,
    }))
  ).current;

  useEffect(() => {
    if (!visible) return;
    const animations = particles.map((p) => {
      p.y.setValue(-20 - Math.random() * 50);
      p.x.setValue(Math.random() * 350);
      p.opacity.setValue(1);
      p.rotate.setValue(0);
      return Animated.parallel([
        Animated.timing(p.y, { toValue: 700, duration: 1500 + Math.random() * 500, useNativeDriver: true }),
        Animated.timing(p.rotate, { toValue: 360 * (Math.random() > 0.5 ? 1 : -1), duration: 1500, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(1000),
          Animated.timing(p.opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      ]);
    });
    Animated.stagger(30, animations).start(() => {
      onComplete?.();
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.confettiContainer} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: Math.random() > 0.5 ? p.size / 2 : 2,
              opacity: p.opacity,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { rotate: p.rotate.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

interface XPPopupProps {
  visible: boolean;
  xp: number;
  onComplete?: () => void;
}

export function XPPopup({ visible, xp, onComplete }: XPPopupProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    translateY.setValue(0);
    opacity.setValue(1);
    Animated.parallel([
      Animated.timing(translateY, { toValue: -80, duration: 1500, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    ]).start(() => onComplete?.());
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.xpPopup, { transform: [{ translateY }], opacity }]} pointerEvents="none">
      <Text style={styles.xpText}>+{xp} XP ⭐</Text>
    </Animated.View>
  );
}

interface BadgePopupProps {
  visible: boolean;
  badge: { icon: string; name: string; description: string } | null;
  onDismiss: () => void;
}

export function BadgeUnlockPopup({ visible, badge, onDismiss }: BadgePopupProps) {
  const slideY = useRef(new Animated.Value(300)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
      ]).start();
    } else {
      slideY.setValue(300);
      scale.setValue(0.5);
    }
  }, [visible]);

  if (!visible || !badge) return null;

  return (
    <View style={styles.badgeOverlay}>
      <Animated.View style={[styles.badgePopup, { transform: [{ translateY: slideY }, { scale }] }]}>
        <Text style={styles.badgePopupEmoji}>{badge.icon}</Text>
        <Text style={styles.badgePopupTitle}>Badge Unlocked!</Text>
        <Text style={styles.badgePopupName}>{badge.name}</Text>
        <Text style={styles.badgePopupDesc}>{badge.description}</Text>
        <Text style={styles.badgePopupXP}>+25 XP Bonus ⭐</Text>
        <View style={styles.badgePopupBtn}>
          <Text style={styles.badgePopupBtnText} onPress={onDismiss}>Awesome! 🎉</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
  },
  xpPopup: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 1001,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  xpText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
  },
  badgeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  badgePopup: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    maxWidth: 320,
  },
  badgePopupEmoji: { fontSize: 64 },
  badgePopupTitle: { fontSize: 14, color: COLORS.primary, fontWeight: '800', marginTop: 8, textTransform: 'uppercase', letterSpacing: 2 },
  badgePopupName: { fontSize: 24, fontWeight: '900', color: '#1A1A2E', marginTop: 4 },
  badgePopupDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8 },
  badgePopupXP: { fontSize: 16, color: COLORS.success, fontWeight: '800', marginTop: 12 },
  badgePopupBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingHorizontal: 32, paddingVertical: 14, marginTop: 20 },
  badgePopupBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});
