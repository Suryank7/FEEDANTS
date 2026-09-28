/**
 * CountdownBanner — Live countdown to registration deadline.
 * Updates every second using backend-provided timestamps.
 * Triggers a data refresh when countdown reaches zero.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';
import { getCountdown, formatCountdown } from '../utils/dateUtils';

export default function CountdownBanner({ targetDate, label, onExpire }) {
  const [countdown, setCountdown] = useState(getCountdown(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      const updated = getCountdown(targetDate);
      setCountdown(updated);

      if (updated.expired) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onExpire]);

  if (countdown.expired) return null;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.bellIcon}>🔔</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.countdown}>{formatCountdown(countdown)}</Text>
        <View style={styles.hurryBadge}>
          <Text style={styles.clockIcon}>⏰</Text>
          <Text style={styles.hurryText}>Hurry up!</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primaryDark,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bellIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  label: {
    color: Colors.textWhite,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  countdown: {
    color: Colors.textWhite,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
  },
  hurryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  clockIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  hurryText: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
});
