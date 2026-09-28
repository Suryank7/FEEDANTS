/**
 * CompetitionStatus — Status indicator bar.
 * Shows the current lifecycle state (Upcoming, Live, Ended, etc.).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

const STATUS_CONFIG = {
  UPCOMING: {
    label: 'Coming Soon',
    bgColor: Colors.warningLight,
    textColor: '#B45309',
    icon: '📅',
  },
  REGISTRATION_OPEN: {
    label: 'Registration Open',
    bgColor: Colors.successLight,
    textColor: '#065F46',
    icon: '✅',
  },
  REGISTRATION_CLOSED: {
    label: 'Registration Closed',
    bgColor: Colors.errorLight,
    textColor: '#991B1B',
    icon: '🔒',
  },
  FULL: {
    label: 'No Spots Remaining',
    bgColor: Colors.errorLight,
    textColor: '#991B1B',
    icon: '🚫',
  },
  LIVE: {
    label: 'Competition is Live',
    bgColor: '#DBEAFE',
    textColor: '#1E40AF',
    icon: '🔴',
  },
  ENDED: {
    label: 'Competition Ended',
    bgColor: '#F3F4F6',
    textColor: '#6B7280',
    icon: '🏁',
  },
  DRAFT: {
    label: 'Draft',
    bgColor: '#F3F4F6',
    textColor: '#6B7280',
    icon: '📝',
  },
};

export default function CompetitionStatus({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;

  return (
    <View style={[styles.container, { backgroundColor: config.bgColor }]}>
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={[styles.label, { color: config.textColor }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
});
