/**
 * CompetitionDetailsScreen — Main screen.
 *
 * Orchestrates all competition sub-components.
 * Manages data fetching via useCompetition hook.
 * All dynamic data is API-driven — nothing is hardcoded.
 *
 * Supports states: Loading, Loaded, Error, Network Failure.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import Colors from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { useCompetition } from '../hooks/useCompetition';

// Components
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorState from '../components/ErrorState';
import CompetitionHeader from '../components/CompetitionHeader';
import CompetitionInfo from '../components/CompetitionInfo';
import JudgeSection from '../components/JudgeSection';
import CountdownBanner from '../components/CountdownBanner';
import CompetitionDates from '../components/CompetitionDates';
import PreviousWinners from '../components/PreviousWinners';
import CompetitionTabs from '../components/CompetitionTabs';
import RewardsSection from '../components/RewardsSection';
import CompetitionStatus from '../components/CompetitionStatus';
import CompetitionCTA from '../components/CompetitionCTA';
import DisclaimerSection from '../components/DisclaimerSection';
import LoginScreen from './LoginScreen';

export default function CompetitionDetailsScreen({ competitionId }) {
  const { token, isAuthenticated, user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: competition,
    loading,
    error,
    registering,
    registerError,
    registerSuccess,
    register,
    retry,
    refresh,
  } = useCompetition(competitionId, token);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Handle registration
  const handleRegister = useCallback(() => {
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }
    register();
  }, [isAuthenticated, register]);

  // Show registration result feedback
  React.useEffect(() => {
    if (registerSuccess) {
      Alert.alert(
        '🎉 Registration Successful!',
        'You have been registered for this competition.',
        [{ text: 'Great!' }]
      );
    }
  }, [registerSuccess]);

  React.useEffect(() => {
    if (registerError) {
      Alert.alert(
        'Registration Failed',
        registerError.message,
        [{ text: 'OK' }]
      );
    }
  }, [registerError]);

  // Determine countdown target
  const getCountdownConfig = () => {
    if (!competition) return null;

    const status = competition.status;
    const now = new Date();

    if (status === 'REGISTRATION_OPEN') {
      return {
        target: competition.registrationEndAt,
        label: 'Registration closes in',
      };
    }
    if (status === 'UPCOMING') {
      return {
        target: competition.registrationStartAt,
        label: 'Registration opens in',
      };
    }
    if (status === 'LIVE') {
      return {
        target: competition.endAt,
        label: 'Competition ends in',
      };
    }
    return null;
  };

  // ─── State A: Loading ─────────────────────────────────
  if (loading && !competition) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.topBar}>
          <Text style={styles.goBackText}>← Go back</Text>
        </View>
        <LoadingSkeleton />
      </SafeAreaView>
    );
  }

  // ─── State I/J: Error / Network Failure ────────────────
  if (error && !competition) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.topBar}>
          <Text style={styles.goBackText}>← Go back</Text>
        </View>
        <ErrorState error={error} onRetry={retry} />
      </SafeAreaView>
    );
  }

  if (!competition) return null;

  const countdownConfig = getCountdownConfig();

  // ─── State B-H: Successfully Loaded ───────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.goBackText}>← Go back</Text>
        <View style={styles.topBarRight}>
          {isAuthenticated ? (
            <TouchableOpacity onPress={logout} style={styles.authBtn}>
              <Text style={styles.logoutText}>
                👤 {user?.name?.split(' ')[0]} | Logout
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setShowLogin(true)}
              style={styles.authBtn}
            >
              <Text style={styles.loginBtnText}>Login</Text>
            </TouchableOpacity>
          )}
          <View style={styles.langRow}>
            <View style={[styles.langBtn, styles.langBtnActive]}>
              <Text style={styles.langTextActive}>ENG</Text>
            </View>
            <View style={styles.langBtn}>
              <Text style={styles.langText}>हिन्दी</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Competition Status Banner */}
        <CompetitionStatus status={competition.status} />

        {/* Header Card */}
        <CompetitionHeader competition={competition} />

        {/* Prize / Entry / Availability */}
        <CompetitionInfo competition={competition} />

        {/* Judge */}
        <JudgeSection organizer={competition.organizer} />

        {/* Countdown */}
        {countdownConfig && (
          <CountdownBanner
            targetDate={countdownConfig.target}
            label={countdownConfig.label}
            onExpire={refresh}
          />
        )}

        {/* Important Dates */}
        <CompetitionDates competition={competition} />

        {/* Previous Winners */}
        <PreviousWinners winners={competition.previousWinners} />

        {/* Tabs: About / Judging / Rules */}
        <CompetitionTabs competition={competition} />

        {/* Rewards */}
        <RewardsSection
          prizes={competition.prizes}
          currency={competition.currency}
        />

        {/* Disclaimer, Payment, Referral, Testimonials */}
        <DisclaimerSection competition={competition} />

        {/* Bottom spacer for CTA */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <CompetitionCTA
        status={competition.status}
        userParticipation={competition.userParticipation}
        isAuthenticated={isAuthenticated}
        registering={registering}
        onRegister={handleRegister}
        onLoginRequired={() => setShowLogin(true)}
      />

      {/* Login Modal */}
      {showLogin && (
        <LoginScreen
          onClose={() => {
            setShowLogin(false);
            // Refresh after login to get personalized state
            setTimeout(() => refresh(), 300);
          }}
        />
      )}

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <View style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </View>
        <View style={styles.navItem}>
          <Text style={styles.navIcon}>🔍</Text>
          <Text style={styles.navLabel}>Explore</Text>
        </View>
        <View style={[styles.navItem, styles.navCenter]}>
          <View style={styles.addButton}>
            <Text style={styles.addIcon}>+</Text>
          </View>
        </View>
        <View style={styles.navItem}>
          <Text style={[styles.navIcon, { color: Colors.primary }]}>🏆</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Competitions</Text>
        </View>
        <View style={styles.navItem}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  goBackText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textDark,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authBtn: {
    marginRight: 12,
  },
  loginBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  langRow: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  langBtnActive: {
    backgroundColor: Colors.primaryDark,
  },
  langText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  langTextActive: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textWhite,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navCenter: {
    marginTop: -20,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  navLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  addIcon: {
    color: Colors.textWhite,
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },
});
