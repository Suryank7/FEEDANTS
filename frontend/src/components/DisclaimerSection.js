/**
 * DisclaimerSection — Info disclaimer + payment/referral sections.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

export default function DisclaimerSection({ competition }) {
  const { disclaimer, referralEnabled } = competition;

  return (
    <View>
      {/* Disclaimer */}
      {disclaimer && (
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerIcon}>ℹ️</Text>
          <View style={styles.disclaimerContent}>
            <Text style={styles.disclaimerLabel}>Disclaimer: </Text>
            <Text style={styles.disclaimerText}>{disclaimer}</Text>
          </View>
        </View>
      )}

      {/* Payment Info */}
      <View style={styles.paymentContainer}>
        <View style={styles.paymentRow}>
          <TouchableOpacity style={styles.paymentItem} activeOpacity={0.7}>
            <View style={styles.playCircle}>
              <Text style={styles.playBtn}>▶</Text>
            </View>
            <View>
              <Text style={styles.paymentTitle}>How will you receive{'\n'}prize money?</Text>
              <Text style={styles.paymentSub}>Watch video to know more</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.paymentRight}>
            <View style={styles.policyRow}>
              <Text style={styles.checkIcon}>☑</Text>
              <Text style={styles.policyText}>Refund policy</Text>
            </View>
            <View style={styles.policyRow}>
              <Text style={styles.checkIcon}>☑</Text>
              <Text style={styles.policyText}>Secure payments</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Referral */}
      {referralEnabled && (
        <View style={styles.referralContainer}>
          <View style={styles.referralTop}>
            <Text style={styles.megaphoneIcon}>📢</Text>
            <Text style={styles.referralTitle}>Refer & Earn more discount</Text>
            <TouchableOpacity style={styles.referNowBtn} activeOpacity={0.7}>
              <Text style={styles.referNowText}>Refer Now</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.referralLinkRow}>
            <View style={styles.referralLinkBox}>
              <Text style={styles.referralLink} numberOfLines={1}>
                https://feedants.com/r/referral123
              </Text>
            </View>
            <TouchableOpacity style={styles.copyBtn} activeOpacity={0.7}>
              <Text style={styles.copyText}>Copy Link</Text>
            </TouchableOpacity>
            <Text style={styles.earnText}>You earn ₹10 for every signup</Text>
          </View>
        </View>
      )}

      {/* Testimonials */}
      <TouchableOpacity style={styles.testimonialContainer} activeOpacity={0.7}>
        <View style={styles.testimonialRow}>
          <Text style={styles.chatIcon}>💬</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.testimonialTitle}>Hear From Our Users</Text>
            <Text style={styles.testimonialSub}>See what participants say about Feedants</Text>
          </View>
          <Text style={styles.arrowIcon}>›</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.accentLight,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
    padding: 12,
  },
  disclaimerIcon: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 1,
  },
  disclaimerContent: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  disclaimerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  disclaimerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  paymentContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  playBtn: {
    color: Colors.textWhite,
    fontSize: 12,
    marginLeft: 2,
  },
  paymentTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textDark,
  },
  paymentSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  paymentRight: {
    justifyContent: 'center',
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkIcon: {
    color: Colors.primary,
    fontSize: 14,
    marginRight: 6,
  },
  policyText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  referralContainer: {
    backgroundColor: Colors.accentLight,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    padding: 14,
  },
  referralTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  megaphoneIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  referralTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
    flex: 1,
  },
  referNowBtn: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  referNowText: {
    color: Colors.textWhite,
    fontSize: 12,
    fontWeight: '600',
  },
  referralLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  referralLinkBox: {
    backgroundColor: Colors.white,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  referralLink: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  copyBtn: {
    borderWidth: 1,
    borderColor: Colors.primaryDark,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  copyText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  earnText: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 6,
    width: '100%',
    textAlign: 'right',
  },
  testimonialContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 12,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  testimonialRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  testimonialTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  testimonialSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  arrowIcon: {
    fontSize: 24,
    color: Colors.textSecondary,
    fontWeight: '300',
  },
});
