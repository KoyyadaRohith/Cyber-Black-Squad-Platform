/**
 * Cyber Black Squad – Supabase Database Layer
 * Replaces localStorage collections with PostgreSQL tables via Supabase.
 * Session persistence uses a cookie-based auth session token instead of sessionStorage/localStorage.
 */

// Configuration: read from `window.CBS_CONFIG` (see js/config.js)
function _getCookieValue(name) {
  try {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
    if (match) return decodeURIComponent(match[1]);
  } catch (e) {
    console.warn('Cookie read error:', e);
  }
  try {
    return localStorage.getItem(name);
  } catch (e) {
    return null;
  }
}

function _configMissingError() {
  console.error('[cbs-db] Supabase configuration missing or invalid. Create `js/config.js` (see README) and include it before `js/db.js`. Expected: window.CBS_CONFIG = { SUPABASE_URL, SUPABASE_ANON_KEY }');
}

function _setCookieValue(name, value, days = 7) {
  try {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = 'expires=' + date.toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; ${expires}`;
  } catch (e) {
    console.warn('Cookie write error:', e);
  }
  try {
    localStorage.setItem(name, value);
  } catch (e) {
    console.warn('LocalStorage write error:', e);
  }
}

function _removeCookie(name) {
  try {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  } catch (e) {
    console.warn('Cookie remove error:', e);
  }
  try {
    localStorage.removeItem(name);
  } catch (e) {
    console.warn('LocalStorage remove error:', e);
  }
}

const db = {
  _cache: {
    users: [],
    projects: [],
    tasks: [],
    milestones: [],
    channels: [],
    messages: [],
    notifications: [],
    activity_logs: [],
    settings: null,
    sessions: []
  },

  ready: null,
  authCookieKey: 'cbs_session',

  _fieldMap: {
    createdDate: 'created_at',
    updatedDate: 'updated_at'
  },

  _camelToSnake(key) {
    if (this._fieldMap[key]) return this._fieldMap[key];
    return key.replace(/([A-Z])/g, '_$1').toLowerCase();
  },

  _snakeToCamel(key) {
    if (key === 'created_at') return 'createdAt';
    if (key === 'updated_at') return 'updatedAt';
    return key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
  },

  _mapToDb(table, payload) {
    if (!payload || typeof payload !== 'object') return payload;
    if (Array.isArray(payload)) return payload.map(item => this._mapToDb(table, item));

    if (table === 'settings') {
      return {
        id: payload.id || 'settings',
        appearance: payload.appearance || 'light',
        notif_email: payload.notifications?.email ?? true,
        notif_push: payload.notifications?.push ?? true,
        notif_alerts: payload.notifications?.alerts ?? true,
        privacy_show_status: payload.privacy?.showStatus ?? true,
        privacy_share_analytics: payload.privacy?.shareAnalytics ?? true,
        security_password_expiry: payload.security?.passwordExpiry ?? 90,
        security_require_mfa: payload.security?.requireMfa ?? false
      };
    }

    if (table === 'users') {
      const userCols = [
        'id', 'name', 'email', 'phone', 'role', 'department', 'skills', 'bio', 
        'avatar', 'status', 'linkedin', 'github', 'portfolio', 'experience', 
        'education', 'certifications', 'account_type', 'access_level', 'created_date', 'password'
      ];
      const mapped = {};
      Object.keys(payload).forEach((key) => {
        let dbKey;
        if (key === 'createdDate' || key === 'createdAt') {
          dbKey = 'created_date';
        } else if (key === 'title') {
          dbKey = 'account_type';
        } else if (key === 'professionalSummary') {
          dbKey = 'access_level';
        } else {
          dbKey = this._camelToSnake(key);
        }
        if (userCols.includes(dbKey)) {
          mapped[dbKey] = payload[key];
        }
      });
      return mapped;
    }

    const mapped = {};
    Object.keys(payload).forEach((key) => {
      const dbKey = this._camelToSnake(key);
      mapped[dbKey] = payload[key];
    });
    return mapped;
  },

  _mapFromDb(table, row) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return row;

    if (table === 'settings') {
      return {
        id: row.id,
        appearance: row.appearance || 'light',
        notifications: {
          email: row.notif_email ?? true,
          push: row.notif_push ?? true,
          alerts: row.notif_alerts ?? true
        },
        privacy: {
          showStatus: row.privacy_show_status ?? true,
          shareAnalytics: row.privacy_share_analytics ?? true
        },
        security: {
          passwordExpiry: row.security_password_expiry ?? 90,
          requireMfa: row.security_require_mfa ?? false
        },
        updatedAt: row.updated_at,
        updatedDate: row.updated_at
      };
    }

    if (table === 'users') {
      const mapped = {};
      Object.keys(row).forEach((key) => {
        const jsKey = this._snakeToCamel(key);
        mapped[jsKey] = row[key];
        if (key === 'created_date') {
          mapped.createdDate = row[key];
          mapped.createdAt = row[key];
        }
      });
      mapped.title = row.account_type;
      mapped.professionalSummary = row.access_level;
      return mapped;
    }

    const mapped = {};
    Object.keys(row).forEach((key) => {
      const jsKey = this._snakeToCamel(key);
      mapped[jsKey] = row[key];

      if (key === 'created_at') {
        mapped.createdDate = row[key];
        mapped.createdAt = row[key];
      }
      if (key === 'updated_at') {
        mapped.updatedDate = row[key];
        mapped.updatedAt = row[key];
      }
    });
    return mapped;
  },

  get supabase() {
    const cfg = window.CBS_CONFIG || {};
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
      _configMissingError();
      throw new Error('Supabase configuration missing');
    }

    if (!this._client) {
      this._client = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          storage: {
            getItem: (key) => _getCookieValue(key),
            setItem: (key, value) => _setCookieValue(key, value, 7),
            removeItem: (key) => _removeCookie(key)
          }
        }
      });
    }
    return this._client;
  },

  async init() {
    if (this.ready) return this.ready;
    this.ready = (async () => {
      const cfg = window.CBS_CONFIG || {};
      if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
        _configMissingError();
        return;
      }

      const safeRefresh = async (name, fn) => {
        try {
          await fn();
        } catch (e) {
          console.warn(`[db] Failed to refresh ${name}:`, e);
        }
      };

      await Promise.all([
        safeRefresh('users', () => this.refreshUsers()),
        safeRefresh('projects', () => this.refreshProjects()),
        safeRefresh('tasks', () => this.refreshTasks()),
        safeRefresh('milestones', () => this.refreshMilestones()),
        safeRefresh('channels', () => this.refreshChannels()),
        safeRefresh('messages', () => this.refreshMessages()),
        safeRefresh('notifications', () => this.refreshNotifications()),
        safeRefresh('activity_logs', () => this.refreshActivityLogs()),
        safeRefresh('settings', () => this.refreshSettings()),
        safeRefresh('sessions', () => this.refreshSessions())
      ]);

      this.setupRealtime();
    })();
    return this.ready;
  },

  async _fetchAll(table) {
    const { data, error } = await this.supabase.from(table).select('*');
    if (error) {
      console.error(`Supabase fetch error for ${table}:`, error);
      try {
        const backup = localStorage.getItem(`cbs_backup_${table}`);
        if (backup) {
          console.log(`[db] Restored backup cache for ${table} from local storage.`);
          return JSON.parse(backup);
        }
      } catch (e) {
        console.warn(`[db] Failed to parse backup cache for ${table}:`, e);
      }
      return [];
    }
    const mapped = (data || []).map(row => this._mapFromDb(table, row));
    try {
      localStorage.setItem(`cbs_backup_${table}`, JSON.stringify(mapped));
    } catch (e) {
      console.warn(`[db] Failed to write backup cache for ${table}:`, e);
    }
    return mapped;
  },

  async _insert(table, payload) {
    const dbPayload = Array.isArray(payload) ? payload.map(item => this._mapToDb(table, item)) : this._mapToDb(table, payload);
    const { data, error } = await this.supabase.from(table).insert(dbPayload).select();
    if (error) {
      console.error(`Supabase insert error for ${table}:`, error);
      throw error;
    }
    const result = Array.isArray(data) ? data[0] : data;
    return this._mapFromDb(table, result);
  },

  async _update(table, id, payload) {
    const dbPayload = this._mapToDb(table, payload);
    const { data, error } = await this.supabase.from(table).update(dbPayload).eq('id', id).select();
    if (error) {
      console.error(`Supabase update error for ${table}:`, error);
      throw error;
    }
    const result = Array.isArray(data) ? data[0] : data;
    return this._mapFromDb(table, result);
  },

  async _delete(table, id) {
    const { error } = await this.supabase.from(table).delete().eq('id', id);
    if (error) {
      console.error(`Supabase delete error for ${table}:`, error);
      throw error;
    }
    return true;
  },

  _defaultSettings() {
    return {
      appearance: 'light',
      notifications: { email: true, push: true, alerts: true },
      privacy: { showStatus: true, shareAnalytics: true },
      security: { passwordExpiry: 90, requireMfa: false }
    };
  },

  async refreshUsers() {
    const res = await this._fetchAll('users');
    if (res && res.length > 0) this._cache.users = res;
    return this._cache.users;
  },

  async refreshProjects() {
    const res = await this._fetchAll('projects');
    if (res && res.length > 0) this._cache.projects = res;
    return this._cache.projects;
  },

  async refreshTasks() {
    const res = await this._fetchAll('tasks');
    if (res && res.length > 0) this._cache.tasks = res;
    return this._cache.tasks;
  },

  async refreshMilestones() {
    const res = await this._fetchAll('milestones');
    if (res && res.length > 0) this._cache.milestones = res;
    return this._cache.milestones;
  },

  async refreshChannels() {
    const res = await this._fetchAll('channels');
    if (res && res.length > 0) this._cache.channels = res;
    return this._cache.channels;
  },

  async refreshMessages() {
    const res = await this._fetchAll('messages');
    if (res && res.length > 0) this._cache.messages = res;
    return this._cache.messages;
  },

  async refreshNotifications() {
    const res = await this._fetchAll('notifications');
    if (res && res.length > 0) this._cache.notifications = res;
    return this._cache.notifications;
  },

  async refreshActivityLogs() {
    const res = await this._fetchAll('activity_logs');
    if (res && res.length > 0) this._cache.activity_logs = res;
    return this._cache.activity_logs;
  },

  async refreshSettings() {
    const rows = await this._fetchAll('settings');
    if (rows && rows.length > 0) {
      const primary = rows.find(r => r.id === 'settings');
      if (primary) {
        this._cache.settings = primary;
        try {
          localStorage.setItem('cbs_theme_preference', primary.appearance);
        } catch (e) {}
      }
    }
    if (!this._cache.settings) {
      const defaults = this._defaultSettings();
      try {
        const created = await this._insert('settings', [{ id: 'settings', ...defaults }]);
        this._cache.settings = created || { ...defaults, id: 'settings' };
        try {
          localStorage.setItem('cbs_theme_preference', this._cache.settings.appearance);
        } catch (e) {}
      } catch (e) {
        this._cache.settings = { ...defaults, id: 'settings' };
      }
    }
    return this._cache.settings;
  },

  async refreshSessions() {
    const res = await this._fetchAll('sessions');
    if (res && res.length > 0) this._cache.sessions = res;
    return this._cache.sessions;
  },

  getUsers() {
    return this._cache.users || [];
  },

  getUserById(id) {
    return this.getUsers().find(u => u.id === id);
  },

  getUserByEmail(email) {
    return this.getUsers().find(u => u.email?.toLowerCase() === email?.toLowerCase());
  },

  async saveUser(user) {
    const isNew = !user.id;
    const nextUser = {
      ...user,
      id: user.id || `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdDate: user.createdDate || new Date().toISOString(),
      status: user.status || 'active',
      avatar: user.avatar || 'assets/avatar.png'
    };

    const saved = isNew
      ? await this._insert('users', [nextUser])
      : await this._update('users', nextUser.id, nextUser);

    if (saved) {
      const current = this.getUsers();
      if (isNew) {
        current.push(saved);
      } else {
        const idx = current.findIndex(u => u.id === saved.id);
        if (idx !== -1) current[idx] = saved;
      }

      if (window.cbsAuth) {
        const currentUser = window.cbsAuth.getCurrentUser();
        if (currentUser && currentUser.id === saved.id) {
          window.cbsAuth.updateSession(saved);
        }
      }

      this.addActivityLog(saved.id, `${saved.name} user record saved.`, 'User Management').catch(err => console.warn(err));
      this.addNotification('Security', isNew ? 'Workspace Member Enrolled' : 'Workspace Member Updated', `${saved.name} user account metadata saved.`, 'Medium').catch(err => console.warn(err));
    }
    return saved;
  },

  async deleteUser(id) {
    const user = this.getUserById(id);
    if (!user) return false;
    await this._delete('users', id);
    this._cache.users = this.getUsers().filter(u => u.id !== id);
    this.addActivityLog(id, `User account ${user.name} deleted from system.`, 'User Management').catch(err => console.warn(err));
    this.addNotification('Security', 'Workspace Member Removed', `${user.name} was removed from the active directory.`, 'High').catch(err => console.warn(err));
    return true;
  },

  async setUserStatus(id, status) {
    const user = this.getUserById(id);
    if (!user) return false;

    const updated = await this._update('users', id, { ...user, status });
    if (!updated) return false;

    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) users[idx] = updated;

    this.addActivityLog(id, `User ${updated.name} status updated to ${status}.`, 'User Management').catch(err => console.warn(err));
    this.addNotification('Security', 'User Access Modified', `${updated.name} status marked ${status}.`, status === 'suspended' ? 'High' : 'Medium').catch(err => console.warn(err));
    return true;
  },

  getProjects() {
    return this._cache.projects || [];
  },

  getProjectById(id) {
    return this.getProjects().find(p => p.id === id);
  },

  async saveProject(project) {
    const isNew = !project.id;
    const nextProject = {
      ...project,
      id: project.id || `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      progress: project.progress || 0,
      documents: project.documents || [],
      timeline: project.timeline || [{ text: 'Project Created & Metadata Enrolled', date: new Date().toISOString(), type: 'system' }]
    };

    const saved = isNew
      ? await this._insert('projects', [nextProject])
      : await this._update('projects', nextProject.id, nextProject);

    if (saved) {
      const current = this.getProjects();
      if (isNew) current.push(saved);
      else {
        const idx = current.findIndex(p => p.id === saved.id);
        if (idx !== -1) current[idx] = saved;
      }
      this.addActivityLog(saved.ownerId || 'System', isNew ? `Created project: ${saved.name}` : `Modified project: ${saved.name}`, 'Project').catch(err => console.warn(err));
      this.addNotification('Projects', isNew ? 'New Project Enrolled' : 'Project Updated', `Project "${saved.name}" has been saved.`, 'High').catch(err => console.warn(err));
    }
    return saved;
  },

  async deleteProject(id) {
    const project = this.getProjectById(id);
    if (!project) return false;
    await this._delete('projects', id);
    this._cache.projects = this.getProjects().filter(p => p.id !== id);
    await this.deleteMilestonesByProject(id);
    this.addActivityLog('System', `Destroyed project record: ${project.name}`, 'Project').catch(err => console.warn(err));
    this.addNotification('Projects', 'Project Destroyed', `Project "${project.name}" and associated elements removed.`, 'High').catch(err => console.warn(err));
    return true;
  },

  getMilestones() {
    return this._cache.milestones || [];
  },

  getMilestonesByProject(projId) {
    return this.getMilestones().filter(m => m.projectId === projId);
  },

  async saveMilestone(milestone) {
    const isNew = !milestone.id;
    const nextMilestone = {
      ...milestone,
      id: milestone.id || `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      completionPct: milestone.completionPct || 0
    };

    const saved = isNew
      ? await this._insert('milestones', [nextMilestone])
      : await this._update('milestones', nextMilestone.id, nextMilestone);

    if (saved) {
      const current = this.getMilestones();
      if (isNew) current.push(saved);
      else {
        const idx = current.findIndex(m => m.id === saved.id);
        if (idx !== -1) current[idx] = saved;
      }
      this.addActivityLog('System', `Milestone saved: ${saved.name}`, 'Project').catch(err => console.warn(err));
      this.addNotification('Projects', 'Milestone Updated', `Milestone "${saved.name}" was saved.`, 'Medium').catch(err => console.warn(err));
      await this.appendProjectTimeline(saved.projectId, isNew ? `Milestone Added: ${saved.name}` : `Milestone Updated: ${saved.name}`);
      await this.recalculateProjectMetrics(saved.projectId);
    }
    return saved;
  },

  async deleteMilestone(id) {
    const milestone = this.getMilestones().find(m => m.id === id);
    if (!milestone) return false;
    await this._delete('milestones', id);
    this._cache.milestones = this.getMilestones().filter(m => m.id !== id);
    await this.addActivityLog('System', `Removed milestone record: ${milestone.name}`, 'Project');
    await this.recalculateProjectMetrics(milestone.projectId);
    return true;
  },

  async deleteMilestonesByProject(projId) {
    const milestones = this.getMilestones().filter(m => m.projectId === projId);
    await Promise.all(milestones.map(m => this._delete('milestones', m.id)));
    this._cache.milestones = this.getMilestones().filter(m => m.projectId !== projId);
  },

  getTasks() {
    return this._cache.tasks || [];
  },

  getTaskById(id) {
    return this.getTasks().find(t => t.id === id);
  },

  async saveTask(task) {
    const isNew = !task.id;
    const nextTask = {
      ...task,
      id: task.id || `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      progress: task.progress || 0,
      comments: task.comments || [],
      attachments: task.attachments || []
    };

    const saved = isNew
      ? await this._insert('tasks', [nextTask])
      : await this._update('tasks', nextTask.id, nextTask);

    if (saved) {
      const current = this.getTasks();
      if (isNew) current.push(saved);
      else {
        const idx = current.findIndex(t => t.id === saved.id);
        if (idx !== -1) current[idx] = saved;
      }
      if (!isNew && task.status && this.getTaskById(saved.id)?.status !== task.status) {
        this.addActivityLog(saved.assigneeId || 'System', `Task "${saved.title}" moved to ${saved.status}`, 'Task').catch(err => console.warn(err));
      }
      this.addNotification('Tasks', isNew ? 'New Task Assigned' : 'Task Updated', `Task "${saved.title}" has been saved.`, 'Medium').catch(err => console.warn(err));
      await this.appendProjectTimeline(saved.projectId, isNew ? `Task Created: ${saved.title}` : `Task Updated: ${saved.title}`);
      await this.recalculateProjectMetrics(saved.projectId);
    }
    return saved;
  },

  async deleteTask(id) {
    const task = this.getTaskById(id);
    if (!task) return false;
    await this._delete('tasks', id);
    this._cache.tasks = this.getTasks().filter(t => t.id !== id);
    this.addActivityLog('System', `Deleted task backlog: ${task.title}`, 'Task').catch(err => console.warn(err));
    this.addNotification('Tasks', 'Task Wiped', `Task "${task.title}" has been deleted from active backlog.`, 'Medium').catch(err => console.warn(err));
    await this.recalculateProjectMetrics(task.projectId);
    return true;
  },

  async recalculateProjectMetrics(projId) {
    if (!projId) return;
    const project = this.getProjectById(projId);
    if (!project) return;

    const projTasks = this.getTasks().filter(t => t.projectId === projId);
    const milestones = this.getMilestonesByProject(projId);

    let avgProgress = 0;
    if (projTasks.length > 0) {
      const total = projTasks.reduce((sum, t) => sum + (Number(t.progress) || 0), 0);
      avgProgress = Math.round(total / projTasks.length);
    } else if (milestones.length > 0) {
      const total = milestones.reduce((sum, m) => sum + (Number(m.completionPct) || 0), 0);
      avgProgress = Math.round(total / milestones.length);
    }

    const updatedProject = { ...project, progress: avgProgress };
    if (avgProgress === 100) {
      updatedProject.status = 'Completed';
      updatedProject.completionDate = new Date().toISOString().split('T')[0];
      await this.appendProjectTimeline(projId, 'Project Completed: All tasks deliverable!');
    } else if (avgProgress > 0 && project.status === 'Planning') {
      updatedProject.status = 'In Progress';
    }

    await this.saveProject(updatedProject);
  },

  async appendProjectTimeline(projId, text) {
    if (!projId || !text) return;
    const project = this.getProjectById(projId);
    if (!project) return;

    const timeline = [
      { text, date: new Date().toISOString(), type: 'project' },
      ...(project.timeline || [])
    ];

    await this.saveProject({ ...project, timeline });
  },

  getChannels() {
    return this._cache.channels || [];
  },

  async saveChannel(channel) {
    const isNew = !channel.id;
    const nextChannel = {
      ...channel,
      id: channel.id || `ch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      isDefault: channel.isDefault || false
    };

    const saved = isNew
      ? await this._insert('channels', [nextChannel])
      : await this._update('channels', nextChannel.id, nextChannel);

    if (saved) {
      const current = this.getChannels();
      if (isNew) current.push(saved);
      else {
        const idx = current.findIndex(c => c.id === saved.id);
        if (idx !== -1) current[idx] = saved;
      }
      await this.addActivityLog('System', `Chat channel saved: #${saved.name}`, 'System');
      await this.addNotification('Messages', 'Chat Channel Updated', `Channel #${saved.name} has been saved.`, 'Low');
    }
    return saved;
  },

  async deleteChannel(id) {
    const channel = this.getChannels().find(c => c.id === id);
    if (!channel || channel.isDefault) return false;
    await this._delete('channels', id);
    this._cache.channels = this.getChannels().filter(c => c.id !== id);
    await Promise.all(this.getMessages().filter(m => m.channelId === id).map(m => this._delete('messages', m.id)));
    this._cache.messages = this.getMessages().filter(m => m.channelId !== id);
    await this.addActivityLog('System', `Deleted chat channel: #${channel.name}`, 'System');
    return true;
  },

  getMessages() {
    return this._cache.messages || [];
  },

  getMessagesByChannel(channelId) {
    return this.getMessages().filter(m => m.channelId === channelId);
  },

  async addChatMessage(channelId, senderId, text, reactions = {}) {
    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      channelId,
      senderId,
      text,
      timestamp: new Date().toISOString(),
      reactions
    };
    const saved = await this._insert('messages', [newMsg]);
    if (saved) this._cache.messages.push(saved);
    return saved;
  },

  async saveMessage(message) {
    const saved = await this._update('messages', message.id, message);
    if (saved) {
      const current = this.getMessages();
      const idx = current.findIndex(m => m.id === saved.id);
      if (idx !== -1) current[idx] = saved;
    }
    return saved;
  },

  async deleteMessage(id) {
    await this._delete('messages', id);
    this._cache.messages = this.getMessages().filter(m => m.id !== id);
  },

  getNotifications() {
    return this._cache.notifications || [];
  },

  async setNotifications(notifications) {
    if (!Array.isArray(notifications)) return;
    await Promise.all(notifications.map(n => this._upsertNotification(n)));
    this._cache.notifications = notifications;
  },

  async _upsertNotification(notification) {
    if (!notification.id) notification.id = `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const dbPayload = this._mapToDb('notifications', notification);
    const { error } = await this.supabase.from('notifications').upsert(dbPayload, { onConflict: 'id' });
    if (error) {
      console.error('Supabase notification upsert error:', error);
      throw error;
    }
    return notification;
  },

  async addNotification(category, title, message, priority = 'Medium') {
    const newNot = {
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      category,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      priority
    };
    const saved = await this._insert('notifications', [newNot]);
    if (saved) {
      this._cache.notifications.unshift(saved);
      if (this._cache.notifications.length > 50) this._cache.notifications.pop();
      window.dispatchEvent(new CustomEvent('cbs-enterprise-notification', { detail: saved }));
    }
    return saved;
  },

  async markNotificationRead(id) {
    const notif = this.getNotifications().find(n => n.id === id);
    if (!notif) return;
    const updated = await this._update('notifications', id, { ...notif, read: true });
    if (updated) {
      const idx = this.getNotifications().findIndex(n => n.id === id);
      if (idx !== -1) this._cache.notifications[idx] = updated;
    }
  },

  async saveNotification(notification) {
    if (!notification || !notification.id) return;
    const updated = await this._update('notifications', notification.id, notification);
    if (updated) {
      const idx = this.getNotifications().findIndex(n => n.id === notification.id);
      if (idx !== -1) this._cache.notifications[idx] = updated;
    }
  },

  async deleteNotification(id) {
    await this._delete('notifications', id);
    this._cache.notifications = this.getNotifications().filter(n => n.id !== id);
  },

  async markAllNotificationsRead() {
    const unread = this.getNotifications().filter(n => !n.read);
    await Promise.all(unread.map(n => this._update('notifications', n.id, { ...n, read: true })));
    this._cache.notifications = this.getNotifications().map(n => ({ ...n, read: true }));
  },

  async clearNotifications() {
    await Promise.all(this.getNotifications().map(n => this._delete('notifications', n.id)));
    this._cache.notifications = [];
  },

  getActivityLogs() {
    return this._cache.activity_logs || [];
  },

  async addActivityLog(userId, text, type = 'System') {
    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      userId,
      text,
      timestamp: new Date().toISOString(),
      type
    };
    const saved = await this._insert('activity_logs', [newLog]);
    if (saved) {
      this._cache.activity_logs.unshift(saved);
      if (this._cache.activity_logs.length > 100) this._cache.activity_logs.pop();
    }
    return saved;
  },

  getSettings() {
    return this._cache.settings || this._defaultSettings();
  },

  async saveSettings(settings) {
    const current = this.getSettings();
    const updated = { ...current, ...settings, id: 'settings' };
    const saved = await this._upsertSetting(updated);
    this._cache.settings = saved;
    try {
      localStorage.setItem('cbs_theme_preference', saved.appearance);
    } catch (e) {}
    return saved;
  },

  async _upsertSetting(setting) {
    const dbPayload = this._mapToDb('settings', setting);
    const { error } = await this.supabase.from('settings').upsert(dbPayload, { onConflict: 'id' });
    if (error) {
      console.error('Supabase settings upsert error:', error);
      throw error;
    }
    return setting;
  },

  getSessions() {
    return this._cache.sessions || [];
  },

  async addSessionRecord(userId, ip = '127.0.0.1', status = 'Success') {
    const newSession = {
      id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      loginTime: new Date().toISOString(),
      ip,
      status
    };
    const saved = await this._insert('sessions', [newSession]);
    if (saved) {
      this._cache.sessions.unshift(saved);
      if (this._cache.sessions.length > 50) this._cache.sessions.pop();
    }
    return saved;
  },

  async saveSession(session) {
    if (!session || !session.id) return;
    const updated = await this._update('sessions', session.id, session);
    if (updated) {
      const idx = this.getSessions().findIndex(s => s.id === session.id);
      if (idx !== -1) this._cache.sessions[idx] = updated;
    }
    return updated;
  },

  async deleteSession(id) {
    await this._delete('sessions', id);
    this._cache.sessions = this.getSessions().filter(s => s.id !== id);
  },

  async updateSessionStatus(sessionId, status) {
    const session = this.getSessions().find(s => s.id === sessionId);
    if (!session) return;
    return this.saveSession({ ...session, status });
  },

  setupRealtime() {
    try {
      const client = this.supabase;
      const tables = ['users', 'projects', 'tasks', 'milestones', 'channels', 'messages', 'notifications', 'activity_logs', 'settings'];
      
      tables.forEach(table => {
        client
          .channel(`public:${table}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: table },
            async (payload) => {
              console.log(`[Realtime] Change detected in ${table}:`, payload);
              
              // Refresh the specific cache
              switch (table) {
                case 'users':
                  await this.refreshUsers();
                  break;
                case 'projects':
                  await this.refreshProjects();
                  break;
                case 'tasks':
                  await this.refreshTasks();
                  break;
                case 'milestones':
                  await this.refreshMilestones();
                  break;
                case 'channels':
                  await this.refreshChannels();
                  break;
                case 'messages':
                  await this.refreshMessages();
                  break;
                case 'notifications':
                  await this.refreshNotifications();
                  if (payload.eventType === 'INSERT') {
                    const saved = this._mapFromDb('notifications', payload.new);
                    if (window.cbsApp && typeof window.cbsApp.handleIncomingNotification === 'function') {
                      window.cbsApp.handleIncomingNotification(saved);
                    } else {
                      window.dispatchEvent(new CustomEvent('cbs-enterprise-notification', { detail: saved }));
                    }
                  }
                  break;
                case 'settings':
                  await this.refreshSettings();
                  break;
                case 'activity_logs':
                  await this.refreshActivityLogs();
                  break;
              }
              
              // Trigger app-level UI synchronization
              if (window.cbsApp && typeof window.cbsApp.sync === 'function') {
                window.cbsApp.sync();
              }
            }
          )
          .subscribe((status) => {
            console.log(`[Realtime] Subscription status for ${table}:`, status);
          });
      });
    } catch (e) {
      console.warn('[Realtime] Failed to setup realtime subscription:', e);
    }
  }

};

window.cbsDB = db;
