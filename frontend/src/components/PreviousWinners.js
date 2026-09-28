/**
 * PreviousWinners — Horizontal scrollable list of past winners.
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

function WinnerCard({ winner }) {
  const initials = winner.name
    ? winner.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  // Different colors for different positions
  const positionColors = {
    '1st Winner': '#FFD700',
    '2nd Winner': '#C0C0C0',
    '3rd Winner': '#CD7F32',
  };
  const borderColor = positionColors[winner.position] || Colors.primary;

  return (
    <View style={styles.winnerCard}>
      <View style={[styles.winnerAvatar, { borderColor }]}>
        <Text style={styles.winnerInitials}>{initials}</Text>
        <View style={styles.playBadge}>
          <Text style={styles.playIcon}>▶</Text>
        </View>
      </View>
      <Text style={styles.winnerName} numberOfLines={1}>{winner.name}</Text>
      <Text style={[styles.winnerPosition, { color: borderColor === '#FFD700' ? '#B8860B' : Colors.primary }]}>
        {winner.position}
      </Text>
    </View>
  );
}

export default function PreviousWinners({ winners = [] }) {
  if (!winners.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Previous Winners</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {winners.map((winner, index) => (
          <WinnerCard key={index} winner={winner} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    paddingLeft: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 12,
  },
  scrollContent: {
    paddingRight: 16,
  },
  winnerCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  winnerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  winnerInitials: {
    color: Colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
  },
  playBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  playIcon: {
    color: Colors.textWhite,
    fontSize: 8,
    marginLeft: 1,
  },
  winnerName: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textDark,
    marginTop: 6,
    textAlign: 'center',
  },
  winnerPosition: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
});
