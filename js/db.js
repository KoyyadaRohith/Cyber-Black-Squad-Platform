/**
 * Cyber Black Squad – Upgraded Enterprise Database Core
 * Simulates a robust document relational database (like Firebase Firestore) with localStorage.
 * Manages 10 distinct collections with unified CRUD operations, indexing, and activity audit log binds.
 */

const DB_KEYS = {
  USERS: 'cbs_users_coll',
  PROJECTS: 'cbs_projects_coll',
  TASKS: 'cbs_tasks_coll',
  MILESTONES: 'cbs_milestones_coll',
  CHANNELS: 'cbs_channels_coll',
  MESSAGES: 'cbs_messages_coll',
  NOTIFICATIONS: 'cbs_notifications_coll',
  ACTIVITY_LOGS: 'cbs_activity_logs_coll',
  SETTINGS: 'cbs_settings_coll',
  SESSIONS: 'cbs_sessions_coll'
};

// 1. DEFAULT DATA DEFINITIONS
const DEFAULT_USERS = [
  {
    id: 'u-1',
    name: 'Koyyada Rohith',
    email: 'rohithkoyyada@cyberblacksquad.com',
    password: 'rocky@444',
    phone: '+91 8888888889',
    role: 'Founder',
    department: 'Management',
    skills: 'Strategy, Security Architecture, Fund Raising, Leadership',
    bio: 'Founder & CEO of Cyber Black Squad. Security researcher and tech entrepreneur.',
    avatar: 'assets/avatar.png',
    status: 'active', // 'active', 'suspended'
    createdDate: '2026-01-10T12:00:00Z',
    linkedin: 'https://linkedin.com',
    github: 'https://github.com',
    portfolio: 'https://cyberblacksquad.com',
    experience: 'Founder at Cyber Black Squad (Present), Principal Security Engineer at Aegis Tech (5 yrs)',
    education: 'B.Tech-Computer Science and Engineering (Aurora University)',
    certifications: 'CISSP, CEH, CISM'
  },
  {
    id: 'u-2',
    name: 'Mr Evil Monster',
    email: 'mrevilmonster@cyberblacksquad.com',
    password: 'mrevil@43',
    phone: '+91 9999999998',
    role: 'Admin',
    department: 'Administration & Operations',
    skills: 'Platform administration, project oversight, task governance, user management, workspace monitoring, analytics supervision, collaboration management',
    bio: 'Responsible for platform administration, project oversight, task governance, user management, workspace monitoring, analytics supervision, collaboration management, and operational control across the Cyber Black Squad platform.',
    avatar: 'assets/avatar.png',
    status: 'active',
    createdDate: '2026-02-15T09:30:00Z',
    linkedin: 'https://linkedin.com',
    github: 'https://github.com',
    portfolio: 'https://cyberblacksquad.com',
    experience: 'System Administrator at Cyber Black Squad (Present)',
    education: 'B.Tech-Cyber Security',
    certifications: 'Access Level: Full Administrative Control',
    accountType: 'System Administrator',
    accessLevel: 'Full Administrative Control'
  },

  {
    id: 'u-4',
    name: 'Elena Rostova',
    email: 'elena@cyberblacksquad.com',
    password: 'password123',
    phone: '+1 (555) 015-8822',
    role: 'Team Member',
    department: 'Design',
    skills: 'Product Design, UI/UX Systems, Tailwind, SaaS Interfaces',
    bio: 'Interface Architect. Dedicated to crafting fluid, responsive human interfaces.',
    avatar: 'assets/avatar.png',
    status: 'active',
    createdDate: '2026-03-20T10:15:00Z',
    linkedin: 'https://linkedin.com',
    github: 'https://github.com',
    portfolio: 'https://cyberblacksquad.com',
    experience: 'Lead Product Designer at Cyber Black Squad (Present), Interaction Designer at Figma (2 yrs)',
    education: 'B.A. in Interaction Design (Rhode Island School of Design)',
    certifications: 'Human-Computer Interaction Specialist'
  }
];

const DEFAULT_PROJECTS = [
  {
    id: 'p-1',
    name: 'Aegis Threat Detection',
    description: 'Developing a real-time AI-powered system for active threat mitigation across hybrid cloud systems.',
    priority: 'High', // 'Low', 'Medium', 'High'
    status: 'In Progress', // 'Planning', 'In Progress', 'In Review', 'Completed', 'Archived'
    budget: 85000,
    startDate: '2026-04-10',
    dueDate: '2026-06-15',
    completionDate: null,
    ownerId: 'u-1',
    members: ['u-1', 'u-2', 'u-3'],
    notes: 'Aegis utilizes custom anomaly detectors trained on raw PCAP network report packets.',
    documents: [
      { id: 'doc-1', name: 'Aegis_Architecture_Specs.pdf', type: 'PDF', size: '2.4 MB', date: '2026-04-12T10:00:00Z', uploadedBy: 'Koyyada Rohith' },
      { id: 'doc-2', name: 'Intrusion_Model_V1_Weights.xlsx', type: 'XLSX', size: '18.6 MB', date: '2026-05-01T15:30:00Z', uploadedBy: 'David Chen' }
    ],
    timeline: [
      { text: 'Project Initiated & Scopes Defined', date: '2026-04-10T09:00:00Z', type: 'system' },
      { text: 'Core Architecture Draft Specs document uploaded', date: '2026-04-12T10:00:00Z', type: 'project' },
      { text: 'David Chen joined the core team', date: '2026-04-15T11:00:00Z', type: 'team' }
    ]
  },
  {
    id: 'p-2',
    name: 'Black Sword API Gateway',
    description: 'An ultra-secure, rate-limited endpoint broker for high-throughput enterprise security integrations.',
    priority: 'Medium',
    status: 'Planning',
    budget: 40000,
    startDate: '2026-05-01',
    dueDate: '2026-08-30',
    completionDate: null,
    ownerId: 'u-3',
    members: ['u-1', 'u-3'],
    notes: 'API routes will utilize AES-GCM-256 encrypted token headers.',
    documents: [],
    timeline: [
      { text: 'Gateway Scoping Initialized', date: '2026-05-01T09:00:00Z', type: 'system' }
    ]
  },
  {
    id: 'p-3',
    name: 'Cyber Shield V2',
    description: 'Upgrading the core network intrusion defense agents with zero-trust kernel level filters.',
    priority: 'High',
    status: 'Completed',
    budget: 120000,
    startDate: '2026-01-15',
    dueDate: '2026-05-20',
    completionDate: '2026-05-20',
    ownerId: 'u-2',
    members: ['u-2', 'u-4'],
    notes: 'Zero-trust filters implemented successfully as lightweight eBPF probes in host Linux kernels.',
    documents: [
      { id: 'doc-3', name: 'Shield_V2_Audit_Report.docx', type: 'DOCX', size: '1.2 MB', date: '2026-05-20T12:00:00Z', uploadedBy: 'Mr Evil Monster' }
    ],
    timeline: [
      { text: 'eBPF Filter Prototypes Drafted', date: '2026-01-15T09:00:00Z', type: 'system' },
      { text: 'Project marked Completed by Mr Evil Monster', date: '2026-05-20T12:00:00Z', type: 'system' }
    ]
  }
];

const DEFAULT_MILESTONES = [
  { id: 'm-1', projectId: 'p-1', name: 'Classifier Model Training Pass', description: 'Train NLP anomaly detection nodes on intrusion telemetry datasets.', status: 'Completed', dueDate: '2026-05-15', completionPct: 100 },
  { id: 'm-2', projectId: 'p-1', name: 'Sandbox Containment Tests', description: 'Execute malware drill containments inside virtualization buffers.', status: 'Pending', dueDate: '2026-06-02', completionPct: 40 },
  { id: 'm-3', projectId: 'p-2', name: 'Define API handshake tokens specs', description: 'Architect token validation sequence diagrams.', status: 'Pending', dueDate: '2026-06-15', completionPct: 15 }
];

const DEFAULT_TASKS = [
  {
    id: 't-1',
    projectId: 'p-1',
    title: 'Train Aegis NLP Classifier Model',
    description: 'Train the foundational deep learning model on custom intrusion report feeds.',
    priority: 'High',
    status: 'In Progress', // 'Backlog', 'To Do', 'In Progress', 'Review', 'Completed'
    assigneeId: 'u-3',
    dueDate: '2026-06-05',
    progress: 75,
    comments: [
      { id: 'c-1', senderId: 'u-1', text: 'Ensure model is optimized for minimal CPU cycles during inference.', timestamp: '2026-05-28T14:00:00Z' },
      { id: 'c-2', senderId: 'u-3', text: 'Yes, integrating highly quantized ONNX weights.', timestamp: '2026-05-29T09:00:00Z' }
    ],
    attachments: [{ id: 'a-1', name: 'Telemetry_Feed.xlsx', size: '4.2 MB', date: '2026-05-20T12:00:00Z' }]
  },
  {
    id: 't-2',
    projectId: 'p-1',
    title: 'Kernel Sandbox Testing',
    description: 'Conduct strict containment drills on dangerous polymorphic malware signatures.',
    priority: 'High',
    status: 'To Do',
    assigneeId: 'u-2',
    dueDate: '2026-06-12',
    progress: 0,
    comments: [],
    attachments: []
  },
  {
    id: 't-3',
    projectId: 'p-2',
    title: 'OAuth2 Integration Architecture',
    description: 'Define exact authentication hooks and encryption handshakes for API client tokens.',
    priority: 'Medium',
    status: 'In Progress',
    assigneeId: 'u-3',
    dueDate: '2026-06-25',
    progress: 40,
    comments: [],
    attachments: []
  },
  {
    id: 't-4',
    projectId: 'p-3',
    title: 'Write Zero-Trust Rulesets',
    description: 'Draft the core verification ruleset for incoming edge requests.',
    priority: 'Low',
    status: 'Completed',
    assigneeId: 'u-2',
    dueDate: '2026-05-18',
    progress: 100,
    comments: [],
    attachments: []
  },
  {
    id: 't-5',
    projectId: 'p-1',
    title: 'Secure Dashboard Wireframes',
    description: 'Finalize interface designs for the enterprise client panel dashboard pages.',
    priority: 'Medium',
    status: 'Completed',
    assigneeId: 'u-4',
    dueDate: '2026-05-15',
    progress: 100,
    comments: [
      { id: 'c-3', senderId: 'u-1', text: 'Excellent spacing and visual aesthetics, Elena!', timestamp: '2026-05-16T10:00:00Z' }
    ],
    attachments: [{ id: 'a-2', name: 'Wireframes_V2.png', size: '2.8 MB', date: '2026-05-14T11:00:00Z' }]
  },
  {
    id: 't-6',
    projectId: 'p-1',
    title: 'Vulnerability PCAP Auditing',
    description: 'Audit network packets dumps to filter bad signatures from test systems.',
    priority: 'High',
    status: 'Backlog',
    assigneeId: 'u-2',
    dueDate: '2026-05-24', // Late task!
    progress: 10,
    comments: [],
    attachments: []
  }
];

const DEFAULT_CHANNELS = [
  { id: 'ch-1', name: 'general', description: 'Open dialogue for startup announcements and cross-team communication', isDefault: true },
  { id: 'ch-2', name: 'development', description: 'Technical scoping, build logs, and repository updates', isDefault: false },
  { id: 'ch-3', name: 'design', description: 'Design reviews, UI system tokens, and wireframes feedback', isDefault: false },
  { id: 'ch-4', name: 'management', description: 'Operational boards, strategy sync, and milestone alerts', isDefault: false }
];

const DEFAULT_MESSAGES = [
  { id: 'msg-1', channelId: 'ch-1', senderId: 'u-1', text: 'Welcome to the updated Cyber Black Squad enterprise workspace platform!', timestamp: '2026-05-29T10:00:00Z', reactions: { '👍': ['u-2', 'u-3'] } },
  { id: 'msg-2', channelId: 'ch-1', senderId: 'u-2', text: 'Operational security systems reporting clean edge filters online.', timestamp: '2026-05-29T10:15:00Z', reactions: { '🔥': ['u-1', 'u-4'] } },
  { id: 'msg-3', channelId: 'ch-2', senderId: 'u-3', text: 'Starting deployment tests for our Aegis NLP model weights this afternoon.', timestamp: '2026-05-29T11:00:00Z', reactions: {} }
];

const DEFAULT_NOTIFICATIONS = [
  { id: 'n-1', category: 'Security', title: 'Welcome to Cyber Black Squad Platform!', message: 'Enterprise operations center sandbox environment initialized.', timestamp: '2026-05-29T12:00:00Z', read: false, priority: 'High' },
  { id: 'n-2', category: 'Tasks', title: 'Task Assigned', message: 'David Chen was assigned task: Train Aegis NLP Classifier Model.', timestamp: '2026-05-29T12:10:00Z', read: false, priority: 'Medium' },
  { id: 'n-3', category: 'Projects', title: 'Project Completed Successfully', message: 'Project "Cyber Shield V2" successfully completed and archived.', timestamp: '2026-05-29T11:30:00Z', read: true, priority: 'Low' }
];

const DEFAULT_ACTIVITY_LOGS = [
  { id: 'log-1', userId: 'u-1', text: 'Koyyada Rohith logged into the operations panel.', timestamp: '2026-05-29T12:00:00Z', type: 'Security' },
  { id: 'log-2', userId: 'u-2', text: 'Mr Evil Monster modified task: Write Zero-Trust Rulesets.', timestamp: '2026-05-29T11:45:00Z', type: 'Tasks' },
  { id: 'log-3', userId: 'u-1', text: 'Koyyada Rohith created a new project: Black Sword API Gateway.', timestamp: '2026-05-29T10:00:00Z', type: 'Projects' }
];

const DEFAULT_SETTINGS = {
  appearance: 'light', // 'light', 'dark', 'auto'
  notifications: { email: true, push: true, alerts: true },
  privacy: { showStatus: true, shareAnalytics: true },
  security: { passwordExpiry: 90, requireMfa: false }
};

const DEFAULT_SESSIONS = [
  { id: 'sess-1', userId: 'u-1', loginTime: '2026-05-29T12:00:00Z', ip: '192.168.1.50', status: 'Success' },
  { id: 'sess-2', userId: 'u-2', loginTime: '2026-05-29T11:20:00Z', ip: '192.168.1.88', status: 'Success' }
];

// 2. DATABASE UTILITIES & CRUD WRAPPERS
const db = {
  init() {
    let users = [];
    try {
      users = JSON.parse(localStorage.getItem(DB_KEYS.USERS)) || [];
    } catch (e) {
      users = [];
    }

    if (!Array.isArray(users) || users.length === 0) {
      users = [...DEFAULT_USERS];
    }

    // Ensure Koyyada Rohith (u-1) is present and fully updated
    let u1Idx = users.findIndex(u => u.id === 'u-1');
    const targetU1 = {
      id: 'u-1',
      name: 'Koyyada Rohith',
      email: 'rohithkoyyada@cyberblacksquad.com',
      password: 'rocky@444',
      phone: '+91 8888888889',
      role: 'Founder',
      department: 'Management',
      skills: 'Strategy, Security Architecture, Fund Raising, Leadership',
      bio: 'Founder & CEO of Cyber Black Squad. Security researcher and tech entrepreneur.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      status: 'active',
      createdDate: '2026-01-10T12:00:00Z',
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
      portfolio: 'https://cyberblacksquad.com',
      experience: 'Founder at Cyber Black Squad (Present), Principal Security Engineer at Aegis Tech (5 yrs)',
      education: 'B.Tech-Computer Science and Engineering (Aurora University)',
      certifications: 'CISSP, CEH, CISM'
    };
    if (u1Idx === -1) {
      users.push(targetU1);
    } else {
      users[u1Idx] = { ...targetU1, ...users[u1Idx] };
    }

    // Ensure Mr Evil Monster (u-2) is present and fully updated
    let u2Idx = users.findIndex(u => u.id === 'u-2');
    const targetU2 = {
      id: 'u-2',
      name: 'Mr Evil Monster',
      email: 'mrevilmonster@cyberblacksquad.com',
      password: 'mrevil@43',
      phone: '+91 9999999998',
      role: 'Admin',
      department: 'Administration & Operations',
      skills: 'Platform administration, project oversight, task governance, user management, workspace monitoring, analytics supervision, collaboration management',
      bio: 'Responsible for platform administration, project oversight, task governance, user management, workspace monitoring, analytics supervision, collaboration management, and operational control across the Cyber Black Squad platform.',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      status: 'active',
      createdDate: '2026-02-15T09:30:00Z',
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
      portfolio: 'https://cyberblacksquad.com',
      experience: 'System Administrator at Cyber Black Squad (Present)',
      education: 'B.Tech-Cyber Security',
      certifications: 'Access Level: Full Administrative Control',
      accountType: 'System Administrator',
      accessLevel: 'Full Administrative Control'
    };
    if (u2Idx === -1) {
      users.push(targetU2);
    } else {
      users[u2Idx] = { ...targetU2, ...users[u2Idx] };
    }

    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    if (!localStorage.getItem(DB_KEYS.PROJECTS)) localStorage.setItem(DB_KEYS.PROJECTS, JSON.stringify(DEFAULT_PROJECTS));
    if (!localStorage.getItem(DB_KEYS.TASKS)) localStorage.setItem(DB_KEYS.TASKS, JSON.stringify(DEFAULT_TASKS));
    if (!localStorage.getItem(DB_KEYS.MILESTONES)) localStorage.setItem(DB_KEYS.MILESTONES, JSON.stringify(DEFAULT_MILESTONES));
    if (!localStorage.getItem(DB_KEYS.CHANNELS)) localStorage.setItem(DB_KEYS.CHANNELS, JSON.stringify(DEFAULT_CHANNELS));
    if (!localStorage.getItem(DB_KEYS.MESSAGES)) localStorage.setItem(DB_KEYS.MESSAGES, JSON.stringify(DEFAULT_MESSAGES));
    if (!localStorage.getItem(DB_KEYS.NOTIFICATIONS)) localStorage.setItem(DB_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
    if (!localStorage.getItem(DB_KEYS.ACTIVITY_LOGS)) localStorage.setItem(DB_KEYS.ACTIVITY_LOGS, JSON.stringify(DEFAULT_ACTIVITY_LOGS));
    if (!localStorage.getItem(DB_KEYS.SETTINGS)) localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    if (!localStorage.getItem(DB_KEYS.SESSIONS)) localStorage.setItem(DB_KEYS.SESSIONS, JSON.stringify(DEFAULT_SESSIONS));
  },

  _get(key) {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
      console.error("Storage parse error on key: ", key, e);
      return [];
    }
  },

  _set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  // USERS COLLECTION CRUD
  getUsers() {
    return this._get(DB_KEYS.USERS);
  },

  getUserById(id) {
    return this.getUsers().find(u => u.id === id);
  },

  saveUser(user) {
    const users = this.getUsers();
    if (!user.id) {
      user.id = 'u-' + Date.now();
      user.createdDate = new Date().toISOString();
      user.status = user.status || 'active';
      user.avatar = user.avatar || 'assets/avatar.png';
      users.push(user);
      this.addActivityLog(user.id, `New user ${user.name} created inside database.`, 'User Management');
      this.addNotification('Security', 'New Workspace Member Added', `${user.name} has been enrolled in the workspace directory.`, 'Medium');
    } else {
      const idx = users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...user };
        this.addActivityLog(user.id, `User metadata updated for ${user.name}.`, 'User Management');
      }
    }
    this._set(DB_KEYS.USERS, users);
    return user;
  },

  deleteUser(id) {
    const users = this.getUsers();
    const user = users.find(u => u.id === id);
    if (!user) return false;

    this._set(DB_KEYS.USERS, users.filter(u => u.id !== id));
    this.addActivityLog(id, `User account ${user.name} deleted from database.`, 'User Management');
    this.addNotification('Security', 'Workspace Member Removed', `${user.name} was removed from the active directory.`, 'High');
    return true;
  },

  setUserStatus(id, status) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return false;

    users[idx].status = status;
    this._set(DB_KEYS.USERS, users);
    this.addActivityLog(id, `User ${users[idx].name} status updated to ${status}.`, 'User Management');

    const priority = status === 'suspended' ? 'High' : 'Medium';
    this.addNotification('Security', `User Access Modified`, `${users[idx].name} status marked ${status}.`, priority);
    return true;
  },

  // PROJECTS COLLECTION CRUD
  getProjects() {
    return this._get(DB_KEYS.PROJECTS);
  },

  getProjectById(id) {
    return this.getProjects().find(p => p.id === id);
  },

  saveProject(project) {
    const projects = this.getProjects();
    const isNew = !project.id;
    if (isNew) {
      project.id = 'p-' + Date.now();
      project.progress = project.progress || 0;
      project.documents = project.documents || [];
      project.timeline = project.timeline || [
        { text: 'Project Created & Metadata Enrolled', date: new Date().toISOString(), type: 'system' }
      ];
      projects.push(project);
      this.addActivityLog(project.ownerId || 'System', `Created project: ${project.name}`, 'Project');
      this.addNotification('Projects', 'New Project Enrolled', `Startup project "${project.name}" has been initialized.`, 'High');
    } else {
      const idx = projects.findIndex(p => p.id === project.id);
      if (idx !== -1) {
        projects[idx] = { ...projects[idx], ...project };
        this.addActivityLog(project.ownerId || 'System', `Modified project parameters for ${project.name}`, 'Project');
      }
    }
    this._set(DB_KEYS.PROJECTS, projects);
    return project;
  },

  deleteProject(id) {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === id);
    if (!project) return false;

    this._set(DB_KEYS.PROJECTS, projects.filter(p => p.id !== id));
    this.addActivityLog('System', `Destroyed project record: ${project.name}`, 'Project');
    this.addNotification('Projects', 'Project Destroyed', `Project "${project.name}" and associated elements removed.`, 'High');
    return true;
  },

  // MILESTONES COLLECTION CRUD
  getMilestones() {
    return this._get(DB_KEYS.MILESTONES);
  },

  getMilestonesByProject(projId) {
    return this.getMilestones().filter(m => m.projectId === projId);
  },

  saveMilestone(milestone) {
    const milestones = this.getMilestones();
    const isNew = !milestone.id;
    if (isNew) {
      milestone.id = 'm-' + Date.now();
      milestone.completionPct = milestone.completionPct || 0;
      milestones.push(milestone);
      this.addActivityLog('System', `Created milestone: ${milestone.name}`, 'Project');
      this.addNotification('Projects', 'New Milestone Created', `Milestone "${milestone.name}" added.`, 'Medium');
      this.appendProjectTimeline(milestone.projectId, `Milestone Added: ${milestone.name}`);
    } else {
      const idx = milestones.findIndex(m => m.id === milestone.id);
      if (idx !== -1) {
        milestones[idx] = { ...milestones[idx], ...milestone };
        if (milestone.completionPct === 100) {
          milestones[idx].status = 'Completed';
          this.appendProjectTimeline(milestone.projectId, `Milestone Completed: ${milestone.name}`);
        }
      }
    }
    this._set(DB_KEYS.MILESTONES, milestones);

    // Automatically adjust project progress
    this.recalculateProjectMetrics(milestone.projectId);
    return milestone;
  },

  deleteMilestone(id) {
    const milestones = this.getMilestones();
    const ms = milestones.find(m => m.id === id);
    if (!ms) return false;

    this._set(DB_KEYS.MILESTONES, milestones.filter(m => m.id !== id));
    this.addActivityLog('System', `Removed milestone record: ${ms.name}`, 'Project');
    this.recalculateProjectMetrics(ms.projectId);
    return true;
  },

  // TASKS COLLECTION CRUD
  getTasks() {
    return this._get(DB_KEYS.TASKS);
  },

  getTaskById(id) {
    return this.getTasks().find(t => t.id === id);
  },

  saveTask(task) {
    const tasks = this.getTasks();
    const isNew = !task.id;
    if (isNew) {
      task.id = 't-' + Date.now();
      task.progress = task.progress || 0;
      task.comments = task.comments || [];
      task.attachments = task.attachments || [];
      tasks.push(task);
      this.addActivityLog(task.assigneeId || 'System', `Task created: ${task.title}`, 'Task');
      this.addNotification('Tasks', 'New Task Assigned', `Task "${task.title}" was delegated.`, 'Medium');
      this.appendProjectTimeline(task.projectId, `Task Created: ${task.title}`);
    } else {
      const idx = tasks.findIndex(t => t.id === task.id);
      if (idx !== -1) {
        const oldTask = tasks[idx];
        tasks[idx] = { ...oldTask, ...task };
        if (oldTask.status !== task.status) {
          this.addActivityLog(task.assigneeId || 'System', `Task "${task.title}" moved to ${task.status}`, 'Task');
          if (task.status === 'Completed') {
            this.appendProjectTimeline(task.projectId, `Task Completed: ${task.title}`);
            this.addNotification('Tasks', 'Task Completed', `Task "${task.title}" has been completed!`, 'Low');
          }
        }
      }
    }
    this._set(DB_KEYS.TASKS, tasks);
    this.recalculateProjectMetrics(task.projectId);
    return task;
  },

  deleteTask(id) {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return false;

    this._set(DB_KEYS.TASKS, tasks.filter(t => t.id !== id));
    this.addActivityLog('System', `Deleted task backlog: ${task.title}`, 'Task');
    this.recalculateProjectMetrics(task.projectId);
    return true;
  },

  recalculateProjectMetrics(projId) {
    if (!projId) return;
    const project = this.getProjectById(projId);
    if (!project) return;

    const projTasks = this.getTasks().filter(t => t.projectId === projId);
    const milestones = this.getMilestonesByProject(projId);

    // Average completion progress calculation
    let avgProgress = 0;
    if (projTasks.length > 0) {
      const totalProgress = projTasks.reduce((sum, t) => sum + (Number(t.progress) || 0), 0);
      avgProgress = Math.round(totalProgress / projTasks.length);
    } else if (milestones.length > 0) {
      const totalMilestone = milestones.reduce((sum, m) => sum + (Number(m.completionPct) || 0), 0);
      avgProgress = Math.round(totalMilestone / milestones.length);
    }

    project.progress = avgProgress;
    if (avgProgress === 100) {
      project.status = 'Completed';
      project.completionDate = new Date().toISOString().split('T')[0];
      this.appendProjectTimeline(projId, `Project Completed: All tasks deliverable!`);
    } else if (avgProgress > 0 && project.status === 'Planning') {
      project.status = 'In Progress';
    }

    const projects = this.getProjects();
    const idx = projects.findIndex(p => p.id === projId);
    if (idx !== -1) {
      projects[idx] = project;
      this._set(DB_KEYS.PROJECTS, projects);
    }
  },

  appendProjectTimeline(projId, text) {
    if (!projId) return;
    const project = this.getProjectById(projId);
    if (!project) return;

    project.timeline = project.timeline || [];
    project.timeline.unshift({
      text,
      date: new Date().toISOString(),
      type: 'project'
    });

    const projects = this.getProjects();
    const idx = projects.findIndex(p => p.id === projId);
    if (idx !== -1) {
      projects[idx] = project;
      this._set(DB_KEYS.PROJECTS, projects);
    }
  },

  // CHANNELS COLLECTION CRUD
  getChannels() {
    return this._get(DB_KEYS.CHANNELS);
  },

  saveChannel(channel) {
    const channels = this.getChannels();
    if (!channel.id) {
      channel.id = 'ch-' + Date.now();
      channel.isDefault = false;
      channels.push(channel);
      this.addActivityLog('System', `Created chat channel: #${channel.name}`, 'System');
      this.addNotification('Messages', 'New Chat Channel', `Channel #${channel.name} was added.`, 'Low');
    } else {
      const idx = channels.findIndex(c => c.id === channel.id);
      if (idx !== -1) {
        channels[idx] = { ...channels[idx], ...channel };
      }
    }
    this._set(DB_KEYS.CHANNELS, channels);
    return channel;
  },

  deleteChannel(id) {
    const channels = this.getChannels();
    const ch = channels.find(c => c.id === id);
    if (!ch || ch.isDefault) return false; // block general deletes

    this._set(DB_KEYS.CHANNELS, channels.filter(c => c.id !== id));

    // Wipe associated messages
    const msgs = this.getMessages().filter(m => m.channelId !== id);
    this._set(DB_KEYS.MESSAGES, msgs);

    this.addActivityLog('System', `Deleted chat channel: #${ch.name}`, 'System');
    return true;
  },

  // MESSAGES COLLECTION CRUD
  getMessages() {
    return this._get(DB_KEYS.MESSAGES);
  },

  getMessagesByChannel(channelId) {
    return this.getMessages().filter(m => m.channelId === channelId);
  },

  addChatMessage(channelId, senderId, text, reactions = {}) {
    const messages = this.getMessages();
    const newMsg = {
      id: 'msg-' + Date.now(),
      channelId,
      senderId,
      text,
      timestamp: new Date().toISOString(),
      reactions: reactions
    };
    messages.push(newMsg);
    this._set(DB_KEYS.MESSAGES, messages);
    return newMsg;
  },

  saveMessage(msg) {
    const messages = this.getMessages();
    const idx = messages.findIndex(m => m.id === msg.id);
    if (idx !== -1) {
      messages[idx] = msg;
      this._set(DB_KEYS.MESSAGES, messages);
    }
  },

  deleteMessage(id) {
    const messages = this.getMessages();
    this._set(DB_KEYS.MESSAGES, messages.filter(m => m.id !== id));
  },

  // NOTIFICATIONS COLLECTION CRUD
  getNotifications() {
    return this._get(DB_KEYS.NOTIFICATIONS);
  },

  addNotification(category, title, message, priority = 'Medium') {
    const notifications = this.getNotifications();
    const newNotif = {
      id: 'n-' + Date.now(),
      category, // 'Tasks', 'Projects', 'Messages', 'System', 'Security'
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      priority // 'Low', 'Medium', 'High'
    };
    notifications.unshift(newNotif);
    if (notifications.length > 50) notifications.pop();

    this._set(DB_KEYS.NOTIFICATIONS, notifications);

    // Dispatch instant custom notification reactive event
    window.dispatchEvent(new CustomEvent('cbs-enterprise-notification', { detail: newNotif }));
    return newNotif;
  },

  markNotificationRead(id) {
    const notifications = this.getNotifications();
    const idx = notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      notifications[idx].read = true;
      this._set(DB_KEYS.NOTIFICATIONS, notifications);
    }
  },

  deleteNotification(id) {
    const notifications = this.getNotifications();
    this._set(DB_KEYS.NOTIFICATIONS, notifications.filter(n => n.id !== id));
  },

  markAllNotificationsRead() {
    const notifications = this.getNotifications().map(n => ({ ...n, read: true }));
    this._set(DB_KEYS.NOTIFICATIONS, notifications);
  },

  clearNotifications() {
    this._set(DB_KEYS.NOTIFICATIONS, []);
  },

  // ACTIVITY LOGS COLLECTION CRUD
  getActivityLogs() {
    return this._get(DB_KEYS.ACTIVITY_LOGS);
  },

  addActivityLog(userId, text, type = 'System') {
    const logs = this.getActivityLogs();
    const newLog = {
      id: 'log-' + Date.now(),
      userId,
      text,
      timestamp: new Date().toISOString(),
      type // 'User Management', 'Project', 'Task', 'Security', 'System'
    };
    logs.unshift(newLog);
    if (logs.length > 100) logs.pop();

    this._set(DB_KEYS.ACTIVITY_LOGS, logs);
    return newLog;
  },

  // SETTINGS COLLECTION CRUD
  getSettings() {
    this.init();
    return JSON.parse(localStorage.getItem(DB_KEYS.SETTINGS)) || DEFAULT_SETTINGS;
  },

  saveSettings(settings) {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    this._set(DB_KEYS.SETTINGS, updated);
    return updated;
  },

  // SESSIONS COLLECTION CRUD
  getSessions() {
    return this._get(DB_KEYS.SESSIONS);
  },

  addSessionRecord(userId, ip = '127.0.0.1', status = 'Success') {
    const sessions = this.getSessions();
    const newSession = {
      id: 'sess-' + Date.now(),
      userId,
      loginTime: new Date().toISOString(),
      ip,
      status
    };
    sessions.unshift(newSession);
    if (sessions.length > 50) sessions.pop();
    this._set(DB_KEYS.SESSIONS, sessions);
    return newSession;
  }
};

// Initial database loading
db.init();

// Export globally
window.cbsDB = db;
