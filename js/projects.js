/**
 * Cyber Black Squad – Enterprise Project Management Module
 * Controls project creations, edits, archive / restore lifecycle,
 * document archives, timelines, and milestone CRUD grids.
 */

const projectsModule = {
  activeDetailId: null,

  render() {
    const projects = window.cbsDB.getProjects();
    const team = window.cbsDB.getUsers();
    const searchVal = (document.getElementById('projectSearch')?.value || '').toLowerCase();
    const statusVal = document.getElementById('projectStatusFilter')?.value || 'All';
    const canEdit = window.cbsAuth.canEdit();

    const addNewProjectBtn = document.getElementById('addNewProjectBtn');
    if (addNewProjectBtn) {
      addNewProjectBtn.style.display = canEdit ? '' : 'none';
    }

    // Filter projects
    const filtered = projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchVal) || p.description.toLowerCase().includes(searchVal);
      let matchesStatus = true;
      if (statusVal === 'All') {
        matchesStatus = p.status !== 'Archived';
      } else if (statusVal === 'Archived') {
        matchesStatus = p.status === 'Archived';
      } else {
        matchesStatus = p.status === statusVal;
      }
      return matchesSearch && matchesStatus;
    });

    const countBadge = document.getElementById('inventory-count-badge');
    if (countBadge) countBadge.textContent = `${filtered.length} Total`;

    // 1. RENDER CARDS GRID
    const grid = document.getElementById('projectsCardsGrid');
    if (grid) {
      grid.innerHTML = '';
      
      filtered.forEach(p => {
        const isArchived = p.status === 'Archived';
        const statusClass = this.getBadgeClass(p.status);
        
        let avatarsHtml = '';
        (p.members || []).slice(0, 3).forEach(mId => {
          const u = team.find(us => us.id === mId);
          if (u) {
            avatarsHtml += `<img src="${u.avatar}" alt="${u.name}" class="avatar" title="${u.name} (${u.role})">`;
          }
        });
        if ((p.members || []).length > 3) {
          avatarsHtml += `<div class="avatar-more">+${p.members.length - 3}</div>`;
        }

        let actionButtons = '';
        if (canEdit) {
          if (isArchived) {
            actionButtons = `
              <button class="action-icon-btn" onclick="projectsModule.handleRestore('${p.id}')" title="Restore Project"><i class="fa-solid fa-trash-arrow-up"></i></button>
            `;
          } else {
            actionButtons = `
              <button class="action-icon-btn" onclick="projectsModule.openEditModal('${p.id}')" title="Edit Parameters"><i class="fa-regular fa-pen-to-square"></i></button>
              <button class="action-icon-btn" onclick="projectsModule.handleArchive('${p.id}')" title="Archive Project"><i class="fa-solid fa-box-archive"></i></button>
              <button class="action-icon-btn delete" onclick="projectsModule.handleDelete('${p.id}')" title="Permanently Delete"><i class="fa-regular fa-trash-can"></i></button>
            `;
          }
        }

        const card = document.createElement('div');
        card.className = `project-card ${isArchived ? 'archived-opacity' : ''}`;
        if (isArchived) card.style.opacity = '0.6';
        
        card.innerHTML = `
          <div class="project-card-header">
            <span class="badge ${statusClass}">${p.status}</span>
            <div class="card-actions">${actionButtons}</div>
          </div>
          <div>
            <h3 class="project-title" onclick="projectsModule.openDetailsModal('${p.id}')">${p.name}</h3>
            <p class="project-desc">${p.description}</p>
          </div>
          <div class="project-progress-container">
            <div class="progress-label">
              <span>Overall Development</span>
              <span>${p.progress}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${p.progress}%;"></div>
            </div>
          </div>
          <div class="project-card-footer">
            <div class="avatar-group">${avatarsHtml}</div>
            <span class="project-dates"><i class="fa-regular fa-calendar-days"></i> Due ${this.formatDate(p.dueDate)}</span>
          </div>
        `;
        grid.appendChild(card);
      });

      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="panel-card" style="grid-column: span 3; text-align: center; padding: 48px;">
            <i class="fa-regular fa-folder-open" style="font-size:32px; color:var(--text-light); margin-bottom:12px;"></i>
            <p style="color: var(--text-muted); font-size: 14px;">No startup projects match your active search filters.</p>
          </div>
        `;
      }
    }

    // 2. RENDER TABLE INVENTORY
    const tableBody = document.getElementById('projectsTableBody');
    if (tableBody) {
      tableBody.innerHTML = '';
      
      filtered.forEach(p => {
        const isArchived = p.status === 'Archived';
        const statusClass = this.getBadgeClass(p.status);
        
        let avatarsHtml = '';
        (p.members || []).forEach(mId => {
          const u = team.find(us => us.id === mId);
          if (u) {
            avatarsHtml += `<img src="${u.avatar}" alt="${u.name}" class="avatar" style="width: 22px; height: 22px; margin-right: -6px;" title="${u.name}">`;
          }
        });

        let actions = '';
        if (canEdit) {
          if (isArchived) {
            actions = `<button class="btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="projectsModule.handleRestore('${p.id}')">Restore</button>`;
          } else {
            actions = `
              <button class="action-icon-btn" onclick="projectsModule.openEditModal('${p.id}')"><i class="fa-regular fa-pen-to-square"></i></button>
              <button class="action-icon-btn" onclick="projectsModule.handleArchive('${p.id}')"><i class="fa-solid fa-box-archive"></i></button>
            `;
          }
        } else {
          actions = `<button class="btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="projectsModule.openDetailsModal('${p.id}')">Inspect</button>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight: 700; color: var(--text-main); cursor: pointer;" onclick="projectsModule.openDetailsModal('${p.id}')">${p.name}</td>
          <td><span class="badge ${statusClass}">${p.status}</span></td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="progress-bar-bg" style="width: 80px;"><div class="progress-bar-fill" style="width: ${p.progress}%;"></div></div>
              <span style="font-weight: 600; font-size: 11.5px;">${p.progress}%</span>
            </div>
          </td>
          <td style="color: var(--text-muted); font-size:12.5px;">${this.formatDate(p.dueDate)}</td>
          <td><div class="avatar-group">${avatarsHtml}</div></td>
          <td><div class="card-actions">${actions}</div></td>
        `;
        tableBody.appendChild(tr);
      });
    }
  },

  getBadgeClass(status) {
    switch (status) {
      case 'Completed': return 'badge-green';
      case 'In Progress': return 'badge-blue';
      case 'In Review': return 'badge-orange';
      case 'Archived': return 'badge-red';
      case 'Planning': default: return 'badge-purple';
    }
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  openCreateModal() {
    if (!window.cbsAuth.canEdit()) {
      alert('Security Policy: Project creation is locked.');
      return;
    }
    const form = document.getElementById('projectForm');
    if (form) form.reset();
    document.getElementById('projId').value = '';
    document.getElementById('projectModalTitle').textContent = 'Create Startup Project';

    this.renderMembersChecklist([]);
    this.openOverlay('projectModal');
  },

  openEditModal(id) {
    if (!window.cbsAuth.canEdit()) return;
    const p = window.cbsDB.getProjectById(id);
    if (!p) return;

    document.getElementById('projectModalTitle').textContent = 'Modify Project Specifications';
    document.getElementById('projId').value = p.id;
    document.getElementById('projName').value = p.name;
    document.getElementById('projDesc').value = p.description;
    document.getElementById('projStatus').value = p.status;
    document.getElementById('projProgress').value = p.progress;
    document.getElementById('projStart').value = p.startDate;
    document.getElementById('projDue').value = p.dueDate;

    this.renderMembersChecklist(p.members || []);
    this.openOverlay('projectModal');
  },

  renderMembersChecklist(assignedIds) {
    const container = document.getElementById('projectModalMembersChecklist');
    if (!container) return;
    container.innerHTML = '';

    const users = window.cbsDB.getUsers();
    users.forEach(u => {
      const isChecked = assignedIds.includes(u.id) ? 'checked' : '';
      const div = document.createElement('div');
      div.style = 'display:flex; align-items:center; gap:8px;';
      div.innerHTML = `
        <input type="checkbox" name="projMembers" value="${u.id}" id="check-p-mem-${u.id}" ${isChecked}>
        <label for="check-p-mem-${u.id}" style="font-size:12.5px; font-weight:normal;">${u.name} (${u.role})</label>
      `;
      container.appendChild(div);
    });
  },

  async handleSaveSubmit(e) {
    e.preventDefault();
    if (!window.cbsAuth.canEdit()) return;
    const id = document.getElementById('projId').value;
    
    const checkedMembers = [];
    document.querySelectorAll('input[name="projMembers"]:checked').forEach(cb => {
      checkedMembers.push(cb.value);
    });

    const isNew = !id;

    const projectData = {
      id: id || undefined,
      name: document.getElementById('projName').value.trim(),
      description: document.getElementById('projDesc').value.trim(),
      status: document.getElementById('projStatus').value,
      progress: Number(document.getElementById('projProgress').value) || 0,
      startDate: document.getElementById('projStart').value,
      dueDate: document.getElementById('projDue').value,
      members: checkedMembers,
      budget: isNew ? 50000 : Number(window.cbsDB.getProjectById(id)?.budget) || 50000,
      ownerId: isNew ? window.cbsAuth.getCurrentUser()?.id : window.cbsDB.getProjectById(id)?.ownerId
    };

    await window.cbsDB.saveProject(projectData);
    this.closeOverlay('projectModal');
    window.cbsApp?.sync();

    if (window.showToastNotification) {
      window.showToastNotification(isNew ? 'Project Initialized' : 'Project Updated', `Workspace synced: ${projectData.name}`);
    }
  },

  async handleArchive(id) {
    if (!window.cbsAuth.canEdit()) return;
    if (confirm('Archive this project?')) {
      const p = window.cbsDB.getProjectById(id);
      if (p) {
        p.status = 'Archived';
        await window.cbsDB.saveProject(p);
        await window.cbsDB.addNotification('Projects', 'Project Archived', `Project "${p.name}" has been archived.`, 'Medium');
        await window.cbsDB.addActivityLog(window.cbsAuth.getCurrentUser()?.id, `Archived project: ${p.name}`, 'Project');
        window.cbsApp?.sync();
        if (window.showToastNotification) window.showToastNotification('Project Archived', p.name);
      }
    }
  },

  async handleRestore(id) {
    if (!window.cbsAuth.canEdit()) return;
    const p = window.cbsDB.getProjectById(id);
    if (p) {
      p.status = 'Planning';
      await window.cbsDB.saveProject(p);
      await window.cbsDB.addNotification('Projects', 'Project Restored', `Project "${p.name}" restored back to planning status.`, 'Medium');
      await window.cbsDB.addActivityLog(window.cbsAuth.getCurrentUser()?.id, `Restored archived project: ${p.name}`, 'Project');
      window.cbsApp?.sync();
      if (window.showToastNotification) window.showToastNotification('Project Restored', p.name);
    }
  },

  async handleDelete(id) {
    if (!window.cbsAuth.canEdit()) return;
    if (confirm('Permanently delete project record?')) {
      const p = window.cbsDB.getProjectById(id);
      if (p) {
        await window.cbsDB.deleteProject(id);
        window.cbsApp?.sync();
        if (window.showToastNotification) window.showToastNotification('Project Wiped', 'Successfully removed.');
      }
    }
  },

  // HIGH FIDELITY PROJECT SPECS OVERLAYS (TABS SYSTEM)
  openDetailsModal(id) {
    const p = window.cbsDB.getProjectById(id);
    if (!p) return;

    this.activeDetailId = id;
    
    // Inject Tabbed Layout elements into Modal dynamically
    const modalBox = document.querySelector('#projectDetailsModal .modal-box');
    if (!modalBox) return;

    const team = window.cbsDB.getUsers();
    const owner = team.find(u => u.id === p.ownerId) || { name: 'Founder' };

    modalBox.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 id="detProjectTitle" style="font-size:18px;">${p.name}</h3>
          <span style="font-size:11px; color:var(--text-muted);">Owned by: <strong>${owner.name}</strong> | Budget: <strong>$${p.budget.toLocaleString()}</strong></span>
        </div>
        <button onclick="projectsModule.closeOverlay('projectDetailsModal')" class="modal-close-btn"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body" style="padding: 20px; display:flex; flex-direction:column; gap:16px;">
        
        <div style="display:flex; border-bottom: 1px solid var(--border-color); gap: 16px; padding-bottom: 8px; flex-wrap:wrap;">
          <button class="details-tab-btn active" onclick="projectsModule.switchDetailTab('overview')" id="tab-btn-overview" style="font-weight:600; color:var(--primary-color);">Overview</button>
          <button class="details-tab-btn" onclick="projectsModule.switchDetailTab('milestones')" id="tab-btn-milestones" style="font-weight:500; color:var(--text-muted);">Milestones</button>
          <button class="details-tab-btn" onclick="projectsModule.switchDetailTab('documents')" id="tab-btn-documents" style="font-weight:500; color:var(--text-muted);">Files & Documents</button>
          <button class="details-tab-btn" onclick="projectsModule.switchDetailTab('timeline')" id="tab-btn-timeline" style="font-weight:500; color:var(--text-muted);">Timeline Logs</button>
        </div>

        <div id="projectDetailsDynamicTabContent" style="min-height: 280px; max-height:380px; overflow-y:auto;">
          <!-- Loaded dynamically -->
        </div>

      </div>
    `;

    this.openOverlay('projectDetailsModal');
    this.switchDetailTab('overview');
  },

  switchDetailTab(tabName) {
    const id = this.activeDetailId;
    const p = window.cbsDB.getProjectById(id);
    if (!p) return;

    document.querySelectorAll('.details-tab-btn').forEach(btn => {
      btn.classList.remove('active');
      btn.style.color = 'var(--text-muted)';
      btn.style.borderBottom = 'none';
    });
    
    const activeBtn = document.getElementById(`tab-btn-${tabName}`);
    if (activeBtn) {
      activeBtn.classList.add('active');
      activeBtn.style.color = 'var(--primary-color)';
      activeBtn.style.borderBottom = '2px solid var(--primary-color)';
    }

    const container = document.getElementById('projectDetailsDynamicTabContent');
    if (!container) return;

    container.innerHTML = '';

    if (tabName === 'overview') {
      const statusClass = this.getBadgeClass(p.status);
      const team = window.cbsDB.getUsers();
      
      let avatarsHtml = '';
      (p.members || []).forEach(mId => {
        const u = team.find(us => us.id === mId);
        if (u) {
          avatarsHtml += `
            <div style="display:flex; align-items:center; gap:8px; padding:6px; background:var(--bg-main); border:1px solid var(--border-color); border-radius:var(--radius-sm); font-size:11.5px;">
              <img src="${u.avatar}" class="avatar" style="width:20px; height:20px; border:none;">
              <span>${u.name} (${u.role})</span>
            </div>
          `;
        }
      });

      container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="badge ${statusClass}">${p.status}</span>
            <span style="font-size:12px; color:var(--text-light); font-weight:500;">
              Timeline: <strong>${p.startDate}</strong> to <strong>${p.dueDate}</strong>
            </span>
          </div>
          <div style="background:var(--bg-main); border:1px solid var(--border-color); padding:12px 16px; border-radius:var(--radius-md);">
            <h4 style="font-size:12.5px; margin-bottom:4px; font-weight:700;">Project Scope Notes</h4>
            <p style="font-size:12.5px; color:var(--text-muted); line-height:1.5;">${p.description}</p>
          </div>
          <div class="project-progress-container" style="gap:6px;">
            <div class="progress-label">
              <span>Overall Delivery Completion</span>
              <span><strong>${p.progress}%</strong></span>
            </div>
            <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${p.progress}%;"></div></div>
          </div>
          <div>
            <h4 style="font-size:12.5px; font-weight:700; margin-bottom:8px;"><i class="fa-solid fa-user-group" style="margin-right:6px;"></i>Core Collaborators</h4>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">${avatarsHtml}</div>
          </div>
        </div>
      `;
    } 
    else if (tabName === 'milestones') {
      // MILESTONES TAB WITH UPGRADED CRUD EDIT
      const milestones = window.cbsDB.getMilestonesByProject(id);
      const canEdit = window.cbsAuth.canEdit();
      
      let rowsHtml = '';
      milestones.forEach(m => {
        const isDone = m.status === 'Completed';
        const checkboxIcon = isDone ? 'fa-solid fa-square-check' : 'fa-regular fa-square';
        const checkboxColor = isDone ? 'var(--color-success)' : 'var(--text-light)';
        
        let checkboxHtml = '';
        if (canEdit) {
          checkboxHtml = `<button onclick="projectsModule.handleToggleMilestone('${m.id}')" style="font-size:16px; color:${checkboxColor};"><i class="${checkboxIcon}"></i></button>`;
        } else {
          checkboxHtml = `<span style="font-size:16px; color:${checkboxColor}; margin-right:4px;"><i class="${checkboxIcon}"></i></span>`;
        }

        let editDeleteHtml = '';
        if (canEdit) {
          editDeleteHtml = `
            <button onclick="projectsModule.openEditMilestoneInline('${m.id}')" style="color:var(--primary-color); font-size:12px;" title="Edit Milestone"><i class="fa-regular fa-pen-to-square"></i></button>
            <button onclick="projectsModule.handleDeleteMilestone('${m.id}')" style="color:var(--color-danger); font-size:12px;"><i class="fa-regular fa-trash-can"></i></button>
          `;
        }

        rowsHtml += `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border:1px solid var(--border-color); background:var(--bg-card); border-radius:var(--radius-md);">
            <div style="display:flex; gap:12px; align-items:center;">
              ${checkboxHtml}
              <div style="display:flex; flex-direction:column;">
                <span style="font-weight:600; font-size:13px; text-decoration: ${isDone ? 'line-through' : 'none'}; color: ${isDone ? 'var(--text-muted)' : 'var(--text-main)'};">${m.name}</span>
                <span style="font-size:11px; color:var(--text-muted);">${m.description} | Due: ${m.dueDate}</span>
              </div>
            </div>
            <div style="display:flex; gap:10px; align-items:center;">
              <span style="font-size:11px; font-weight:600;" class="badge ${isDone ? 'badge-green' : 'badge-orange'}">${m.completionPct}%</span>
              ${editDeleteHtml}
            </div>
          </div>
        `;
      });

      const addMilestoneBtn = canEdit ? `<button onclick="projectsModule.openCreateMilestoneInline()" class="badge badge-purple" style="font-size:11px; cursor:pointer;"><i class="fa-solid fa-plus"></i> Add Milestone</button>` : '';

      container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="font-size:12.5px; font-weight:700;"><i class="fa-solid fa-flag" style="color:var(--secondary-color); margin-right:6px;"></i>Startup Milestones</h4>
            ${addMilestoneBtn}
          </div>
          
          <div id="inlineMilestoneFormContainer"></div>

          <div style="display:flex; flex-direction:column; gap:8px;">${rowsHtml}</div>
          ${milestones.length === 0 ? '<p style="color:var(--text-light); text-align:center; padding:24px 0; font-size:12.5px;">No active milestones scheduled.</p>' : ''}
        </div>
      `;
    } 
    else if (tabName === 'documents') {
      const docs = p.documents || [];
      const canEdit = window.cbsAuth.canEdit();
      
      let rowsHtml = '';
      docs.forEach(d => {
        const fileIcon = d.type === 'PDF' ? 'fa-regular fa-file-pdf' : (d.type === 'XLSX' ? 'fa-regular fa-file-excel' : 'fa-regular fa-file');
        const color = d.type === 'PDF' ? 'var(--color-danger)' : (d.type === 'XLSX' ? 'var(--color-success)' : 'var(--primary-color)');

        let docActions = `<button onclick="projectsModule.handleDownloadDoc('${d.name}', '${d.size}')" class="action-icon-btn" style="width:24px; height:24px; font-size:11px;" title="Download"><i class="fa-solid fa-download"></i></button>`;
        if (canEdit) {
          docActions += `<button onclick="projectsModule.handleDeleteDoc('${d.id}')" class="action-icon-btn delete" style="width:24px; height:24px; font-size:11px;" title="Wipe"><i class="fa-regular fa-trash-can"></i></button>`;
        }

        rowsHtml += `
          <tr style="font-size:12px;">
            <td style="font-weight:600;"><i class="${fileIcon}" style="color:${color}; margin-right:8px; font-size:15px;"></i>${d.name}</td>
            <td><span class="badge" style="font-size:10px; padding:2px 6px;">${d.type}</span></td>
            <td style="color:var(--text-muted);">${d.size}</td>
            <td style="color:var(--text-light);">${d.uploadedBy.split(' ')[0]}</td>
            <td>
              <div class="card-actions">
                ${docActions}
              </div>
            </td>
          </tr>
        `;
      });

      const uploadDocBtn = canEdit ? `
        <label class="badge badge-blue" style="font-size:11px; cursor:pointer;"><i class="fa-solid fa-upload"></i> Upload File
          <input type="file" id="projectDocUploaderInput" style="display:none;" onchange="projectsModule.handleUploadDocFile(this)">
        </label>
      ` : '';

      container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="font-size:12.5px; font-weight:700;"><i class="fa-solid fa-file-shield" style="color:var(--primary-color); margin-right:6px;"></i>Project Document Archive</h4>
            ${uploadDocBtn}
          </div>
          
          <div class="data-table-container" style="border-radius:var(--radius-sm);">
            <table class="data-table">
              <thead>
                <tr style="font-size:11.5px; background:var(--bg-main);">
                  <th style="padding:10px 16px;">Filename</th>
                  <th style="padding:10px 16px;">Format</th>
                  <th style="padding:10px 16px;">Volume</th>
                  <th style="padding:10px 16px;">By</th>
                  <th style="padding:10px 16px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
                ${docs.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding:24px; color:var(--text-light);">No project docs uploaded yet.</td></tr>' : ''}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } 
    else if (tabName === 'timeline') {
      const timelineLogs = p.timeline || [];
      let timelineHtml = '';
      
      timelineLogs.forEach((log, index) => {
        const relative = this.formatRelative(log.date);
        timelineHtml += `
          <div class="timeline-item" style="padding-left: 20px; font-size:12.5px;">
            <div class="timeline-dot" style="border-color:${index === 0 ? 'var(--primary-color)' : 'var(--text-light)'};"></div>
            <span class="timeline-text" style="font-weight:${index === 0 ? '600' : 'normal'}; color: var(--text-main);">${log.text}</span>
            <span class="timeline-time" style="font-size:10px; color:var(--text-muted);"><i class="fa-regular fa-clock"></i> ${relative}</span>
          </div>
        `;
      });

      container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:12px;">
          <h4 style="font-size:12.5px; font-weight:700;"><i class="fa-solid fa-route" style="color:var(--color-success); margin-right:6px;"></i>Operational Project Timeline Logs</h4>
          <div class="timeline" style="margin-top:10px;">${timelineHtml}</div>
          ${timelineLogs.length === 0 ? '<p style="color:var(--text-light); text-align:center;">No timeline logs generated yet.</p>' : ''}
        </div>
      `;
    }
  },

  openCreateMilestoneInline() {
    if (!window.cbsAuth.canEdit()) return;
    const container = document.getElementById('inlineMilestoneFormContainer');
    if (!container) return;

    container.innerHTML = `
      <form onsubmit="projectsModule.handleSaveMilestoneInlineSubmit(event)" style="background:var(--bg-main); border:1px solid var(--border-color); padding:12px; border-radius:var(--radius-md); margin-bottom:12px; display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; gap:8px;">
          <input type="text" id="inlineMsName" placeholder="Milestone Name" required style="flex:1; padding:6px 12px; font-size:12px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
          <input type="date" id="inlineMsDue" required style="padding:6px; font-size:12px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
        </div>
        <div style="display:flex; gap:8px;">
          <input type="text" id="inlineMsDesc" placeholder="Brief Description..." required style="flex:2; padding:6px 12px; font-size:12px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
          <input type="number" id="inlineMsPct" placeholder="%" min="0" max="100" required style="width:60px; padding:6px; font-size:12px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
          <button type="submit" class="btn-primary" style="padding:6px 12px; font-size:11.5px;"><i class="fa-solid fa-save"></i> Save</button>
        </div>
      </form>
    `;
  },

  // Upgraded: Milestones inline editing form
  openEditMilestoneInline(id) {
    if (!window.cbsAuth.canEdit()) return;
    const ms = window.cbsDB.getMilestones().find(m => m.id === id);
    if (!ms) return;

    const container = document.getElementById('inlineMilestoneFormContainer');
    if (!container) return;

    container.innerHTML = `
      <form onsubmit="projectsModule.handleSaveMilestoneInlineSubmit(event)" style="background:var(--bg-main); border:1px solid var(--border-color); padding:12px; border-radius:var(--radius-md); margin-bottom:12px; display:flex; flex-direction:column; gap:8px;">
        <input type="hidden" id="inlineMsId" value="${ms.id}">
        <div style="display:flex; gap:8px;">
          <input type="text" id="inlineMsName" value="${ms.name}" placeholder="Milestone Name" required style="flex:1; padding:6px 12px; font-size:12px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
          <input type="date" id="inlineMsDue" value="${ms.dueDate}" required style="padding:6px; font-size:12px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
        </div>
        <div style="display:flex; gap:8px;">
          <input type="text" id="inlineMsDesc" value="${ms.description}" placeholder="Brief Description..." required style="flex:2; padding:6px 12px; font-size:12px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
          <input type="number" id="inlineMsPct" value="${ms.completionPct}" placeholder="%" min="0" max="100" required style="width:60px; padding:6px; font-size:12px; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
          <button type="submit" class="btn-primary" style="padding:6px 12px; font-size:11.5px;"><i class="fa-solid fa-save"></i> Save</button>
        </div>
      </form>
    `;
  },

  async handleSaveMilestoneInlineSubmit(e) {
    e.preventDefault();
    if (!window.cbsAuth.canEdit()) return;
    const projId = this.activeDetailId;
    const id = document.getElementById('inlineMsId')?.value || undefined;
    const name = document.getElementById('inlineMsName').value.trim();
    const desc = document.getElementById('inlineMsDesc').value.trim();
    const due = document.getElementById('inlineMsDue').value;
    const pct = Number(document.getElementById('inlineMsPct').value) || 0;

    const msData = {
      id,
      projectId: projId,
      name,
      description: desc,
      dueDate: due,
      completionPct: pct,
      status: pct === 100 ? 'Completed' : 'Pending'
    };

    await window.cbsDB.saveMilestone(msData);
    window.cbsApp?.sync();
    this.switchDetailTab('milestones');
  },

  async handleToggleMilestone(id) {
    if (!window.cbsAuth.canEdit()) return;
    const msList = window.cbsDB.getMilestones();
    const idx = msList.findIndex(m => m.id === id);
    if (idx !== -1) {
      const ms = msList[idx];
      const isDone = ms.status === 'Completed';
      ms.status = isDone ? 'Pending' : 'Completed';
      ms.completionPct = isDone ? 40 : 100;
      
      await window.cbsDB.saveMilestone(ms);
      window.cbsApp?.sync();
      this.switchDetailTab('milestones');
      
      if (window.showToastNotification) {
         window.showToastNotification('Milestone Updated', `${ms.name}: ${ms.status}`);
      }
    }
  },

  async handleDeleteMilestone(id) {
    if (!window.cbsAuth.canEdit()) return;
    if (confirm('Delete this milestone?')) {
      await window.cbsDB.deleteMilestone(id);
      window.cbsApp?.sync();
      this.switchDetailTab('milestones');
    }
  },

  async handleUploadDocFile(input) {
    if (!window.cbsAuth.canEdit()) return;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const user = window.cbsAuth.getCurrentUser();
    
    const name = file.name;
    const ext = name.split('.').pop().toUpperCase();
    const size = (file.size / 1024 / 1024).toFixed(1) + ' MB';

    const newDoc = {
      id: 'doc-' + Date.now(),
      name,
      type: ext,
      size,
      date: new Date().toISOString(),
      uploadedBy: user.name
    };

    const p = window.cbsDB.getProjectById(this.activeDetailId);
    if (p) {
      p.documents = p.documents || [];
      p.documents.push(newDoc);
      
      p.timeline = p.timeline || [];
      p.timeline.unshift({
        text: `Document uploaded: ${newDoc.name}`,
        date: new Date().toISOString(),
        type: 'project'
      });

      await window.cbsDB.saveProject(p);
      window.cbsApp?.sync();
      this.switchDetailTab('documents');
      
      await window.cbsDB.addNotification('Projects', 'Document Uploaded', `File "${name}" uploaded to project "${p.name}".`, 'Low');
      await window.cbsDB.addActivityLog(user.id, `Uploaded document "${name}" to project "${p.name}".`, 'Project');
      
      if (window.showToastNotification) window.showToastNotification('File Uploaded', name);
    }
  },

  handleDownloadDoc(name, size) {
    alert(`[Document Downloader]\n\nTriggering secure simulated tunnel download for: "${name}" (${size})\nStatus: Success!`);
  },

  async handleDeleteDoc(docId) {
    if (!window.cbsAuth.canEdit()) return;
    if (confirm('Delete this document?')) {
      const p = window.cbsDB.getProjectById(this.activeDetailId);
      if (p && p.documents) {
        p.documents = p.documents.filter(d => d.id !== docId);
        await window.cbsDB.saveProject(p);
        window.cbsApp?.sync();
        this.switchDetailTab('documents');
        if (window.showToastNotification) window.showToastNotification('File Wiped', 'Successfully removed.');
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

window.projectsModule = projectsModule;
