/**
 * CompetitionHeader — Top section with title, tags, registered badge.
 * Matches the Feedants design reference header card.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

export default function CompetitionHeader({ competition }) {
  const { title, tags = [], certificateProvided, userParticipation } = competition;
  const isRegistered = userParticipation?.registered;

  return (
    <View style={styles.container}>
      {/* Title Row */}
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {isRegistered && (
          <View style={styles.registeredBadge}>
            <Text style={styles.registeredIcon}>✓</Text>
            <Text style={styles.registeredText}>Registered</Text>
          </View>
        )}
      </View>

      {/* Tags Row */}
      <View style={styles.tagsRow}>
        {tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
        {certificateProvided && (
          <View style={styles.certificateRow}>
            <Text style={styles.trophyIcon}>🏆</Text>
            <Text style={styles.certificateText}>Winners get certificate</Text>
          </View>
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
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textDark,
    flex: 1,
    marginRight: 12,
  },
  registeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  registeredIcon: {
    color: Colors.success,
    fontWeight: '700',
    marginRight: 4,
    fontSize: 13,
  },
  registeredText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  certificateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  trophyIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  certificateText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
});
