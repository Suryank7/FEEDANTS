/**
 * CompetitionInfo — Prize pool, entry fee, and availability bar.
 * Matches the Feedants design's financial + spots section.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

export default function CompetitionInfo({ competition }) {
  const {
    prizePool,
    entryFee,
    currency,
    capacity,
    registeredCount,
    remainingSlots,
  } = competition;

  const currencySymbol = currency === 'INR' ? '₹' : '$';
  const progress = capacity > 0 ? registeredCount / capacity : 0;

  return (
    <View style={styles.container}>
      {/* Prize and Entry Row */}
      <View style={styles.financialRow}>
        <View style={styles.prizeSection}>
          <Text style={styles.label}>Prize Pool</Text>
          <Text style={styles.prizeAmount}>
            {currencySymbol} {prizePool?.toLocaleString()}
          </Text>
        </View>

        <View style={styles.entrySection}>
          <Text style={styles.label}>Entry Fee</Text>
          <Text style={styles.entryAmount}>
            {entryFee > 0 ? `${currencySymbol} ${entryFee}` : 'Free'}
          </Text>
        </View>

        {/* Availability */}
        <View style={styles.availabilitySection}>
          <View style={styles.spotsRow}>
            <Text style={styles.spotsIcon}>👥</Text>
            <Text style={styles.spotsText}>
              Only {remainingSlots} spots left
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(progress * 100, 100)}%`,
                  backgroundColor:
                    remainingSlots <= 5 ? Colors.error : Colors.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.bookedText}>
            {registeredCount} / {capacity} Booked
          </Text>
        </View>
      </View>
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
  financialRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  prizeSection: {
    flex: 1,
  },
  entrySection: {
    flex: 1,
    paddingLeft: 16,
  },
  label: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  prizeAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  entryAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textDark,
  },
  availabilitySection: {
    flex: 1.2,
    alignItems: 'flex-end',
  },
  spotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spotsIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  spotsText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  bookedText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
