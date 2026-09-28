/**
 * CompetitionCTA — Bottom call-to-action button.
 * State-aware: shows Register, Registered, Full, Closed, etc.
 * Includes double-click protection and loading state.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Colors from '../constants/Colors';

/**
 * Determine button config based on competition status and user state.
 */
function getCTAConfig(status, userParticipation, isAuthenticated) {
  const isRegistered = userParticipation?.registered;

  if (isRegistered) {
    return {
      label: 'Upload Submission',
      sublabel: 'Registered',
      enabled: true,
      style: 'registered',
    };
  }

  switch (status) {
    case 'REGISTRATION_OPEN':
      return {
        label: isAuthenticated ? 'Register Now' : 'Login to Register',
        sublabel: null,
        enabled: true,
        style: 'primary',
      };
    case 'UPCOMING':
      return {
        label: 'Coming Soon',
        sublabel: 'Registration not yet open',
        enabled: false,
        style: 'disabled',
      };
    case 'FULL':
      return {
        label: 'No Spots Remaining',
        sublabel: 'Competition is full',
        enabled: false,
        style: 'disabled',
      };
    case 'REGISTRATION_CLOSED':
      return {
        label: 'Registration Closed',
        sublabel: null,
        enabled: false,
        style: 'disabled',
      };
    case 'LIVE':
      return {
        label: 'Competition is Live',
        sublabel: 'Registration closed',
        enabled: false,
        style: 'live',
      };
    case 'ENDED':
      return {
        label: 'Competition Ended',
        sublabel: null,
        enabled: false,
        style: 'disabled',
      };
    default:
      return {
        label: 'Unavailable',
        sublabel: null,
        enabled: false,
        style: 'disabled',
      };
  }
}

export default function CompetitionCTA({
  status,
  userParticipation,
  isAuthenticated,
  registering,
  onRegister,
  onLoginRequired,
}) {
  const config = getCTAConfig(status, userParticipation, isAuthenticated);

  const handlePress = () => {
    if (registering) return;
    
    if (status === 'REGISTRATION_OPEN' && !isAuthenticated) {
      if (onLoginRequired) onLoginRequired();
      return;
    }

    if (config.enabled && !userParticipation?.registered && onRegister) {
      onRegister();
    }
  };

  const buttonStyles = {
    primary: {
      bg: Colors.primaryDark,
      text: Colors.textWhite,
    },
    registered: {
      bg: Colors.primaryDark,
      text: Colors.textWhite,
    },
    live: {
      bg: '#3B82F6',
      text: Colors.textWhite,
    },
    disabled: {
      bg: Colors.disabled,
      text: Colors.textSecondary,
    },
  };

  const currentStyle = buttonStyles[config.style] || buttonStyles.disabled;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: currentStyle.bg },
          !config.enabled && !userParticipation?.registered && styles.buttonDisabled,
        ]}
        onPress={handlePress}
        disabled={(!config.enabled && !userParticipation?.registered) || registering}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={config.label}
        accessibilityState={{ disabled: !config.enabled }}
      >
        {registering ? (
          <ActivityIndicator color={Colors.textWhite} size="small" />
        ) : (
          <>
            <Text style={[styles.buttonText, { color: currentStyle.text }]}>
              {config.label}
            </Text>
            {config.sublabel && (
              <Text style={[styles.sublabel, { color: currentStyle.text, opacity: 0.7 }]}>
                {config.sublabel}
              </Text>
            )}
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  buttonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  sublabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});
