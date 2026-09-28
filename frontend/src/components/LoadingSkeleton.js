/**
 * LoadingSkeleton — displays shimmer placeholders while API data loads.
 * Prevents misleading default content per the spec.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

function SkeletonBlock({ width, height, borderRadius = 8, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: Colors.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
}

export default function LoadingSkeleton() {
  return (
    <View style={styles.container}>
      {/* Banner skeleton */}
      <SkeletonBlock width="100%" height={200} borderRadius={0} />

      <View style={styles.content}>
        {/* Title */}
        <SkeletonBlock width="80%" height={24} style={styles.block} />
        <SkeletonBlock width="50%" height={16} style={styles.block} />

        {/* Tags */}
        <View style={styles.row}>
          <SkeletonBlock width={70} height={28} borderRadius={14} />
          <SkeletonBlock width={90} height={28} borderRadius={14} style={{ marginLeft: 8 }} />
        </View>

        {/* Prize / Entry */}
        <View style={[styles.row, styles.block]}>
          <SkeletonBlock width="45%" height={60} />
          <SkeletonBlock width="45%" height={60} />
        </View>

        {/* Judge */}
        <View style={[styles.row, styles.block]}>
          <SkeletonBlock width={60} height={60} borderRadius={30} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <SkeletonBlock width="60%" height={16} />
            <SkeletonBlock width="80%" height={14} style={{ marginTop: 6 }} />
          </View>
        </View>

        {/* Countdown bar */}
        <SkeletonBlock width="100%" height={48} style={styles.block} />

        {/* Dates grid */}
        <SkeletonBlock width="40%" height={20} style={styles.block} />
        <View style={[styles.row, styles.block]}>
          <SkeletonBlock width="47%" height={80} />
          <SkeletonBlock width="47%" height={80} />
        </View>
        <View style={[styles.row, styles.block]}>
          <SkeletonBlock width="47%" height={80} />
          <SkeletonBlock width="47%" height={80} />
        </View>

        {/* Tabs */}
        <View style={[styles.row, styles.block]}>
          <SkeletonBlock width="30%" height={36} />
          <SkeletonBlock width="30%" height={36} style={{ marginLeft: 8 }} />
          <SkeletonBlock width="30%" height={36} style={{ marginLeft: 8 }} />
        </View>

        {/* Content block */}
        <SkeletonBlock width="100%" height={14} style={styles.block} />
        <SkeletonBlock width="90%" height={14} style={styles.block} />
        <SkeletonBlock width="95%" height={14} style={styles.block} />

        {/* Rewards */}
        <SkeletonBlock width="40%" height={20} style={styles.block} />
        {[1, 2, 3].map((i) => (
          <SkeletonBlock key={i} width="100%" height={40} style={styles.block} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
  },
  block: {
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
});
