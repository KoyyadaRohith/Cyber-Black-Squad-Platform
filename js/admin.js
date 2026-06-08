/**
 * Cyber Black Squad – Central Admin Control Center Module
 * 
 * Implements the 12 specified administrative panels:
 * 1. Dashboard Overview (Calculated metrics & quick actions)
 * 2. User Management (CRUD, suspend, roles, password resets, filters)
 * 3. Project Management (Oversight, assign owner/members, status/priority inline switches)
 * 4. Task Management (Sprint task backlogs, reassign, status checkbox toggles)
 * 5. Team Directory (Cards, filters, administrative profile edit override)
 * 6. Channel Management (Channels CRUD, manage channel members list checklist)
 * 7. Notification Center (System alerts list, manual logs, category filters)
 * 8. Activity Logs (Real-time audit filters by Actor, Category, and Date)
 * 9. Analytics & Reports (5 Chart.js charts and reports download exports CSV/PDF)
 * 10. Broadcast Center (Audience-segmented announcement system)
 * 11. Security Management (Force logout active sessions & failed logins history)
 * 12. Workspace Settings (Global appearance, privacy, and timeouts sliders)
 */

const adminModule = {
  activeAdminSubTab: 'dashboard',
  charts: {},
  editingUserId: null,

  render() {
    // Role access authorization check
    const isAdmin = window.cbsAuth.isAdmin();
    const sidebarItem = document.getElementById('sidebarAdminItem');
    
    if (!isAdmin) {
      if (sidebarItem) sidebarItem.style.display = 'none';
      return;
    } else {
      if (sidebarItem) sidebarItem.style.setProperty('display', 'block', 'important');
    }

    const container = document.getElementById('view-admin');
    if (!container) return;

    // Inject custom sub-sidebar layout styles
    this.injectStyles();

    container.innerHTML = `
      <div class="admin-wrapper">
        <!-- Vertical Control Sidebar -->
        <aside class="admin-sub-sidebar">
          <div class="admin-sidebar-title"><i class="fa-solid fa-gears" style="margin-right:6px;"></i>System Controls</div>
          <button onclick="adminModule.switchAdminTab('dashboard')" class="admin-nav-btn" id="adm-tab-dashboard"><i class="fa-solid fa-chart-line"></i> Dashboard</button>
          <button onclick="adminModule.switchAdminTab('users')" class="admin-nav-btn" id="adm-tab-users"><i class="fa-solid fa-users"></i> Users Control</button>
          <button onclick="adminModule.switchAdminTab('projects')" class="admin-nav-btn" id="adm-tab-projects"><i class="fa-solid fa-briefcase"></i> Projects Oversight</button>
          <button onclick="adminModule.switchAdminTab('tasks')" class="admin-nav-btn" id="adm-tab-tasks"><i class="fa-solid fa-list-check"></i> Tasks Board</button>
          <button onclick="adminModule.switchAdminTab('directory')" class="admin-nav-btn" id="adm-tab-directory"><i class="fa-solid fa-address-book"></i> Team Directory</button>
          <button onclick="adminModule.switchAdminTab('channels')" class="admin-nav-btn" id="adm-tab-channels"><i class="fa-solid fa-comments"></i> Channels Roster</button>
          <button onclick="adminModule.switchAdminTab('notifications')" class="admin-nav-btn" id="adm-tab-notifications"><i class="fa-regular fa-bell"></i> Alerts Center</button>
          <button onclick="adminModule.switchAdminTab('activity')" class="admin-nav-btn" id="adm-tab-activity"><i class="fa-solid fa-clock-rotate-left"></i> System Logs</button>
          <button onclick="adminModule.switchAdminTab('analytics')" class="admin-nav-btn" id="adm-tab-analytics"><i class="fa-solid fa-chart-pie"></i> Analytics & CSV</button>
          <button onclick="adminModule.switchAdminTab('broadcasts')" class="admin-nav-btn" id="adm-tab-broadcasts"><i class="fa-solid fa-bullhorn"></i> Broadcast Center</button>
          <button onclick="adminModule.switchAdminTab('security')" class="admin-nav-btn" id="adm-tab-security"><i class="fa-solid fa-shield-halved"></i> Session Security</button>
          <button onclick="adminModule.switchAdminTab('settings')" class="admin-nav-btn" id="adm-tab-settings"><i class="fa-solid fa-sliders"></i> Global Settings</button>
        </aside>

        <!-- Dynamic Content Panel -->
        <div class="admin-content-pane" id="adminTabContentArea">
          <!-- Loaded dynamically -->
        </div>
      </div>
    `;

    this.switchAdminTab(this.activeAdminSubTab);
  },

  injectStyles() {
    if (document.getElementById('cbs-admin-styles-override')) return;
    const style = document.createElement('style');
    style.id = 'cbs-admin-styles-override';
    style.textContent = `
      .admin-wrapper {
        display: flex;
        gap: 20px;
        width: 100%;
        margin-top: 10px;
        align-items: flex-start;
      }
      .admin-sub-sidebar {
        width: 230px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex-shrink: 0;
        box-shadow: var(--shadow-sm);
      }
      .admin-sidebar-title {
        font-family: 'Outfit', sans-serif;
        font-weight: 700;
        font-size: 11.5px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--text-muted);
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: 8px;
        display: flex;
        align-items: center;
      }
      .admin-content-pane {
        flex: 1;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: 24px;
        min-width: 0;
        box-shadow: var(--shadow-sm);
      }
      .admin-nav-btn {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        border-radius: var(--radius-md);
        font-size: 13px;
        font-weight: 500;
        color: var(--text-muted);
        background: transparent;
        border: none;
        cursor: pointer;
        text-align: left;
        transition: all 0.2s ease;
        width: 100%;
      }
      .admin-nav-btn i {
        width: 16px;
        text-align: center;
        font-size: 14px;
      }
      .admin-nav-btn:hover {
        background: var(--bg-main);
        color: var(--primary-color);
      }
      .admin-nav-btn.active {
        background: rgba(59, 130, 246, 0.08);
        color: var(--primary-color);
        font-weight: 600;
      }
      body.dark-theme .admin-nav-btn.active {
        background: rgba(59, 130, 246, 0.15);
      }
      .admin-grid-charts {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      .admin-chart-box {
        background: var(--bg-main);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 16px;
        min-height: 250px;
        display: flex;
        flex-direction: column;
      }
      .admin-inline-form-box {
        background: var(--bg-main);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 16px;
        margin-bottom: 20px;
      }
      .radial-progress-score {
        position: relative;
        width: 90px;
        height: 90px;
        border-radius: 50%;
        background: radial-gradient(closest-side, var(--bg-card) 79%, transparent 80% 100%), conic-gradient(var(--secondary-color) calc(var(--val) * 1%), var(--border-color) 0);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Outfit', sans-serif;
        font-weight: 800;
        font-size: 18px;
        color: var(--text-main);
      }
      .priority-pill {
        padding: 2px 8px;
        border-radius: var(--radius-full);
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        display: inline-block;
      }
      .priority-Critical { background: #fee2e2; color: #ef4444; }
      .priority-High { background: #fee2e2; color: #ef4444; }
      .priority-Medium { background: #fef3c7; color: #d97706; }
      .priority-Low { background: #dcfce7; color: #15803d; }
    `;
    document.head.appendChild(style);
  },

  switchAdminTab(tabName) {
    this.activeAdminSubTab = tabName;

    // Toggle nav active headings
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const activeBtn = document.getElementById(`adm-tab-${tabName}`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    const area = document.getElementById('adminTabContentArea');
    if (!area) return;

    // Destroy chart instances before recreation to avoid mouseover glitch overlaps
    Object.keys(this.charts).forEach(key => {
      if (this.charts[key]) {
        this.charts[key].destroy();
        this.charts[key] = null;
      }
    });

    area.innerHTML = '';

    switch (tabName) {
      case 'dashboard':
        this.renderDashboard(area);
        break;
      case 'users':
        this.renderUsers(area);
        break;
      case 'projects':
        this.renderProjects(area);
        break;
      case 'tasks':
        this.renderTasks(area);
        break;
      case 'directory':
        this.renderDirectory(area);
        break;
      case 'channels':
        this.renderChannels(area);
        break;
      case 'notifications':
        this.renderNotifications(area);
        break;
      case 'activity':
        this.renderActivity(area);
        break;
      case 'analytics':
        this.renderAnalytics(area);
        break;
      case 'broadcasts':
        this.renderBroadcasts(area);
        break;
      case 'security':
        this.renderSecurity(area);
        break;
      case 'settings':
        this.renderSettings(area);
        break;
    }
  },

  // ==========================================
  // SECTION 1: DASHBOARD OVERVIEW
  // ==========================================
  renderDashboard(area) {
    const users = window.cbsDB.getUsers();
    const projects = window.cbsDB.getProjects();
    const tasks = window.cbsDB.getTasks();
    const channels = window.cbsDB.getChannels();
    const notifications = window.cbsDB.getNotifications();
    const messages = window.cbsDB.getMessages() || [];

    const activeUsers = users.filter(u => u.status === 'active').length;
    const activeProjects = projects.filter(p => p.status !== 'Archived' && p.status !== 'Completed').length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const pendingTasks = tasks.filter(t => t.status !== 'Completed').length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;

    // Workspace activity score computation
    const activityScore = Math.min(100, Math.round((activeUsers * 8) + (completedTasks * 6) + (activeProjects * 12) + (messages.length * 0.5)));

    area.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-size:16px; font-weight:700;"><i class="fa-solid fa-chart-line" style="color:var(--primary-color); margin-right:8px;"></i>Operational Dashboard Overview</h3>
          <span class="badge badge-purple" style="font-size:11px;">Admin oversight view</span>
        </div>

        <!-- 11 KPIs Grid Layout -->
        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:12px;">
          <div style="background:var(--bg-main); border:1px solid var(--border-color); padding:12px; border-radius:var(--radius-md); text-align:center;">
            <div style="font-size:24px; font-weight:800; color:var(--primary-color);">${users.length}</div>
            <div style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Total Users</div>
          </div>
          <div style="background:var(--bg-main); border:1px solid var(--border-color); padding:12px; border-radius:var(--radius-md); text-align:center;">
            <div style="font-size:24px; font-weight:800; color:var(--color-success);">${activeUsers}</div>
            <div style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Active Users</div>
          </div>
          <div style="background:var(--bg-main); border:1px solid var(--border-color); padding:12px; border-radius:var(--radius-md); text-align:center;">
            <div style="font-size:24px; font-weight:800; color:var(--secondary-color);">${projects.length}</div>
            <div style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Total Projects</div>
          </div>
          <div style="background:var(--bg-main); border:1px solid var(--border-color); padding:12px; border-radius:var(--radius-md); text-align:center;">
            <div style="font-size:24px; font-weight:800; color:var(--primary-hover);">${activeProjects}</div>
            <div style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Active Projects</div>
          </div>
          <div style="background:var(--bg-main); border:1px solid var(--border-color); padding:12px; border-radius:var(--radius-md); text-align:center;">
            <div style="font-size:24px; font-weight:800; color:var(--color-success);">${completedProjects}</div>
            <div style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Completed Projects</div>
          </div>
          <div style="background:var(--bg-main); border:1px solid var(--border-color); padding:12px; border-radius:var(--radius-md); text-align:center;">
            <div style="font-size:24px; font-weight:800; color:var(--color-warning);">${tasks.length}</div>
            <div style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Total Tasks</div>
          </div>
          <div style="background:var(--bg-main); border:1px solid var(--border-color); padding:12px; border-radius:var(--radius-md); text-align:center;">
            <div style="font-size:24px; font-weight:800; color:var(--color-danger);">${pendingTasks}</div>
            <div style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Pending Tasks</div>
          </div>
          <div style="background:var(--bg-main); border:1px solid var(--border-color); padding:12px; border-radius:var(--radius-md); text-align:center;">
            <div style="font-size:24px; font-weight:800; color:var(--color-success);">${completedTasks}</div>
            <div style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Completed Tasks</div>
          </div>
          <div style="background:var(--bg-main); border:1px solid var(--border-color); padding:12px; border-radius:var(--radius-md); text-align:center;">
            <div style="font-size:24px; font-weight:800; color:var(--color-info);">${notifications.length}</div>
            <div style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Alerts Count</div>
          </div>
          <div style="background:var(--bg-main); border:1px solid var(--border-color); padding:12px; border-radius:var(--radius-md); text-align:center;">
            <div style="font-size:24px; font-weight:800; color:var(--secondary-color);">${channels.length}</div>
            <div style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Active Channels</div>
          </div>
          
          <div style="grid-column: span 2; display:flex; gap:16px; background:var(--bg-main); border:1px solid var(--border-color); padding:12px 20px; border-radius:var(--radius-md); align-items:center;">
            <div class="radial-progress-score" style="--val: ${activityScore};">
              <span>${activityScore}%</span>
            </div>
            <div>
              <h4 style="font-size:13px; font-weight:700; margin-bottom:4px;">Workspace Activity Score</h4>
              <p style="font-size:11px; color:var(--text-muted); line-height:1.4;">Weighted rating based on team size, active schedules, chat discussions frequency, and task deliverables velocity.</p>
            </div>
          </div>
        </div>

        <!-- Quick Actions Panel -->
        <div style="border-top:1px dashed var(--border-color); padding-top:20px;">
          <h4 style="font-size:13px; font-weight:700; margin-bottom:12px;"><i class="fa-solid fa-bolt" style="color:var(--color-warning); margin-right:6px;"></i>Administrative Quick Controls</h4>
          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <button onclick="adminModule.switchAdminTab('users'); adminModule.openCreateUserFormInline();" class="btn-primary" style="padding:8px 16px; font-size:12px;"><i class="fa-solid fa-user-plus"></i> Create User</button>
            <button onclick="projectsModule.openCreateModal()" class="btn-primary" style="padding:8px 16px; font-size:12px; background:var(--secondary-color);"><i class="fa-solid fa-folder-plus"></i> Create Project</button>
            <button onclick="tasksModule.openCreateModal()" class="btn-primary" style="padding:8px 16px; font-size:12px; background:var(--color-success);"><i class="fa-solid fa-plus"></i> Create Task</button>
            <button onclick="adminModule.switchAdminTab('broadcasts')" class="btn-primary" style="padding:8px 16px; font-size:12px; background:var(--color-danger);"><i class="fa-solid fa-bullhorn"></i> Broadcast Announcement</button>
          </div>
        </div>
      </div>
    `;
  },

  // ==========================================
  // SECTION 2: USER MANAGEMENT
  // ==========================================
  renderUsers(area) {
    const users = window.cbsDB.getUsers();

    // Query values
    const searchVal = (document.getElementById('admUsersSearch')?.value || '').toLowerCase().trim();
    const roleVal = document.getElementById('admUsersRoleFilter')?.value || 'All';
    const deptVal = document.getElementById('admUsersDeptFilter')?.value || 'All';
    const statusVal = document.getElementById('admUsersStatusFilter')?.value || 'All';
    const sortVal = document.getElementById('admUsersSort')?.value || 'name';

    // Apply filtering
    let filtered = users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchVal) || u.email.toLowerCase().includes(searchVal);
      const matchesRole = roleVal === 'All' || u.role === roleVal;
      const matchesDept = deptVal === 'All' || u.department === deptVal;
      const matchesStatus = statusVal === 'All' || u.status === statusVal;
      return matchesSearch && matchesRole && matchesDept && matchesStatus;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortVal === 'name-desc') return b.name.localeCompare(a.name);
      if (sortVal === 'role') return a.role.localeCompare(b.role);
      if (sortVal === 'dept') return a.department.localeCompare(b.department);
      if (sortVal === 'status') return a.status.localeCompare(b.status);
      return a.name.localeCompare(b.name); // Default: name A-Z
    });

    let rowsHtml = '';
    filtered.forEach(u => {
      const isActive = u.status === 'active';
      const isSelf = u.id === window.cbsAuth.getCurrentUser()?.id;

      let statusBtn = '';
      if (!isSelf) {
        if (isActive) {
          statusBtn = `<button onclick="adminModule.handleToggleUserStatus('${u.id}', 'suspended')" class="badge badge-orange" style="border:none; cursor:pointer;">Suspend</button>`;
        } else {
          statusBtn = `<button onclick="adminModule.handleToggleUserStatus('${u.id}', 'active')" class="badge badge-green" style="border:none; cursor:pointer;">Activate</button>`;
        }
      } else {
        statusBtn = `<span class="badge badge-purple" style="font-size:9.5px;">Self Account</span>`;
      }

      const deleteBtn = (!isSelf) ? `<button onclick="adminModule.handleDeleteUser('${u.id}')" class="action-icon-btn delete" title="Delete User"><i class="fa-regular fa-trash-can"></i></button>` : '';

      rowsHtml += `
        <tr>
          <td style="font-weight:700; display:flex; align-items:center; gap:8px;">
            <img src="${u.avatar}" class="avatar" style="width:24px; height:24px; border:none;">
            <span>${u.name}</span>
          </td>
          <td><span class="badge badge-blue" style="font-size:10px;">${u.role}</span></td>
          <td style="font-size:12.5px; color:var(--text-muted);">${u.email}</td>
          <td style="font-size:12.5px;">${u.department}</td>
          <td><span class="badge ${isActive ? 'badge-green' : 'badge-red'}">${u.status}</span></td>
          <td>
            <div class="card-actions" style="gap:8px;">
              <button onclick="adminModule.openEditUserForm('${u.id}')" class="action-icon-btn" title="Edit Profile Details"><i class="fa-regular fa-pen-to-square"></i></button>
              <button onclick="adminModule.handleResetPassword('${u.id}')" class="action-icon-btn" title="Reset Password credentials"><i class="fa-solid fa-key" style="color:var(--color-warning);"></i></button>
              ${statusBtn}
              ${deleteBtn}
            </div>
          </td>
        </tr>
      `;
    });

    area.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-size:15px; font-weight:700;"><i class="fa-solid fa-address-book" style="color:var(--primary-color); margin-right:8px;"></i>System Accounts & Privileges</h3>
          <button onclick="adminModule.openCreateUserFormInline()" class="btn-primary" style="padding:6px 12px; font-size:11.5px;"><i class="fa-solid fa-user-plus"></i> Add User</button>
        </div>

        <!-- Inline User Form Container -->
        <div id="inlineUserFormContainer"></div>

        <!-- Search, Filter, Sort Row -->
        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; background:var(--bg-main); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:20px;">
          <div class="topbar-search" style="display:block; width:180px;">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="admUsersSearch" placeholder="Search accounts..." value="${searchVal}" oninput="adminModule.switchAdminTab('users')" style="padding: 6px 12px 6px 30px; font-size:11.5px;">
          </div>
          
          <select id="admUsersRoleFilter" onchange="adminModule.switchAdminTab('users')" style="padding:6px; font-size:11.5px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
            <option value="Workspace Roles" ${roleVal === 'Workspace Roles' ? 'selected' : ''}>All Role</option>  
            <option value="Admin" ${roleVal === 'Admin' ? 'selected' : ''}>Admin</option>
            <option value="Founder" ${roleVal === 'Founder' ? 'selected' : ''}>Founder</option>
            <option value="CEO" ${roleVal === 'CEO' ? 'selected' : ''}>CEO</option>
            <option value="Manager" ${roleVal === 'Manager' ? 'selected' : ''}>Manager</option>
            <option value="SOC Analyst" ${roleVal === 'SOC Analyst' ? 'selected' : ''}>SOC Analyst</option>
            <option value="Security Engineer" ${roleVal === 'Security Engineer' ? 'selected' : ''}>Security Engineer</option>
            <option value="Threat Hunter" ${roleVal === 'Threat Hunter' ? 'selected' : ''}>Threat Hunter</option>
            <option value="Ethical Hacker" ${roleVal === 'Ethical Hacker' ? 'selected' : ''}>Ethical Hacker</option>
            <option value="Incident Responder" ${roleVal === 'Incident Responder' ? 'selected' : ''}>Incident Responder</option>
            <option value="Frontend Developer" ${roleVal === 'Frontend Developer' ? 'selected' : ''}>Frontend Developer</option>
            <option value="Backend Developer" ${roleVal === 'Backend Developer' ? 'selected' : ''}>Backend Developer</option>
            <option value="Full Stack Developer" ${roleVal === 'Full Stack Developer' ? 'selected' : ''}>Full Stack Developer</option>
            <option value="AI Engineer" ${roleVal === 'AI Engineer' ? 'selected' : ''}>AI Engineer</option>
            <option value="DevOps Engineer" ${roleVal === 'DevOps Engineer' ? 'selected' : ''}>DevOps Engineer</option>
            <option value="Project Lead" ${roleVal === 'Project Lead' ? 'selected' : ''}>Project Lead</option>
            <option value="Team Member" ${roleVal === 'Team Member' ? 'selected' : ''}>Team Member</option>
            <option value="Intern" ${roleVal === 'Intern' ? 'selected' : ''}>Intern</option>
          </select>

          <select id="admUsersDeptFilter" onchange="adminModule.switchAdminTab('users')" style="padding:6px; font-size:11.5px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
            <option value="All" ${deptVal === 'All' ? 'selected' : ''}>All Departments</option>
            <option value="Administration & Operations" ${deptVal === 'Administration & Operations' ? 'selected' : ''}>Administration & Operations</option>
            <option value="Security Operations" ${deptVal === 'Security Operations' ? 'selected' : ''}>Security Operations</option>
            <option value="Cybersecurity" ${deptVal === 'Cybersecurity' ? 'selected' : ''}>Cybersecurity</option>
            <option value="Artificial Intelligence" ${deptVal === 'Artificial Intelligence' ? 'selected' : ''}>Artificial Intelligence</option>
            <option value="Engineering" ${deptVal === 'Engineering' ? 'selected' : ''}>Engineering</option>
            <option value="DevOps" ${deptVal === 'DevOps' ? 'selected' : ''}>DevOps</option>
            <option value="Research & Development" ${deptVal === 'Research & Development' ? 'selected' : ''}>Research & Development</option>
            <option value="Management" ${deptVal === 'Management' ? 'selected' : ''}>Management</option>
            <option value="Design" ${deptVal === 'Design' ? 'selected' : ''}>Design</option>
            <option value="Human Resources" ${deptVal === 'Human Resources' ? 'selected' : ''}>Human Resources</option>
            <option value="Marketing" ${deptVal === 'Marketing' ? 'selected' : ''}>Marketing</option>
            <option value="Sales" ${deptVal === 'Sales' ? 'selected' : ''}>Sales</option>
            <option value="Finance" ${deptVal === 'Finance' ? 'selected' : ''}>Finance</option>
            <option value="Customer Support" ${deptVal === 'Customer Support' ? 'selected' : ''}>Customer Support</option>
            <option value="Quality Assurance" ${deptVal === 'Quality Assurance' ? 'selected' : ''}>Quality Assurance</option>
          </select>

          <select id="admUsersStatusFilter" onchange="adminModule.switchAdminTab('users')" style="padding:6px; font-size:11.5px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
            <option value="All" ${statusVal === 'All' ? 'selected' : ''}>All Statuses</option>
            <option value="active" ${statusVal === 'active' ? 'selected' : ''}>Active</option>
            <option value="suspended" ${statusVal === 'suspended' ? 'selected' : ''}>Suspended</option>
          </select>

          <select id="admUsersSort" onchange="adminModule.switchAdminTab('users')" style="padding:6px; font-size:11.5px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
            <option value="name" ${sortVal === 'name' ? 'selected' : ''}>Sort: Name A-Z</option>
            <option value="name-desc" ${sortVal === 'name-desc' ? 'selected' : ''}>Sort: Name Z-A</option>
            <option value="role" ${sortVal === 'role' ? 'selected' : ''}>Sort: Access Level</option>
            <option value="dept" ${sortVal === 'dept' ? 'selected' : ''}>Sort: Department</option>
            <option value="status" ${sortVal === 'status' ? 'selected' : ''}>Sort: Status</option>
          </select>
        </div>

        <!-- Accounts Grid Table -->
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr style="font-size:11.5px; background:var(--bg-main);">
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              ${filtered.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-light);">No user accounts match these filters.</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  openCreateUserFormInline() {
    this.editingUserId = null;
    const container = document.getElementById('inlineUserFormContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="admin-inline-form-box">
        <h4 style="font-size:13px; font-weight:700; margin-bottom:12px;"><i class="fa-solid fa-user-plus" style="color:var(--primary-color); margin-right:6px;"></i>Enroll New Platform User Account</h4>
        <form onsubmit="adminModule.handleSaveUserInlineSubmit(event)" style="display:flex; flex-direction:column; gap:12px;">
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:11px;">Full Display Name</label>
              <input type="text" id="inlineUsName" placeholder="K. ROHITH" required style="padding:6px 12px; font-size:12px;">
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:11px;">Email Address</label>
              <input type="email" id="inlineUsEmail" placeholder="name@cyberblacksquad.com" required style="padding:6px 12px; font-size:12px;">
            </div>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px;">
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:11px;">Select Workspace Role</label>
              <select id="inlineUsRole" style="padding:6px; font-size:12px;">
                <option value="Admin">Admin</option>
                <option value="Founder">Founder</option>
                <option value="CEO">CEO</option>
                <option value="Manager">Manager</option>
                <option value="SOC Analyst">SOC Analyst</option>
                <option value="CEO">CEO</option>
                <option value="Security Engineer">Security Engineer</option>
                <option value="Threat Hunter">Threat Hunter</option>
                <option value="Ethical Hacker">Ethical Hacker</option>
                <option value="Incident Responder">Incident Responder</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="AI Engineer">AI Engineer</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="Project Lead">Project Lead</option>
                <option value="Team Member">Team Member</option>
                <option value="Intern">Intern</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:11px;">Workspace Department</label>
              <select id="inlineUsDept" style="padding:6px; font-size:12px;">
                <option value="Administration & Operations">Administration & Operations</option>
                <option value="Security Operations">Security Operations</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Engineering">Engineering</option>
                <option value="DevOps">DevOps</option>
                <option value="Research & Development">Research & Development</option>
                <option value="Design">Design</option>
                <option value="Management">Management</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Finance">Finance</option>
                <option value="Customer Support">Customer Support</option>
                <option value="Quality Assurance">Quality Assurance</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:11px;">Security Password</label>
              <input type="password" id="inlineUsPass" placeholder="e.g. password123" required style="padding:6px 12px; font-size:12px;">
            </div>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:4px;">
            <button type="button" onclick="document.getElementById('inlineUserFormContainer').innerHTML=''" class="btn-secondary" style="padding:6px 12px; font-size:11.5px;">Cancel</button>
            <button type="submit" class="btn-primary" style="padding:6px 12px; font-size:11.5px;">Save User Credentials</button>
          </div>
        </form>
      </div>
    `;
  },

  openEditUserForm(userId) {
    const u = window.cbsDB.getUserById(userId);
    if (!u) return;

    this.editingUserId = userId;
    const container = document.getElementById('inlineUserFormContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="admin-inline-form-box" style="border-color:var(--primary-color);">
        <h4 style="font-size:13px; font-weight:700; margin-bottom:12px;"><i class="fa-regular fa-pen-to-square" style="color:var(--primary-color); margin-right:6px;"></i>Modify User Account Parameters</h4>
        <form onsubmit="adminModule.handleSaveUserInlineSubmit(event)" style="display:flex; flex-direction:column; gap:12px;">
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:11px;">Full Display Name</label>
              <input type="text" id="inlineUsName" value="${u.name}" required style="padding:6px 12px; font-size:12px;">
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:11px;">Email Address</label>
              <input type="email" id="inlineUsEmail" value="${u.email}" required style="padding:6px 12px; font-size:12px;">
            </div>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px;">
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:11px;">Workspace Role</label>
              <select id="inlineUsRole" style="padding:6px; font-size:12px;">
                <option value="Admin" ${u.role === 'Admin' ? 'selected' : ''}>Admin</option>
                <option value="Founder" ${u.role === 'Founder' ? 'selected' : ''}>Founder</option>
                <option value="CEO" ${u.role === 'CEO' ? 'selected' : ''}>CEO</option>
                <option value="Manager" ${u.role === 'Manager' ? 'selected' : ''}>Manager</option>
                <option value="SOC Analyst" ${u.role === 'SOC Analyst' ? 'selected' : ''}>SOC Analyst</option>
                <option value="Security Engineer" ${u.role === 'Security Engineer' ? 'selected' : ''}>Security Engineer</option>
                <option value="Threat Hunter" ${u.role === 'Threat Hunter' ? 'selected' : ''}>Threat Hunter</option>
                <option value="Ethical Hacker" ${u.role === 'Ethical Hacker' ? 'selected' : ''}>Ethical Hacker</option>
                <option value="Incident Responder" ${u.role === 'Incident Responder' ? 'selected' : ''}>Incident Responder</option>
                <option value="Frontend Developer" ${u.role === 'Frontend Developer' ? 'selected' : ''}>Frontend Developer</option>
                <option value="Backend Developer" ${u.role === 'Backend Developer' ? 'selected' : ''}>Backend Developer</option>
                <option value="Full Stack Developer" ${u.role === 'Full Stack Developer' ? 'selected' : ''}>Full Stack Developer</option>
                <option value="AI Engineer" ${u.role === 'AI Engineer' ? 'selected' : ''}>AI Engineer</option>
                <option value="DevOps Engineer" ${u.role === 'DevOps Engineer' ? 'selected' : ''}>DevOps Engineer</option>
                <option value="Project Lead" ${u.role === 'Project Lead' ? 'selected' : ''}>Project Lead</option>
                <option value="Team Member" ${u.role === 'Team Member' ? 'selected' : ''}>Team Member</option>
                <option value="Intern" ${u.role === 'Intern' ? 'selected' : ''}>Intern</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:11px;">Workspace Department</label>
              <select id="inlineUsDept" style="padding:6px; font-size:12px;">
                <option value="Administration & Operations" ${u.department === 'Administration & Operations' ? 'selected' : ''}>Administration & Operations</option>
                <option value="Security Operations" ${u.department === 'Security Operations' ? 'selected' : ''}>Security Operations</option>
                <option value="Cybersecurity" ${u.department === 'Cybersecurity' ? 'selected' : ''}>Cybersecurity</option>
                <option value="Artificial Intelligence" ${u.department === 'Artificial Intelligence' ? 'selected' : ''}>Artificial Intelligence</option>
                <option value="Engineering" ${u.department === 'Engineering' ? 'selected' : ''}>Engineering</option>
                <option value="DevOps" ${u.department === 'DevOps' ? 'selected' : ''}>DevOps</option>
                <option value="Research & Development" ${u.department === 'Research & Development' ? 'selected' : ''}>Research & Development</option>
                <option value="Design" ${u.department === 'Design' ? 'selected' : ''}>Design</option>
                <option value="Management" ${u.department === 'Management' ? 'selected' : ''}>Management</option>
                <option value="Human Resources" ${u.department === 'Human Resources' ? 'selected' : ''}>Human Resources</option>
                <option value="Marketing" ${u.department === 'Marketing' ? 'selected' : ''}>Marketing</option>
                <option value="Sales" ${u.department === 'Sales' ? 'selected' : ''}>Sales</option>
                <option value="Finance" ${u.department === 'Finance' ? 'selected' : ''}>Finance</option>
                <option value="Customer Support" ${u.department === 'Customer Support' ? 'selected' : ''}>Customer Support</option>
                <option value="Quality Assurance" ${u.department === 'Quality Assurance' ? 'selected' : ''}>Quality Assurance</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:11px;">Account Status</label>
              <select id="inlineUsStatus" style="padding:6px; font-size:12px;">
                <option value="active" ${u.status === 'active' ? 'selected' : ''}>Active</option>
                <option value="suspended" ${u.status === 'suspended' ? 'selected' : ''}>Suspended</option>
              </select>
            </div>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:4px;">
            <button type="button" onclick="document.getElementById('inlineUserFormContainer').innerHTML=''" class="btn-secondary" style="padding:6px 12px; font-size:11.5px;">Cancel</button>
            <button type="submit" class="btn-primary" style="padding:6px 12px; font-size:11.5px;">Update Account Details</button>
          </div>
        </form>
      </div>
    `;
    window.location.hash = '#inlineUserFormContainer';
  },

  handleSaveUserInlineSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('inlineUsName').value.trim();
    const email = document.getElementById('inlineUsEmail').value.trim();
    const role = document.getElementById('inlineUsRole').value;
    const dept = document.getElementById('inlineUsDept').value;

    if (!this.editingUserId) {
      // Create path
      const pwd = document.getElementById('inlineUsPass').value;
      try {
        const u = window.cbsAuth.register(name, email, pwd, role);
        u.department = dept;
        window.cbsDB.saveUser(u);
        window.cbsApp?.sync();
        if (window.showToastNotification) window.showToastNotification('User Enrolled', name);
      } catch (err) {
        alert(err.message);
      }
    } else {
      // Edit path
      const u = window.cbsDB.getUserById(this.editingUserId);
      if (u) {
        u.name = name;
        u.email = email;
        u.role = role;
        u.department = dept;
        u.status = document.getElementById('inlineUsStatus')?.value || u.status;
        window.cbsDB.saveUser(u);
        window.cbsApp?.sync();
        if (window.showToastNotification) window.showToastNotification('User Profile Updated', name);
      }
    }
  },

  handleToggleUserStatus(userId, status) {
    window.cbsDB.setUserStatus(userId, status);
    
    // If user suspended, force session logout
    if (status === 'suspended') {
      const sessions = window.cbsDB.getSessions();
      sessions.forEach(s => {
        if (s.userId === userId) s.status = 'Terminated';
      });
      localStorage.setItem('cbs_sessions_coll', JSON.stringify(sessions));
    }

    window.cbsApp?.sync();
  },

  handleDeleteUser(id) {
    if (confirm('Verify: Permanently delete this account record? This is irreversible.')) {
      window.cbsDB.deleteUser(id);
      window.cbsApp?.sync();
    }
  },

  handleResetPassword(id) {
    const newPwd = prompt('Reset Credentials: Enter a new security password for this user:');
    if (newPwd) {
      if (newPwd.length < 6) {
        alert('Password must be at least 6 characters.');
        return;
      }
      const u = window.cbsDB.getUserById(id);
      if (u) {
        u.password = newPwd;
        window.cbsDB.saveUser(u);
        window.cbsDB.addActivityLog(window.cbsAuth.getCurrentUser()?.id, `Administratively reset password for ${u.name}`, 'Security');
        if (window.showToastNotification) window.showToastNotification('Password Reset', `Updated for ${u.name}`);
      }
    }
  },

  // ==========================================
  // SECTION 3: PROJECT MANAGEMENT
  // ==========================================
  renderProjects(area) {
    const projects = window.cbsDB.getProjects();
    const team = window.cbsDB.getUsers();

    let rowsHtml = '';
    projects.forEach(p => {
      const isArchived = p.status === 'Archived';
      
      // Project managers list select dropdown options
      let managersSelect = `<select onchange="adminModule.handleSaveProjectInline('${p.id}', 'ownerId', this.value)" style="padding:4px; font-size:12px; font-weight:600; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-card); width:130px;">`;
      team.forEach(u => {
        managersSelect += `<option value="${u.id}" ${u.id === p.ownerId ? 'selected' : ''}>${u.name}</option>`;
      });
      managersSelect += `</select>`;

      // Priorities select options
      let prioritySelect = `<select onchange="adminModule.handleSaveProjectInline('${p.id}', 'priority', this.value)" style="padding:4px; font-size:12px; font-weight:600; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-card); width:95px;">`;
      ['Low', 'Medium', 'High'].forEach(pri => {
        prioritySelect += `<option value="${pri}" ${pri === p.priority ? 'selected' : ''}>${pri}</option>`;
      });
      prioritySelect += `</select>`;

      // Status selector
      let statusSelect = `<select onchange="adminModule.handleSaveProjectInline('${p.id}', 'status', this.value)" style="padding:4px; font-size:12px; font-weight:600; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-card); width:110px;">`;
      ['Planning', 'In Progress', 'In Review', 'Completed', 'Archived'].forEach(st => {
        statusSelect += `<option value="${st}" ${st === p.status ? 'selected' : ''}>${st}</option>`;
      });
      statusSelect += `</select>`;

      // Archive / Restore action trigger
      const archiveBtn = isArchived ? 
        `<button class="action-icon-btn" onclick="projectsModule.handleRestore('${p.id}')" title="Restore Project"><i class="fa-solid fa-trash-arrow-up"></i></button>` :
        `<button class="action-icon-btn" onclick="projectsModule.handleArchive('${p.id}')" title="Archive Project"><i class="fa-solid fa-box-archive"></i></button>`;

      rowsHtml += `
        <tr>
          <td style="font-weight:700; color:var(--primary-color); cursor:pointer;" onclick="projectsModule.openDetailsModal('${p.id}')">
            ${p.name}
          </td>
          <td>${managersSelect}</td>
          <td>${prioritySelect}</td>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <div class="progress-bar-bg" style="width: 50px; height:6px;"><div class="progress-bar-fill" style="width: ${p.progress}%;"></div></div>
              <span style="font-size:11px; font-weight:700;">${p.progress}%</span>
            </div>
          </td>
          <td>${statusSelect}</td>
          <td>
            <div class="card-actions" style="gap:8px;">
              <button onclick="projectsModule.openDetailsModal('${p.id}')" class="action-icon-btn" title="Inspect Milestones & Specs"><i class="fa-regular fa-folder-open"></i></button>
              <button onclick="projectsModule.openEditModal('${p.id}')" class="action-icon-btn" title="Modify Specs"><i class="fa-regular fa-pen-to-square"></i></button>
              ${archiveBtn}
              <button onclick="projectsModule.handleDelete('${p.id}')" class="action-icon-btn delete" title="Permanently Delete Project"><i class="fa-regular fa-trash-can"></i></button>
            </div>
          </td>
        </tr>
      `;
    });

    area.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-size:15px; font-weight:700;"><i class="fa-solid fa-briefcase" style="color:var(--secondary-color); margin-right:8px;"></i>Project Lifecycle Oversight</h3>
          <button onclick="projectsModule.openCreateModal()" class="btn-primary" style="padding:6px 12px; font-size:11.5px;"><i class="fa-solid fa-folder-plus"></i> Create Project</button>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr style="font-size:11.5px; background:var(--bg-main);">
                <th>Project Name</th>
                <th>Owner (Manager)</th>
                <th>Priority</th>
                <th>Development Progress</th>
                <th>Execution Stage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              ${projects.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-light);">No project records.</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  handleSaveProjectInline(projId, field, value) {
    const p = window.cbsDB.getProjectById(projId);
    if (p) {
      if (field === 'progress') p.progress = Number(value) || 0;
      else p[field] = value;

      window.cbsDB.saveProject(p);
      window.cbsApp?.sync();
      if (window.showToastNotification) window.showToastNotification('Project Synced', `Field "${field}" updated.`);
    }
  },

  // ==========================================
  // SECTION 4: TASK MANAGEMENT
  // ==========================================
  renderTasks(area) {
    const tasks = window.cbsDB.getTasks();
    const team = window.cbsDB.getUsers();
    const projects = window.cbsDB.getProjects();

    let rowsHtml = '';
    tasks.forEach(t => {
      const p = projects.find(proj => proj.id === t.projectId) || { name: 'Internal Work' };
      const isCompleted = t.status === 'Completed';

      // Assignee dropdown
      let assigneeSelect = `<select onchange="adminModule.handleSaveTaskInline('${t.id}', 'assigneeId', this.value)" style="padding:4px; font-size:12px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-card); width:130px;">`;
      team.forEach(u => {
        assigneeSelect += `<option value="${u.id}" ${u.id === t.assigneeId ? 'selected' : ''}>${u.name}</option>`;
      });
      assigneeSelect += `</select>`;

      // Priorities dropdown
      let prioritySelect = `<select onchange="adminModule.handleSaveTaskInline('${t.id}', 'priority', this.value)" style="padding:4px; font-size:12px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-card); width:95px;">`;
      ['Low', 'Medium', 'High', 'Critical'].forEach(pri => {
        prioritySelect += `<option value="${pri}" ${pri === t.priority ? 'selected' : ''}>${pri}</option>`;
      });
      prioritySelect += `</select>`;

      // Status dropdown
      let statusSelect = `<select onchange="adminModule.handleSaveTaskInline('${t.id}', 'status', this.value)" style="padding:4px; font-size:12px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-card); width:110px;">`;
      ['Backlog', 'To Do', 'In Progress', 'Review', 'Completed'].forEach(st => {
        statusSelect += `<option value="${st}" ${st === t.status ? 'selected' : ''}>${st}</option>`;
      });
      statusSelect += `</select>`;

      rowsHtml += `
        <tr style="opacity: ${isCompleted ? '0.7' : '1'};">
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <input type="checkbox" ${isCompleted ? 'checked' : ''} onclick="adminModule.handleToggleTaskComplete('${t.id}')" style="cursor:pointer;">
              <span style="font-weight:700; text-decoration: ${isCompleted ? 'line-through' : 'none'};">${t.title}</span>
            </div>
          </td>
          <td style="font-size:12px; color:var(--text-muted);">${p.name}</td>
          <td>${assigneeSelect}</td>
          <td>${prioritySelect}</td>
          <td>${statusSelect}</td>
          <td style="font-size:12px; color:var(--text-light);">${new Date(t.dueDate).toLocaleDateString()}</td>
          <td>
            <div class="card-actions" style="gap:8px;">
              <button onclick="tasksModule.openDetailsModal('${t.id}')" class="action-icon-btn" title="Inspect comments/files"><i class="fa-regular fa-comment"></i></button>
              <button onclick="tasksModule.openEditModal('${t.id}')" class="action-icon-btn" title="Edit Task specs"><i class="fa-regular fa-pen-to-square"></i></button>
              <button onclick="adminModule.handleDeleteTask('${t.id}')" class="action-icon-btn delete" title="Wipe Task"><i class="fa-regular fa-trash-can"></i></button>
            </div>
          </td>
        </tr>
      `;
    });

    area.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-size:15px; font-weight:700;"><i class="fa-solid fa-list-check" style="color:var(--color-success); margin-right:8px;"></i>Platform Sprint Tasks Backlog</h3>
          <button onclick="tasksModule.openCreateModal()" class="btn-primary" style="padding:6px 12px; font-size:11.5px;"><i class="fa-solid fa-plus"></i> Create Task</button>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr style="font-size:11.5px; background:var(--bg-main);">
                <th>Task Title</th>
                <th>Parent Project</th>
                <th>Assigned User</th>
                <th>Priority</th>
                <th>Execution Stage</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              ${tasks.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-light);">No tasks created.</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  handleSaveTaskInline(id, field, value) {
    const t = window.cbsDB.getTaskById(id);
    if (t) {
      t[field] = value;
      if (field === 'status' && value === 'Completed') {
        t.progress = 100;
      } else if (field === 'status' && value !== 'Completed' && t.progress === 100) {
        t.progress = 0;
      }
      window.cbsDB.saveTask(t);
      window.cbsApp?.sync();
      if (window.showToastNotification) window.showToastNotification('Task Updated', `Task changed successfully.`);
    }
  },

  handleToggleTaskComplete(id) {
    const t = window.cbsDB.getTaskById(id);
    if (t) {
      if (t.status === 'Completed') {
        t.status = 'To Do';
        t.progress = 0;
      } else {
        t.status = 'Completed';
        t.progress = 100;
      }
      window.cbsDB.saveTask(t);
      window.cbsApp?.sync();
    }
  },

  handleDeleteTask(id) {
    if (confirm('Delete task permanently from database?')) {
      window.cbsDB.deleteTask(id);
      window.cbsApp?.sync();
    }
  },

  // ==========================================
  // SECTION 5: TEAM DIRECTORY
  // ==========================================
  renderDirectory(area) {
    const users = window.cbsDB.getUsers();
    const projects = window.cbsDB.getProjects();

    const roleVal = document.getElementById('admDirRoleFilter')?.value || 'All';
    const deptVal = document.getElementById('admDirDeptFilter')?.value || 'All';
    const statusVal = document.getElementById('admDirStatusFilter')?.value || 'All';

    const filtered = users.filter(u => {
      const matchesRole = roleVal === 'All' || u.role === roleVal;
      const matchesDept = deptVal === 'All' || u.department === deptVal;
      const matchesStatus = statusVal === 'All' || u.status === statusVal;
      return matchesRole && matchesDept && matchesStatus;
    });

    let cardsHtml = '';
    filtered.forEach(u => {
      const skillsHtml = (u.skills || '').split(',').map(s => s.trim()).filter(s => s).map(s => `
        <span style="font-size:10px; background:var(--bg-main); border:1px solid var(--border-color); color:var(--text-medium); padding:2px 6px; border-radius:4px;">${s}</span>
      `).join('');

      let assignSelect = `<select onchange="adminModule.handleAssignUserProject('${u.id}', this.value)" style="padding:4px; font-size:11px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-card); width:130px; margin-top:6px;">`;
      assignSelect += `<option value="" disabled selected>Associate Project...</option>`;
      projects.forEach(p => {
        assignSelect += `<option value="${p.id}">${p.name}</option>`;
      });
      assignSelect += `</select>`;

      cardsHtml += `
        <div style="background:var(--bg-main); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:16px; display:flex; flex-direction:column; gap:10px; position:relative; box-shadow:var(--shadow-sm);">
          <div style="display:flex; gap:12px; align-items:center;">
            <img src="${u.avatar}" class="avatar" style="width:48px; height:48px; border-radius:var(--radius-md); border:none;">
            <div style="display:flex; flex-direction:column;">
              <span style="font-weight:800; font-size:13.5px; font-family:'Outfit';">${u.name}</span>
              <span style="font-size:11px; color:var(--text-muted); font-weight:600;">${u.role}</span>
            </div>
            <span class="badge ${u.status === 'active' ? 'badge-green' : 'badge-red'}" style="position:absolute; top:12px; right:12px; font-size:9px; text-transform:uppercase;">${u.status}</span>
          </div>

          <div style="font-size:11px; color:var(--text-light); text-transform:uppercase; font-weight:700; margin-top:2px;">Department</div>
          <div style="font-size:12.5px; font-weight:600; color:var(--text-main); margin-top:-6px;">${u.department}</div>

          <div style="font-size:11px; color:var(--text-light); text-transform:uppercase; font-weight:700; margin-top:2px;">Strategic Skills</div>
          <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:-4px;">
            ${skillsHtml || '<span style="font-size:11px; color:var(--text-light);">None registered</span>'}
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed var(--border-color); padding-top:10px; margin-top:6px;">
            <div style="display:flex; gap:8px;">
              <button onclick="adminModule.openViewProfileModal('${u.id}')" class="badge badge-purple" style="border:none; cursor:pointer;">Profile</button>
              <button onclick="adminModule.openEditProfileModal('${u.id}')" class="badge badge-blue" style="border:none; cursor:pointer;">Edit</button>
              <button onclick="switchActiveView('team')" class="badge badge-green" style="border:none; cursor:pointer;"><i class="fa-regular fa-comments"></i> Chat</button>
            </div>
            ${assignSelect}
          </div>
        </div>
      `;
    });

    area.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-size:15px; font-weight:700;"><i class="fa-solid fa-address-card" style="color:var(--secondary-color); margin-right:8px;"></i>Team Directory & Skills Roster</h3>
          <span class="badge badge-purple">${filtered.length} active</span>
        </div>

        <!-- Filters Row -->
        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; background:var(--bg-main); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:20px;">
          <select id="admDirRoleFilter" onchange="adminModule.switchAdminTab('directory')" style="padding:6px; font-size:11.5px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
          <option value="Admin" ${roleVal === 'Admin' ? 'selected' : ''}>Admin</option>
          <option value="Founder" ${roleVal === 'Founder' ? 'selected' : ''}>Founder</option>
          <option value="CEO" ${roleVal === 'CEO' ? 'selected' : ''}>CEO</option>
          <option value="Manager" ${roleVal === 'Manager' ? 'selected' : ''}>Manager</option>
          <option value="Team Member" ${roleVal === 'Team Member' ? 'selected' : ''}>Team Member</option>
          <option value="SOC Analyst" ${roleVal === 'SOC Analyst' ? 'selected' : ''}>SOC Analyst</option>
          <option value="Security Engineer" ${roleVal === 'Security Engineer' ? 'selected' : ''}>Security Engineer</option>
          <option value="Threat Hunter" ${roleVal === 'Threat Hunter' ? 'selected' : ''}>Threat Hunter</option>
          <option value="Ethical Hacker" ${roleVal === 'Ethical Hacker' ? 'selected' : ''}>Ethical Hacker</option>
          <option value="Incident Responder" ${roleVal === 'Incident Responder' ? 'selected' : ''}>Incident Responder</option>
          <option value="Frontend Developer" ${roleVal === 'Frontend Developer' ? 'selected' : ''}>Frontend Developer</option>
          <option value="Backend Developer" ${roleVal === 'Backend Developer' ? 'selected' : ''}>Backend Developer</option>
          <option value="Full Stack Developer" ${roleVal === 'Full Stack Developer' ? 'selected' : ''}>Full Stack Developer</option>
          <option value="AI Engineer" ${roleVal === 'AI Engineer' ? 'selected' : ''}>AI Engineer</option>
          <option value="DevOps Engineer" ${roleVal === 'DevOps Engineer' ? 'selected' : ''}>DevOps Engineer</option>
          <option value="Project Lead" ${roleVal === 'Project Lead' ? 'selected' : ''}>Project Lead</option>
          <option value="Intern" ${roleVal === 'Intern' ? 'selected' : ''}>Intern</option>
          </select>

          <select id="admDirDeptFilter" onchange="adminModule.switchAdminTab('directory')" style="padding:6px; font-size:11.5px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
            <option value="Administration & Operations" ${deptVal === 'Administration & Operations' ? 'selected' : ''}>Administration & Operations</option>  
            <option value="Security Operations" ${deptVal === 'Security Operations' ? 'selected' : ''}>Security Operations</option>
            <option value="Cybersecurity" ${deptVal === 'Cybersecurity' ? 'selected' : ''}>Cybersecurity</option>
            <option value="Artificial Intelligence" ${deptVal === 'Artificial Intelligence' ? 'selected' : ''}>Artificial Intelligence</option>
            <option value="Engineering" ${deptVal === 'Engineering' ? 'selected' : ''}>Engineering</option>
            <option value="DevOps" ${deptVal === 'DevOps' ? 'selected' : ''}>DevOps</option>
            <option value="Research & Development" ${deptVal === 'Research & Development' ? 'selected' : ''}>Research & Development</option>
            <option value="Management" ${deptVal === 'Management' ? 'selected' : ''}>Management</option>
            <option value="Design" ${deptVal === 'Design' ? 'selected' : ''}>Design</option>
            <option value="Human Resources" ${deptVal === 'Human Resources' ? 'selected' : ''}>Human Resources</option>
            <option value="Marketing" ${deptVal === 'Marketing' ? 'selected' : ''}>Marketing</option>
            <option value="Sales" ${deptVal === 'Sales' ? 'selected' : ''}>Sales</option>
            <option value="Finance" ${deptVal === 'Finance' ? 'selected' : ''}>Finance</option>
            <option value="Customer Support" ${deptVal === 'Customer Support' ? 'selected' : ''}>Customer Support</option>
            <option value="Quality Assurance" ${deptVal === 'Quality Assurance' ? 'selected' : ''}>Quality Assurance</option>
          </select>

          <select id="admDirStatusFilter" onchange="adminModule.switchAdminTab('directory')" style="padding:6px; font-size:11.5px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
            <option value="All" ${statusVal === 'All' ? 'selected' : ''}>All Statuses</option>
            <option value="active" ${statusVal === 'active' ? 'selected' : ''}>Active</option>
            <option value="suspended" ${statusVal === 'suspended' ? 'selected' : ''}>Suspended</option>
          </select>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          ${cardsHtml}
          ${filtered.length === 0 ? '<div style="grid-column: span 2; text-align:center; padding:32px; color:var(--text-light);">No team members match the filters.</div>' : ''}
        </div>

        <!-- Inline Profile Editor overlay area -->
        <div id="inlineProfileFormOverrideArea"></div>
      </div>
    `;
  },

  handleAssignUserProject(userId, projId) {
    if (!projId) return;
    const p = window.cbsDB.getProjectById(projId);
    if (p) {
      p.members = p.members || [];
      if (!p.members.includes(userId)) {
        p.members.push(userId);
        window.cbsDB.saveProject(p);
        window.cbsDB.addNotification('Projects', 'Member Assigned', `${window.cbsDB.getUserById(userId)?.name} assigned to project ${p.name}.`, 'Medium');
        window.cbsApp?.sync();
        if (window.showToastNotification) window.showToastNotification('User Associated', p.name);
      } else {
        alert('User is already associated to this project.');
      }
    }
  },

  openViewProfileModal(userId) {
    const u = window.cbsDB.getUserById(userId);
    if (!u) return;

    // Simulate profile details viewport modal
    let modal = document.getElementById('admDirViewProfileModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'admDirViewProfileModal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-box" style="max-width:500px;">
        <div class="modal-header">
          <h3 style="font-size:16px;">Collaborator Profile details</h3>
          <button onclick="document.getElementById('admDirViewProfileModal').classList.remove('active')" class="modal-close-btn"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body" style="padding:20px; display:flex; flex-direction:column; gap:14px; max-height:450px; overflow-y:auto;">
          <div style="display:flex; gap:16px; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:16px;">
            <img src="${u.avatar}" class="profile-avatar-large" style="width:64px; height:64px; border-radius:var(--radius-md);">
            <div style="display:flex; flex-direction:column;">
              <h4 style="font-size:16px; font-weight:800; font-family:'Outfit';">${u.name}</h4>
              <span style="font-size:12px; color:var(--text-muted); font-weight:600;">${u.role} (${u.department})</span>
              <span style="font-size:11px; color:var(--text-light); margin-top:2px;">Email: ${u.email}</span>
            </div>
          </div>
          <div>
            <h5 style="font-size:12px; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:4px;">Executive Bio</h5>
            <p style="font-size:12.5px; color:var(--text-medium); line-height:1.5;">${u.bio || 'No bio registered.'}</p>
          </div>
          <div>
            <h5 style="font-size:12px; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:4px;">Academic & Experience</h5>
            <p style="font-size:12px; color:var(--text-muted);">Education: <strong>${u.education || 'N/A'}</strong></p>
            <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">Certs: <strong>${u.certifications || 'N/A'}</strong></p>
            <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">Job Experience: <strong>${u.experience || 'N/A'}</strong></p>
          </div>
        </div>
      </div>
    `;
    modal.classList.add('active');
  },

  openEditProfileModal(userId) {
    const u = window.cbsDB.getUserById(userId);
    if (!u) return;

    const container = document.getElementById('inlineProfileFormOverrideArea');
    if (!container) return;

    container.innerHTML = `
      <div class="admin-inline-form-box" style="margin-top:20px; border-color:var(--secondary-color);">
        <h4 style="font-size:13px; font-weight:700; margin-bottom:12px;"><i class="fa-solid fa-user-gear" style="color:var(--secondary-color); margin-right:6px;"></i>Modify Directory Metadata: ${u.name}</h4>
        <form onsubmit="adminModule.handleSaveProfileOverride(event, '${u.id}')" style="display:flex; flex-direction:column; gap:12px;">
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:11px;">Identity Phone Number</label>
              <input type="text" id="overridePhone" value="${u.phone || ''}" style="padding:6px 12px; font-size:12px;">
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:11px;">Skills (comma separated)</label>
              <input type="text" id="overrideSkills" value="${u.skills || ''}" style="padding:6px 12px; font-size:12px;">
            </div>
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:11px;">Personal Bio</label>
            <textarea id="overrideBio" rows="2" style="padding:6px 12px; font-size:12px;">${u.bio || ''}</textarea>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px;">
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:11px;">LinkedIn Link</label>
              <input type="url" id="overrideLinkedin" value="${u.linkedin || ''}" style="padding:6px; font-size:12px;">
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:11px;">GitHub URL</label>
              <input type="url" id="overrideGithub" value="${u.github || ''}" style="padding:6px; font-size:12px;">
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:11px;">Portfolio link</label>
              <input type="url" id="overridePortfolio" value="${u.portfolio || ''}" style="padding:6px; font-size:12px;">
            </div>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:4px;">
            <button type="button" onclick="document.getElementById('inlineProfileFormOverrideArea').innerHTML=''" class="btn-secondary" style="padding:6px 12px; font-size:11.5px;">Cancel</button>
            <button type="submit" class="btn-primary" style="padding:6px 12px; font-size:11.5px; background:var(--secondary-color);">Save Profile Parameters</button>
          </div>
        </form>
      </div>
    `;
    window.location.hash = '#inlineProfileFormOverrideArea';
  },

  handleSaveProfileOverride(e, userId) {
    e.preventDefault();
    const u = window.cbsDB.getUserById(userId);
    if (u) {
      u.phone = document.getElementById('overridePhone').value.trim();
      u.skills = document.getElementById('overrideSkills').value.trim();
      u.bio = document.getElementById('overrideBio').value.trim();
      u.linkedin = document.getElementById('overrideLinkedin').value.trim();
      u.github = document.getElementById('overrideGithub').value.trim();
      u.portfolio = document.getElementById('overridePortfolio').value.trim();

      window.cbsDB.saveUser(u);
      document.getElementById('inlineProfileFormOverrideArea').innerHTML = '';
      window.cbsApp?.sync();
      if (window.showToastNotification) window.showToastNotification('Profile Overwritten', u.name);
    }
  },

  // ==========================================
  // SECTION 6: CHANNEL MANAGEMENT
  // ==========================================
  renderChannels(area) {
    const channels = window.cbsDB.getChannels();
    const messages = window.cbsDB.getMessages() || [];

    let rowsHtml = '';
    channels.forEach(ch => {
      const isDefault = ch.isDefault || ch.name === 'general';
      const msgCount = messages.filter(m => m.channelId === ch.id).length;
      
      // Simulate member counts. If channels members is empty, assume everyone has access
      const membersCount = (ch.members || []).length || window.cbsDB.getUsers().length;

      const deleteBtn = !isDefault ? 
        `<button onclick="adminModule.handleDeleteChannel('${ch.id}')" class="badge badge-red" style="border:none; cursor:pointer;">Delete</button>` :
        `<span style="font-size:11px; color:var(--text-light); font-weight:600;">System Protected</span>`;

      rowsHtml += `
        <tr>
          <td style="font-weight:700;"><i class="fa-solid fa-hashtag" style="color:var(--secondary-color); margin-right:6px;"></i>${ch.name}</td>
          <td style="font-size:12.5px; color:var(--text-muted);">${ch.description}</td>
          <td style="font-weight:600; text-align:center;">${membersCount} members</td>
          <td style="font-weight:600; text-align:center;">${msgCount} messages</td>
          <td>
            <div class="card-actions" style="gap:8px;">
              <button onclick="adminModule.handleRenameChannel('${ch.id}')" class="badge badge-purple" style="border:none; cursor:pointer;">Rename</button>
              <button onclick="adminModule.handleManageChannelMembers('${ch.id}')" class="badge badge-blue" style="border:none; cursor:pointer;">Members</button>
              ${deleteBtn}
            </div>
          </td>
        </tr>
      `;
    });

    area.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-size:15px; font-weight:700;"><i class="fa-solid fa-comments" style="color:var(--color-info); margin-right:8px;"></i>Discussion Channels Directory</h3>
          <button onclick="adminModule.openCreateChannelInline()" class="btn-primary" style="padding:6px 12px; font-size:11.5px;"><i class="fa-solid fa-plus"></i> Add Channel</button>
        </div>

        <div id="inlineChannelFormBox"></div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr style="font-size:11.5px; background:var(--bg-main);">
                <th>Channel name</th>
                <th>Topic Scope</th>
                <th style="text-align:center;">Members</th>
                <th style="text-align:center;">Messages</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <!-- Inline Channel members overlay -->
        <div id="inlineChannelMembersOverlayArea"></div>
      </div>
    `;
  },

  openCreateChannelInline() {
    const container = document.getElementById('inlineChannelFormBox');
    if (!container) return;

    container.innerHTML = `
      <form onsubmit="adminModule.handleSaveChannelInline(event)" style="background:var(--bg-main); border:1px solid var(--border-color); padding:12px; border-radius:var(--radius-md); margin-bottom:12px; display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; gap:8px;">
          <input type="text" id="inlineChName" placeholder="Channel Tag (e.g. ops-intel)" required style="flex:1; padding:6px 12px; font-size:12px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
          <input type="text" id="inlineChDesc" placeholder="Topic Description..." required style="flex:2; padding:6px 12px; font-size:12px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
          <button type="submit" class="btn-primary" style="padding:6px 12px; font-size:11.5px;"><i class="fa-solid fa-save"></i> Save</button>
        </div>
      </form>
    `;
  },

  handleSaveChannelInline(e) {
    e.preventDefault();
    const name = document.getElementById('inlineChName').value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    const desc = document.getElementById('inlineChDesc').value.trim();

    window.cbsDB.saveChannel({ name, description: desc, members: [] });
    document.getElementById('inlineChannelFormBox').innerHTML = '';
    window.cbsApp?.sync();
  },

  handleRenameChannel(id) {
    const ch = window.cbsDB.getChannels().find(c => c.id === id);
    if (!ch) return;

    const newName = prompt('Rename Channel: Enter new channel tag:', ch.name);
    if (newName) {
      ch.name = newName.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '');
      window.cbsDB.saveChannel(ch);
      window.cbsApp?.sync();
    }
  },

  handleDeleteChannel(id) {
    if (confirm('Delete this chat channel and erase all its messages? This cannot be restored.')) {
      window.cbsDB.deleteChannel(id);
      window.cbsApp?.sync();
    }
  },

  handleManageChannelMembers(channelId) {
    const channels = window.cbsDB.getChannels();
    const ch = channels.find(c => c.id === channelId);
    if (!ch) return;

    const users = window.cbsDB.getUsers();
    ch.members = ch.members || users.map(u => u.id); // default to everyone

    const container = document.getElementById('inlineChannelMembersOverlayArea');
    if (!container) return;

    let checklistHtml = '';
    users.forEach(u => {
      const isChecked = ch.members.includes(u.id) ? 'checked' : '';
      checklistHtml += `
        <div style="display:flex; align-items:center; gap:8px;">
          <input type="checkbox" id="chk-ch-mem-${u.id}" value="${u.id}" ${isChecked} onchange="adminModule.handleToggleChannelMember('${ch.id}', '${u.id}')" style="cursor:pointer;">
          <label for="chk-ch-mem-${u.id}" style="font-size:12.5px; cursor:pointer;">${u.name} (${u.role})</label>
        </div>
      `;
    });

    container.innerHTML = `
      <div class="admin-inline-form-box" style="margin-top:16px; border-color:var(--primary-color);">
        <h4 style="font-size:13px; font-weight:700; margin-bottom:12px;"><i class="fa-solid fa-users-gear" style="color:var(--primary-color); margin-right:6px;"></i>Manage Channel Members: #${ch.name}</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
          ${checklistHtml}
        </div>
        <div style="display:flex; justify-content:flex-end;">
          <button onclick="document.getElementById('inlineChannelMembersOverlayArea').innerHTML=''" class="btn-primary" style="padding:4px 10px; font-size:11.5px;">Close Manager</button>
        </div>
      </div>
    `;
    window.location.hash = '#inlineChannelMembersOverlayArea';
  },

  handleToggleChannelMember(channelId, userId) {
    const channels = window.cbsDB.getChannels();
    const ch = channels.find(c => c.id === channelId);
    if (ch) {
      ch.members = ch.members || [];
      const idx = ch.members.indexOf(userId);
      if (idx !== -1) {
        ch.members.splice(idx, 1);
      } else {
        ch.members.push(userId);
      }
      window.cbsDB.saveChannel(ch);
      window.cbsApp?.sync();
    }
  },

  // ==========================================
  // SECTION 7: NOTIFICATION CENTER
  // ==========================================
  renderNotifications(area) {
    const notifications = window.cbsDB.getNotifications();
    const searchVal = (document.getElementById('admNotifSearch')?.value || '').toLowerCase().trim();
    const catVal = document.getElementById('admNotifCatFilter')?.value || 'All';

    const filtered = notifications.filter(n => {
      const matchesSearch = n.title.toLowerCase().includes(searchVal) || n.message.toLowerCase().includes(searchVal);
      const matchesCat = catVal === 'All' || n.category === catVal;
      return matchesSearch && matchesCat;
    });

    let itemsHtml = '';
    filtered.forEach(n => {
      const typeBadge = n.category === 'Security' ? 'badge-red' : (n.category === 'Tasks' ? 'badge-purple' : 'badge-blue');
      
      itemsHtml += `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-main); border:1px solid var(--border-color); padding:12px; border-radius:var(--radius-md); opacity: ${n.read ? '0.7' : '1'};">
          <div style="display:flex; gap:12px; align-items:center;">
            <i class="fa-regular ${n.read ? 'fa-envelope-open' : 'fa-envelope'}" style="color:${n.read ? 'var(--text-light)' : 'var(--primary-color)'}; font-size:16px;"></i>
            <div style="display:flex; flex-direction:column;">
              <span style="font-weight:700; font-size:12.5px;">${n.title}</span>
              <span style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">${n.message}</span>
              <span style="font-size:10px; color:var(--text-light); margin-top:4px;"><i class="fa-regular fa-clock"></i> ${new Date(n.timestamp).toLocaleString()}</span>
            </div>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <span class="badge ${typeBadge}" style="font-size:9px; padding:1px 6px;">${n.category}</span>
            <button onclick="adminModule.handleToggleNotifRead('${n.id}', ${!n.read})" class="badge badge-blue" style="border:none; cursor:pointer;">
              ${n.read ? 'Unread' : 'Read'}
            </button>
            <button onclick="adminModule.handleDeleteNotif('${n.id}')" class="action-icon-btn delete" style="padding:4px;"><i class="fa-regular fa-trash-can"></i></button>
          </div>
        </div>
      `;
    });

    area.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-size:15px; font-weight:700;"><i class="fa-regular fa-bell" style="color:var(--primary-color); margin-right:8px;"></i>Live Notifications Audit</h3>
          <div style="display:flex; gap:8px;">
            <button onclick="adminModule.openCreateNotificationInline()" class="btn-primary" style="padding:6px 12px; font-size:11.5px;"><i class="fa-solid fa-bullhorn"></i> Push Alert</button>
            <button onclick="adminModule.handleMarkAllNotifsRead()" class="btn-secondary" style="padding:6px 12px; font-size:11.5px;">Mark All Read</button>
          </div>
        </div>

        <div id="inlineNotifFormBox"></div>

        <!-- Filters Row -->
        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; background:var(--bg-main); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:20px;">
          <div class="topbar-search" style="display:block; width:180px;">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="admNotifSearch" placeholder="Filter alerts..." value="${searchVal}" oninput="adminModule.switchAdminTab('notifications')" style="padding: 6px 12px 6px 30px; font-size:11.5px;">
          </div>
          
          <select id="admNotifCatFilter" onchange="adminModule.switchAdminTab('notifications')" style="padding:6px; font-size:11.5px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
            <option value="All" ${catVal === 'All' ? 'selected' : ''}>All Categories</option>
            <option value="Projects" ${catVal === 'Projects' ? 'selected' : ''}>Projects</option>
            <option value="Tasks" ${catVal === 'Tasks' ? 'selected' : ''}>Tasks</option>
            <option value="Messages" ${catVal === 'Messages' ? 'selected' : ''}>Messages</option>
            <option value="Security" ${catVal === 'Security' ? 'selected' : ''}>Security</option>
            <option value="System" ${catVal === 'System' ? 'selected' : ''}>System</option>
          </select>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          ${itemsHtml}
          ${filtered.length === 0 ? '<div style="text-align:center; padding:32px; color:var(--text-light);">No notifications matched the criteria.</div>' : ''}
        </div>
      </div>
    `;
  },

  openCreateNotificationInline() {
    const container = document.getElementById('inlineNotifFormBox');
    if (!container) return;

    container.innerHTML = `
      <div class="admin-inline-form-box">
        <h4 style="font-size:13px; font-weight:700; margin-bottom:12px;"><i class="fa-regular fa-bell" style="color:var(--primary-color); margin-right:6px;"></i>Generate Custom System Alert</h4>
        <form onsubmit="adminModule.handleCreateNotificationSubmit(event)" style="display:flex; flex-direction:column; gap:10px;">
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:11px;">Category Type</label>
              <select id="inlineNotifCat" style="padding:6px; font-size:12px;">
                <option value="System">System Alert</option>
                <option value="Security">Security Warning</option>
                <option value="Projects">Projects update</option>
                <option value="Tasks">Tasks backlogs</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label style="font-size:11px;">Priority Tier</label>
              <select id="inlineNotifPri" style="padding:6px; font-size:12px;">
                <option value="Low">Low Importance</option>
                <option value="Medium">Medium Alert</option>
                <option value="High">High Security Priority</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:11px;">Notification Title</label>
            <input type="text" id="inlineNotifTitle" placeholder="e.g. Maintenance Scheduled" required style="padding:6px 12px; font-size:12px;">
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:11px;">Detailed Warning parameters</label>
            <textarea id="inlineNotifMsg" rows="2" placeholder="Provide background info..." required style="padding:6px 12px; font-size:12px;"></textarea>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:4px;">
            <button type="button" onclick="document.getElementById('inlineNotifFormBox').innerHTML=''" class="btn-secondary" style="padding:6px 12px; font-size:11.5px;">Cancel</button>
            <button type="submit" class="btn-primary" style="padding:6px 12px; font-size:11.5px;">Push Alert notification</button>
          </div>
        </form>
      </div>
    `;
  },

  handleCreateNotificationSubmit(e) {
    e.preventDefault();
    const cat = document.getElementById('inlineNotifCat').value;
    const pri = document.getElementById('inlineNotifPri').value;
    const title = document.getElementById('inlineNotifTitle').value.trim();
    const msg = document.getElementById('inlineNotifMsg').value.trim();

    window.cbsDB.addNotification(cat, title, msg, pri);
    document.getElementById('inlineNotifFormBox').innerHTML = '';
    window.cbsApp?.sync();
  },

  handleToggleNotifRead(id, readVal) {
    const list = window.cbsDB.getNotifications();
    const idx = list.findIndex(n => n.id === id);
    if (idx !== -1) {
      list[idx].read = readVal;
      localStorage.setItem('cbs_notifications_coll', JSON.stringify(list));
      window.cbsApp?.sync();
    }
  },

  handleDeleteNotif(id) {
    window.cbsDB.deleteNotification(id);
    window.cbsApp?.sync();
  },

  handleMarkAllNotifsRead() {
    window.cbsDB.markAllNotificationsRead();
    window.cbsApp?.sync();
  },

  // ==========================================
  // SECTION 8: ACTIVITY LOGS
  // ==========================================
  renderActivity(area) {
    const logs = window.cbsDB.getActivityLogs();
    const team = window.cbsDB.getUsers();

    // Filters
    const searchVal = (document.getElementById('admLgSearch')?.value || '').toLowerCase().trim();
    const userVal = document.getElementById('admLgUserFilter')?.value || 'All';
    const catVal = document.getElementById('admLgCatFilter')?.value || 'All';
    const dateVal = document.getElementById('admLgDateFilter')?.value || '';

    const filtered = logs.filter(l => {
      const actor = team.find(u => u.id === l.userId) || { name: 'System Logs' };
      const matchesSearch = l.text.toLowerCase().includes(searchVal) || actor.name.toLowerCase().includes(searchVal);
      const matchesUser = userVal === 'All' || l.userId === userVal;
      const matchesCat = catVal === 'All' || l.type === catVal;
      
      let matchesDate = true;
      if (dateVal) {
        const logDateStr = new Date(l.timestamp).toISOString().split('T')[0];
        matchesDate = logDateStr === dateVal;
      }
      
      return matchesSearch && matchesUser && matchesCat && matchesDate;
    });

    let usersOpts = '<option value="All">All Users</option>';
    team.forEach(u => {
      usersOpts += `<option value="${u.id}" ${userVal === u.id ? 'selected' : ''}>${u.name}</option>`;
    });

    let rowsHtml = '';
    filtered.forEach(l => {
      const actor = team.find(u => u.id === l.userId) || { name: 'System Logs', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' };
      const typeBadge = l.type === 'Security' ? 'badge-red' : (l.type === 'User Management' ? 'badge-purple' : 'badge-blue');

      rowsHtml += `
        <tr style="font-size:12px;">
          <td style="color:var(--text-light); white-space:nowrap;">${new Date(l.timestamp).toLocaleString()}</td>
          <td style="font-weight:700; display:flex; align-items:center; gap:8px;">
            <img src="${actor.avatar}" class="avatar" style="width:20px; height:20px; border:none;">
            <span>${actor.name}</span>
          </td>
          <td><span class="badge ${typeBadge}" style="font-size:9.5px; padding:1px 6px;">${l.type}</span></td>
          <td style="color:var(--text-muted); line-height:1.4;">${l.text}</td>
        </tr>
      `;
    });

    area.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-size:15px; font-weight:700;"><i class="fa-solid fa-clock-rotate-left" style="color:var(--primary-color); margin-right:8px;"></i>Audit Operations History</h3>
          <span class="badge badge-purple">${filtered.length} entries</span>
        </div>

        <!-- Filters Row -->
        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; background:var(--bg-main); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:20px;">
          <div class="topbar-search" style="display:block; width:180px;">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="admLgSearch" placeholder="Filter message..." value="${searchVal}" oninput="adminModule.switchAdminTab('activity')" style="padding: 6px 12px 6px 30px; font-size:11.5px;">
          </div>

          <select id="admLgUserFilter" onchange="adminModule.switchAdminTab('activity')" style="padding:6px; font-size:11.5px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
            ${usersOpts}
          </select>

          <select id="admLgCatFilter" onchange="adminModule.switchAdminTab('activity')" style="padding:6px; font-size:11.5px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
            <option value="All" ${catVal === 'All' ? 'selected' : ''}>All Categories</option>
            <option value="Security" ${catVal === 'Security' ? 'selected' : ''}>Security</option>
            <option value="User Management" ${catVal === 'User Management' ? 'selected' : ''}>User Management</option>
            <option value="Project" ${catVal === 'Project' ? 'selected' : ''}>Project</option>
            <option value="Task" ${catVal === 'Task' ? 'selected' : ''}>Task</option>
            <option value="System" ${catVal === 'System' ? 'selected' : ''}>System</option>
          </select>

          <input type="date" id="admLgDateFilter" value="${dateVal}" onchange="adminModule.switchAdminTab('activity')" style="padding:5px; font-size:11.5px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
        </div>

        <div class="data-table-container" style="max-height: 380px; overflow-y:auto;">
          <table class="data-table">
            <thead>
              <tr style="font-size:11.5px; background:var(--bg-main); position:sticky; top:0; z-index:10;">
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Category</th>
                <th>Action Message</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              ${filtered.length === 0 ? '<tr><td colspan="4" style="text-align:center; padding:24px; color:var(--text-light);">No activity history records found.</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ==========================================
  // SECTION 9: ANALYTICS & REPORTS
  // ==========================================
  renderAnalytics(area) {
    area.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-size:15px; font-weight:700;"><i class="fa-solid fa-chart-pie" style="color:var(--secondary-color); margin-right:8px;"></i>Live Growth Analytics & Reports</h3>
          
          <div style="display:flex; gap:8px;">
            <select id="admReportSelect" style="padding:6px; font-size:11.5px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
              <option value="Users">Users Directory</option>
              <option value="Projects">Projects Velocity</option>
              <option value="Tasks">Tasks distribution</option>
              <option value="Activity">Audit logs</option>
            </select>
            <button onclick="adminModule.handleExportCSV(document.getElementById('admReportSelect').value)" class="btn-primary" style="padding:6px 12px; font-size:11.5px; background:var(--color-success);"><i class="fa-solid fa-file-csv"></i> Export CSV</button>
            <button onclick="adminModule.handleExportPDF(document.getElementById('admReportSelect').value)" class="btn-secondary" style="padding:6px 12px; font-size:11.5px;"><i class="fa-solid fa-print"></i> Export PDF</button>
          </div>
        </div>

        <!-- 5 Charts Grid -->
        <div class="admin-grid-charts">
          <div class="admin-chart-box">
            <h4 style="font-size:12px; font-weight:700; margin-bottom:12px;">Project Completion (Completed vs Active)</h4>
            <div style="flex:1; display:flex; align-items:center; justify-content:center; min-height:0;">
              <canvas id="adminChartProjectCompletion"></canvas>
            </div>
          </div>
          <div class="admin-chart-box">
            <h4 style="font-size:12px; font-weight:700; margin-bottom:12px;">Team Productivity (Completed tasks per member)</h4>
            <div style="flex:1; display:flex; align-items:center; justify-content:center; min-height:0;">
              <canvas id="adminChartTeamProductivity"></canvas>
            </div>
          </div>
          <div class="admin-chart-box">
            <h4 style="font-size:12px; font-weight:700; margin-bottom:12px;">User Activity (Audit logs frequency per user)</h4>
            <div style="flex:1; display:flex; align-items:center; justify-content:center; min-height:0;">
              <canvas id="adminChartUserActivity"></canvas>
            </div>
          </div>
          <div class="admin-chart-box">
            <h4 style="font-size:12px; font-weight:700; margin-bottom:12px;">Task Distribution (Statuses columns)</h4>
            <div style="flex:1; display:flex; align-items:center; justify-content:center; min-height:0;">
              <canvas id="adminChartTaskDistribution"></canvas>
            </div>
          </div>
          <div class="admin-chart-box" style="grid-column: span 2;">
            <h4 style="font-size:12px; font-weight:700; margin-bottom:12px;">Workspace Growth (User Enrollment Timeline)</h4>
            <div style="flex:1; display:flex; align-items:center; justify-content:center; min-height:0; height:180px;">
              <canvas id="adminChartWorkspaceGrowth"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;

    // Instantiate Chart.js graphs dynamically
    setTimeout(() => {
      this.drawAnalyticsCharts();
    }, 100);
  },

  drawAnalyticsCharts() {
    const users = window.cbsDB.getUsers();
    const projects = window.cbsDB.getProjects();
    const tasks = window.cbsDB.getTasks();
    const logs = window.cbsDB.getActivityLogs();

    // 1. Project Completion (Doughnut)
    const completedProj = projects.filter(p => p.status === 'Completed').length;
    const activeProj = projects.filter(p => p.status !== 'Completed').length;

    const ctx1 = document.getElementById('adminChartProjectCompletion');
    if (ctx1) {
      this.charts['projectCompletion'] = new Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Active/Other'],
          datasets: [{
            data: [completedProj, activeProj],
            backgroundColor: ['#10b981', '#3b82f6'],
            borderWidth: 0
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    // 2. Team Productivity (Horizontal Bar)
    const completedTasksPerMember = {};
    users.forEach(u => { completedTasksPerMember[u.name] = 0; });
    tasks.filter(t => t.status === 'Completed').forEach(t => {
      const u = users.find(usr => usr.id === t.assigneeId);
      if (u) completedTasksPerMember[u.name]++;
    });

    const ctx2 = document.getElementById('adminChartTeamProductivity');
    if (ctx2) {
      this.charts['teamProductivity'] = new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: Object.keys(completedTasksPerMember),
          datasets: [{
            label: 'Tasks Completed',
            data: Object.values(completedTasksPerMember),
            backgroundColor: '#8b5cf6'
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
      });
    }

    // 3. User Activity (Pie)
    const logsPerUser = {};
    users.forEach(u => { logsPerUser[u.name] = 0; });
    logs.forEach(l => {
      const u = users.find(usr => usr.id === l.userId);
      if (u) logsPerUser[u.name]++;
    });

    const ctx3 = document.getElementById('adminChartUserActivity');
    if (ctx3) {
      this.charts['userActivity'] = new Chart(ctx3, {
        type: 'pie',
        data: {
          labels: Object.keys(logsPerUser),
          datasets: [{
            data: Object.values(logsPerUser),
            backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4']
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    // 4. Task Distribution (Vertical Bar)
    const taskStatusCounts = { 'Backlog': 0, 'To Do': 0, 'In Progress': 0, 'Review': 0, 'Completed': 0 };
    tasks.forEach(t => {
      if (taskStatusCounts[t.status] !== undefined) taskStatusCounts[t.status]++;
    });

    const ctx4 = document.getElementById('adminChartTaskDistribution');
    if (ctx4) {
      this.charts['taskDistribution'] = new Chart(ctx4, {
        type: 'bar',
        data: {
          labels: Object.keys(taskStatusCounts),
          datasets: [{
            label: 'Tasks',
            data: Object.values(taskStatusCounts),
            backgroundColor: ['#64748b', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
      });
    }

    // 5. Workspace Growth (Line chart)
    // Sort users by createdDate
    const sortedUsers = [...users].sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate));
    const labels = [];
    const cumulative = [];
    let count = 0;
    sortedUsers.forEach(u => {
      const d = new Date(u.createdDate).toLocaleDateString();
      labels.push(d);
      count++;
      cumulative.push(count);
    });

    const ctx5 = document.getElementById('adminChartWorkspaceGrowth');
    if (ctx5) {
      this.charts['workspaceGrowth'] = new Chart(ctx5, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Total Registered Users',
            data: cumulative,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            fill: true,
            tension: 0.2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
      });
    }
  },

  handleExportCSV(reportType) {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (reportType === 'Users') {
      csvContent += "ID,Name,Email,Role,Department,Status\n";
      window.cbsDB.getUsers().forEach(u => {
        csvContent += `"${u.id}","${u.name}","${u.email}","${u.role}","${u.department}","${u.status}"\n`;
      });
    } else if (reportType === 'Projects') {
      csvContent += "ID,Name,OwnerID,Priority,Progress,Status,StartDate,DueDate\n";
      window.cbsDB.getProjects().forEach(p => {
        csvContent += `"${p.id}","${p.name}","${p.ownerId}","${p.priority}",${p.progress},"${p.status}","${p.startDate}","${p.dueDate}"\n`;
      });
    } else if (reportType === 'Tasks') {
      csvContent += "ID,ProjectID,Title,AssigneeID,Priority,Status,DueDate\n";
      window.cbsDB.getTasks().forEach(t => {
        csvContent += `"${t.id}","${t.projectId}","${t.title}","${t.assigneeId}","${t.priority}","${t.status}","${t.dueDate}"\n`;
      });
    } else if (reportType === 'Activity') {
      csvContent += "ID,Timestamp,UserID,Category,ActionMessage\n";
      window.cbsDB.getActivityLogs().forEach(l => {
        csvContent += `"${l.id}","${l.timestamp}","${l.userId}","${l.type}","${l.text.replace(/"/g, '""')}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CBS_${reportType}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  handleExportPDF(reportType) {
    // Generates a simple, elegant printable layout in a new window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    let reportHtml = `
      <html>
      <head>
        <title>Cyber Black Squad - ${reportType} Report</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #333; }
          h2 { border-bottom: 2px solid #3b82f6; padding-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
          th { background: #f8fafc; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>Cyber Black Squad Platform Report: ${reportType}</h2>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
    `;

    if (reportType === 'Users') {
      reportHtml += `<tr><th>Name</th><th>Role</th><th>Email</th><th>Department</th><th>Status</th></tr></thead><tbody>`;
      window.cbsDB.getUsers().forEach(u => {
        reportHtml += `<tr><td>${u.name}</td><td>${u.role}</td><td>${u.email}</td><td>${u.department}</td><td>${u.status}</td></tr>`;
      });
    } else if (reportType === 'Projects') {
      reportHtml += `<tr><th>Project Name</th><th>Priority</th><th>Progress</th><th>Status</th><th>Due Date</th></tr></thead><tbody>`;
      window.cbsDB.getProjects().forEach(p => {
        reportHtml += `<tr><td>${p.name}</td><td>${p.priority}</td><td>${p.progress}%</td><td>${p.status}</td><td>${p.dueDate}</td></tr>`;
      });
    } else if (reportType === 'Tasks') {
      reportHtml += `<tr><th>Task Title</th><th>Priority</th><th>Status</th><th>Due Date</th></tr></thead><tbody>`;
      window.cbsDB.getTasks().forEach(t => {
        reportHtml += `<tr><td>${t.title}</td><td>${t.priority}</td><td>${t.status}</td><td>${t.dueDate}</td></tr>`;
      });
    } else if (reportType === 'Activity') {
      reportHtml += `<tr><th>Time</th><th>Category</th><th>Log Action</th></tr></thead><tbody>`;
      window.cbsDB.getActivityLogs().forEach(l => {
        reportHtml += `<tr><td>${new Date(l.timestamp).toLocaleString()}</td><td>${l.type}</td><td>${l.text}</td></tr>`;
      });
    }

    reportHtml += `</tbody></table></body></html>`;

    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  },

  // ==========================================
  // SECTION 10: BROADCAST CENTER
  // ==========================================
  renderBroadcasts(area) {
    area.innerHTML = `
      <div style="max-width:540px; margin:0 auto; background:var(--bg-main); border:1px solid var(--border-color); padding:20px; border-radius:var(--radius-lg);">
        <h4 style="font-size:14px; font-weight:700; border-bottom:1px solid var(--border-color); padding-bottom:8px; margin-bottom:16px;">
          <i class="fa-solid fa-bullhorn" style="color:var(--color-danger); margin-right:8px;"></i>Global System Announcement Broadcast
        </h4>
        <form onsubmit="adminModule.handleBroadcastAnnouncementSubmit(event)" style="display:flex; flex-direction:column; gap:12px;">
          <div class="form-group">
            <label for="broadTitle" style="font-weight:600; font-size:12px;">Announcement Title</label>
            <input type="text" id="broadTitle" placeholder="e.g. Critical security patch updates v2.4.1" required style="padding:8px 12px; font-size:12px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
          </div>
          
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:0;">
            <div class="form-group">
              <label for="broadPriority" style="font-weight:600; font-size:12px;">Priority Importance</label>
              <select id="broadPriority" style="padding:6px; font-size:12px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
                <option value="Low">Low Importance</option>
                <option value="Medium" selected>Medium alert</option>
                <option value="High">High Security Priority</option>
              </select>
            </div>
            <div class="form-group">
              <label for="broadAudience" style="font-weight:600; font-size:12px;">Audience Scope</label>
              <select id="broadAudience" style="padding:6px; font-size:12px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
                <option value="All">All Collaborators</option>
                <option value="Founder">Founders Only</option>
                <option value="Manager">Managers Only</option>
                <option value="Team Member">Team Members Only</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="broadMsg" style="font-weight:600; font-size:12px;">Broadcast Announcement text</label>
            <textarea id="broadMsg" rows="3" placeholder="Provide description..." required style="padding:8px 12px; font-size:12px; border:1px solid var(--border-color); border-radius:var(--radius-sm);"></textarea>
          </div>

          <button type="submit" class="btn-primary" style="margin-top:6px; justify-content:center;"><i class="fa-solid fa-paper-plane"></i> Broadcast Announcement</button>
        </form>
      </div>
    `;
  },

  handleBroadcastAnnouncementSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('broadTitle').value.trim();
    const pri = document.getElementById('broadPriority').value;
    const msg = document.getElementById('broadMsg').value.trim();
    const audience = document.getElementById('broadAudience').value;

    const me = window.cbsAuth.getCurrentUser();

    // 1. Add alert to notification center
    window.cbsDB.addNotification('System', `[Broadcast] ${title}`, `${msg} (Scope: ${audience})`, pri);
    
    // 2. Add activity log
    window.cbsDB.addActivityLog(me.id, `Broadcasted announcement: "${title}" to ${audience}`, 'System');

    // 3. Post to general discussions chat channel
    const channels = window.cbsDB.getChannels();
    const generalChannel = channels.find(c => c.name === 'general') || channels[0];
    if (generalChannel) {
      window.cbsDB.addChatMessage(generalChannel.id, me.id, `🚨 **[WORKSPACE BROADCAST - ${pri}]**: **${title}**\n${msg}`);
    }

    document.getElementById('broadTitle').value = '';
    document.getElementById('broadMsg').value = '';

    window.cbsApp?.sync();
    if (window.showToastNotification) window.showToastNotification('Global Broadcast Sent', title);
  },

  // ==========================================
  // SECTION 11: SECURITY MANAGEMENT
  // ==========================================
  renderSecurity(area) {
    const sessions = window.cbsDB.getSessions();
    const team = window.cbsDB.getUsers();

    // Login histories list table rows
    let rowsHtml = '';
    sessions.forEach(s => {
      const u = team.find(us => us.id === s.userId) || { name: 'Offline User', status: 'active' };
      const isSuccess = s.status === 'Success';
      const isTerminated = s.status === 'Terminated';
      const badgeClass = isSuccess ? 'badge-green' : (isTerminated ? 'badge-red' : 'badge-orange');

      let actionBtn = '';
      if (isSuccess) {
        actionBtn = `<button onclick="adminModule.handleForceLogout('${s.id}')" class="badge badge-red" style="border:none; cursor:pointer;">Force Logout</button>`;
      } else {
        actionBtn = `<button onclick="adminModule.handleDeleteSessionRecord('${s.id}')" class="action-icon-btn delete" style="padding:2px;"><i class="fa-regular fa-trash-can"></i></button>`;
      }

      rowsHtml += `
        <tr>
          <td>${new Date(s.loginTime).toLocaleString()}</td>
          <td style="font-weight:700;">${u.name}</td>
          <td style="font-size:12.5px; color:var(--text-muted);">${s.ip}</td>
          <td><span class="badge ${badgeClass}">${s.status}</span></td>
          <td>
            <div class="card-actions" style="gap:8px;">
              ${actionBtn}
              ${u.status !== 'suspended' && u.id !== window.cbsAuth.getCurrentUser()?.id ? `<button onclick="adminModule.handleSuspendUserFromSecurity('${u.id}')" class="badge badge-orange" style="border:none; cursor:pointer;">Suspend Account</button>` : ''}
            </div>
          </td>
        </tr>
      `;
    });

    // Compute failed login counts
    const failedLogins = sessions.filter(s => s.status.startsWith('Failed')).length;

    area.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-size:15px; font-weight:700;"><i class="fa-solid fa-shield-halved" style="color:var(--color-danger); margin-right:8px;"></i>Security Governance & Active Sessions</h3>
          <span class="badge badge-red" style="font-size:11px; text-transform:uppercase;">Failed Login Attempts: ${failedLogins}</span>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr style="font-size:11.5px; background:var(--bg-main);">
                <th>Session Time</th>
                <th>User Account</th>
                <th>Client IP</th>
                <th>Status</th>
                <th>Control Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              ${sessions.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding:24px; color:var(--text-light);">No active sessions logs.</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  handleForceLogout(sessionId) {
    if (confirm('Verify: Terminate this session and force user logout?')) {
      const sessions = window.cbsDB.getSessions();
      const s = sessions.find(sess => sess.id === sessionId);
      if (s) {
        s.status = 'Terminated';
        localStorage.setItem('cbs_sessions_coll', JSON.stringify(sessions));
        
        // Log action
        window.cbsDB.addActivityLog(window.cbsAuth.getCurrentUser()?.id, `Administratively terminated session for User ID: ${s.userId}`, 'Security');
        window.cbsApp?.sync();
        if (window.showToastNotification) window.showToastNotification('Session Invalidated', `User forced to logout.`);
      }
    }
  },

  handleDeleteSessionRecord(sessionId) {
    const sessions = window.cbsDB.getSessions().filter(s => s.id !== sessionId);
    localStorage.setItem('cbs_sessions_coll', JSON.stringify(sessions));
    window.cbsApp?.sync();
  },

  handleSuspendUserFromSecurity(userId) {
    if (confirm('Verify: Suspend access permissions for this account?')) {
      this.handleToggleUserStatus(userId, 'suspended');
      if (window.showToastNotification) window.showToastNotification('Account Suspended', 'Security lock applied.');
    }
  },

  // ==========================================
  // SECTION 12: WORKSPACE SETTINGS
  // ==========================================
  renderSettings(area) {
    const settings = window.cbsDB.getSettings();
    const timeout = settings.security?.sessionTimeout || 30;
    const minPassLen = settings.security?.minPasswordLength || 6;

    area.innerHTML = `
      <div style="max-width:540px; margin:0 auto; display:flex; flex-direction:column; gap:20px;">
        <h3 style="font-size:15px; font-weight:700;"><i class="fa-solid fa-sliders" style="color:var(--primary-color); margin-right:8px;"></i>System Workspace Configurations</h3>
        
        <form onsubmit="adminModule.handleSaveSettingsSubmit(event)" style="display:flex; flex-direction:column; gap:16px;">
          
          <!-- Theme -->
          <div style="background:var(--bg-main); border:1px solid var(--border-color); padding:16px; border-radius:var(--radius-md);">
            <h4 style="font-size:12.5px; font-weight:700; margin-bottom:8px;"><i class="fa-solid fa-circle-half-stroke"></i> System Theme Settings</h4>
            <select id="admSetTheme" style="padding:6px; font-size:12px; width:100%; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
              <option value="light" ${settings.appearance === 'light' ? 'selected' : ''}>Light Theme Mode</option>
              <option value="dark" ${settings.appearance === 'dark' ? 'selected' : ''}>Dark Theme Mode (Midnight)</option>
              <option value="auto" ${settings.appearance === 'auto' ? 'selected' : ''}>Auto Schedule Sync</option>
            </select>
          </div>

          <!-- Notifications -->
          <div style="background:var(--bg-main); border:1px solid var(--border-color); padding:16px; border-radius:var(--radius-md);">
            <h4 style="font-size:12.5px; font-weight:700; margin-bottom:8px;"><i class="fa-solid fa-envelope"></i> Notifications Channels</h4>
            <div style="display:flex; flex-direction:column; gap:8px;">
              <label style="display:flex; align-items:center; gap:8px; font-weight:normal; font-size:12px; cursor:pointer;">
                <input type="checkbox" id="admSetEmailNotif" ${settings.notifications?.email ? 'checked' : ''}>
                <span>Email Notifications Digests</span>
              </label>
              <label style="display:flex; align-items:center; gap:8px; font-weight:normal; font-size:12px; cursor:pointer;">
                <input type="checkbox" id="admSetPushNotif" ${settings.notifications?.push ? 'checked' : ''}>
                <span>Push Banner Alerts</span>
              </label>
            </div>
          </div>

          <!-- Password Policy slider -->
          <div style="background:var(--bg-main); border:1px solid var(--border-color); padding:16px; border-radius:var(--radius-md);">
            <h4 style="font-size:12.5px; font-weight:700; margin-bottom:8px;"><i class="fa-solid fa-key"></i> Workspace Password Security Policy</h4>
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
              <label for="admSetMinPass" style="font-size:12px;">Minimum Password Length:</label>
              <span id="lblMinPass" style="font-weight:700; font-size:12px; color:var(--primary-color);">${minPassLen} characters</span>
            </div>
            <input type="range" id="admSetMinPass" min="6" max="16" value="${minPassLen}" oninput="document.getElementById('lblMinPass').textContent = this.value + ' characters'" style="width:100%;">
          </div>

          <!-- Session Timeout slider -->
          <div style="background:var(--bg-main); border:1px solid var(--border-color); padding:16px; border-radius:var(--radius-md);">
            <h4 style="font-size:12.5px; font-weight:700; margin-bottom:8px;"><i class="fa-solid fa-clock"></i> Active Session Inactivity Timeout</h4>
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
              <label for="admSetTimeout" style="font-size:12px;">Session Limit:</label>
              <span id="lblTimeout" style="font-weight:700; font-size:12px; color:var(--secondary-color);">${timeout} minutes</span>
            </div>
            <input type="range" id="admSetTimeout" min="5" max="120" step="5" value="${timeout}" oninput="document.getElementById('lblTimeout').textContent = this.value + ' minutes'" style="width:100%;">
          </div>

          <button type="submit" class="btn-primary" style="justify-content:center;"><i class="fa-regular fa-square-check"></i> Apply System Settings</button>
        </form>
      </div>
    `;
  },

  handleSaveSettingsSubmit(e) {
    e.preventDefault();
    const settings = window.cbsDB.getSettings();

    const appearance = document.getElementById('admSetTheme').value;
    const email = document.getElementById('admSetEmailNotif').checked;
    const push = document.getElementById('admSetPushNotif').checked;
    const minPassLen = Number(document.getElementById('admSetMinPass').value);
    const sessionTimeout = Number(document.getElementById('admSetTimeout').value);

    settings.appearance = appearance;
    settings.notifications = { email, push, alerts: settings.notifications?.alerts || true };
    settings.security = { passwordExpiry: settings.security?.passwordExpiry || 90, requireMfa: settings.security?.requireMfa || false, minPasswordLength: minPassLen, sessionTimeout };

    window.cbsDB.saveSettings(settings);

    // Dynamic theme override
    if (window.applyWorkspaceTheme) {
      window.applyWorkspaceTheme(appearance);
    }

    window.cbsDB.addActivityLog(window.cbsAuth.getCurrentUser()?.id, `Updated workspace settings preferences.`, 'System');
    window.cbsApp?.sync();

    if (window.showToastNotification) window.showToastNotification('Settings Synced', 'Global configurations updated.');
  }
};

window.adminModule = adminModule;
