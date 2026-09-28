/**
 * RewardsSection — Prize breakdown table.
 * Displays prizes by position with appropriate icons.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

const POSITION_ICONS = {
  '1st Winner': '🏆',
  '2nd Winner': '🥈',
  '3rd Winner': '🥉',
  '4th Winner': '⭐',
  '5th Winner': '⭐',
  '6th Winner': '⭐',
};

export default function RewardsSection({ prizes = [], currency = 'INR' }) {
  if (!prizes.length) return null;

  const currencySymbol = currency === 'INR' ? '₹' : '$';

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Rewards</Text>
        <Text style={styles.allPositions}>(All Positions)</Text>
      </View>

      {prizes.map((prize, index) => (
        <View
          key={index}
          style={[
            styles.prizeRow,
            index < prizes.length - 1 && styles.prizeRowBorder,
          ]}
        >
          <View style={styles.prizeLeft}>
            <Text style={styles.prizeIcon}>
              {POSITION_ICONS[prize.position] || '⭐'}
            </Text>
            <Text style={styles.prizePosition}>{prize.position}</Text>
          </View>
          <Text style={styles.prizeAmount}>
            {currencySymbol} {prize.amount?.toLocaleString()}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  allPositions: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  prizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  prizeRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  prizeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prizeIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  prizePosition: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  prizeAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
});
