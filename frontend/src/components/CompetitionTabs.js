/**
 * CompetitionTabs — Tabbed content: About, Judging Parameters, Rules & Eligibility.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

const TABS = [
  { key: 'about', label: 'About Competition' },
  { key: 'judging', label: 'Judging Parameters' },
  { key: 'rules', label: 'Rules & Eligibility' },
];

export default function CompetitionTabs({ competition }) {
  const [activeTab, setActiveTab] = useState('about');
  const [expanded, setExpanded] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'about':
        return renderAbout();
      case 'judging':
        return renderJudging();
      case 'rules':
        return renderRules();
      default:
        return null;
    }
  };

  const renderAbout = () => {
    const desc = competition.description || '';
    const shortDesc = desc.length > 200 && !expanded ? desc.slice(0, 200) + '...' : desc;

    return (
      <View>
        <Text style={styles.contentText}>{shortDesc}</Text>
        {desc.length > 200 && (
          <TouchableOpacity
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.viewMore}>
              {expanded ? 'View less ▲' : 'View more ▼'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderJudging = () => {
    const params = competition.judgingParameters || [];
    if (!params.length) {
      return <Text style={styles.contentText}>No judging parameters specified.</Text>;
    }

    return (
      <View>
        {params.map((param, index) => (
          <View key={index} style={styles.paramRow}>
            <View style={styles.paramHeader}>
              <Text style={styles.paramName}>{param.name}</Text>
              {param.weightage && (
                <Text style={styles.paramWeightage}>{param.weightage}</Text>
              )}
            </View>
            {param.description && (
              <Text style={styles.paramDesc}>{param.description}</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderRules = () => {
    const rules = competition.rules || [];
    const eligibility = competition.eligibility || [];

    return (
      <View>
        {rules.length > 0 && (
          <>
            <Text style={styles.subTitle}>Rules</Text>
            {rules.map((rule, index) => (
              <View key={index} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{rule}</Text>
              </View>
            ))}
          </>
        )}
        {eligibility.length > 0 && (
          <>
            <Text style={[styles.subTitle, { marginTop: 12 }]}>Eligibility</Text>
            {eligibility.map((item, index) => (
              <View key={index} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tab Headers */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
            ]}
            onPress={() => {
              setActiveTab(tab.key);
              setExpanded(false);
            }}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.contentArea}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primaryDark,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  contentArea: {
    padding: 16,
  },
  contentText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  viewMore: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingRight: 8,
  },
  bullet: {
    fontSize: 14,
    color: Colors.primary,
    marginRight: 8,
    marginTop: 1,
  },
  bulletText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  paramRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  paramHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paramName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  paramWeightage: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  paramDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
  },
});
