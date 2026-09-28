/**
 * JudgeSection — Organizer/Judge profile card.
 * Shows avatar, name, credentials, and intro video button.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

export default function JudgeSection({ organizer }) {
  if (!organizer) return null;

  const initials = organizer.name
    ? organizer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'JD';

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.role}>Judge</Text>
          <Text style={styles.name}>{organizer.name}</Text>
          {organizer.title && (
            <Text style={styles.title}>{organizer.title}</Text>
          )}
          {organizer.experience && (
            <Text style={styles.experience}>{organizer.experience}</Text>
          )}
        </View>

        {/* Intro Video Button */}
        <TouchableOpacity
          style={styles.videoButton}
          activeOpacity={0.7}
          accessibilityLabel="Watch intro video"
        >
          <View style={styles.playIcon}>
            <Text style={styles.playTriangle}>▶</Text>
          </View>
          <Text style={styles.videoText}>Intro Video</Text>
        </TouchableOpacity>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.textWhite,
    fontSize: 20,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  role: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    marginTop: 1,
  },
  title: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  experience: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  videoButton: {
    alignItems: 'center',
  },
  playIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryDark,
  },
  playTriangle: {
    color: Colors.primaryDark,
    fontSize: 16,
    marginLeft: 2,
  },
  videoText: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
});
