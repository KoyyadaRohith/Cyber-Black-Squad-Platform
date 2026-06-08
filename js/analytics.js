/**
 * Cyber Black Squad – Enterprise Advanced Analytics Module
 * Integrates 5 interactive SVG charts powered by Chart.js.
 * Dynamically parses local storage database arrays to draw growth curves.
 */

const analyticsModule = {
  charts: {},

  render() {
    const tasks = window.cbsDB.getTasks();
    const projects = window.cbsDB.getProjects().filter(p => p.status !== 'Archived');
    const team = window.cbsDB.getUsers();
    const logs = window.cbsDB.getActivityLogs();

    // 1. CHART 1: WEEKLY WORKSPACE GROWTH (LINE)
    this.renderWeeklyGrowthChart(logs);

    // 2. CHART 2: TASK COMPLETION STATUS DISTRIBUTION (DOUGHNUT)
    this.renderTaskCompletionChart(tasks);

    // 3. CHART 3: PROJECT VELOCITY PROGRESS LEVELS (HORIZONTAL BAR)
    this.renderProjectVelocityChart(projects);

    // 4. CHART 4: TEAM CONTRIBUTION COMPLETED TASKS (PIE / DOUGHNUT)
    this.renderTeamContributionChart(tasks, team);

    // 5. CHART 5: USER ACTIVITY FREQUENCY INDEX (BAR)
    this.renderUserActivityChart(logs, team);
  },

  renderWeeklyGrowthChart(logs) {
    const weekdayCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 };
    logs.forEach(l => {
      const d = new Date(l.timestamp);
      const day = d.getDay();
      weekdayCounts[day]++;
    });

    const realData = [
      weekdayCounts[1], // Mon
      weekdayCounts[2], // Tue
      weekdayCounts[3], // Wed
      weekdayCounts[4], // Thu
      weekdayCounts[5], // Fri
      weekdayCounts[6], // Sat
      weekdayCounts[0]  // Sun
    ];

    // Render Dashboard performance curve if canvas is in DOM
    const dashCtx = document.getElementById('dashboardPerformanceChart');
    if (dashCtx) {
      if (this.charts.dashboardGrowth) this.charts.dashboardGrowth.destroy();
      const gradient = dashCtx.getContext('2d').createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.25)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');

      this.charts.dashboardGrowth = new Chart(dashCtx, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'System Activities Velocity',
            data: realData,
            borderColor: '#8b5cf6',
            borderWidth: 3,
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#3b82f6',
            pointBorderWidth: 2,
            pointRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { color: 'rgba(226, 232, 240, 0.5)' }, ticks: { color: '#94a3b8', stepSize: 1 } },
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
          }
        }
      });
    }

    // Render Analytics page weekly growth curve if canvas is in DOM
    const analCtx = document.getElementById('analyticsWeeklyGrowthChart');
    if (analCtx) {
      if (this.charts.analyticsGrowth) this.charts.analyticsGrowth.destroy();
      const gradient = analCtx.getContext('2d').createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.25)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');

      this.charts.analyticsGrowth = new Chart(analCtx, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'System Activities Velocity',
            data: realData,
            borderColor: '#8b5cf6',
            borderWidth: 3,
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#3b82f6',
            pointBorderWidth: 2,
            pointRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { color: 'rgba(226, 232, 240, 0.5)' }, ticks: { color: '#94a3b8', stepSize: 1 } },
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
          }
        }
      });
    }
  },

  renderTaskCompletionChart(tasks) {
    const ctx = document.getElementById('analyticsTasksChart');
    if (!ctx) return;

    if (this.charts.taskCompletion) this.charts.taskCompletion.destroy();

    const completed = tasks.filter(t => t.status === 'Completed').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const review = tasks.filter(t => t.status === 'Review' || t.status === 'In Review').length;
    const todo = tasks.filter(t => t.status === 'To Do').length;
    const backlog = tasks.filter(t => t.status === 'Backlog').length;

    this.charts.taskCompletion = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'In Progress', 'In Review', 'To Do', 'Backlog'],
        datasets: [{
          data: [completed, inProgress, review, todo, backlog],
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#a855f7', '#94a3b8'],
          borderWidth: 2,
          borderColor: 'var(--bg-card)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#64748b', font: { family: 'Inter', size: 11 } } }
        }
      }
    });
  },

  renderProjectVelocityChart(projects) {
    const ctx = document.getElementById('analyticsProjectsVelocityChart');
    if (!ctx) return;

    if (this.charts.projectVelocity) this.charts.projectVelocity.destroy();

    const labels = projects.map(p => p.name.substring(0, 15) + '...');
    const progressData = projects.map(p => p.progress);

    this.charts.projectVelocity = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Delivery Completion %',
          data: progressData,
          backgroundColor: 'rgba(59, 130, 246, 0.75)',
          borderColor: '#3b82f6',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { max: 100, grid: { color: 'rgba(226, 232, 240, 0.5)' }, ticks: { color: '#94a3b8' } },
          y: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
      }
    });
  },

  renderTeamContributionChart(tasks, team) {
    const ctx = document.getElementById('analyticsTeamChart') || document.getElementById('analyticsTeamContributionChart');
    if (!ctx) return;

    if (this.charts.teamContribution) this.charts.teamContribution.destroy();

    const labels = [];
    const values = [];

    team.forEach(m => {
      const resolved = tasks.filter(t => t.assigneeId === m.id && t.status === 'Completed').length;
      labels.push(m.name.split(' ')[0]);
      values.push(resolved);
    });

    this.charts.teamContribution = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#14b8a6'],
          borderWidth: 2,
          borderColor: 'var(--bg-card)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#64748b', font: { family: 'Inter', size: 11 } } }
        }
      }
    });
  },

  renderUserActivityChart(logs, team) {
    const ctx = document.getElementById('analyticsUserActivityChart');
    if (!ctx) return;

    if (this.charts.userActivity) this.charts.userActivity.destroy();

    const labels = [];
    const data = [];

    team.slice(0, 5).forEach(m => {
      const freq = logs.filter(l => l.userId === m.id).length;
      labels.push(m.name.split(' ')[0]);
      data.push(freq);
    });

    this.charts.userActivity = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Activity Logs Count',
          data: data,
          backgroundColor: 'rgba(16, 185, 129, 0.75)',
          borderColor: '#10b981',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: 'rgba(226, 232, 240, 0.5)' }, ticks: { stepSize: 1, color: '#94a3b8' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
      }
    });
  }
};

window.analyticsModule = analyticsModule;
