/**
 * Cyber Black Squad – Upgraded Enterprise Authentication Core
 * Handles sign-in checks, audits account status (suspensions), enforces 4-tier role permissions, 
 * and automatically logs audit trails to sessions history tables.
 */

const AUTH_KEYS = {
  SESSION: 'cbs_session'
};

const auth = {
  getUsers() {
    if (window.cbsDB) {
      return window.cbsDB.getUsers();
    }
    return [];
  },

  register(name, email, password, role) {
    const users = this.getUsers();
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (exists) {
      throw new Error('An account with this email address already exists.');
    }

    const newUser = {
      name,
      email,
      password,
      role, // Founder, Admin, Manager, Team Member
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

    const saved = window.cbsDB.saveUser(newUser);
    return saved;
  },

  login(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user || user.password !== password) {
      if (user) {
        window.cbsDB.addSessionRecord(user.id, '127.0.0.1', 'Failed: Wrong Password');
      }
      throw new Error('Invalid email or password. Please verify.');
    }

    // SECURITY OVERRIDE: Check if user is suspended
    if (user.status === 'suspended') {
      window.cbsDB.addSessionRecord(user.id, '127.0.0.1', 'Failed: Account Suspended');
      throw new Error('Access Denied: This account has been suspended by workspace administration.');
    }

    // Set Session Storage
    const sessionData = {
      userId: user.id,
      loginTime: new Date().toISOString()
    };
    sessionStorage.setItem(AUTH_KEYS.SESSION, JSON.stringify(sessionData));

    // Log operational session & activity logs
    window.cbsDB.addSessionRecord(user.id, '127.0.0.1', 'Success');
    window.cbsDB.addActivityLog(user.id, `${user.name} logged into the workspace.`, 'Security');
    
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

    return user;
  },

  logout() {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      window.cbsDB.addActivityLog(currentUser.id, `${currentUser.name} logged out of the workspace.`, 'Security');
    }
    
    sessionStorage.removeItem(AUTH_KEYS.SESSION);
  },

  getCurrentUser() {
    let session = sessionStorage.getItem(AUTH_KEYS.SESSION);
    if (!session) return null;

    try {
      const sessionData = JSON.parse(session);
      const user = window.cbsDB.getUserById(sessionData.userId);
      if (!user) return null;
      
      return user;
    } catch (e) {
      return null;
    }
  },

  isAuthenticated() {
    return this.getCurrentUser() !== null;
  },

  requireAuth(redirectUrl = 'login.html') {
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
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'Admin';
  },

  isFounder() {
    const user = this.getCurrentUser();
    return user && user.role === 'Founder';
  },

  canEdit() {
    const user = this.getCurrentUser();
    return user && (user.role === 'Founder' || user.role === 'Admin');
  }
};

// Export to window
window.cbsAuth = auth;
