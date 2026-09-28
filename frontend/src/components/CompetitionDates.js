/**
 * CompetitionDates — Important dates grid.
 * Shows: Register Before, Submission Starts, Submission Ends, Result Date.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';
import { formatDate, formatTime } from '../utils/dateUtils';

function DateCard({ icon, label, date, color = Colors.primary }) {
  return (
    <View style={styles.dateCard}>
      <View style={styles.dateCardRow}>
        <Text style={[styles.dateIcon, { color }]}>{icon}</Text>
        <View style={styles.dateInfo}>
          <Text style={styles.dateLabel}>{label}</Text>
          <Text style={[styles.dateValue, { color }]}>{formatDate(date)}</Text>
          <Text style={styles.dateTime}>{formatTime(date)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function CompetitionDates({ competition }) {
  const { registrationEndAt, submissionStartAt, submissionEndAt, resultAt } = competition;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Important Dates</Text>
      <View style={styles.grid}>
        <DateCard
          icon="📋"
          label="Register Before"
          date={registrationEndAt}
          color={Colors.primary}
        />
        {submissionStartAt && (
          <DateCard
            icon="📤"
            label="Submission Starts"
            date={submissionStartAt}
            color={Colors.primary}
          />
        )}
        {submissionEndAt && (
          <DateCard
            icon="📥"
            label="Submission Ends"
            date={submissionEndAt}
            color={Colors.primary}
          />
        )}
        {resultAt && (
          <DateCard
            icon="🏆"
            label="Result Date"
            date={resultAt}
            color="#E91E63"
          />
        )}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dateCard: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  dateCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dateIcon: {
    fontSize: 18,
    marginRight: 8,
    marginTop: 2,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  dateTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
});
