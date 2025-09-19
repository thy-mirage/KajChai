/**
 * Utility functions for checking user restrictions
 */

/**
 * Check if a worker is currently restricted from forum activities
 * @param {Object} user - User object from auth context
 * @returns {boolean} - True if user is restricted from forum activities
 */
export const isUserRestrictedFromForum = (user) => {
  // Only workers can be restricted
  if (!user || user.role !== 'WORKER') {
    return false;
  }

  // Check if banned (permanent restriction)
  if (user.isBanned) {
    return true;
  }

  // Check if currently restricted
  if (user.isRestricted && user.restrictedAt) {
    // Check if restriction has expired (3 days from restriction date)
    const restrictionDate = new Date(user.restrictedAt);
    const expiryDate = new Date(restrictionDate.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days
    const now = new Date();
    
    // If restriction has expired, user is no longer restricted
    if (now > expiryDate) {
      return false;
    }
    
    // Still under restriction
    return true;
  }

  return false;
};

/**
 * Get the restriction expiry date for a restricted user
 * @param {Object} user - User object from auth context
 * @returns {Date|null} - Expiry date or null if not restricted
 */
export const getRestrictionExpiryDate = (user) => {
  if (!user || user.role !== 'WORKER' || !user.isRestricted || !user.restrictedAt) {
    return null;
  }

  const restrictionDate = new Date(user.restrictedAt);
  return new Date(restrictionDate.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days
};

/**
 * Get a user-friendly restriction message
 * @param {Object} user - User object from auth context
 * @returns {string|null} - Restriction message or null if not restricted
 */
export const getRestrictionMessage = (user) => {
  if (!isUserRestrictedFromForum(user)) {
    return null;
  }

  if (user.isBanned) {
    return 'Your account has been permanently banned from forum activities.';
  }

  if (user.isRestricted) {
    const expiryDate = getRestrictionExpiryDate(user);
    const expiryString = expiryDate ? expiryDate.toLocaleDateString() : 'unknown date';
    const reason = user.restrictionReason || 'Policy violation';
    
    return `Your account is restricted from forum activities until ${expiryString}. Reason: ${reason}`;
  }

  return null;
};