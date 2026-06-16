/**
 * Cyber Black Squad – Enterprise Kanban Task Board Module
 * Implements HTML5 Drag and Drop actions across 5 backlog columns,
 * comment threads, mock file attachment loaders, and role policy locks.
 */

const tasksModule = {
  render() {
    const tasks = window.cbsDB.getTasks();
    const projects = window.cbsDB.getProjects();
    const team = window.cbsDB.getUsers();
    const canEdit = window.cbsAuth.canEdit();

    const addNewTaskBtn = document.getElementById('addNewTaskBtn');
    if (addNewTaskBtn) {
      addNewTaskBtn.style.display = canEdit ? '' : 'none';
    }

    // Filters
    const searchVal = (document.getElementById('taskSearch')?.value || '').toLowerCase();
    const projFilter = document.getElementById('taskProjectFilter')?.value || 'All';
    const priFilter = document.getElementById('taskPriorityFilter')?.value || 'All';

    // Apply filter criteria
    const filtered = tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchVal) || t.description.toLowerCase().includes(searchVal);
      const matchesProj = projFilter === 'All' || t.projectId === projFilter;
      const matchesPri = priFilter === 'All' || t.priority === priFilter;
      return matchesSearch && matchesProj && matchesPri;
    });

    // Populate project filter options dynamically to capture newly created projects
    const selectFilter = document.getElementById('taskProjectFilter');
    if (selectFilter) {
      const activeFilterVal = projFilter;
      selectFilter.innerHTML = '<option value="All">All Projects</option>';
      projects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        if (p.id === activeFilterVal) opt.selected = true;
        selectFilter.appendChild(opt);
      });
    }

    // Map column elements
    const lists = {
      'Backlog': document.getElementById('col-backlog-list'),
      'To Do': document.getElementById('col-todo-list'),
      'In Progress': document.getElementById('col-inprogress-list'),
      'In Review': document.getElementById('col-inreview-list'), // Map "Review" status to dashboard UI columns list
      'Review': document.getElementById('col-inreview-list'),
      'Completed': document.getElementById('col-completed-list')
    };

    const counts = {
      'Backlog': document.getElementById('count-backlog'),
      'To Do': document.getElementById('count-todo'),
      'In Progress': document.getElementById('count-inprogress'),
      'In Review': document.getElementById('count-inreview'),
      'Completed': document.getElementById('count-completed')
    };

    // Clear column html content and reset count badges
    Object.values(lists).forEach(list => { if (list) list.innerHTML = ''; });
    Object.values(counts).forEach(cSpan => { if (cSpan) cSpan.textContent = '0'; });

    const stats = { 'Backlog': 0, 'To Do': 0, 'In Progress': 0, 'Review': 0, 'Completed': 0 };

    filtered.forEach(t => {
      // Map 'Review' status to 'In Review' for dashboard board structure consistency
      const mappedStatus = t.status === 'Review' ? 'In Review' : t.status;
      const listElement = lists[mappedStatus] || lists[t.status];
      if (!listElement) return;

      stats[t.status === 'Review' ? 'In Review' : t.status]++;

      const project = projects.find(p => p.id === t.projectId);
      const assignee = team.find(u => u.id === t.assigneeId);
      const priorityClass = t.priority === 'High' ? 'priority-high' : (t.priority === 'Medium' ? 'priority-medium' : 'priority-low');

      // Determine if task is overdue (overdue when current time is after deadline and status is not Completed)
      const isOverdue = new Date(t.dueDate) < new Date() && t.status !== 'Completed';
      const deadlineStyle = isOverdue ? 'color: var(--color-danger); font-weight:700;' : '';
      const borderStyle = isOverdue ? 'border: 2px solid var(--color-danger); box-shadow: 0 0 10px rgba(239, 68, 68, 0.1);' : '';
      const deadlineIcon = isOverdue ? '<i class="fa-solid fa-triangle-exclamation animate-pulse"></i>' : '<i class="fa-regular fa-clock"></i>';

      // Security checking: Administrators and Founders can modify all tasks. Members cannot edit or drag tasks.
      const canDrag = canEdit;

      const card = document.createElement('div');
      card.className = 'task-card';
      card.setAttribute('style', `${borderStyle} cursor: ${canDrag ? 'grab' : 'not-allowed'};`);
      card.setAttribute('draggable', canDrag ? 'true' : 'false');

      // Drag & Drop events
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', t.id);
        card.style.opacity = '0.4';
      });
      card.addEventListener('dragend', () => {
        card.style.opacity = '1';
      });

      // Click to open spec detail dialog
      card.addEventListener('click', (e) => {
        // avoid trigger if clicking profile avatars or icon buttons
        if (e.target.closest('.avatar') || e.target.closest('.action-icon-btn')) return;
        tasksModule.openDetailsModal(t.id);
      });

      card.innerHTML = `
        <div class="task-card-header">
          <span class="task-priority ${priorityClass}">${t.priority}</span>
          <span style="font-size:11px; font-weight:600; color:var(--text-muted);">${project ? project.name.substring(0, 14) + '...' : 'Internal'}</span>
        </div>
        <h4 class="task-card-title">${t.title}</h4>
        <p class="task-card-desc">${t.description}</p>
        
        <!-- Task Backlog completion slider preview -->
        <div class="project-progress-container" style="gap:4px; margin-top:4px;">
          <div class="progress-label" style="font-size: 10px;">
            <span>Completed</span>
            <span><strong>${t.progress}%</strong></span>
          </div>
          <div class="progress-bar-bg" style="height:4px;"><div class="progress-bar-fill" style="width:${t.progress}%;"></div></div>
        </div>

        <div class="task-card-footer">
          <span class="task-deadline" style="${deadlineStyle}">${deadlineIcon} ${this.formatDate(t.dueDate)}</span>
          <div style="display:flex; align-items:center; gap:6px;">
            ${t.comments?.length > 0 ? `<span style="font-size:11px; color:var(--text-light);"><i class="fa-regular fa-comment"></i> ${t.comments.length}</span>` : ''}
            <img src="${assignee ? assignee.avatar : 'assets/avatar.png'}" 
                 class="avatar" style="width:24px; height:24px; border:none;" 
                 title="Assigned to: ${assignee ? assignee.name : 'Unassigned'}">
          </div>
        </div>
      `;
      listElement.appendChild(card);
    });

    // Update counts badges
    Object.keys(counts).forEach(key => {
      const el = counts[key];
      if (el) el.textContent = stats[key] || 0;
    });

    // Bind columns droppable areas
    this.initDragAndDropListeners();
  },

  initDragAndDropListeners() {
    const cols = document.querySelectorAll('.kanban-cards-list');
    cols.forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.style.background = 'rgba(139, 92, 246, 0.04)';
      });

      col.addEventListener('dragleave', () => {
        col.style.background = 'transparent';
      });

      col.addEventListener('drop', async (e) => {
        e.preventDefault();
        col.style.background = 'transparent';

        const taskId = e.dataTransfer.getData('text/plain');
        const task = window.cbsDB.getTaskById(taskId);
        if (!task) return;

        // Map UI column status correctly
        let targetStatus = col.getAttribute('data-status'); // 'Backlog', 'To Do', 'In Progress', 'In Review', 'Completed'
        if (targetStatus === 'In Review') targetStatus = 'Review';

        // Check Drag Permissions
        if (!window.cbsAuth.canEdit()) {
          alert('Security Policy: You do not have permissions to modify task status.');
          return;
        }

        // Apply changes
        task.status = targetStatus;
        if (targetStatus === 'Completed') {
          task.progress = 100;
        } else if (targetStatus === 'Backlog' && task.progress === 100) {
          task.progress = 0;
        }

        await window.cbsDB.saveTask(task);
        window.cbsApp?.sync();

        if (window.showToastNotification) {
          window.showToastNotification('Task Relocated', `${task.title} moved to ${targetStatus}`);
        }
      });
    });
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  // CRUD MODALS OVERLAYS
  openCreateModal() {
    if (!window.cbsAuth.canEdit()) {
      alert('Workspace Security: You do not have permissions to create sprint tasks.');
      return;
    }
    const form = document.getElementById('taskForm');
    if (form) form.reset();

    document.getElementById('taskId').value = '';
    document.getElementById('taskModalTitle').textContent = 'Create Backlog Task';
    document.getElementById('taskProgressGroup').style.display = 'none';

    this.syncSelectDropdowns(null);
    this.openOverlay('taskModal');
  },

  openEditModal(id) {
    if (!window.cbsAuth.canEdit()) return;
    const t = window.cbsDB.getTaskById(id);
    if (!t) return;

    const canEdit = window.cbsAuth.canEdit();

    document.getElementById('taskModalTitle').textContent = 'Modify Task Parameters';
    document.getElementById('taskId').value = t.id;
    document.getElementById('taskTitle').value = t.title;
    document.getElementById('taskDesc').value = t.description;

    this.syncSelectDropdowns(t);

    document.getElementById('taskPriority').value = t.priority;
    document.getElementById('taskStatus').value = t.status;
    document.getElementById('taskDue').value = t.dueDate;

    const progressGrp = document.getElementById('taskProgressGroup');
    if (progressGrp) {
      progressGrp.style.display = 'block';
      document.getElementById('taskProgress').value = t.progress || 0;
    }

    // Role Locks: non-editors cannot edit text scopes or reassign workers
    const isReadOnly = !canEdit;
    document.getElementById('taskTitle').readOnly = isReadOnly;
    document.getElementById('taskDesc').readOnly = isReadOnly;
    document.getElementById('taskProjectId').disabled = isReadOnly;
    document.getElementById('taskPriority').disabled = isReadOnly;
    document.getElementById('taskAssigneeId').disabled = isReadOnly;

    this.openOverlay('taskModal');
  },

  syncSelectDropdowns(task) {
    const pSelect = document.getElementById('taskProjectId');
    if (pSelect) {
      pSelect.innerHTML = '<option value="" disabled>Select parent project...</option>';
      window.cbsDB.getProjects().forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        if (task && p.id === task.projectId) opt.selected = true;
        pSelect.appendChild(opt);
      });
    }

    const aSelect = document.getElementById('taskAssigneeId');
    if (aSelect) {
      aSelect.innerHTML = '<option value="" disabled>Select team member...</option>';
      window.cbsDB.getUsers().forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = u.name;
        if (task && u.id === task.assigneeId) opt.selected = true;
        aSelect.appendChild(opt);
      });
    }
  },

  async handleSaveSubmit(e) {
    e.preventDefault();
    if (!window.cbsAuth.canEdit()) return;
    const id = document.getElementById('taskId').value;

    const progressVal = Number(document.getElementById('taskProgress').value) || 0;
    let statusVal = document.getElementById('taskStatus').value;
    if (progressVal === 100) statusVal = 'Completed';

    const taskData = {
      id: id || undefined,
      title: document.getElementById('taskTitle').value.trim(),
      description: document.getElementById('taskDesc').value.trim(),
      projectId: document.getElementById('taskProjectId').value,
      priority: document.getElementById('taskPriority').value,
      status: statusVal,
      assigneeId: document.getElementById('taskAssigneeId').value,
      dueDate: document.getElementById('taskDue').value,
      progress: progressVal
    };

    await window.cbsDB.saveTask(taskData);
    this.closeOverlay('taskModal');
    window.cbsApp?.sync();

    if (window.showToastNotification) {
      window.showToastNotification('Task Saved', taskData.title);
    }
  },

  // HIGH FIDELITY TASK DETAILS & COMMENTS DIALOG
  openDetailsModal(id) {
    const t = window.cbsDB.getTaskById(id);
    if (!t) return;

    this.activeTaskId = id;

    // Select modal body viewport inside dashboard.html if placeholder exits or build custom box
    let overlay = document.getElementById('taskDetailsModal');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'taskDetailsModal';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    const project = window.cbsDB.getProjectById(t.projectId) || { name: 'Internal Workspace' };
    const team = window.cbsDB.getUsers();
    const assignee = team.find(u => u.id === t.assigneeId) || { name: 'Unassigned', avatar: 'assets/avatar.png' };

    // Format comments logs
    let commentsHtml = '';
    (t.comments || []).forEach(c => {
      const sender = team.find(u => u.id === c.senderId) || { name: 'Member', avatar: 'assets/avatar.png' };
      commentsHtml += `
        <div style="display:flex; gap:10px; padding:10px; background:var(--bg-main); border:1px solid var(--border-color); border-radius:var(--radius-md); font-size:12px;">
          <img src="${sender.avatar}" class="avatar" style="width:28px; height:28px; border:none;">
          <div style="display:flex; flex-direction:column; gap:2px; flex:1;">
            <div style="display:flex; justify-content:space-between;">
              <span style="font-weight:700;">${sender.name}</span>
              <span style="font-size:10px; color:var(--text-light);">${new Date(c.timestamp).toLocaleDateString()}</span>
            </div>
            <span style="color:var(--text-muted); line-height:1.4;">${c.text}</span>
          </div>
        </div>
      `;
    });

    // Attachments elements
    let filesHtml = '';
    const canEdit = window.cbsAuth.canEdit();
    (t.attachments || []).forEach(f => {
      const deleteAttachBtn = canEdit ? `<button onclick="tasksModule.handleDeleteAttachment('${f.id}')" style="color:var(--color-danger);"><i class="fa-solid fa-xmark"></i></button>` : '';
      filesHtml += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--bg-main); border:1px solid var(--border-color); border-radius:var(--radius-sm); font-size:12px; margin-bottom:6px;">
          <span><i class="fa-regular fa-paperclip" style="margin-right:6px;"></i>${f.name} (${f.size})</span>
          ${deleteAttachBtn}
        </div>
      `;
    });

    const uploadAttachBtn = canEdit ? `
      <label class="badge badge-blue" style="font-size:10px; cursor:pointer;"><i class="fa-solid fa-plus"></i> Upload File
        <input type="file" style="display:none;" onchange="tasksModule.handleUploadAttachment(this)">
      </label>
    ` : '';

    overlay.innerHTML = `
      <div class="modal-box" style="max-width: 580px;">
        <div class="modal-header">
          <div>
            <h3 style="font-size:16px;">${t.title}</h3>
            <span style="font-size:11px; color:var(--text-muted);">Project: <strong>${project.name}</strong> | Priority: <strong>${t.priority}</strong></span>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            ${canEdit ? `<button onclick="tasksModule.closeOverlay('taskDetailsModal'); tasksModule.openEditModal('${t.id}')" class="badge badge-purple" style="border:none; cursor:pointer; padding:4px 8px; font-weight:600;"><i class="fa-regular fa-edit"></i> Edit Specs</button>` : ''}
            <button onclick="tasksModule.closeOverlay('taskDetailsModal')" class="modal-close-btn"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
        <div class="modal-body" style="padding: 20px; display:flex; flex-direction:column; gap:16px; max-height:480px; overflow-y:auto;">
          
          <div>
            <h4 style="font-size:12.5px; font-weight:700; margin-bottom:6px;">Functional Requirements</h4>
            <p style="font-size:12.5px; color:var(--text-muted); line-height:1.5;">${t.description}</p>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-main); padding:10px 14px; border-radius:var(--radius-md);">
            <div style="display:flex; align-items:center; gap:10px;">
              <img src="${assignee.avatar}" class="avatar" style="width:32px; height:32px; border:none;">
              <div style="display:flex; flex-direction:column;">
                <span style="font-size:12px; font-weight:700;">${assignee.name}</span>
                <span style="font-size:10px; color:var(--text-muted);">${assignee.role}</span>
              </div>
            </div>
            <div style="text-align:right;">
              <span style="font-size:11px; color:var(--text-light); font-weight:500;">Sprint Deadline</span>
              <div style="font-size:12px; font-weight:700; color:var(--text-main);">${new Date(t.dueDate).toLocaleDateString()}</div>
            </div>
          </div>

          <!-- Progress Slider Info -->
          <div>
            <div class="progress-label" style="font-size:12px; margin-bottom:6px;">
              <span>Resolution Level Completed</span>
              <span><strong>${t.progress}%</strong></span>
            </div>
            <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${t.progress}%;"></div></div>
          </div>

          <!-- Attachments Panel -->
          <div style="border-top:1px solid var(--border-color); padding-top:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <h4 style="font-size:12.5px; font-weight:700;"><i class="fa-solid fa-paperclip" style="margin-right:6px;"></i>Attachments</h4>
              ${uploadAttachBtn}
            </div>
            <div id="taskAttachmentsListContainer">${filesHtml}</div>
            ${t.attachments?.length === 0 ? '<p style="font-size:11.5px; color:var(--text-light); text-align:center;">No reference files attached.</p>' : ''}
          </div>

          <!-- Discussion Comments Feed -->
          <div style="border-top:1px solid var(--border-color); padding-top:14px;">
            <h4 style="font-size:12.5px; font-weight:700; margin-bottom:10px;"><i class="fa-regular fa-comments" style="margin-right:6px;"></i>Task Discussion Notes</h4>
            
            <div style="display:flex; flex-direction:column; gap:8px; max-height:160px; overflow-y:auto; margin-bottom:12px;">
              ${commentsHtml}
              ${t.comments?.length === 0 ? '<p style="font-size:11.5px; color:var(--text-light); text-align:center; padding:12px 0;">No discussion logs yet.</p>' : ''}
            </div>

            <!-- Add Comment Form -->
            <form onsubmit="tasksModule.handleAddCommentSubmit(event)" style="display:flex; gap:8px;">
              <input type="text" id="taskCommentInput" placeholder="Add a work log comment..." required style="flex:1; padding:8px 12px; font-size:12px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
              <button type="submit" class="btn-primary" style="padding:8px 14px; font-size:11.5px;"><i class="fa-regular fa-paper-plane"></i></button>
            </form>
          </div>

        </div>
      </div>
    `;

    this.openOverlay('taskDetailsModal');
  },

  async handleAddCommentSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('taskCommentInput');
    const text = input.value.trim();
    if (!text) return;

    const t = window.cbsDB.getTaskById(this.activeTaskId);
    if (t) {
      t.comments = t.comments || [];
      t.comments.push({
        id: 'c-' + Date.now(),
        senderId: window.cbsAuth.getCurrentUser()?.id,
        text,
        timestamp: new Date().toISOString()
      });

      await window.cbsDB.saveTask(t);
      input.value = '';
      window.cbsApp?.sync();
      this.openDetailsModal(t.id);
    }
  },

  async handleUploadAttachment(input) {
    if (!window.cbsAuth.canEdit()) return;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const user = window.cbsAuth.getCurrentUser();

    const name = file.name;
    const size = (file.size / 1024 / 1024).toFixed(1) + ' MB';

    const newAttach = {
      id: 'a-' + Date.now(),
      name,
      size,
      date: new Date().toISOString()
    };

    const t = window.cbsDB.getTaskById(this.activeTaskId);
    if (t) {
      t.attachments = t.attachments || [];
      t.attachments.push(newAttach);

      await window.cbsDB.saveTask(t);
      window.cbsApp?.sync();
      this.openDetailsModal(t.id);

      await window.cbsDB.addNotification('Tasks', 'File Attached', `File "${name}" uploaded to task "${t.title}".`, 'Low');
      if (window.showToastNotification) window.showToastNotification('File Attached', name);
    }
  },

  async handleDeleteAttachment(id) {
    if (!window.cbsAuth.canEdit()) return;
    if (confirm('Delete this file attachment?')) {
      const t = window.cbsDB.getTaskById(this.activeTaskId);
      if (t && t.attachments) {
        t.attachments = t.attachments.filter(a => a.id !== id);
        await window.cbsDB.saveTask(t);
        window.cbsApp?.sync();
        this.openDetailsModal(t.id);
        if (window.showToastNotification) window.showToastNotification('Attachment Wiped', 'Successfully removed.');
      }
    }
  },

  openOverlay(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
  },

  closeOverlay(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
  }
};

window.tasksModule = tasksModule;
