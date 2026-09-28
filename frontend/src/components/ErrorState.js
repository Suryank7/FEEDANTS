/**
 * ErrorState — displays user-friendly error messages with retry capability.
 * Never exposes stack traces, database errors, or internal details.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

export default function ErrorState({ error, onRetry }) {
  const isNetworkError = error?.code === 'NETWORK_ERROR' || error?.status === 0;
  const isNotFound = error?.status === 404;

  let icon = '⚠️';
  let title = 'Something went wrong';
  let message = error?.message || 'An unexpected error occurred. Please try again.';

  if (isNetworkError) {
    icon = '📡';
    title = 'Connection Error';
    message = 'Unable to connect to the server. Please check your internet connection and try again.';
  } else if (isNotFound) {
    icon = '🔍';
    title = 'Not Found';
    message = 'The competition you\'re looking for doesn\'t exist or has been removed.';
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.7}
          accessibilityLabel="Retry loading competition"
          accessibilityRole="button"
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.background,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  retryText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
});
