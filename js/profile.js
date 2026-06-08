/**
 * Cyber Black Squad – Profile & Team Directory Module
 * Coordinates profile modifications, Base64 avatar crops overlays,
 * and builds the standalone filterable Team Directory viewports.
 */

const profileModule = {
  tempBase64Image: null,

  render() {
    const user = window.cbsAuth.getCurrentUser();
    if (!user) return;

    const pAvatar = document.getElementById('profileUserAvatar');
    const pName = document.getElementById('profileUserName');
    const pTitleRole = document.getElementById('profileUserTitleRole');

    if (pAvatar) pAvatar.src = user.avatar;
    if (pName) pName.textContent = user.name;
    if (pTitleRole) pTitleRole.textContent = `${user.title || user.role} | ${user.department || 'Operations'}`;

    // Fill form elements
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('profName', user.name);
    setVal('profEmail', user.email);
    setVal('profTitle', user.title || '');
    setVal('profContact', user.phone || user.contact || '');
    setVal('profRole', user.role);
    setVal('profStatus', user.status || 'online');
    setVal('profBio', user.bio || '');

    setVal('profDept', user.department || 'General');
    setVal('profSkills', user.skills || '');
    setVal('profLinkedin', user.linkedin || '');
    setVal('profGithub', user.github || '');
    setVal('profPortfolio', user.portfolio || '');
    setVal('profExperience', user.experience || '');
    setVal('profEducation', user.education || '');
    setVal('profCertifications', user.certifications || '');
    setVal('profSummary', user.professionalSummary || '');

    // Click to upload uploader binder
    const avatarImg = document.getElementById('profileUserAvatar');
    if (avatarImg && !avatarImg.dataset.boundClick) {
      avatarImg.dataset.boundClick = 'true';
      avatarImg.style.cursor = 'pointer';
      avatarImg.title = 'Click to Change Profile Avatar';
      avatarImg.addEventListener('click', () => {
        this.openCropUploaderModal();
      });
    }
  },

  handleSaveSubmit(e) {
    e.preventDefault();
    const user = window.cbsAuth.getCurrentUser();
    const alertDiv = document.getElementById('profileAlert');

    const updated = {
      id: user.id,
      name: document.getElementById('profName').value.trim(),
      title: document.getElementById('profTitle').value.trim(),
      phone: document.getElementById('profContact').value.trim(),
      status: document.getElementById('profStatus').value,
      bio: document.getElementById('profBio').value.trim(),
      
      department: document.getElementById('profDept').value,
      skills: document.getElementById('profSkills').value.trim(),
      linkedin: document.getElementById('profLinkedin').value.trim(),
      github: document.getElementById('profGithub').value.trim(),
      portfolio: document.getElementById('profPortfolio').value.trim(),
      experience: document.getElementById('profExperience').value.trim(),
      education: document.getElementById('profEducation').value.trim(),
      certifications: document.getElementById('profCertifications').value.trim(),
      professionalSummary: document.getElementById('profSummary').value.trim()
    };

    try {
      window.cbsDB.saveUser({ ...user, ...updated });
      window.cbsDB.addActivityLog(user.id, `${updated.name} updated their personal profile fields.`, 'User Management');

      // Sync headers
      document.getElementById('sidebarUserName').textContent = updated.name;
      document.getElementById('sidebarUserRole').textContent = updated.title || user.role;

      if (alertDiv) {
        alertDiv.className = 'auth-alert success';
        alertDiv.innerHTML = '<i class="fa-solid fa-circle-check" style="margin-right: 6px;"></i> Profile information saved successfully!';
        setTimeout(() => {
          alertDiv.className = 'auth-alert';
          alertDiv.innerHTML = '';
        }, 2000);
      }

      window.cbsApp?.sync();
    } catch(err) {
      if (alertDiv) {
        alertDiv.className = 'auth-alert danger';
        alertDiv.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="margin-right: 6px;"></i> Error saving profile: ${err.message}`;
      }
    }
  },

  openCropUploaderModal() {
    let modal = document.getElementById('cropAvatarModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'cropAvatarModal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-box" style="max-width: 440px;">
        <div class="modal-header">
          <h3>Change Profile Image</h3>
          <button onclick="profileModule.closeModal('cropAvatarModal')" class="modal-close-btn"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body" style="padding: 20px; display:flex; flex-direction:column; gap:16px; align-items:center;">
          
          <div style="width:100%;">
            <label class="btn-secondary" style="display:block; text-align:center; padding:10px; cursor:pointer;">
              <i class="fa-solid fa-folder-open" style="margin-right:8px;"></i> Select Local Image File
              <input type="file" id="avatarFileInput" accept="image/*" style="display:none;" onchange="profileModule.handleSelectLocalAvatarFile(this)">
            </label>
          </div>

          <div id="cropSimulatorWrapper" style="display:none; width: 100%; text-align:center; flex-direction:column; align-items:center; gap:12px;">
            <div style="position:relative; width: 220px; height: 220px; background:#f1f5f9; border: 1px solid var(--border-color); border-radius: 50%; overflow:hidden;">
              <img id="avatarCropPreviewImg" src="" style="width:100%; height:100%; object-fit:cover; transition: transform 0.1s;">
              <div style="position:absolute; top:0; left:0; width:100%; height:100%; border: 4px dashed var(--secondary-color); border-radius:50%; box-sizing:border-box; pointer-events:none;"></div>
            </div>
            
            <div style="width:100%; display:flex; flex-direction:column; gap:4px; text-align:left;">
              <label style="font-size:11px; font-weight:600; color:var(--text-muted);">Adjust Crop Scale Zoom</label>
              <input type="range" id="avatarCropZoomSlider" min="1" max="2" step="0.1" value="1" oninput="profileModule.handleZoomCrop(this.value)" style="width:100%; cursor:pointer;">
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; width:100%; border-top:1px solid var(--border-color); padding-top:14px; margin-top:6px;">
            <button onclick="profileModule.handleRemoveAvatar()" class="btn-secondary" style="color:var(--color-danger); border-color:rgba(239, 68, 68, 0.2);"><i class="fa-regular fa-trash-can"></i> Remove</button>
            <div style="display:flex; gap:8px;">
              <button onclick="profileModule.closeModal('cropAvatarModal')" class="btn-secondary">Cancel</button>
              <button onclick="profileModule.handleSaveCroppedAvatarSubmit()" id="saveCropBtn" class="btn-primary" style="opacity:0.5; cursor:not-allowed;" disabled>Save Image</button>
            </div>
          </div>

        </div>
      </div>
    `;

    this.openModal('cropAvatarModal');
  },

  handleSelectLocalAvatarFile(input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    const reader = new FileReader();
    reader.onload = (e) => {
      this.tempBase64Image = e.target.result;
      const img = document.getElementById('avatarCropPreviewImg');
      const wrapper = document.getElementById('cropSimulatorWrapper');
      const saveBtn = document.getElementById('saveCropBtn');

      if (img && wrapper && saveBtn) {
        img.src = this.tempBase64Image;
        wrapper.style.display = 'flex';
        saveBtn.disabled = false;
        saveBtn.style.opacity = '1';
        saveBtn.style.cursor = 'pointer';
      }
    };
    reader.readAsDataURL(file);
  },

  handleZoomCrop(val) {
    const img = document.getElementById('avatarCropPreviewImg');
    if (img) img.style.transform = `scale(${val})`;
  },

  handleSaveCroppedAvatarSubmit() {
    if (!this.tempBase64Image) return;

    const user = window.cbsAuth.getCurrentUser();
    user.avatar = this.tempBase64Image;
    window.cbsDB.saveUser(user);
    window.cbsDB.addActivityLog(user.id, `${user.name} changed their display profile picture avatar.`, 'User Management');

    // Global syncing
    document.getElementById('sidebarUserAvatar').src = user.avatar;
    document.getElementById('topbarUserAvatar').src = user.avatar;
    
    const pAvatar = document.getElementById('profileUserAvatar');
    if (pAvatar) pAvatar.src = user.avatar;

    this.closeModal('cropAvatarModal');
    this.tempBase64Image = null;
    
    if (window.showToastNotification) window.showToastNotification('Avatar Synced', 'Image updated globally.');
    
    window.cbsApp?.sync();
  },

  handleRemoveAvatar() {
    if (confirm('Reset display profile picture?')) {
      const user = window.cbsAuth.getCurrentUser();
      user.avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
      window.cbsDB.saveUser(user);
      
      document.getElementById('sidebarUserAvatar').src = user.avatar;
      document.getElementById('topbarUserAvatar').src = user.avatar;
      
      const pAvatar = document.getElementById('profileUserAvatar');
      if (pAvatar) pAvatar.src = user.avatar;

      this.closeModal('cropAvatarModal');
      window.cbsApp?.sync();
    }
  },

  openModal(id) {
    document.getElementById(id)?.classList.add('active');
  },

  closeModal(id) {
    document.getElementById(id)?.classList.remove('active');
  }
};

// ==========================================
// 9. TEAM DIRECTORY MODULE IMPLEMENTATION    
// ==========================================
const directoryModule = {
  render() {
    const grid = document.getElementById('directoryCardsGrid');
    if (!grid) return; // safeguard if tab is not rendered

    grid.innerHTML = '';

    const users = window.cbsDB.getUsers();
    
    // Filters elements
    const searchVal = (document.getElementById('directorySearchInput')?.value || '').toLowerCase().trim();
    const roleVal = document.getElementById('directoryRoleFilter')?.value || 'All';
    const deptVal = document.getElementById('directoryDeptFilter')?.value || 'All';

    // Apply directory queries
    const filtered = users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchVal) || (u.skills || '').toLowerCase().includes(searchVal) || u.email.toLowerCase().includes(searchVal);
      const matchesRole = roleVal === 'All' || u.role === roleVal;
      const matchesDept = deptVal === 'All' || u.department === deptVal;
      return matchesSearch && matchesRole && matchesDept;
    });

    filtered.forEach(u => {
      const isSelf = u.id === window.cbsAuth.getCurrentUser()?.id;
      const statusClass = `status-${u.status || 'offline'}`;
      
      const card = document.createElement('div');
      card.className = 'project-card';
      card.innerHTML = `
        <div class="project-card-header" style="justify-content: flex-start; gap: 12px; align-items:center;">
          <div class="member-avatar-wrapper">
            <img src="${u.avatar}" class="avatar" style="width:48px; height:48px; border:none;">
            <span class="status-indicator-dot ${statusClass}" style="width:11px; height:11px;"></span>
          </div>
          <div class="member-details">
            <span class="member-name" style="font-size:14.5px;">${u.name} ${isSelf ? '<span class="badge badge-purple" style="font-size:8px; padding:1px 4px;">You</span>' : ''}</span>
            <span class="member-title">${u.title || 'Workspace Collaborator'}</span>
          </div>
        </div>

        <div style="font-size:12.5px; color:var(--text-muted); min-height:40px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          ${u.bio || 'No workspace biography added yet.'}
        </div>

        <!-- Skills tags -->
        <div style="display:flex; gap:4px; flex-wrap:wrap; min-height:22px;">
          ${(u.skills || '').split(',').slice(0, 3).filter(Boolean).map(skill => `<span class="badge" style="font-size:9.5px; background:rgba(59,130,246,0.06); color:var(--primary-color); padding:1px 6px;">${skill.trim()}</span>`).join('')}
          ${!(u.skills) ? '<span style="font-size:10.5px; color:var(--text-light);">No custom skills.</span>' : ''}
        </div>

        <div class="project-card-footer" style="padding-top:12px; margin-top:4px;">
          <span style="font-size:11px; color:var(--text-light); font-weight:600;"><i class="fa-regular fa-envelope"></i> ${u.email}</span>
          <button onclick="cbsDirectory.openMemberDetailsModal('${u.id}')" class="btn-primary" style="padding:6px 12px; font-size:11px; font-weight:600;">View Profile</button>
        </div>
      `;
      grid.appendChild(card);
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="panel-card" style="grid-column: span 3; text-align:center; padding:48px;">
          <i class="fa-solid fa-address-card" style="font-size:32px; color:var(--text-light); margin-bottom:12px;"></i>
          <p style="color:var(--text-muted); font-size:14px;">No team members matching active directory queries.</p>
        </div>
      `;
    }
  },

  openMemberDetailsModal(userId) {
    const u = window.cbsDB.getUserById(userId);
    if (!u) return;

    let modal = document.getElementById('directoryMemberProfileModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'directoryMemberProfileModal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    const linkedHtml = u.linkedin ? `<a href="${u.linkedin}" target="_blank" class="badge badge-blue" style="font-size:11px;"><i class="fa-brands fa-linkedin"></i> LinkedIn</a>` : '';
    const gitHtml = u.github ? `<a href="${u.github}" target="_blank" class="badge badge-purple" style="font-size:11px;"><i class="fa-brands fa-github"></i> GitHub</a>` : '';
    const portHtml = u.portfolio ? `<a href="${u.portfolio}" target="_blank" class="badge badge-green" style="font-size:11px;"><i class="fa-solid fa-globe"></i> Portfolio</a>` : '';

    modal.innerHTML = `
      <div class="modal-box" style="max-width: 580px;">
        <div class="modal-header">
          <h3>Collaborator Profile Details</h3>
          <button onclick="document.getElementById('directoryMemberProfileModal').classList.remove('active')" class="modal-close-btn"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body" style="padding:20px; display:flex; flex-direction:column; gap:16px; max-height:480px; overflow-y:auto;">
          
          <div style="display:flex; gap:16px; align-items:center;">
            <img src="${u.avatar}" class="avatar" style="width:72px; height:72px; border:none; box-shadow:var(--shadow-md);">
            <div style="display:flex; flex-direction:column; gap:4px;">
              <h4 style="font-size:18px; font-weight:800; color:var(--text-main);">${u.name}</h4>
              <span style="font-size:12px; color:var(--text-muted);">Position: <strong>${u.title || 'Collaborator'}</strong> | Department: <strong>${u.department || 'General'}</strong></span>
              <span style="font-size:11.5px; color:var(--text-light); font-weight:600;"><i class="fa-solid fa-user-shield"></i> Access Role: ${u.role}</span>
            </div>
          </div>

          <!-- Social connections links -->
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            ${linkedHtml}
            ${gitHtml}
            ${portHtml}
            ${!u.linkedin && !u.github && !u.portfolio ? '<span style="font-size:11.5px; color:var(--text-light);">No external profiles shared.</span>' : ''}
          </div>

          <div style="border-top:1px solid var(--border-color); padding-top:12px; display:flex; flex-direction:column; gap:10px;">
            <div>
              <h5 style="font-size:12.5px; font-weight:700; margin-bottom:4px;">Professional Summary</h5>
              <p style="font-size:12.5px; color:var(--text-muted); line-height:1.5;">${u.professionalSummary || u.bio || 'No professional bio outlines added yet.'}</p>
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div>
                <h5 style="font-size:12.5px; font-weight:700; margin-bottom:4px;">Contact Information</h5>
                <span style="font-size:12px; color:var(--text-muted);"><i class="fa-regular fa-envelope"></i> ${u.email}</span><br>
                <span style="font-size:12px; color:var(--text-muted);"><i class="fa-solid fa-phone"></i> ${u.phone || 'No phone added'}</span>
              </div>
              <div>
                <h5 style="font-size:12.5px; font-weight:700; margin-bottom:4px;">Skills & Competencies</h5>
                <p style="font-size:12px; color:var(--text-muted);">${u.skills || 'No skills listed.'}</p>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div>
                <h5 style="font-size:12.5px; font-weight:700; margin-bottom:4px;">Experience Background</h5>
                <p style="font-size:12px; color:var(--text-muted);">${u.experience || 'No experience details.'}</p>
              </div>
              <div>
                <h5 style="font-size:12.5px; font-weight:700; margin-bottom:4px;">Education & Credentials</h5>
                <p style="font-size:12px; color:var(--text-muted);">${u.education || 'No educational entries.'}</p>
              </div>
            </div>
          </div>

          <div class="form-actions-row" style="border-top:1px solid var(--border-color); padding-top:16px; margin-top:8px;">
            <button onclick="document.getElementById('directoryMemberProfileModal').classList.remove('active')" class="btn-primary">Close Profile</button>
          </div>

        </div>
      </div>
    `;

    modal.classList.add('active');
  }
};

// Bind to window
window.profileModule = profileModule;
window.cbsDirectory = directoryModule;
