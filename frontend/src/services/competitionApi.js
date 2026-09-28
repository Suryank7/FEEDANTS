/**
 * Competition API Service
 * Handles all API communication for competition-related operations.
 */

import API_BASE_URL from '../config/api';

/**
 * Generic fetch wrapper with error handling.
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error?.message || 'An error occurred');
      error.status = response.status;
      error.code = data.error?.code || 'UNKNOWN_ERROR';
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.status) {
      throw error; // Re-throw API errors
    }
    // Network error
    const networkError = new Error('Unable to connect to the server. Please check your connection.');
    networkError.status = 0;
    networkError.code = 'NETWORK_ERROR';
    throw networkError;
  }
}

/**
 * Get competition details.
 * @param {string} competitionId
 * @param {string|null} token - Auth token for personalized data
 */
export async function getCompetition(competitionId, token = null) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return apiFetch(`/competitions/${competitionId}`, { headers });
}

/**
 * Register for a competition.
 * @param {string} competitionId
 * @param {string} token - Auth token (required)
 */
export async function registerForCompetition(competitionId, token) {
  return apiFetch(`/competitions/${competitionId}/register`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Cancel registration for a competition.
 * @param {string} competitionId
 * @param {string} token - Auth token (required)
 */
export async function cancelRegistration(competitionId, token) {
  return apiFetch(`/competitions/${competitionId}/register`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Login user.
 * @param {{ email: string, password: string }} credentials
 */
export async function loginUser(email, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Register user.
 * @param {{ name: string, email: string, password: string }} data
 */
export async function registerUser(name, email, password) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}
