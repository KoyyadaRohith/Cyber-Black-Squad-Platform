/**
 * Cyber Black Squad – Enterprise Real-Time Chat Module
 * Manages multiple channels, message search indexes, mentions pickers,
 * emoji reaction overlays, and permanent discussion history tracking.
 */

const chatModule = {
  activeChannelId: 'ch-1', // #general by default

  render() {
    const channels = window.cbsDB.getChannels();
    const activeCh = channels.find(c => c.id === this.activeChannelId) || channels[0];
    if (!activeCh) return;

    this.activeChannelId = activeCh.id;

    // 1. RENDER CHANNELS SIDEBAR LIST
    const list = document.getElementById('chatChannelsList');
    if (!list) return; // safeguard if view is inactive

    list.innerHTML = '';
    const canEdit = window.cbsAuth.canEdit();

    const addChannelBtn = document.querySelector('button[onclick="chatModule.openCreateChannelModal()"]');
    if (addChannelBtn) {
      addChannelBtn.style.display = canEdit ? '' : 'none';
    }

    channels.forEach(ch => {
      const isActive = ch.id === this.activeChannelId;
      const isDefault = ch.isDefault;
      
      const renameBtn = (canEdit && !isDefault) ? `<button onclick="chatModule.handleRenameChannel(event, '${ch.id}')" style="font-size:10px; color:var(--text-light);"><i class="fa-regular fa-pen-to-square"></i></button>` : '';
      const deleteBtn = (canEdit && !isDefault) ? `<button onclick="chatModule.handleDeleteChannel(event, '${ch.id}')" style="font-size:10px; color:var(--color-danger);"><i class="fa-regular fa-trash-can"></i></button>` : '';

      const li = document.createElement('li');
      li.className = `sidebar-menu-item ${isActive ? 'active' : ''}`;
      li.style = 'list-style:none; padding:4px 0;';
      li.innerHTML = `
        <a href="#" onclick="chatModule.switchChannel(event, '${ch.id}')" style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; font-weight:${isActive ? '700' : '500'}; background: ${isActive ? 'rgba(59,130,246,0.05)' : 'none'}; border-radius: var(--radius-sm);">
          <span><i class="fa-solid fa-hashtag" style="margin-right:8px; color: var(--secondary-color);"></i>${ch.name}</span>
          <div style="display:flex; gap:6px; align-items:center;">
            ${renameBtn}
            ${deleteBtn}
          </div>
        </a>
      `;
      list.appendChild(li);
    });

    // 2. RENDER CHAT HEADER TITLE & DESC
    const chatTitle = document.getElementById('activeChannelHeaderTitle');
    const chatDesc = document.getElementById('activeChannelHeaderDesc');
    if (chatTitle) chatTitle.textContent = `#${activeCh.name}`;
    if (chatDesc) chatDesc.textContent = activeCh.description || 'Collaborative workspace thread.';

    // 3. RENDER MESSAGE ROOM FEED
    this.renderMessagesFeed();
  },

  renderMessagesFeed() {
    const team = window.cbsDB.getUsers();
    const channelMessages = window.cbsDB.getMessagesByChannel(this.activeChannelId);
    const searchMsgQuery = (document.getElementById('chatMsgSearchInput')?.value || '').toLowerCase().trim();

    const filtered = channelMessages.filter(m => {
      if (!searchMsgQuery) return true;
      const sender = team.find(u => u.id === m.senderId);
      return m.text.toLowerCase().includes(searchMsgQuery) || sender?.name.toLowerCase().includes(searchMsgQuery);
    });

    const feed = document.getElementById('chatMessagesArea');
    if (!feed) return;

    feed.innerHTML = '';
    const user = window.cbsAuth.getCurrentUser();
    const isAdmin = window.cbsAuth.isAdmin();

    filtered.forEach(m => {
      const sender = team.find(u => u.id === m.senderId) || { name: 'Former Worker', avatar: 'assets/avatar.png', role: 'Collaborator' };
      const isSelf = m.senderId === user.id;

      // Reactions formatting
      let reactionsHtml = '';
      Object.keys(m.reactions || {}).forEach(emoji => {
        const reactors = m.reactions[emoji] || [];
        if (reactors.length > 0) {
          const reactedBySelf = reactors.includes(user.id);
          reactionsHtml += `
            <button onclick="chatModule.handleMessageReaction('${m.id}', '${emoji}')" 
                    class="badge" 
                    style="font-size:10px; padding:2px 6px; cursor:pointer; background: ${reactedBySelf ? 'rgba(139,92,246,0.1)' : 'var(--bg-main)'}; border:1px solid ${reactedBySelf ? 'var(--secondary-color)' : 'var(--border-color)'};">
              ${emoji} <span style="font-weight:600; margin-left:2px;">${reactors.length}</span>
            </button>
          `;
        }
      });

      // Actions template
      const canEdit = isSelf;
      const canDelete = isSelf || window.cbsAuth.canEdit();
      let editBtn = canEdit ? `<button onclick="chatModule.handleEditInline('${m.id}')" style="font-size:10.5px; color:var(--text-light);" title="Edit message"><i class="fa-regular fa-pen-to-square"></i></button>` : '';
      let deleteBtn = canDelete ? `<button onclick="chatModule.handleDeleteMessage('${m.id}')" style="font-size:10.5px; color:var(--color-danger);" title="Delete message"><i class="fa-regular fa-trash-can"></i></button>` : '';

      const bubbleWrapperClass = isSelf ? 'chat-bubble-wrapper self' : 'chat-bubble-wrapper';

      const div = document.createElement('div');
      div.className = bubbleWrapperClass;
      div.style = 'margin-bottom: 12px;';
      div.innerHTML = `
        <img src="${sender.avatar}" alt="${sender.name}" class="avatar" style="width: 32px; height: 32px;" title="${sender.name}">
        <div class="chat-bubble">
          
          <div style="display:flex; justify-content:space-between; align-items:center; gap:16px;">
            <span class="chat-sender-name">${sender.name} <span style="font-size:8.5px; font-weight:normal; color:var(--text-light); margin-left:6px;">${sender.role}</span></span>
            <div style="display:flex; gap:6px; opacity: 0.5;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.5'">
              ${editBtn}
              ${deleteBtn}
              
              <!-- Simple Reaction Picker Trigger -->
              <button onclick="chatModule.openReactionPicker(event, '${m.id}')" style="font-size:10.5px; color:var(--text-light);"><i class="fa-regular fa-face-smile"></i></button>
            </div>
          </div>

          <span id="msg-text-span-${m.id}" class="chat-text">${m.text}</span>
          
          <!-- Reactions list row -->
          <div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:4px;">${reactionsHtml}</div>
          
          <span class="chat-meta">${this.formatTime(m.timestamp)}</span>
        </div>
      `;
      feed.appendChild(div);
    });

    // Auto-scroll General thread to bottom
    feed.scrollTop = feed.scrollHeight;
  },

  switchChannel(e, id) {
    if (e) e.preventDefault();
    this.activeChannelId = id;
    this.render();
  },

  handleSendChatMessage(e) {
    e.preventDefault();
    const input = document.getElementById('chatMessageInput');
    const text = input.value.trim();
    if (!text) return;

    const user = window.cbsAuth.getCurrentUser();
    
    window.cbsDB.addChatMessage(this.activeChannelId, user.id, text);
    input.value = '';
    
    window.cbsApp?.sync();
  },

  // Reaction picking systems
  openReactionPicker(e, msgId) {
    e.stopPropagation();
    
    // Close any active overlays
    const existing = document.getElementById('inlineEmojiPickerOver');
    if (existing) existing.remove();

    const rect = e.target.getBoundingClientRect();
    
    const div = document.createElement('div');
    div.id = 'inlineEmojiPickerOver';
    div.style = `
      position: fixed;
      top: ${rect.top - 40}px;
      left: ${rect.left - 120}px;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-md);
      padding: 6px;
      display: flex;
      gap: 6px;
      z-index: 10000;
    `;

    const emojis = ['👍', '🔥', '🚀', '❤️', '👏', '😮'];
    emojis.forEach(emo => {
      div.innerHTML += `<button onclick="chatModule.handleMessageReaction('${msgId}', '${emo}'); document.getElementById('inlineEmojiPickerOver').remove();" style="font-size:16px; cursor:pointer;">${emo}</button>`;
    });

    document.body.appendChild(div);

    // Click outside handler
    const closePicker = () => {
      div.remove();
      document.removeEventListener('click', closePicker);
    };
    setTimeout(() => {
      document.addEventListener('click', closePicker);
    }, 100);
  },

  handleMessageReaction(msgId, emoji) {
    const messages = window.cbsDB.getMessages();
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    const user = window.cbsAuth.getCurrentUser();
    msg.reactions = msg.reactions || {};
    
    let reactors = msg.reactions[emoji] || [];
    if (reactors.includes(user.id)) {
      // Toggle off reaction
      reactors = reactors.filter(uid => uid !== user.id);
    } else {
      // Toggle on reaction
      reactors.push(user.id);
    }

    msg.reactions[emoji] = reactors;
    window.cbsDB.saveMessage(msg);
    window.cbsApp?.sync();
  },

  handleEditInline(msgId) {
    const messages = window.cbsDB.getMessages();
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    const textSpan = document.getElementById(`msg-text-span-${msgId}`);
    if (!textSpan) return;

    textSpan.innerHTML = `
      <div style="display:flex; gap:6px; margin-top:4px; width:100%;">
        <input type="text" id="inlineEditField-${msgId}" value="${msg.text}" style="flex:1; padding:4px 8px; font-size:12px; border:1px solid var(--primary-color); border-radius:var(--radius-sm);">
        <button onclick="chatModule.saveInlineEditSubmit('${msgId}')" class="btn-primary" style="padding:4px 8px; font-size:10px;"><i class="fa-solid fa-check"></i></button>
        <button onclick="chatModule.renderMessagesFeed()" class="btn-secondary" style="padding:4px 8px; font-size:10px;"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `;
  },

  saveInlineEditSubmit(msgId) {
    const input = document.getElementById(`inlineEditField-${msgId}`);
    const text = input.value.trim();
    if (!text) return;

    const messages = window.cbsDB.getMessages();
    const msg = messages.find(m => m.id === msgId);
    if (msg) {
      msg.text = text;
      window.cbsDB.saveMessage(msg);
      window.cbsApp?.sync();
    }
  },

  handleDeleteMessage(id) {
    if (confirm('Delete this message permanently?')) {
      window.cbsDB.deleteMessage(id);
      window.cbsApp?.sync();
    }
  },

  // Channels creations inline modals
  openCreateChannelModal() {
    if (!window.cbsAuth.canEdit()) {
      alert('Security Policy: Channel creation is locked.');
      return;
    }
    const name = prompt('Enter new channel name (e.g. product-sprints):');
    if (!name) return;
    
    const cleanName = name.toLowerCase().replace(/[^a-z0-9-_]/g, '');
    const desc = prompt('Enter a brief description for this channel:');
    
    window.cbsDB.saveChannel({
      name: cleanName,
      description: desc || ''
    });

    window.cbsApp?.sync();
  },

  handleRenameChannel(e, chId) {
    e.stopPropagation();
    e.preventDefault();
    if (!window.cbsAuth.canEdit()) return;

    const ch = window.cbsDB.getChannels().find(c => c.id === chId);
    if (!ch) return;

    const name = prompt('Rename channel name:', ch.name);
    if (!name) return;
    
    ch.name = name.toLowerCase().replace(/[^a-z0-9-_]/g, '');
    window.cbsDB.saveChannel(ch);
    window.cbsApp?.sync();
  },

  handleDeleteChannel(e, chId) {
    e.stopPropagation();
    e.preventDefault();
    if (!window.cbsAuth.canEdit()) return;

    if (confirm('Strict Admin Override!\n\nAre you sure you want to permanently delete this chat channel? All conversation blocks inside this thread will be lost!')) {
      window.cbsDB.deleteChannel(chId);
      this.activeChannelId = 'ch-1'; // fallback #general
      window.cbsApp?.sync();
    }
  },

  formatTime(isoStr) {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' | ' + d.toLocaleDateString();
  }
};

window.chatModule = chatModule;
