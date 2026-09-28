/**
 * Feedants Competition Details — App Entry
 *
 * This app demonstrates a production-oriented competition module.
 * The competition ID can be changed to test different competition states.
 *
 * The app:
 * 1. Restores any saved auth session
 * 2. Fetches competition list to find the first competition
 * 3. Renders the CompetitionDetailsScreen with that ID
 *
 * In a real app, this ID would come from navigation/deep link.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import CompetitionDetailsScreen from './src/screens/CompetitionDetailsScreen';
import API_BASE_URL from './src/config/api';
import Colors from './src/constants/Colors';

function AppContent() {
  const { restoreSession } = useAuth();
  const [competitionId, setCompetitionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        // Restore saved auth session
        await restoreSession();

        // Fetch first competition from seed data
        // In production, this would come from navigation params
        const response = await fetch(`${API_BASE_URL}/competitions/first`);

        if (response.ok) {
          const data = await response.json();
          setCompetitionId(data.data.id);
        } else {
          // Fallback: use the competition ID directly if the endpoint doesn't exist
          setError('No competitions found. Please run: cd backend && npm run seed');
        }
      } catch (err) {
        setError(
          'Cannot connect to the API server.\n\n' +
          'Make sure the backend is running:\n' +
          'cd backend && npm run dev\n\n' +
          'And the database is seeded:\n' +
          'cd backend && npm run seed\n\n' +
          `API URL: ${API_BASE_URL}`
        );
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Connecting to Feedants...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Setup Required</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!competitionId) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No competition ID available.</Text>
      </View>
    );
  }

  return <CompetitionDetailsScreen competitionId={competitionId} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
