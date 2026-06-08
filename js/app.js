/**
 * Cyber Black Squad – Central Orchestrator & Router Controller
 * Links all Phase 3.5 modular scripts (projects, tasks, chat, admin, profile)
 * into a single unified client-side application experience.
 */

// ==========================================
// 1. GLOBAL WORKSPACE APPLICATION STATE     
// ==========================================
let activeView = 'dashboard';

// Always reset activeView on app initialization to prevent showing last viewed page
function resetActiveViewState() {
  activeView = 'dashboard';
  // Clear any stored view preference from browser history
  if (sessionStorage.getItem('cbs_activeView')) {
    sessionStorage.removeItem('cbs_activeView');
  }
}
let charts = {}; // references to Chart.js elements

document.addEventListener('DOMContentLoaded', () => {
  // Enforce session authenticity guards
  if (!window.cbsAuth || !window.cbsAuth.isAuthenticated()) {
    window.location.href = 'home.html';
    return;
  }

  // Always reset active view to prevent showing last viewed page on app restart
  resetActiveViewState();

  // Load authenticated session profile
  const user = window.cbsAuth.getCurrentUser();
  
  // Set up layout, routers, theme overrides, and events listeners
  initMainLayout(user);
  initSidebarRouter(user);
  initGlobalEventListeners();
  initSmartSearchEngine();
  
  // Initial Sync - Always start from dashboard
  switchActiveView('dashboard');
  window.notificationsModule?.syncBellIndicator();

  // Background random activity logger simulator
  startActivitySimulatorService();
});

// ==========================================
// 2. CORE WORKSPACE LAYOUT & ROLE ASSIGN    
// ==========================================
function initMainLayout(user) {
  // Profile elements fill
  const elements = {
    sidebarUserName: user.name,
    sidebarUserRole: user.title || user.role,
    sidebarUserAvatar: user.avatar,
    topbarUserAvatar: user.avatar
  };

  Object.keys(elements).forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (el.tagName === 'IMG') el.src = elements[id];
      else el.textContent = elements[id];
    }
  });

  // Enforce Appearance settings (Dark Mode)
  const settings = window.cbsDB.getSettings();
  applyWorkspaceTheme(settings.appearance);

  // Collapsible Menu Sidebar Drawer logic
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  const toggleIcon = document.getElementById('toggleIcon');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      const isCol = sidebar.classList.contains('collapsed');
      if (toggleIcon) toggleIcon.className = isCol ? 'fa-solid fa-angle-right' : 'fa-solid fa-angle-left';
      toggleBtn.title = isCol ? 'Expand Menu' : 'Collapse Menu';
    });
  }

  // Enforce 3-tier / upgraded Role Access Navigation boundaries
  const userRole = user.role || 'Team Member';
  const roleAllowedViews = {
    'Admin': ['dashboard', 'projects', 'tasks', 'team', 'directory', 'notifications', 'analytics', 'profile', 'settings', 'admin'],
    'Founder': ['dashboard', 'projects', 'tasks', 'team', 'directory', 'notifications', 'analytics', 'profile', 'settings'],
    'Manager': ['dashboard', 'projects', 'tasks', 'team', 'directory', 'notifications', 'analytics', 'profile', 'settings'],
    'Team Member': ['dashboard', 'projects', 'tasks', 'team', 'directory', 'notifications', 'analytics', 'profile', 'settings']
  };
  const allowed = roleAllowedViews[userRole] || roleAllowedViews['Team Member'];

  document.querySelectorAll('.sidebar-menu-item').forEach(item => {
    const view = item.getAttribute('data-view');
    if (view) {
      if (allowed.includes(view)) {
        if (view === 'admin') {
          item.style.setProperty('display', 'block', 'important');
        } else {
          item.style.display = '';
        }
      } else {
        item.style.setProperty('display', 'none', 'important');
      }
    }
  });
}

// Global theme control switcher
function applyWorkspaceTheme(theme) {
  const body = document.body;
  if (theme === 'dark') {
    body.classList.add('dark-theme');
  } else if (theme === 'light') {
    body.classList.remove('dark-theme');
  } else if (theme === 'auto') {
    // Auto-schedule theme evaluates local time hours
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 18;
    if (isNight) body.classList.add('dark-theme');
    else body.classList.remove('dark-theme');
  }
}

// ==========================================
// 3. TAB CONTROLLER ROUTER ENGINE           
// ==========================================
function initSidebarRouter(user) {
  const menuItems = document.querySelectorAll('.sidebar-menu-item');
  
  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = item.getAttribute('data-view');
      if (targetView) {
        switchActiveView(targetView);
      }
    });
  });

  // Logout binder
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Verify: Do you want to sign out of active session?')) {
        window.cbsAuth.logout();
        window.location.href = 'home.html?v=' + Date.now();
      }
    });
  }
}

function switchActiveView(viewName) {
  const user = window.cbsAuth.getCurrentUser();
  const userRole = user ? user.role : 'Team Member';
  const roleAllowedViews = {
    'Admin': ['dashboard', 'projects', 'tasks', 'team', 'directory', 'notifications', 'analytics', 'profile', 'settings', 'admin'],
    'Founder': ['dashboard', 'projects', 'tasks', 'team', 'directory', 'notifications', 'analytics', 'profile', 'settings'],
    'Manager': ['dashboard', 'projects', 'tasks', 'team', 'directory', 'notifications', 'analytics', 'profile', 'settings'],
    'Team Member': ['dashboard', 'projects', 'tasks', 'team', 'directory', 'notifications', 'analytics', 'profile', 'settings']
  };
  const allowed = roleAllowedViews[userRole] || roleAllowedViews['Team Member'];

  if (!allowed.includes(viewName)) {
    console.warn(`Access denied for role ${userRole} to view ${viewName}`);
    if (viewName !== 'dashboard') {
      switchActiveView('dashboard');
    }
    return;
  }

  if (!document.getElementById(`view-${viewName}`)) return;
  activeView = viewName;

  // Sync sidebar active highlight styles
  document.querySelectorAll('.sidebar-menu-item').forEach(item => {
    if (item.getAttribute('data-view') === viewName) item.classList.add('active');
    else item.classList.remove('active');
  });

  // Toggle active view pane
  document.querySelectorAll('.content-view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${viewName}`).classList.add('active');

  // Page title update
  const titleMap = {
    dashboard: 'Dashboard Overview',
    projects: 'Projects Management',
    tasks: 'Sprint Tasks Backlog',
    team: 'Discussion general-workspace',
    directory: 'Team Directory',
    notifications: 'Notifications Center',
    analytics: 'Growth Analytics & Statistics',
    profile: 'Profile Configuration',
    settings: 'Workspace Preferences',
    admin: 'Administrative Control Center'
  };
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = titleMap[viewName] || 'Cyber Black Squad Workspace';

  // Load modules details
  loadModuleRenderer();
}

function loadModuleRenderer() {
  switch (activeView) {
    case 'dashboard':
      renderDashboardView();
      break;
    case 'projects':
      window.projectsModule?.render();
      break;
    case 'tasks':
      window.tasksModule?.render();
      break;
    case 'team':
      window.chatModule?.render();
      break;
    case 'directory':
      window.cbsDirectory?.render();
      break;
    case 'notifications':
      window.notificationsModule?.render();
      break;
    case 'analytics':
      window.analyticsModule?.render();
      break;
    case 'profile':
      window.profileModule?.render();
      break;
    case 'settings':
      renderSettingsForm();
      break;
    case 'admin':
      window.adminModule?.render();
      break;
  }
}

// ==========================================
// 4. FOUNDER DASHBOARD & LOGIC VIEWPORTS    
// ==========================================
function renderDashboardView() {
  const user = window.cbsAuth.getCurrentUser();
  const isAdmin = window.cbsAuth.isAdmin();

  // 1. RENDER FOUNDER DASHBOARD LAYER ABOVE STANDARD (IF ADMIN OR FOUNDER)
  const dashboardContainer = document.getElementById('view-dashboard');
  if (!dashboardContainer) return;

  // Query database statistics parameters
  const users = window.cbsDB.getUsers();
  const projects = window.cbsDB.getProjects().filter(p => p.status !== 'Archived');
  const tasks = window.cbsDB.getTasks();
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const open = tasks.filter(t => t.status !== 'Completed').length;
  const onlineCount = users.filter(u => u.status === 'active').length; // online simulator

  // Calculate project completion average
  let avgCompletion = 0;
  if (projects.length > 0) {
    avgCompletion = Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length);
  }

  // Prepend Founder Quick Actions if element placeholder not loaded yet
  let founderHeader = document.getElementById('founderDashboardHeaderWidget');
  const canEdit = window.cbsAuth.canEdit();
  if (canEdit) {
    if (!founderHeader) {
      founderHeader = document.createElement('div');
      founderHeader.id = 'founderDashboardHeaderWidget';
      founderHeader.style = 'margin-bottom: 24px; animation: fadeIn 0.3s ease;';
      dashboardContainer.insertBefore(founderHeader, dashboardContainer.firstChild);
    }

    const isActualAdmin = window.cbsAuth.isAdmin();
    const widgetTitle = isActualAdmin ? 'Founder & Administrative Control Dashboard' : 'Founder Workspace Dashboard';
    const widgetSubtitle = isActualAdmin ? `Privileged view enabled for: <strong>${user.name}</strong> (${user.role})` : `Privileged workspace view enabled for: <strong>${user.name}</strong> (${user.role})`;
    const badgeText = isActualAdmin ? 'Workspace Overlord' : 'Workspace Founder';
    
    let quickActionsHtml = `
      <button onclick="projectsModule.openCreateModal()" class="badge badge-blue" style="cursor:pointer; padding:6px 12px; font-size:11.5px; font-weight:600;"><i class="fa-solid fa-folder-plus"></i> New Project</button>
      <button onclick="tasksModule.openCreateModal()" class="badge badge-purple" style="cursor:pointer; padding:6px 12px; font-size:11.5px; font-weight:600;"><i class="fa-solid fa-plus"></i> Assign Task</button>
    `;
    if (isActualAdmin) {
      quickActionsHtml += `
        <button onclick="switchActiveView('admin'); adminModule.switchAdminTab('users'); adminModule.openCreateUserFormInline();" class="badge badge-green" style="cursor:pointer; padding:6px 12px; font-size:11.5px; font-weight:600;"><i class="fa-solid fa-user-plus"></i> Enroll Account</button>
        <button onclick="switchActiveView('admin'); adminModule.switchAdminTab('broadcasts');" class="badge badge-orange" style="cursor:pointer; padding:6px 12px; font-size:11.5px; font-weight:600;"><i class="fa-solid fa-bullhorn"></i> Global Broadcast</button>
      `;
    }

    founderHeader.innerHTML = `
      <div class="panel-card" style="background:var(--bg-card); border:1px solid var(--border-color); padding:20px; border-radius:var(--radius-lg); box-shadow:var(--shadow-sm); display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h3 style="font-size:16px; font-weight:700;"><i class="fa-solid fa-user-shield" style="color:var(--secondary-color); margin-right:8px;"></i>${widgetTitle}</h3>
            <span style="font-size:11.5px; color:var(--text-muted);">${widgetSubtitle}</span>
          </div>
          <span class="badge badge-purple" style="font-size:10px; padding:3px 8px; font-weight:700; text-transform:uppercase;">${badgeText}</span>
        </div>
        
        <!-- Founder Dashboard Mini Widgets Row -->
        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:12px;">
          <div style="padding:10px; background:var(--bg-main); border:1px solid var(--border-color); border-radius:var(--radius-md); text-align:center;">
            <div style="font-size:20px; font-family:'Outfit'; font-weight:800; color:var(--primary-color);">${users.length}</div>
            <div style="font-size:10px; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Roster Users</div>
          </div>
          <div style="padding:10px; background:var(--bg-main); border:1px solid var(--border-color); border-radius:var(--radius-md); text-align:center;">
            <div style="font-size:20px; font-family:'Outfit'; font-weight:800; color:var(--secondary-color);">${projects.length}</div>
            <div style="font-size:10px; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Active Projects</div>
          </div>
          <div style="padding:10px; background:var(--bg-main); border:1px solid var(--border-color); border-radius:var(--radius-md); text-align:center;">
            <div style="font-size:20px; font-family:'Outfit'; font-weight:800; color:var(--color-success);">${avgCompletion}%</div>
            <div style="font-size:10px; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Milestones Ratio</div>
          </div>
          <div style="padding:10px; background:var(--bg-main); border:1px solid var(--border-color); border-radius:var(--radius-md); text-align:center;">
            <div style="font-size:20px; font-family:'Outfit'; font-weight:800; color:var(--color-danger);">${open}</div>
            <div style="font-size:10px; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Pending Tasks</div>
          </div>
        </div>

        <!-- Founder Quick Actions buttons -->
        <div style="display:flex; gap:10px; border-top:1px dashed var(--border-color); padding-top:14px; flex-wrap:wrap;">
          ${quickActionsHtml}
        </div>
      </div>
    `;
  } else {
    // If regular user, ensure widget is removed
    if (founderHeader) founderHeader.remove();
  }

  // 2. SYNC METRICS COUNTERS
  const syncId = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  syncId('dash-total-projects', projects.length);
  syncId('dash-total-tasks', tasks.length);
  syncId('dash-pending-tasks', open);
  syncId('dash-total-team', users.length);
  syncId('dash-team-online', onlineCount);

  // Recalculate dynamic overall startup productivity score ratio
  const completedPct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
  const prodScore = document.getElementById('dash-productivity-score');
  if (prodScore) prodScore.textContent = `${completedPct}%`;

  // 3. RECENT ACTIVITY TIMELINE FEED LOGS RENDER
  const timeline = document.getElementById('dashboardActivityTimeline');
  if (timeline) {
    timeline.innerHTML = '';
    const logs = window.cbsDB.getActivityLogs().slice(0, 4);
    
    logs.forEach(log => {
      const rel = formatRelativeTime(log.timestamp);
      const div = document.createElement('div');
      div.className = 'timeline-item';
      div.innerHTML = `
        <div class="timeline-dot"></div>
        <span class="timeline-text">${log.text}</span>
        <span class="timeline-time"><i class="fa-regular fa-clock"></i> ${rel}</span>
      `;
      timeline.appendChild(div);
    });

    if (logs.length === 0) {
      timeline.innerHTML = '<p style="color:var(--text-light); text-align:center; padding:16px;">No recent workspace logs.</p>';
    }
  }

  // 4. CHART RE-DRAW (LINE GRAPH)
  window.analyticsModule?.renderWeeklyGrowthChart(window.cbsDB.getActivityLogs());
}

// ==========================================
// 5. MODULE 8: SYSTEM SETTINGS OVERRIDES    
// ==========================================
function renderSettingsForm() {
  const settings = window.cbsDB.getSettings();

  document.getElementById('set-notif-email').checked = settings.notifications.email;
  document.getElementById('set-notif-push').checked = settings.notifications.push;
  document.getElementById('set-notif-alerts').checked = settings.notifications.alerts;
  
  document.getElementById('set-priv-status').checked = settings.privacy.showStatus;
  document.getElementById('set-priv-share').checked = settings.privacy.shareAnalytics;

  // Set Appearance switcher active option
  const themeSel = document.getElementById('set-appearance-theme');
  if (themeSel) themeSel.value = settings.appearance || 'light';

  // Populate Security Session logs roster
  const sessionsList = document.getElementById('workspaceSessionsHistoryList');
  if (sessionsList) {
    sessionsList.innerHTML = '';
    const histories = window.cbsDB.getSessions();
    const team = window.cbsDB.getUsers();

    histories.forEach(s => {
      const u = team.find(us => us.id === s.userId) || { name: 'Member' };
      const isSuccess = s.status === 'Success';
      const badgeClass = isSuccess ? 'badge-green' : 'badge-red';

      const div = document.createElement('div');
      div.style = 'display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border:1px solid var(--border-color); border-radius:var(--radius-sm); font-size:12px; background:var(--bg-main); margin-bottom:6px;';
      div.innerHTML = `
        <div style="display:flex; gap:10px; align-items:center;">
          <i class="fa-solid fa-key" style="color: ${isSuccess ? 'var(--color-success)' : 'var(--color-danger)'};"></i>
          <div style="display:flex; flex-direction:column;">
            <span style="font-weight:700;">${u.name} (IP: ${s.ip})</span>
            <span style="font-size:10px; color:var(--text-light);">${new Date(s.loginTime).toLocaleString()}</span>
          </div>
        </div>
        <span class="badge ${badgeClass}" style="font-size:9.5px; padding:2px 6px;">${s.status}</span>
      `;
      sessionsList.appendChild(div);
    });
  }

  // Clear security inputs
  document.getElementById('set-pass-new').value = '';
  document.getElementById('set-pass-confirm').value = '';
}

function handleSaveSettings(e) {
  e.preventDefault();
  const alertDiv = document.getElementById('settingsAlert');
  const newPass = document.getElementById('set-pass-new').value;
  const confirmPass = document.getElementById('set-pass-confirm').value;

  const user = window.cbsAuth.getCurrentUser();

  // Validate passwords if entered
  if (newPass) {
    if (newPass.length < 6) {
      alertDiv.className = 'auth-alert danger';
      alertDiv.innerHTML = '<i class="fa-solid fa-circle-exclamation" style="margin-right: 6px;"></i> Security Override: Password must be at least 6 characters.';
      return;
    }
    if (newPass !== confirmPass) {
      alertDiv.className = 'auth-alert danger';
      alertDiv.innerHTML = '<i class="fa-solid fa-circle-exclamation" style="margin-right: 6px;"></i> Security Override: Passwords do not match.';
      return;
    }

    // Save Password to User Store
    const users = window.cbsDB.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx].password = newPass;
      localStorage.setItem('cbs_users_coll', JSON.stringify(users));
      window.cbsDB.addActivityLog(user.id, `${user.name} changed their session password override.`, 'Security');
    }
  }

  // Save Appearance, Notifications privacy toggles
  const updatedSettings = {
    appearance: document.getElementById('set-appearance-theme')?.value || 'light',
    notifications: {
      email: document.getElementById('set-notif-email').checked,
      push: document.getElementById('set-notif-push').checked,
      alerts: document.getElementById('set-notif-alerts').checked
    },
    privacy: {
      showStatus: document.getElementById('set-priv-status').checked,
      shareAnalytics: document.getElementById('set-priv-share').checked
    }
  };

  window.cbsDB.saveSettings(updatedSettings);
  window.cbsDB.addActivityLog(user.id, `${user.name} updated workspace appearance settings.`, 'System');

  // Apply Appearance Theme Changes
  applyWorkspaceTheme(updatedSettings.appearance);

  alertDiv.className = 'auth-alert success';
  alertDiv.innerHTML = '<i class="fa-solid fa-circle-check" style="margin-right: 6px;"></i> Workspace settings saved and loaded successfully!';
  
  setTimeout(() => {
    alertDiv.className = 'auth-alert';
    alertDiv.innerHTML = '';
    window.cbsApp?.sync();
  }, 2000);

  if (window.showToastNotification) window.showToastNotification('Settings Synced', 'Appearance tokens successfully loaded.');
}

// ==========================================
// 6. SMART DIALOG SEARCH ENGINE             
// ==========================================
function initSmartSearchEngine() {
  const searchInput = document.getElementById('globalSearchInput');
  if (!searchInput) return;

  // Add keydown listener to trigger categorized results popup on Enter press
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = searchInput.value.trim();
      if (val) triggerSmartSearchModal(val);
    }
  });
}

function triggerSmartSearchModal(query) {
  let modal = document.getElementById('smartSearchModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'smartSearchModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  const val = query.toLowerCase();

  // Query database arrays
  const users = window.cbsDB.getUsers().filter(u => u.name.toLowerCase().includes(val) || u.role.toLowerCase().includes(val));
  const projects = window.cbsDB.getProjects().filter(p => p.name.toLowerCase().includes(val) || p.description.toLowerCase().includes(val));
  const tasks = window.cbsDB.getTasks().filter(t => t.title.toLowerCase().includes(val) || t.description.toLowerCase().includes(val));
  const channels = window.cbsDB.getChannels().filter(c => c.name.toLowerCase().includes(val));
  const messages = window.cbsDB.getMessages().filter(m => m.text.toLowerCase().includes(val));
  const notifications = window.cbsDB.getNotifications().filter(n => n.title.toLowerCase().includes(val) || n.message.toLowerCase().includes(val));

  // Build categorizations HTML
  let resultsHtml = '';
  
  const appendSection = (title, array, icon, formatter) => {
    if (array.length === 0) return;
    resultsHtml += `
      <div style="margin-bottom:16px;">
        <h4 style="font-size:12px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px;"><i class="${icon}" style="margin-right:6px;"></i>${title} (${array.length})</h4>
        <div style="display:flex; flex-direction:column; gap:6px;">
          ${array.slice(0, 3).map(item => formatter(item)).join('')}
        </div>
      </div>
    `;
  };

  appendSection('Collaborators Directory', users, 'fa-solid fa-users', u => `
    <div onclick="switchActiveView('team'); document.getElementById('smartSearchModal').classList.remove('active');" style="display:flex; gap:10px; align-items:center; padding:8px 12px; background:var(--bg-main); border:1px solid var(--border-color); border-radius:var(--radius-sm); cursor:pointer;">
      <img src="${u.avatar}" class="avatar" style="width:20px; height:20px; border:none;">
      <span style="font-size:12.5px; font-weight:600;">${u.name} <span style="font-weight:normal; font-size:11px; color:var(--text-light); margin-left:6px;">${u.role}</span></span>
    </div>
  `);

  appendSection('Startup Projects', projects, 'fa-solid fa-briefcase', p => `
    <div onclick="switchActiveView('projects'); projectsModule.openDetailsModal('${p.id}'); document.getElementById('smartSearchModal').classList.remove('active');" style="padding:8px 12px; background:var(--bg-main); border:1px solid var(--border-color); border-radius:var(--radius-sm); cursor:pointer;">
      <div style="font-weight:600; font-size:12.5px; color:var(--primary-color);">${p.name}</div>
      <div style="font-size:11px; color:var(--text-muted); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${p.description}</div>
    </div>
  `);

  appendSection('Backlog Tasks', tasks, 'fa-solid fa-list-check', t => `
    <div onclick="switchActiveView('tasks'); tasksModule.openDetailsModal('${t.id}'); document.getElementById('smartSearchModal').classList.remove('active');" style="padding:8px 12px; background:var(--bg-main); border:1px solid var(--border-color); border-radius:var(--radius-sm); cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
      <span style="font-weight:600; font-size:12.5px;">${t.title}</span>
      <span class="badge badge-purple" style="font-size:9.5px; padding:2px 6px;">${t.status}</span>
    </div>
  `);

  appendSection('Messages Discussions Logs', messages, 'fa-solid fa-comments', m => `
    <div onclick="switchActiveView('team'); chatModule.switchChannel(null, '${m.channelId}'); document.getElementById('smartSearchModal').classList.remove('active');" style="padding:8px 12px; background:var(--bg-main); border:1px solid var(--border-color); border-radius:var(--radius-sm); cursor:pointer;">
      <div style="font-size:12px; line-height:1.4;">"${m.text.substring(0, 80)}..."</div>
    </div>
  `);

  appendSection('System Notifications', notifications, 'fa-solid fa-bell', n => `
    <div onclick="switchActiveView('notifications'); document.getElementById('smartSearchModal').classList.remove('active');" style="padding:8px 12px; background:var(--bg-main); border:1px solid var(--border-color); border-radius:var(--radius-sm); cursor:pointer;">
      <div style="font-size:12px; font-weight:600;">${n.title}</div>
      <div style="font-size:11px; color:var(--text-light);">${n.message}</div>
    </div>
  `);

  if (!resultsHtml) {
    resultsHtml = `
      <div style="text-align:center; padding:32px;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size:24px; color:var(--text-light); margin-bottom:8px;"></i>
        <p style="color:var(--text-muted); font-size:12.5px;">No projects, tasks, comments, or directory members match: "${query}"</p>
      </div>
    `;
  }

  modal.innerHTML = `
    <div class="modal-box" style="max-width:520px;">
      <div class="modal-header" style="background:var(--bg-main);">
        <div>
          <h3 style="font-size:15px;"><i class="fa-solid fa-magnifying-glass" style="margin-right:8px; color:var(--primary-color);"></i>Smart Workspace Categorized Search</h3>
          <span style="font-size:11px; color:var(--text-muted);">Results querying matching keyword: <strong>"${query}"</strong></span>
        </div>
        <button onclick="document.getElementById('smartSearchModal').classList.remove('active')" class="modal-close-btn"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body" style="padding:20px; max-height:420px; overflow-y:auto; display:flex; flex-direction:column; gap:12px;">
        ${resultsHtml}
      </div>
    </div>
  `;

  modal.classList.add('active');
}

// ==========================================
// 7. REAL-TIME ACTIVITY LOGGER SIMULATOR     
// ==========================================
function startActivitySimulatorService() {
  // Simulates a friendly background log updates every 90 seconds
  setInterval(() => {
    triggerRandomEventLog();
  }, 90000);
}

function triggerRandomEventLog() {
  const user = window.cbsAuth.getCurrentUser();
  const alerts = [
    { text: 'Mr Evil Monster passed containment tests inside Aegis Threat sandbox virtualizers.', type: 'Security', title: 'Containment Audit Pass' },
    { text: 'eBPF rulesets successfully compiled across host Kernel Shields defense nodes.', type: 'System', title: 'Compiler logs' },
    { text: 'David Chen updated golang gateway token verification routines.', type: 'Tasks', title: 'Task code update' }
  ];

  const random = alerts[Math.floor(Math.random() * alerts.length)];
  window.cbsDB.addActivityLog(user.id, random.text, random.type);
  window.cbsDB.addNotification(random.type, random.title, random.text, 'Low');

  // Trigger reactive update if current view requires it
  window.cbsApp?.sync();
}

// Global listener for interactive notifications
function initGlobalEventListeners() {
  const bell = document.getElementById('notificationToggleBtn');
  const dropdown = document.getElementById('notificationDropdown');

  if (bell && dropdown) {
    bell.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });
  }

  // Attach instant custom notification reactive event
  window.addEventListener('cbs-enterprise-notification', (e) => {
    window.notificationsModule?.syncBellIndicator();
    
    // Check Settings preferences to trigger toast alerts
    const settings = window.cbsDB.getSettings();
    if (settings.notifications && settings.notifications.push) {
      if (window.showToastNotification) {
        window.showToastNotification(e.detail.title, e.detail.message);
      }
    }
  });
}

// ==========================================
// 8. RELATIVE CLOCK UTILITY                 
// ==========================================
function formatRelativeTime(isoStr) {
  const date = new Date(isoStr);
  const now = new Date();
  const diff = now - date;
  
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
 
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

// Exports globally
window.switchActiveView = switchActiveView;
window.formatRelativeTime = formatRelativeTime;

window.cbsApp = {
  sync() {
    const user = window.cbsAuth.getCurrentUser();
    if (!user) return;

    // 1. Sync header / sidebar identity fields
    const elements = {
      sidebarUserName: user.name,
      sidebarUserRole: user.title || user.role,
      sidebarUserAvatar: user.avatar,
      topbarUserAvatar: user.avatar
    };

    Object.keys(elements).forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (el.tagName === 'IMG') el.src = elements[id];
        else el.textContent = elements[id];
      }
    });

    // 2. Re-render the active viewport
    if (activeView === 'dashboard') {
      renderDashboardView();
    } else if (activeView === 'projects') {
      window.projectsModule?.render();
    } else if (activeView === 'tasks') {
      window.tasksModule?.render();
    } else if (activeView === 'team') {
      window.chatModule?.render();
    } else if (activeView === 'directory') {
      window.cbsDirectory?.render();
    } else if (activeView === 'notifications') {
      window.notificationsModule?.render();
    } else if (activeView === 'analytics') {
      window.analyticsModule?.render();
    } else if (activeView === 'profile') {
      window.profileModule?.render();
    } else if (activeView === 'settings') {
      renderSettingsForm();
    } else if (activeView === 'admin') {
      window.adminModule?.render();
    }

    // 3. Sync Notification Bell badge and list dropdown
    window.notificationsModule?.syncBellIndicator();
  }
};
