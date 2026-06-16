/**
 * Cyber Black Squad – Upgraded Enterprise Authentication Core
 * Handles sign-in checks, audits account status (suspensions), enforces 4-tier role permissions, 
 * and automatically logs audit trails to sessions history tables.
 */

const AUTH_COOKIE_NAME = 'cbs_session';

function _getCookieValue(name) {
  try {
    return sessionStorage.getItem(name);
  } catch (e) {
    console.warn('Session read error:', e);
    return null;
  }
}

function _setCookieValue(name, value, days = 7) {
  try {
    sessionStorage.setItem(name, value);
  } catch (e) {
    console.warn('Session write error:', e);
  }
}

function _removeCookie(name) {
  try {
    sessionStorage.removeItem(name);
  } catch (e) {
    console.warn('Session remove error:', e);
  }
}

const auth = {
  getUsers() {
    if (window.cbsDB) {
      return window.cbsDB.getUsers();
    }
    return [];
  },

  async register(name, email, password, role) {
    await window.cbsDB.init();
    const users = this.getUsers();
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (exists) {
      throw new Error('An account with this email address already exists.');
    }

    const newUser = {
      name,
      email,
      password,
      role, // Founder, Administrator, Manager, Team Member
      phone: '',
      department: 'General',
      skills: '',
      bio: '',
      status: 'active',
      avatar: 'assets/avatar.png',
      linkedin: '',
      github: '',
      portfolio: '',
      experience: '',
      education: '',
      certifications: '',
      professionalSummary: ''
    };

    const saved = await window.cbsDB.saveUser(newUser);
    return saved;
  },

  async login(email, password) {
    await window.cbsDB.init();
    const users = this.getUsers();
    console.log(`[Auth] Login attempt for ${email}. Found ${users.length} users in DB.`);

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user || user.password !== password) {
      if (user) {
        console.log(`[Auth] Password mismatch for user ${email}`);
        await window.cbsDB.addSessionRecord(user.id, '127.0.0.1', 'Failed: Wrong Password');
      } else {
        console.log(`[Auth] User not found: ${email}`);
      }
      throw new Error('Invalid email or password. Please verify.');
    }

    // SECURITY OVERRIDE: Check if user is suspended
    if (user.status === 'suspended') {
      console.log(`[Auth] User suspended: ${email}`);
      await window.cbsDB.addSessionRecord(user.id, '127.0.0.1', 'Failed: Account Suspended');
      throw new Error('Access Denied: This account has been suspended by workspace administration.');
    }

    // Set Auth Cookie with fallback profile data to survive cache race conditions
    const sessionData = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || 'assets/avatar.png',
      loginTime: new Date().toISOString()
    };
    _setCookieValue(AUTH_COOKIE_NAME, JSON.stringify(sessionData), 7);
    console.log(`[Auth] Session cookie set for user ${user.id}: ${AUTH_COOKIE_NAME}`);

    // Verify cookie was set
    const verifySession = _getCookieValue(AUTH_COOKIE_NAME);
    console.log(`[Auth] Cookie verification: ${verifySession ? 'SUCCESS' : 'FAILED'}`);

    // Log operational session & activity logs
    try {
      await window.cbsDB.addSessionRecord(user.id, '127.0.0.1', 'Success');
      await window.cbsDB.addActivityLog(user.id, `${user.name} logged into the workspace.`, 'Security');
      await window.cbsDB.addNotification('Security', 'User Logged In', `${user.name} logged into the workspace.`, 'Low');
    } catch (logError) {
      console.warn('[Auth] Failed to log session/activity:', logError);
      // Don't fail login if logging fails
    }

    // Toggle active status Online
    const activeUser = window.cbsDB.getUserById(user.id);
    if (activeUser) {
      // Keep online status unless settings overrides
      const settings = window.cbsDB.getSettings();
      if (settings.privacy && settings.privacy.showStatus) {
        // Mock status update inside DB
        // Let's set a global runtime tag or keep database active
      }
    }

    console.log(`[Auth] Login successful for user: ${user.email}`);
    return user;
  },

  async logout() {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      window.cbsDB.addActivityLog(currentUser.id, `${currentUser.name} logged out of the workspace.`, 'Security').catch(() => {});
      window.cbsDB.addNotification('Security', 'User Logged Out', `${currentUser.name} logged out of the workspace.`, 'Low').catch(() => {});
    }
    _removeCookie(AUTH_COOKIE_NAME);
    // Also clear any legacy cookie/localStorage from old session system
    try { document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`; } catch(e) {}
    try { localStorage.removeItem(AUTH_COOKIE_NAME); } catch(e) {}
  },

  getCurrentUser() {
    let session = _getCookieValue(AUTH_COOKIE_NAME);
    if (!session) return null;

    try {
      const sessionData = JSON.parse(session);
      if (window.cbsDB && typeof window.cbsDB.getUserById === 'function') {
        const user = window.cbsDB.getUserById(sessionData.userId);
        if (user) return user;
      }

      // Fallback to session-stored profile data if DB cache is not yet ready
      if (sessionData.userId && sessionData.email && sessionData.name) {
        return {
          id: sessionData.userId,
          name: sessionData.name,
          email: sessionData.email,
          role: sessionData.role || 'Team Member',
          avatar: sessionData.avatar || 'assets/avatar.png'
        };
      }

      return null;
    } catch (e) {
      return null;
    }
  },

  isAuthenticated() {
    return this.getCurrentUser() !== null;
  },

  requireAuth(redirectUrl = 'home.html') {
    if (!this.isAuthenticated()) {
      window.location.href = redirectUrl;
    }
  },

  requireGuest(redirectUrl = 'dashboard.html') {
    if (this.isAuthenticated()) {
      window.location.href = redirectUrl;
    }
  },

  requireHome(redirectUrl = 'home.html') {
    if (!this.isAuthenticated()) {
      window.location.href = redirectUrl;
    }
  },

  // UPGRADED ACCESS TIER POLICIES
  isAdministrator() {
    const user = this.getCurrentUser();
    if (!user || typeof user.role !== 'string') return false;
    const r = user.role.toLowerCase();
    return r === 'administrator' || r === 'admin';
  },

  isFounder() {
    const user = this.getCurrentUser();
    if (!user || typeof user.role !== 'string') return false;
    const r = user.role.toLowerCase();
    return r === 'founder' || r === 'founder & ceo' || r === 'co-founder & cto';
  },

  canEdit() {
    const user = this.getCurrentUser();
    if (!user || typeof user.role !== 'string') return false;
    const r = user.role.toLowerCase();
    return r === 'founder' || r === 'founder & ceo' || r === 'co-founder & cto' || r === 'administrator' || r === 'admin';
  },

  updateSession(user) {
    const session = _getCookieValue(AUTH_COOKIE_NAME);
    if (!session) return;
    try {
      const sessionData = JSON.parse(session);
      if (sessionData.userId === user.id) {
        sessionData.name = user.name;
        sessionData.email = user.email;
        sessionData.role = user.role;
        sessionData.avatar = user.avatar || 'assets/avatar.png';
        _setCookieValue(AUTH_COOKIE_NAME, JSON.stringify(sessionData), 7);
        console.log('[Auth] Session cookie dynamically updated.');
      }
    } catch (e) {
      console.warn('[Auth] Failed to update session:', e);
    }
  },

};

// Export to window
window.cbsAuth = auth;
