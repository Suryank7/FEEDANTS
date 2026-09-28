/**
 * useCompetition — custom hook for competition data fetching and registration.
 *
 * Manages:
 * - Fetching competition details
 * - Registration mutation
 * - Loading/error states
 * - Auto-refresh after registration
 * - Double-click protection
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getCompetition,
  registerForCompetition,
  cancelRegistration,
} from '../services/competitionApi';

export function useCompetition(competitionId, token = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Double-click protection
  const isRegisteringRef = useRef(false);

  /**
   * Fetch competition details from the API.
   */
  const fetchCompetition = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getCompetition(competitionId, token);
      setData(result.data);
    } catch (err) {
      setError({
        message: err.message || 'Failed to load competition details',
        code: err.code || 'UNKNOWN',
        status: err.status || 500,
      });
    } finally {
      setLoading(false);
    }
  }, [competitionId, token]);

  /**
   * Register the current user for this competition.
   * Includes double-click protection.
   */
  const register = useCallback(async () => {
    // Prevent double-clicks
    if (isRegisteringRef.current) return;
    isRegisteringRef.current = true;

    try {
      setRegistering(true);
      setRegisterError(null);
      setRegisterSuccess(false);

      await registerForCompetition(competitionId, token);

      setRegisterSuccess(true);

      // Refresh competition data to get updated state from server
      await fetchCompetition();
    } catch (err) {
      setRegisterError({
        message: err.message || 'Registration failed',
        code: err.code || 'UNKNOWN',
      });
    } finally {
      setRegistering(false);
      isRegisteringRef.current = false;
    }
  }, [competitionId, token, fetchCompetition]);

  /**
   * Cancel registration.
   */
  const cancel = useCallback(async () => {
    if (isRegisteringRef.current) return;
    isRegisteringRef.current = true;

    try {
      setRegistering(true);
      setRegisterError(null);

      await cancelRegistration(competitionId, token);

      // Refresh after cancellation
      await fetchCompetition();
    } catch (err) {
      setRegisterError({
        message: err.message || 'Cancellation failed',
        code: err.code || 'UNKNOWN',
      });
    } finally {
      setRegistering(false);
      isRegisteringRef.current = false;
    }
  }, [competitionId, token, fetchCompetition]);

  /**
   * Retry after error.
   */
  const retry = useCallback(() => {
    fetchCompetition();
  }, [fetchCompetition]);

  // Initial fetch
  useEffect(() => {
    fetchCompetition();
  }, [fetchCompetition]);

  return {
    data,
    loading,
    error,
    registering,
    registerError,
    registerSuccess,
    register,
    cancel,
    retry,
    refresh: fetchCompetition,
    clearRegisterError: () => setRegisterError(null),
  };
}
