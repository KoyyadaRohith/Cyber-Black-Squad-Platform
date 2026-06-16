/**
 * Cyber Black Squad – Real-Time Notification Engine
 * Audits unread counts, controls visual dropdown notifications cards,
 * category scoping, query filters, and bulk status updates.
 */

const notificationsModule = {
  activeCategoryFilter: 'All',

  render() {
    this.syncBellIndicator();
    
    // Check if notifications viewport is active
    const container = document.getElementById('fullNotificationsList');
    if (!container) return; // safeguard

    container.innerHTML = '';
    const notifications = window.cbsDB.getNotifications();
    const searchQuery = (document.getElementById('notificationSearchInput')?.value || '').toLowerCase().trim();
    const categoryFilter = this.activeCategoryFilter;

    const filtered = notifications.filter(n => {
      const matchesSearch = n.title.toLowerCase().includes(searchQuery) || n.message.toLowerCase().includes(searchQuery);
      const matchesCategory = categoryFilter === 'All' || n.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    filtered.forEach(n => {
      const isUnread = !n.read;
      const cardStyle = isUnread ? 'border-left: 4px solid var(--primary-color); background: rgba(59, 130, 246, 0.01);' : '';
      const readBtn = isUnread 
        ? `<button onclick="notificationsModule.handleMarkRead(event, '${n.id}')" class="btn-secondary" style="padding: 4px 8px; font-size:11px;">Mark Read</button>`
        : `<button onclick="notificationsModule.handleMarkUnread(event, '${n.id}')" class="btn-secondary" style="padding: 4px 8px; font-size:11px;">Mark Unread</button>`;
      const priorityClass = n.priority === 'High' ? 'badge-red' : (n.priority === 'Medium' ? 'badge-orange' : 'badge-blue');

      const iconClass = this.getCategoryIcon(n.category);
      const colorClass = this.getCategoryColorClass(n.category);

      const div = document.createElement('div');
      div.className = 'metric-card';
      div.setAttribute('style', `justify-content: flex-start; gap: 20px; cursor: pointer; ${cardStyle}`);
      
      div.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
        notificationsModule.openDetailsModal(n.id);
      });

      div.innerHTML = `
        <div class="notification-icon-wrapper ${colorClass}"><i class="${iconClass}" style="font-size:16px;"></i></div>
        <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
          <div style="display:flex; align-items:center; gap:8px;">
            <h4 style="font-size:13.5px; font-weight:700; color: var(--text-main);">${n.title}</h4>
            <span class="badge ${priorityClass}" style="font-size:9px; padding:2px 6px;">${n.priority}</span>
            <span class="badge" style="font-size:9px; padding:2px 6px; background:#f1f5f9; color:var(--text-muted);">${n.category}</span>
          </div>
          <p style="font-size:12.5px; color: var(--text-muted);">${n.message}</p>
          <span style="font-size:11px; color: var(--text-light);"><i class="fa-regular fa-clock"></i> ${new Date(n.timestamp).toLocaleDateString()} (${this.formatRelative(n.timestamp)})</span>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          ${readBtn}
          <button onclick="notificationsModule.handleDelete(event, '${n.id}')" class="action-icon-btn delete" style="width:28px; height:28px; font-size:11px;" title="Delete notification"><i class="fa-regular fa-trash-can"></i></button>
        </div>
      `;
      container.appendChild(div);
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="panel-card" style="text-align:center; padding:48px;">
          <i class="fa-regular fa-bell-slash" style="font-size:32px; color:var(--text-light); margin-bottom:12px;"></i>
          <p style="color: var(--text-muted); font-size: 14px;">No workspace alerts found matching active filters.</p>
        </div>
      `;
    }
  },

  syncBellIndicator() {
    const notifications = window.cbsDB.getNotifications();
    const unread = notifications.filter(n => !n.read);
    const badge = document.getElementById('unreadIndicator');
    
    if (badge) {
      if (unread.length > 0) {
        badge.style.display = 'block';
        badge.textContent = unread.length > 9 ? '9+' : unread.length;
      } else {
        badge.style.display = 'none';
      }
    }

    // Populate active topbar dropdown list
    const dropdownList = document.getElementById('notificationDropdownList');
    if (!dropdownList) return;

    dropdownList.innerHTML = '';
    
    notifications.slice(0, 5).forEach(n => {
      const isUnread = !n.read;
      const iconClass = this.getCategoryIcon(n.category);
      const colorClass = this.getCategoryColorClass(n.category);
      
      const li = document.createElement('li');
      li.className = `notification-item ${isUnread ? 'unread' : ''}`;
      li.onclick = () => {
        notificationsModule.openDetailsModal(n.id);
      };
      
      li.innerHTML = `
        <div class="notification-icon-wrapper ${colorClass}"><i class="${iconClass}"></i></div>
        <div class="notification-info">
          <span class="notification-title">${n.title}</span>
          <span class="notification-msg">${n.message}</span>
          <span class="notification-time">${this.formatRelative(n.timestamp)}</span>
        </div>
      `;
      dropdownList.appendChild(li);
    });

    if (notifications.length === 0) {
      dropdownList.innerHTML = '<li class="notification-item" style="justify-content:center; padding:16px;"><span style="color:var(--text-light); font-size:12px;">Clear and empty history logs.</span></li>';
    }
  },

  switchCategoryFilter(category) {
    this.activeCategoryFilter = category;
    
    // Toggle active design styles on tags using ID selectors
    document.querySelectorAll('[id^="notif-tab-"]').forEach(btn => {
      btn.className = 'badge badge-blue';
    });

    const activeBtn = document.getElementById(`notif-tab-${category.toLowerCase()}`);
    if (activeBtn) {
      activeBtn.className = 'badge badge-purple';
    }

    this.render();
  },

  async handleMarkRead(e, id) {
    e.stopPropagation();
    await window.cbsDB.markNotificationRead(id);
    this.syncBellIndicator();
    this.render();
  },

  async handleMarkUnread(e, id) {
    e.stopPropagation();
    const notifications = window.cbsDB.getNotifications();
    const idx = notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      notifications[idx].read = false;
      await window.cbsDB.saveNotification(notifications[idx]);
    }
    this.syncBellIndicator();
    this.render();
  },

  async handleDelete(e, id) {
    e.stopPropagation();
    await window.cbsDB.deleteNotification(id);
    this.syncBellIndicator();
    this.render();
  },

  async handleMarkAllRead() {
    await window.cbsDB.markAllNotificationsRead();
    this.syncBellIndicator();
    this.render();
    
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) dropdown.classList.remove('active');
  },

  async handleClearAll() {
    if (confirm('Delete all notification logs permanently?')) {
      await window.cbsDB.clearNotifications();
      this.syncBellIndicator();
      this.render();
    }
  },

  async openDetailsModal(id) {
    const notifications = window.cbsDB.getNotifications();
    const n = notifications.find(not => not.id === id);
    if (!n) return;

    // Automatically mark read on open
    n.read = true;
    await window.cbsDB.saveNotification(n);
    this.syncBellIndicator();
    this.render();

    let modal = document.getElementById('notificationDetailModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'notificationDetailModal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    const priorityClass = n.priority === 'High' ? 'badge-red' : (n.priority === 'Medium' ? 'badge-orange' : 'badge-blue');
    const iconClass = this.getCategoryIcon(n.category);
    const colorClass = this.getCategoryColorClass(n.category);

    modal.innerHTML = `
      <div class="modal-box" style="max-width: 460px;">
        <div class="modal-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <div class="notification-icon-wrapper ${colorClass}" style="width:28px; height:28px; border-radius: 50%;"><i class="${iconClass}" style="font-size:12px;"></i></div>
            <h3 style="font-size:15px; margin:0;">Alert Details</h3>
          </div>
          <button onclick="document.getElementById('notificationDetailModal').classList.remove('active')" class="modal-close-btn"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body" style="padding: 20px; display:flex; flex-direction:column; gap:12px;">
          <div>
            <span class="badge ${priorityClass}" style="font-size:9.5px; padding:2px 6px; margin-right:6px;">${n.priority} Priority</span>
            <span class="badge" style="font-size:9.5px; padding:2px 6px; background:var(--bg-main); color:var(--text-muted); border:1px solid var(--border-color);">${n.category}</span>
          </div>
          <h4 style="font-size:14px; font-weight:700; color:var(--text-main);">${n.title}</h4>
          <p style="font-size:12.5px; color:var(--text-muted); line-height:1.5; background:var(--bg-main); padding:12px; border-radius:var(--radius-sm); border:1px solid var(--border-color);">${n.message}</p>
          <span style="font-size:11px; color:var(--text-light);"><i class="fa-regular fa-clock"></i> Received: ${new Date(n.timestamp).toLocaleString()}</span>
          <div class="form-actions-row" style="border-top:1px solid var(--border-color); padding-top:14px; margin-top:8px; justify-content:flex-end;">
            <button onclick="document.getElementById('notificationDetailModal').classList.remove('active')" class="btn-primary" style="padding: 8px 16px;">Close</button>
          </div>
        </div>
      </div>
    `;
    modal.classList.add('active');
  },

  getCategoryIcon(cat) {
    switch (cat) {
      case 'Tasks': return 'fa-solid fa-list-check';
      case 'Projects': return 'fa-solid fa-briefcase';
      case 'Messages': return 'fa-solid fa-comments';
      case 'Security': return 'fa-solid fa-user-shield';
      case 'System': default: return 'fa-solid fa-bell';
    }
  },

  getCategoryColorClass(cat) {
    switch (cat) {
      case 'Tasks': return 'task';
      case 'Projects': return 'project';
      case 'Security': return 'security';
      case 'Messages': return 'messages';
      case 'System': default: return '';
    }
  },

  formatRelative(isoStr) {
    const date = new Date(isoStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  }
};

window.notificationsModule = notificationsModule;
