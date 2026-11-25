// Antigravity Skill Manager - Frontend Application Logic

// Application State
const state = {
  activeView: 'library', // 'library' or 'explorer'
  librarySkills: [],
  filteredLibrarySkills: [],
  activeLibFilter: 'all',
  librarySearchQuery: '',

  skills: [],
  filteredSkills: [],
  activeFilter: 'all',
  searchQuery: '',

  config: null,
  selectedSkill: null,
  skillToDelete: null,
};

// Skill Starter Templates
const templates = {
  runbook: `# \${NAME}

Step-by-step operational runbook and procedure.

## When to use this skill
Use this skill whenever you need to execute the \${NAME} workflow or handle related maintenance tasks.

## Prerequisites
- Verify environment setup and required credentials.
- Ensure all target services are accessible.

## Procedure

### Step 1: Preparation & Pre-checks
1. Inspect the current environment:
   \`\`\`bash
   echo "Checking status..."
   \`\`\`

### Step 2: Main Execution
1. Execute the main routine according to standard requirements.
2. Confirm the expected outputs are produced.

### Step 3: Verification & Health Check
1. Validate that the operation completed successfully without errors.
2. Check logs or endpoints to ensure standard health.
`,

  tool: `# \${NAME}

Scripted automation and helper tool runner.

## Overview
This skill delegates specialized script automation to dedicated helper utilities in \`./scripts/\`.

## Available Helpers
- \`./scripts/run.sh\` or \`./scripts/run.ps1\`: Primary execution script.

## Instructions

1. Prepare any necessary inputs or flags.
2. Run the helper script:
   \`\`\`bash
   ./scripts/run.sh --flag value
   \`\`\`
3. Parse the output and report findings back to the user clearly.
`,

  testing: `# \${NAME}

Code quality, linting, and automated testing runbook.

## Overview
Guidelines and commands for running unit, integration, and security checks on this project.

## Checklist

- [ ] Static analysis & linting: Run code style validation.
- [ ] Unit tests: Execute the core test suite.
- [ ] Integration tests: Verify external integrations.

## Commands

\`\`\`bash
# Linting
npm run lint

# Test suite
npm test
\`\`\`

## Expected Verification
- All tests must pass with zero failures.
- No new linting warnings or regressions.
`,

  blank: `# \${NAME}

Describe your skill instructions here.

## Steps
1. First step.
2. Second step.
3. Verification.
`
};

// DOM Elements
const el = {
  // Navigation Tabs
  navTabLibrary: document.getElementById('navTabLibrary'),
  navTabExplorer: document.getElementById('navTabExplorer'),
  navLibraryCountBadge: document.getElementById('navLibraryCountBadge'),
  navExplorerCountBadge: document.getElementById('navExplorerCountBadge'),
  viewLibrary: document.getElementById('viewLibrary'),
  viewExplorer: document.getElementById('viewExplorer'),
  btnSwitchToExplorer: document.getElementById('btnSwitchToExplorer'),

  // Header & Controls
  currentWorkspaceDisplay: document.getElementById('currentWorkspaceDisplay'),
  btnSwitchWorkspace: document.getElementById('btnSwitchWorkspace'),
  btnRefresh: document.getElementById('btnRefresh'),

  // Library View Elements
  libStatTotal: document.getElementById('libStatTotal'),
  libStatActive: document.getElementById('libStatActive'),
  libStatInactive: document.getElementById('libStatInactive'),
  librarySearchInput: document.getElementById('librarySearchInput'),
  libCountAll: document.getElementById('libCountAll'),
  libraryContainer: document.getElementById('libraryContainer'),
  libraryEmptyState: document.getElementById('libraryEmptyState'),

  // Explorer View Elements
  statTotal: document.getElementById('statTotal'),
  statWorkspace: document.getElementById('statWorkspace'),
  statGlobal: document.getElementById('statGlobal'),
  statPlugins: document.getElementById('statPlugins'),
  statBuiltin: document.getElementById('statBuiltin'),
  countAll: document.getElementById('countAll'),
  searchInput: document.getElementById('searchInput'),
  skillsContainer: document.getElementById('skillsContainer'),
  emptyState: document.getElementById('emptyState'),

  // Modals
  addSkillModal: document.getElementById('addSkillModal'),
  viewSkillModal: document.getElementById('viewSkillModal'),
  workspaceModal: document.getElementById('workspaceModal'),
  deleteModal: document.getElementById('deleteModal'),
  toastContainer: document.getElementById('toastContainer'),

  // Add Modal Tabs & Panels
  tabAddUrl: document.getElementById('tabAddUrl'),
  tabAddZip: document.getElementById('tabAddZip'),
  tabAddManual: document.getElementById('tabAddManual'),
  panelAddUrl: document.getElementById('panelAddUrl'),
  panelAddZip: document.getElementById('panelAddZip'),
  addSkillForm: document.getElementById('addSkillForm'),

  // Import from URL Elements
  inputImportUrl: document.getElementById('inputImportUrl'),
  importUrlScope: document.getElementById('importUrlScope'),
  inputImportCustomName: document.getElementById('inputImportCustomName'),
  checkImportUrlActivate: document.getElementById('checkImportUrlActivate'),
  btnSubmitImportUrl: document.getElementById('btnSubmitImportUrl'),

  // Import from ZIP / Local Elements
  dropZone: document.getElementById('dropZone'),
  zipFileInput: document.getElementById('zipFileInput'),
  zipFileName: document.getElementById('zipFileName'),
  inputLocalFolder: document.getElementById('inputLocalFolder'),
  importZipScope: document.getElementById('importZipScope'),
  inputImportZipCustomName: document.getElementById('inputImportZipCustomName'),
  btnSubmitImportZip: document.getElementById('btnSubmitImportZip'),

  // Add Form (Manual)
  newSkillName: document.getElementById('newSkillName'),
  newSkillDesc: document.getElementById('newSkillDesc'),
  newSkillScope: document.getElementById('newSkillScope'),
  newSkillTemplate: document.getElementById('newSkillTemplate'),
  newSkillContent: document.getElementById('newSkillContent'),
  checkActivateNow: document.getElementById('checkActivateNow'),
  checkScripts: document.getElementById('checkScripts'),
  checkReferences: document.getElementById('checkReferences'),
  checkExamples: document.getElementById('checkExamples'),

  // Detail Modal
  detailSkillName: document.getElementById('detailSkillName'),
  detailStatusBadge: document.getElementById('detailStatusBadge'),
  detailScopeBadge: document.getElementById('detailScopeBadge'),
  detailPath: document.getElementById('detailPath'),
  detailScopeIcon: document.getElementById('detailScopeIcon'),
  btnToggleFromDetail: document.getElementById('btnToggleFromDetail'),
  btnToggleLabel: document.getElementById('btnToggleLabel'),
  btnDeleteFromDetail: document.getElementById('btnDeleteFromDetail'),
  previewDescription: document.getElementById('previewDescription'),
  previewMarkdownBody: document.getElementById('previewMarkdownBody'),
  editSkillDesc: document.getElementById('editSkillDesc'),
  editSkillContent: document.getElementById('editSkillContent'),
  readOnlyWarning: document.getElementById('readOnlyWarning'),
  btnSaveSkill: document.getElementById('btnSaveSkill'),
  filesTreeContainer: document.getElementById('filesTreeContainer'),
  detailFileCount: document.getElementById('detailFileCount'),

  // Workspace Switch
  inputWorkspacePath: document.getElementById('inputWorkspacePath'),
  btnSaveWorkspace: document.getElementById('btnSaveWorkspace'),

  // Delete
  deleteSkillNameSpan: document.getElementById('deleteSkillNameSpan'),
  btnConfirmDelete: document.getElementById('btnConfirmDelete'),

  // Detail Tabs
  tabBtnPreview: document.getElementById('tabBtnPreview'),
  tabBtnEditor: document.getElementById('tabBtnEditor'),
  tabBtnFiles: document.getElementById('tabBtnFiles'),
  tabContentPreview: document.getElementById('tabContentPreview'),
  tabContentEditor: document.getElementById('tabContentEditor'),
  tabContentFiles: document.getElementById('tabContentFiles'),

  // Trigger Guide Modal Elements
  triggerGuideModal: document.getElementById('triggerGuideModal'),
  triggerModalSkillName: document.getElementById('triggerModalSkillName'),
  triggerModalStatusBadge: document.getElementById('triggerModalStatusBadge'),
  triggerModalStatusInline: document.getElementById('triggerModalStatusInline'),
  triggerModalDesc: document.getElementById('triggerModalDesc'),
  triggerModalKeywords: document.getElementById('triggerModalKeywords'),
  triggerModalSubskillsContainer: document.getElementById('triggerModalSubskillsContainer'),
  triggerModalSubskills: document.getElementById('triggerModalSubskills'),
  triggerModalPrompts: document.getElementById('triggerModalPrompts'),
  btnTriggerFromDetail: document.getElementById('btnTriggerFromDetail'),
};

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  applyTemplateToNewSkill();
  await fetchConfig();
  await refreshAll();
});

// Setup Event Listeners
function setupEventListeners() {
  // Top View Navigation
  el.navTabLibrary.addEventListener('click', () => switchMainView('library'));
  el.navTabExplorer.addEventListener('click', () => switchMainView('explorer'));
  if (el.btnSwitchToExplorer) {
    el.btnSwitchToExplorer.addEventListener('click', () => switchMainView('explorer'));
  }

  // Refresh
  el.btnRefresh.addEventListener('click', async () => {
    el.btnRefresh.classList.add('animate-spin');
    await refreshAll();
    el.btnRefresh.classList.remove('animate-spin');
    showToast('Data refreshed', 'info');
  });

  // Open Add Skill Modal
  document.querySelectorAll('.btnOpenAddModal').forEach((btn) => {
    btn.addEventListener('click', () => {
      openModal(el.addSkillModal);
      el.newSkillName.focus();
    });
  });

  // Switch Workspace Modal
  el.btnSwitchWorkspace.addEventListener('click', () => {
    el.inputWorkspacePath.value = state.config?.workspacePath || '';
    openModal(el.workspaceModal);
  });
  el.btnSaveWorkspace.addEventListener('click', handleSaveWorkspace);

  // Modal Close buttons
  document.querySelectorAll('.modal-close').forEach((btn) => {
    btn.addEventListener('click', closeAllModals);
  });

  // Shortcuts
  window.addEventListener('keydown', (e) => {
    if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && !isModalOpen()) {
      e.preventDefault();
      if (state.activeView === 'library') {
        el.librarySearchInput.focus();
      } else {
        el.searchInput.focus();
      }
    }
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  // Library Search
  el.librarySearchInput.addEventListener('input', (e) => {
    state.librarySearchQuery = e.target.value.toLowerCase().trim();
    applyLibraryFilterAndRender();
  });

  // Library Filters
  document.querySelectorAll('.lib-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lib-filter-btn').forEach((b) => {
        b.className = 'lib-filter-btn px-3 py-1.5 rounded-lg font-medium transition bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800';
      });
      btn.className = 'lib-filter-btn px-3 py-1.5 rounded-lg font-medium transition bg-indigo-600 text-white';
      state.activeLibFilter = btn.dataset.libfilter;
      applyLibraryFilterAndRender();
    });
  });

  // Explorer Search & Filters
  el.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    applyExplorerFilterAndRender();
  });

  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => {
        b.className = 'filter-btn px-3 py-1.5 rounded-lg font-medium transition bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800';
      });
      btn.className = 'filter-btn px-3 py-1.5 rounded-lg font-medium transition bg-indigo-600 text-white';
      state.activeFilter = btn.dataset.filter;
      applyExplorerFilterAndRender();
    });
  });

  // Add Modal Tabs
  el.tabAddUrl.addEventListener('click', () => switchAddModalTab('url'));
  el.tabAddZip.addEventListener('click', () => switchAddModalTab('zip'));
  el.tabAddManual.addEventListener('click', () => switchAddModalTab('manual'));

  // Quick Sample URLs
  document.querySelectorAll('.btn-sample-url').forEach((btn) => {
    btn.addEventListener('click', () => {
      el.inputImportUrl.value = btn.dataset.url;
      el.inputImportUrl.focus();
    });
  });

  // Submit Import URL
  el.btnSubmitImportUrl.addEventListener('click', handleSubmitImportUrl);

  // ZIP Drag and Drop / Select
  el.dropZone.addEventListener('click', () => el.zipFileInput.click());
  el.zipFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      selectedZipFile = e.target.files[0];
      el.zipFileName.textContent = selectedZipFile.name;
    }
  });

  el.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    el.dropZone.classList.add('border-indigo-500');
  });
  el.dropZone.addEventListener('dragleave', () => el.dropZone.classList.remove('border-indigo-500'));
  el.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    el.dropZone.classList.remove('border-indigo-500');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      selectedZipFile = e.dataTransfer.files[0];
      el.zipFileName.textContent = selectedZipFile.name;
    }
  });

  // Submit Import ZIP / Local
  el.btnSubmitImportZip.addEventListener('click', handleSubmitImportZip);

  // Add Form Handlers (Manual)
  el.newSkillTemplate.addEventListener('change', applyTemplateToNewSkill);
  el.newSkillName.addEventListener('input', () => {
    el.newSkillName.value = el.newSkillName.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  });
  el.addSkillForm.addEventListener('submit', handleCreateSkill);

  // Detail Modal Tabs
  el.tabBtnPreview.addEventListener('click', () => switchDetailTab('preview'));
  el.tabBtnEditor.addEventListener('click', () => switchDetailTab('editor'));
  el.tabBtnFiles.addEventListener('click', () => switchDetailTab('files'));

  // Detail Actions
  el.btnSaveSkill.addEventListener('click', handleSaveSkill);
  el.btnToggleFromDetail.addEventListener('click', () => {
    if (state.selectedSkill) {
      if (state.selectedSkill.isLibrarySkill) {
        handleToggleLibrarySkill(state.selectedSkill);
      } else {
        handleToggleExplorerSkill(state.selectedSkill);
      }
    }
  });
  el.btnDeleteFromDetail.addEventListener('click', () => {
    closeModal(el.viewSkillModal);
    promptDeleteSkill(state.selectedSkill);
  });
  if (el.btnTriggerFromDetail) {
    el.btnTriggerFromDetail.addEventListener('click', () => {
      if (state.selectedSkill) {
        openTriggerGuide(state.selectedSkill);
      }
    });
  }

  // Backdrop click to close modals
  [el.addSkillModal, el.viewSkillModal, el.workspaceModal, el.deleteModal, el.triggerGuideModal].forEach((m) => {
    if (m) {
      m.addEventListener('click', (e) => {
        if (e.target === m) closeModal(m);
      });
    }
  });

  // Delete Confirmation
  el.btnConfirmDelete.addEventListener('click', handleConfirmDelete);
}

let selectedZipFile = null;

// Switch mode inside Add Skill Modal
function switchAddModalTab(mode) {
  const tabs = [
    { id: 'url', btn: el.tabAddUrl, panel: el.panelAddUrl },
    { id: 'zip', btn: el.tabAddZip, panel: el.panelAddZip },
    { id: 'manual', btn: el.tabAddManual, panel: el.addSkillForm },
  ];

  tabs.forEach((t) => {
    if (t.id === mode) {
      t.btn.className = 'py-2.5 px-3 border-b-2 border-indigo-500 text-indigo-400 transition flex items-center gap-1.5';
      t.panel.classList.remove('hidden');
    } else {
      t.btn.className = 'py-2.5 px-3 border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5';
      t.panel.classList.add('hidden');
    }
  });
  lucide.createIcons();
}

// Handler: Import from GitHub / OpenClaw / URL
async function handleSubmitImportUrl() {
  const url = el.inputImportUrl.value.trim();
  const targetScope = el.importUrlScope.value;
  const customName = el.inputImportCustomName.value.trim();
  const activate = el.checkImportUrlActivate.checked;

  if (!url) {
    showToast('Silakan masukkan URL GitHub atau OpenClaw', 'error');
    return;
  }

  // Set loading
  const originalHtml = el.btnSubmitImportUrl.innerHTML;
  el.btnSubmitImportUrl.disabled = true;
  el.btnSubmitImportUrl.innerHTML = `
    <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>
    <span>Mengunduh skill...</span>
  `;
  lucide.createIcons();

  try {
    const res = await fetch('/api/library/import-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, targetScope, activate, customName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal mengimpor dari URL');

    closeAllModals();
    el.inputImportUrl.value = '';
    el.inputImportCustomName.value = '';

    showToast(`Skill "${data.skill.name}" berhasil diimpor ke Library!`, 'success');
    switchMainView('library');
    await refreshAll();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    el.btnSubmitImportUrl.disabled = false;
    el.btnSubmitImportUrl.innerHTML = originalHtml;
    lucide.createIcons();
  }
}

// Handler: Import from ZIP or Local Folder
async function handleSubmitImportZip() {
  const localFolder = el.inputLocalFolder.value.trim();
  const targetScope = el.importZipScope.value;
  const customName = el.inputImportZipCustomName.value.trim();

  // If local folder specified
  if (localFolder) {
    try {
      const res = await fetch('/api/library/import-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: localFolder, targetScope, activate: true, customName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengimpor folder lokal');

      closeAllModals();
      el.inputLocalFolder.value = '';
      showToast(`Skill "${data.skill.name}" berhasil diimpor dari folder lokal!`, 'success');
      switchMainView('library');
      await refreshAll();
      return;
    } catch (err) {
      showToast(err.message, 'error');
      return;
    }
  }

  // If ZIP file selected
  if (!selectedZipFile) {
    showToast('Silakan pilih file .zip atau masukkan path folder lokal', 'error');
    return;
  }

  const originalHtml = el.btnSubmitImportZip.innerHTML;
  el.btnSubmitImportZip.disabled = true;
  el.btnSubmitImportZip.innerHTML = `
    <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>
    <span>Mengekstrak file ZIP...</span>
  `;
  lucide.createIcons();

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const base64 = reader.result;
      const res = await fetch('/api/library/import-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zipBase64: base64,
          filename: selectedZipFile.name,
          targetScope,
          activate: true,
          customName
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengimpor ZIP');

      closeAllModals();
      selectedZipFile = null;
      el.zipFileName.textContent = 'Belum ada file dipilih';
      el.inputImportZipCustomName.value = '';

      showToast(`Skill "${data.skill.name}" berhasil diekstrak dan masuk ke Library!`, 'success');
      switchMainView('library');
      await refreshAll();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      el.btnSubmitImportZip.disabled = false;
      el.btnSubmitImportZip.innerHTML = originalHtml;
      lucide.createIcons();
    }
  };
  reader.readAsDataURL(selectedZipFile);
}

// Switch between Library View and Explorer View
function switchMainView(view) {
  state.activeView = view;
  if (view === 'library') {
    el.viewLibrary.classList.remove('hidden');
    el.viewExplorer.classList.add('hidden');
    el.navTabLibrary.className = 'flex items-center gap-2 px-4 py-2 rounded-lg transition nav-tab-active';
    el.navTabExplorer.className = 'flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white transition';
  } else {
    el.viewLibrary.classList.add('hidden');
    el.viewExplorer.classList.remove('hidden');
    el.navTabLibrary.className = 'flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white transition';
    el.navTabExplorer.className = 'flex items-center gap-2 px-4 py-2 rounded-lg transition nav-tab-active';
  }
  lucide.createIcons();
}

// Template applier
function applyTemplateToNewSkill() {
  const tmpl = el.newSkillTemplate.value;
  const name = el.newSkillName.value.trim() || 'my-custom-skill';
  let body = templates[tmpl] || templates.blank;
  body = body.replace(/\${NAME}/g, name);
  el.newSkillContent.value = body;

  if (tmpl === 'runbook') {
    el.newSkillDesc.value = 'Use this skill when you need to execute operational maintenance, diagnostic checks, or routine runbooks.';
    el.checkScripts.checked = false;
  } else if (tmpl === 'tool') {
    el.newSkillDesc.value = 'Use this skill when running external command-line automation scripts and CLI pipelines.';
    el.checkScripts.checked = true;
  } else if (tmpl === 'testing') {
    el.newSkillDesc.value = 'Use this skill when asked to run tests, check code quality, or verify implementation completeness.';
    el.checkScripts.checked = false;
  } else {
    el.newSkillDesc.value = '';
    el.checkScripts.checked = false;
  }
}

// Fetch App Config
async function fetchConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    state.config = data;
    el.currentWorkspaceDisplay.textContent = data.workspacePath;
    el.currentWorkspaceDisplay.title = data.workspacePath;
  } catch (err) {
    console.error('Error fetching config:', err);
  }
}

// Refresh both Library and Explorer
async function refreshAll() {
  await Promise.all([fetchLibrarySkills(), fetchExplorerSkills()]);
}

// ==========================================
// 📚 LIBRARY LOGIC
// ==========================================

async function fetchLibrarySkills() {
  try {
    const res = await fetch('/api/library');
    const data = await res.json();
    state.librarySkills = data.librarySkills || [];

    // Stats
    const total = state.librarySkills.length;
    const active = state.librarySkills.filter((s) => s.isActive).length;
    const inactive = total - active;

    el.libStatTotal.textContent = total;
    el.libStatActive.textContent = active;
    el.libStatInactive.textContent = inactive;
    el.libCountAll.textContent = total;
    el.navLibraryCountBadge.textContent = `${active}/${total}`;

    applyLibraryFilterAndRender();
  } catch (err) {
    console.error('Error fetching library skills:', err);
    showToast('Failed to load library skills', 'error');
  }
}

function applyLibraryFilterAndRender() {
  let list = [...state.librarySkills];

  if (state.activeLibFilter === 'active') {
    list = list.filter((s) => s.isActive);
  } else if (state.activeLibFilter === 'inactive') {
    list = list.filter((s) => !s.isActive);
  } else if (state.activeLibFilter === 'workspace') {
    list = list.filter((s) => s.targetScope === 'workspace');
  } else if (state.activeLibFilter === 'global') {
    list = list.filter((s) => s.targetScope === 'global');
  }

  if (state.librarySearchQuery) {
    list = list.filter((s) => {
      const name = (s.name || '').toLowerCase();
      const desc = (s.description || '').toLowerCase();
      return name.includes(state.librarySearchQuery) || desc.includes(state.librarySearchQuery);
    });
  }

  state.filteredLibrarySkills = list;
  renderLibraryGrid(list);
}

function renderLibraryGrid(skills) {
  el.libraryContainer.innerHTML = '';

  if (skills.length === 0) {
    el.libraryContainer.classList.add('hidden');
    el.libraryEmptyState.classList.remove('hidden');
    el.libraryEmptyState.classList.add('flex');
    lucide.createIcons();
    return;
  }

  el.libraryContainer.classList.remove('hidden');
  el.libraryEmptyState.classList.add('hidden');
  el.libraryEmptyState.classList.remove('flex');

  skills.forEach((skill) => {
    const card = document.createElement('div');
    const isActive = !!skill.isActive;

    card.className = `glass-card p-5 rounded-2xl flex flex-col justify-between space-y-4 border transition-all duration-200 ${
      isActive ? 'card-active-glow' : 'card-inactive-muted'
    }`;

    // Target Scope badge
    const scopeLabel = skill.targetScope === 'workspace' ? 'Workspace (.agents)' : 'Global (~/.gemini)';
    const scopeBadgeClass = skill.targetScope === 'workspace'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';

    // Subdirs chips
    let subdirsHtml = '';
    if (skill.subfolders && skill.subfolders.length > 0) {
      subdirsHtml = skill.subfolders
        .map((f) => `<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">${escapeHtml(f)}/</span>`)
        .join(' ');
    }

    card.innerHTML = `
      <div class="space-y-3">
        <!-- Card Top Bar: Status switch & scope -->
        <div class="flex items-center justify-between gap-2">
          <!-- Big ON / OFF Toggle Switch -->
          <div class="flex items-center gap-2.5">
            <label class="switch" title="${isActive ? 'Klik untuk mematikan skill (OFF)' : 'Klik untuk mengaktifkan skill (ON)'}">
              <input type="checkbox" class="toggle-library-switch" ${isActive ? 'checked' : ''} />
              <span class="slider"></span>
            </label>
            <div class="leading-tight">
              <span class="text-xs font-bold ${isActive ? 'text-emerald-400' : 'text-slate-400'}">
                ${isActive ? '● AKTIF (ON)' : '○ NONAKTIF (OFF)'}
              </span>
              <p class="text-[10px] text-slate-500">
                ${isActive ? 'AI Agent dapat memuat skill ini' : 'Skill tersimpan di Library'}
              </p>
            </div>
          </div>

          <!-- Scope Badge -->
          <span class="text-[10px] font-mono px-2 py-0.5 rounded-full border ${scopeBadgeClass}">
            ${scopeLabel}
          </span>
        </div>

        <!-- Skill Title & Description -->
        <div class="pt-1">
          <h3 class="font-bold text-sm text-white font-mono tracking-tight leading-snug line-clamp-1 flex items-center gap-1.5" title="${escapeHtml(skill.name)}">
            <i data-lucide="sparkles" class="w-3.5 h-3.5 text-indigo-400"></i>
            <span>${escapeHtml(skill.name)}</span>
          </h3>
          <p class="text-xs text-slate-400 leading-relaxed line-clamp-3 mt-1" title="${escapeHtml(skill.description)}">
            ${escapeHtml(skill.description)}
          </p>
        </div>

        <!-- Subfolders if any -->
        ${subdirsHtml ? `<div class="flex flex-wrap gap-1 pt-1">${subdirsHtml}</div>` : ''}
      </div>

      <!-- Card Actions -->
      <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5">
          <button class="btn-inspect px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 hover:text-white flex items-center gap-1 transition" title="Inspect & Edit SKILL.md">
            <i data-lucide="edit-3" class="w-3.5 h-3.5 text-indigo-400"></i>
            <span>Inspect</span>
          </button>
          <button class="btn-trigger px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-semibold flex items-center gap-1.5 transition" title="Lihat cara trigger dan contoh prompt skill ini">
            <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-400"></i>
            <span>⚡ Cara Trigger</span>
          </button>
        </div>

        <div class="flex items-center gap-1">
          <button class="btn-toggle-btn px-2.5 py-1.5 rounded-lg ${
            isActive ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          } text-xs font-semibold flex items-center gap-1.5 transition">
            <i data-lucide="power" class="w-3.5 h-3.5"></i>
            <span>${isActive ? 'Turn OFF' : 'Turn ON'}</span>
          </button>
          <button class="btn-delete p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition" title="Delete from Library">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;

    // Event listeners
    const switchEl = card.querySelector('.toggle-library-switch');
    switchEl.addEventListener('change', () => handleToggleLibrarySkill(skill));

    card.querySelector('.btn-toggle-btn').addEventListener('click', () => handleToggleLibrarySkill(skill));
    card.querySelector('.btn-inspect').addEventListener('click', () => openSkillDetail({ ...skill, isLibrarySkill: true }));
    card.querySelector('.btn-trigger').addEventListener('click', () => openTriggerGuide({ ...skill, isLibrarySkill: true }));
    card.querySelector('.btn-delete').addEventListener('click', () => promptDeleteSkill({ ...skill, isLibrarySkill: true }));

    el.libraryContainer.appendChild(card);
  });

  lucide.createIcons();
}

// Toggle ON / OFF in Library
async function handleToggleLibrarySkill(skill) {
  try {
    const res = await fetch(`/api/library/${encodeURIComponent(skill.name)}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetScope: skill.targetScope || 'workspace' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to toggle skill');

    const statusText = data.isActive ? 'AKTIF (ON)' : 'NONAKTIF (OFF)';
    const toastType = data.isActive ? 'success' : 'info';
    showToast(`Skill "${skill.name}" sekarang ${statusText}!`, toastType);

    // Refresh both library and explorer
    await refreshAll();

    // If modal open, update modal state
    if (state.selectedSkill && state.selectedSkill.name === skill.name) {
      openSkillDetail({ ...state.selectedSkill, isActive: data.isActive, isLibrarySkill: true });
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================
// 🧭 EXPLORER LOGIC (All Discovered Skills)
// ==========================================

async function fetchExplorerSkills() {
  try {
    const res = await fetch('/api/skills');
    const data = await res.json();
    state.skills = data.skills || [];

    // Stats
    const total = state.skills.length;
    const ws = state.skills.filter((s) => s.scope === 'workspace').length;
    const gl = state.skills.filter((s) => s.scope === 'global').length;
    const pl = state.skills.filter((s) => s.scope === 'plugin').length;
    const bi = state.skills.filter((s) => s.scope === 'builtin').length;

    el.statTotal.textContent = total;
    el.statWorkspace.textContent = ws;
    el.statGlobal.textContent = gl;
    el.statPlugins.textContent = pl;
    el.statBuiltin.textContent = bi;
    el.countAll.textContent = total;
    el.navExplorerCountBadge.textContent = total;

    applyExplorerFilterAndRender();
  } catch (err) {
    console.error('Error fetching explorer skills:', err);
  }
}

function applyExplorerFilterAndRender() {
  let list = [...state.skills];

  if (state.activeFilter === 'workspace') {
    list = list.filter((s) => s.scope === 'workspace');
  } else if (state.activeFilter === 'global') {
    list = list.filter((s) => s.scope === 'global');
  } else if (state.activeFilter === 'plugin') {
    list = list.filter((s) => s.scope === 'plugin');
  } else if (state.activeFilter === 'builtin') {
    list = list.filter((s) => s.scope === 'builtin');
  }

  if (state.searchQuery) {
    list = list.filter((s) => {
      const name = (s.name || '').toLowerCase();
      const desc = (s.description || '').toLowerCase();
      const path = (s.folderPath || '').toLowerCase();
      return name.includes(state.searchQuery) || desc.includes(state.searchQuery) || path.includes(state.searchQuery);
    });
  }

  state.filteredSkills = list;
  renderExplorerGrid(list);
}

function renderExplorerGrid(skills) {
  el.skillsContainer.innerHTML = '';

  if (skills.length === 0) {
    el.skillsContainer.classList.add('hidden');
    el.emptyState.classList.remove('hidden');
    el.emptyState.classList.add('flex');
    lucide.createIcons();
    return;
  }

  el.skillsContainer.classList.remove('hidden');
  el.emptyState.classList.add('hidden');
  el.emptyState.classList.remove('flex');

  // Check which skills are already in Library
  const librarySkillNames = new Set(state.librarySkills.map((s) => s.name));

  skills.forEach((skill) => {
    const card = document.createElement('div');
    card.className = `glass-card p-5 rounded-2xl flex flex-col justify-between space-y-4 border ${
      skill.isDisabled ? 'opacity-60 border-slate-800' : 'border-slate-800/80'
    }`;

    // Scope Badge styling
    let scopeBadge = '';
    let scopeIcon = 'book-open';
    if (skill.scope === 'workspace') {
      scopeBadge = '<span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">workspace</span>';
      scopeIcon = 'folder-code';
    } else if (skill.scope === 'global') {
      scopeBadge = '<span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">global</span>';
      scopeIcon = 'globe';
    } else if (skill.scope === 'plugin') {
      scopeBadge = `<span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">plugin: ${escapeHtml(skill.pluginName || 'pkg')}</span>`;
      scopeIcon = 'package';
    } else if (skill.scope === 'builtin') {
      scopeBadge = '<span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">built-in</span>';
      scopeIcon = 'shield';
    }

    const isInLibrary = librarySkillNames.has(skill.name);

    card.innerHTML = `
      <div class="space-y-3">
        <!-- Card Header -->
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg ${
              skill.scope === 'workspace' ? 'bg-emerald-500/10 text-emerald-400' :
              skill.scope === 'global' ? 'bg-cyan-500/10 text-cyan-400' :
              skill.scope === 'plugin' ? 'bg-purple-500/10 text-purple-400' : 'bg-amber-500/10 text-amber-400'
            } flex items-center justify-center flex-shrink-0">
              <i data-lucide="${scopeIcon}" class="w-4 h-4"></i>
            </div>
            <div>
              <h3 class="font-bold text-sm text-white font-mono tracking-tight leading-snug line-clamp-1" title="${escapeHtml(skill.name)}">
                ${escapeHtml(skill.name)}
              </h3>
              <div class="flex items-center gap-1.5 mt-0.5">
                ${scopeBadge}
                ${
                  isInLibrary
                    ? '<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">In Library</span>'
                    : ''
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Description -->
        <p class="text-xs text-slate-400 leading-relaxed line-clamp-3" title="${escapeHtml(skill.description)}">
          ${escapeHtml(skill.description)}
        </p>
      </div>

      <!-- Card Actions -->
      <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5">
          <button class="btn-inspect px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 hover:text-white flex items-center gap-1 transition" title="Inspect SKILL.md">
            <i data-lucide="eye" class="w-3.5 h-3.5 text-indigo-400"></i>
            <span>Inspect</span>
          </button>
          <button class="btn-trigger px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-semibold flex items-center gap-1.5 transition" title="Lihat cara trigger dan contoh prompt skill ini">
            <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-400"></i>
            <span>⚡ Cara Trigger</span>
          </button>
        </div>

        <div class="flex items-center gap-1">
          ${
            !isInLibrary
              ? `
            <button class="btn-import-lib px-2.5 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 border border-indigo-500/25 text-xs font-medium flex items-center gap-1.5 transition" title="Add to Library">
              <i data-lucide="bookmark-plus" class="w-3.5 h-3.5"></i>
              <span>Add to Library</span>
            </button>
          `
              : `
            <span class="text-[11px] font-mono text-emerald-400 px-2 py-1 flex items-center gap-1">
              <i data-lucide="check" class="w-3.5 h-3.5"></i>
              <span>Saved</span>
            </span>
          `
          }
        </div>
      </div>
    `;

    card.querySelector('.btn-inspect').addEventListener('click', () => openSkillDetail({ ...skill, isLibrarySkill: false }));
    card.querySelector('.btn-trigger').addEventListener('click', () => openTriggerGuide({ ...skill, isLibrarySkill: false }));

    const btnImport = card.querySelector('.btn-import-lib');
    if (btnImport) {
      btnImport.addEventListener('click', () => handleImportToLibrary(skill));
    }

    el.skillsContainer.appendChild(card);
  });

  lucide.createIcons();
}

// Import existing skill into Library
async function handleImportToLibrary(skill) {
  try {
    const res = await fetch('/api/library/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourcePath: skill.folderPath,
        name: skill.name,
        targetScope: skill.scope === 'global' ? 'global' : 'workspace',
        activate: true
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to import skill');

    showToast(`Skill "${skill.name}" berhasil ditambahkan ke Library!`, 'success');
    await refreshAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================
// ✏️ CREATE SKILL (Adds directly to Library!)
// ==========================================

async function handleCreateSkill(e) {
  e.preventDefault();

  const name = el.newSkillName.value.trim();
  const description = el.newSkillDesc.value.trim();
  const targetScope = el.newSkillScope.value;
  const content = el.newSkillContent.value;
  const activate = el.checkActivateNow.checked;

  const subdirs = [];
  if (el.checkScripts.checked) subdirs.push('scripts');
  if (el.checkReferences.checked) subdirs.push('references');
  if (el.checkExamples.checked) subdirs.push('examples');

  if (!name) {
    showToast('Please enter a skill name', 'error');
    return;
  }
  if (!description) {
    showToast('Please provide a description (required by Antigravity)', 'error');
    return;
  }

  try {
    const res = await fetch('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, content, targetScope, activate, subdirs })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create skill');

    closeAllModals();
    el.addSkillForm.reset();
    showToast(`Skill "${name}" berhasil dibuat dan disimpan di Library!`, 'success');

    // Switch to library view if not already there
    switchMainView('library');
    await refreshAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================
// ⚡ TRIGGER GUIDE KNOWLEDGE BASE & MODAL
// ==========================================

const TRIGGER_KNOWLEDGE = {
  'drawn-by-code': {
    title: 'drawn-by-code: Code-Driven Canvas Animation Engine (20 Styles)',
    keywords: ['drawn-by-code', 'animate', 'code animation', 'canvas animation', 'animasi kode', 'motion graphics code', 'paper-cutout', 'claymation', 'risograph', 'pixel art animation', 'kinetic typography'],
    subskills: [
      'Orchestrator & Shot Scripting (skills/animate)',
      'Deterministic Frame-by-Frame Engine (Motion.scene)',
      '20 Artistic Style Kits (paper, clay, riso, pixel, etc.)',
      'Hand Rigs & Anatomy Kinetics (skills/hands)',
      'Audio & Musical Grid Alignment (skills/sound)',
      'Procedural Transitions & Effects (skills/transitions)',
      'Automated Cadence & Motion Review (engine/review.mjs)'
    ],
    tips: 'Sebutkan "drawn-by-code", "animate", atau minta animasi berbasis kode Canvas / WebGL (misal gaya paper-cutout, clay, risograph, blueprint). Agen akan merancang brief, menyusun script frame-by-frame murni JavaScript, dan merendernya via engine.',
    prompts: [
      'Gunakan drawn-by-code dengan gaya paper-cutout untuk membuat animasi logo reveal berdurasi 5 detik',
      'Buatkan scene animasi Motion.scene dengan style clay3d untuk promo produk berdurasi 6 detik (120 BPM cut)',
      'Inisialisasi proyek animasi baru dengan drawn-by-code: node engine/new.mjs promo --style risograph --duration 8'
    ]
  },
  'rea-video': {
    title: 'rea-video: Reverse-Engineer Any Video Shot-by-Shot',
    keywords: ['rea-video', 'reverse engineer video', 'bongkar video', 'bedah video', 'cara bikin video ini', 'video breakdown', 'video.md', 'ai video or filmed', 'shot by shot', 'remake video', 'deconstruct video'],
    subskills: [
      'Shot-by-Shot Decomposition (11 Media Categories)',
      'AI vs Real Footage / CGI / 3D Classification',
      'Video Packaging & Subtitle Timeline (SRT/ASS)',
      'Audio Stems & Sound Effect Timing (BGM / SFX)',
      'Camera Framing, Lighting & Color Grade Analysis',
      'Actionable Remake Plan & VIDEO.md Report Generator'
    ],
    tips: 'Gunakan kata kunci "rea-video", "bedah video", atau "bongkar video" saat memberikan referensi video untuk menganalisis setiap shot (apakah syuting asli, AI generated, 3D, atau animasi), mendeteksi editing pack, dan membuat rencana pembuatan ulang (remake blueprint).',
    prompts: [
      'Gunakan rea-video untuk membongkar video referensi ini secara shot-by-shot: apakah ini AI atau syuting asli, dan bagaimana cara me-remake-nya?',
      'Bedah video sample.mp4 dengan rea-video: ekstrak breakdown timeline, analisis pencahayaan kamera, dan hasilkan laporan VIDEO.md',
      'Jalankan rea-video decompose pada video iklan ini untuk mengidentifikasi BGM, sound effect timing, dan prompt AI yang digunakan'
    ]
  },
  'jianying-editor-skill': {
    title: 'JianYing Pro / CapCut AI Automation Skill',
    keywords: ['jianying', 'jianying-editor', 'jianying-editor-skill', 'capcut', 'edit video', 'video automation', 'potong video', 'tambah subtitle', 'draft inspector', 'animasi video', 'tts video', 'bgm video'],
    subskills: [
      'Draft Inspector CLI (draft_inspector.py)',
      'Media Asset Importer & Sync',
      'Auto Exposure & Color Align',
      'TTS & Auto Subtitle Generator',
      'Transitions & Scene Effects',
      'Cloud Music & Sound Effects',
      'Compound Clip & Project Export'
    ],
    tips: 'Gunakan kata kunci "jianying", "capcut", atau "edit video" untuk mengotomasi alur kerja editing JianYing Pro / CapCut Desktop langsung dari AI agent.',
    prompts: [
      'Gunakan jianying-editor-skill untuk memeriksa draft video di JianYing / CapCut: jalankan draft_inspector.py list',
      'Otomatisasi pengeditan video dengan jianying-editor-skill: impor klip video, tambahkan subtitle otomatis, dan sinkronkan musik latar',
      'Tambahkan efek transisi dan animasi teks pada draft proyek CapCut / JianYing menggunakan jianying-editor-skill'
    ]
  },
  'day-trader-skill': {
    title: 'The Day Trader Skill Suite (11 Claude Skills)',
    keywords: ['day trader', 'day-trader-skill', 'trader-scanner', 'trader-news', 'trader-entry', 'trader-exit', 'trader-timemachine', 'trader-pelosi', 'trader-risk', 'trader-budget', 'scan setups', 'stock breakout', 'opening range breakout'],
    subskills: [
      'Chart Scanner (trader-scanner)',
      'News Monitor & SEC 8-K (trader-news)',
      'Entry Timing (trader-entry)',
      'Exit Planner & Targets (trader-exit)',
      'Time Machine 10,000x Replay (trader-timemachine)',
      'Capitol Hill / Pelosi Tracker (trader-pelosi)',
      'Risk Manager Limits (trader-risk)',
      'Position Budget Sizing (trader-budget)',
      'Price Alerts (trader-alerts)',
      'EDGAR Financial Analyst (trader-analyst)',
      'Paper Broker Ticket (trader-broker)'
    ],
    tips: 'Sebutkan "day-trader-skill", "scan setups", "trader-entry", atau "trader-timemachine" untuk menjalankan analisis chart saham, kalkulasi odds Monte Carlo, atau monitoring berita pasar.',
    prompts: [
      'Gunakan day-trader-skill untuk memindai setup chart saham AS hari ini (opening range breakouts & bull flags)',
      'Jalankan trader-timemachine pada ticker TSLA untuk replay simulasi probabilitas 10.000 sesi sebelum entry',
      'Cek berita terbaru dan filing SEC untuk saham NVDA dengan trader-news, lalu rencanakan entry & exit-nya',
      'Hitung position sizing dan budget risk untuk modal $10,000 dengan toleransi risiko 1% per trade menggunakan trader-budget'
    ]
  },
  'security-audit': {
    title: 'Cloudflare Multi-Phase Security Audit',
    keywords: ['security audit', 'security-audit', 'vulnerability review', 'pen test', 'pentest', 'audit security', 'threat model', 'trust boundary', 'cve'],
    subskills: ['Reconnaissance & Surface Mapping', 'Attack Classes & Exploit Analysis', 'Web Protocol & Auth Audit', 'AI & LLM Security', 'Memory Safety & Binary', 'Validated Findings & Coverage Ledger'],
    tips: 'Sebutkan "security audit", "audit keamanan", atau "vulnerability review" untuk menjalankan audit keamanan multi-fase Cloudflare dengan verifikasi independen dan machine-readable findings.',
    prompts: [
      'Jalankan security audit menyeluruh untuk codebase ini dan buatkan coverage ledger serta laporan temuan kerentanan',
      'Tolong lakukan vulnerability review pada modul authentication dan API routes kita menggunakan security-audit',
      'Audit endpoint ini untuk potensi celah broken access control, injection, dan SSRF'
    ]
  },
  'superpowers': {
    title: 'Superpowers Agentic Framework',
    keywords: ['superpowers', 'brainstorming', 'tdd', 'test-driven development', 'systematic debugging', 'code review', 'verification', 'subagent dispatch'],
    subskills: ['TDD (Test-Driven Development)', 'Systematic Debugging', 'Brainstorming & Planning', 'Subagent Dispatching', 'Verification Checklist'],
    tips: 'Sebutkan "superpowers", "tdd", "systematic debugging", atau "code review" dalam instruksi chat Anda. Agen akan otomatis mengadopsi framework disiplin rekayasa perangkat lunak ini.',
    prompts: [
      'Gunakan framework superpowers untuk melakukan brainstorming fitur auth multi-tenant',
      'Tolong selesaikan bug login ini dengan systematic debugging dan buatkan unit test TDD dulu sebelum edit code',
      'Lakukan code review dan verifikasi menyeluruh untuk semua perubahan di branch ini'
    ]
  },
  'caveman': {
    title: 'Caveman Ultra-Lean Coding',
    keywords: ['caveman', 'ultra-lean', 'token-efficient', 'concise', 'no pleasantries', 'direct code', 'surgical patch'],
    subskills: ['Token-Saving Mode', 'Zero Pleasantries/Fluff', 'Surgical Code Patches', 'Instant Bugfixes'],
    tips: 'Ketik "mode caveman" atau "caveman style" ketika Anda menginginkan jawaban AI super cepat, padat, hemat token, dan langsung ke inti kode tanpa basa-basi.',
    prompts: [
      'Mode caveman: buatkan express middleware authentication JWT singkat tanpa penjelasan panjang',
      'Caveman: tolong perbaiki error TypeError di baris 45 server.js secara langsung',
      'Jelaskan kenapa regex ini gagal, mode caveman, ringkas saja'
    ]
  },
  'avoid-ai-design': {
    title: 'Avoid AI Design (Anti-Slop UI)',
    keywords: ['avoid-ai-design', 'de-slop', 'ai slop', 'purple gradient', 'generic ai', 'design audit', 'scanner'],
    subskills: ['Detect AI Design Tells', 'Remove Purple Gradients & Inter', 'Zero-Dependency Scanner', 'Clean Human Typography'],
    tips: 'Gunakan kata kunci "de-slop", "avoid-ai-design", atau "generic AI design" untuk merevisi tampilan agar terlihat profesional dan dibuat desainer manusia.',
    prompts: [
      'Audit dan de-slop halaman index.html ini agar tidak terlihat seperti buatan AI generik',
      'Tolong perbaiki styling dashboard ini dengan menghindari AI design tropes (jangan pakai purple gradient & centered 3 cards)',
      'Jalankan scanner avoid-ai-design untuk mendeteksi AI design tells pada komponen frontend ini'
    ]
  },
  'no-slop-ui': {
    title: 'No-Slop UI Design Rules',
    keywords: ['no-slop-ui', 'clean ui', 'anti-glassmorphism', 'restrained ui', 'gradient moderation', 'human design'],
    subskills: ['Anti-Glassmorphism', 'Gradient Abuse Prevention', 'Restrained & Clean UI', 'Authentic Visuals'],
    tips: 'Gunakan kata kunci "no-slop-ui" saat meminta agen mendesain antarmuka yang bersih, elegan, dan menolak tren AI murahan.',
    prompts: [
      'Desain ulang halaman login ini mengikuti panduan no-slop-ui: bersih, minimalis, dan tanpa glassmorphism berlebihan',
      'Buatkan komponen pricing table yang restrained, rapi, dan profesional ala no-slop-ui',
      'Review antarmuka saat ini dan bersihkan semua efek visual norak berdasarkan aturan no-slop-ui'
    ]
  },
  'taste-skill': {
    title: 'Taste Skill (Premium Frontend)',
    keywords: ['taste-skill', 'taste', 'premium frontend', 'luxury ui', 'micro-interactions', 'redesign audit', 'visual polish'],
    subskills: ['Tasteful Aesthetics', 'Micro-interactions & Physics', 'Modern Color Harmony', 'Design Review Audit'],
    tips: 'Sebutkan "taste-skill" atau "premium UI" untuk memoles antarmuka web ke standar kelas dunia dengan detail visual yang kaya.',
    prompts: [
      'Audit tampilan aplikasi ini dengan taste-skill dan rekomendasikan peningkatan estetika premium',
      'Redesign tombol dan navigation bar ini agar terasa premium dengan micro-interaction yang halus',
      'Poles interaksi hover, transisi kartu, dan typography agar memiliki high taste standard'
    ]
  },
  'anti-slop': {
    title: 'Anti Slop Code & Comments Cleaner',
    keywords: ['anti-slop', 'clean comments', 'strip ai comments', 'clean code', 'authentic code', 'remove boilerplate'],
    subskills: ['Strip AI Explanatory Comments', 'Clean Code Guidelines', 'Authentic Engineering Tone'],
    tips: 'Ketik "anti-slop" saat Anda ingin membersihkan file kode dari komentar-komentar AI yang terlalu bertele-tele dan tidak perlu.',
    prompts: [
      'Bersihkan file server.js ini dari komentar-komentar gaya AI yang redundant menggunakan anti-slop',
      'Refactor kode ini dengan anti-slop rules agar lebih bersih, padat, dan straight to the point',
      'Audit seluruh folder controllers/ dan hapus AI code bloat'
    ]
  },
  'netxeo-design-skill': {
    title: 'Netxeo 100+ Anti-AI Design Laws',
    keywords: ['netxeo', 'design laws', '100+ design laws', 'layout hierarchy', 'ui principles', 'spatial grid'],
    subskills: ['100+ Design Laws', 'Visual Hierarchy Enforcement', 'Spatial Spacing Grid', 'Color Contrast Guard'],
    tips: 'Gunakan istilah "netxeo" atau "design laws" untuk menerapkan aturan desain yang ketat dan presisi.',
    prompts: [
      'Evaluasi tata letak halaman ini berdasarkan aturan netxeo-design-skill',
      'Terapkan prinsip visual hierarchy dari netxeo design skill pada checkout page ini',
      'Perbaiki kontras warna dan ritme spasi form input menggunakan 100+ design laws'
    ]
  },
  'design-guide': {
    title: 'Design Guide Orchestrator',
    keywords: ['design-guide', 'design direction', 'lock contract', 'orchestrator', 'accessible', 'responsive ui'],
    subskills: ['Design Inventory', 'Executable Contract Locking', 'Accessibility & Contrast QA', 'Responsive Layout System'],
    tips: 'Ketik "/design-guide" atau "design-guide" saat memulai fitur frontend baru agar AI memandu arah desain sebelum mulai coding.',
    prompts: [
      'Gunakan design-guide untuk merancang arsitektur komponen frontend dashboard kita',
      'Lock design contract untuk form pendaftaran user dan verifikasi aksesibilitasnya',
      'Pandu saya menentukan arah desain (design direction) untuk landing page aplikasi ini'
    ]
  },
  'web-design-skills': {
    title: 'Web Design Skills (Claude Code)',
    keywords: ['web-design-skills', 'responsive layouts', 'DESIGN.md', 'css grid', 'fluid typography', 'frontend design'],
    subskills: ['Fluid Responsive Grid', 'DESIGN.md Documentation', 'Mobile Breakpoint Best Practices'],
    tips: 'Gunakan skill ini untuk membuat layout web modern atau menyusun dokumen DESIGN.md standar proyek.',
    prompts: [
      'Buat rancangan layout responsif untuk halaman profil user dengan web-design-skills',
      'Buat dokumentasi DESIGN.md untuk panduan styling dan token warna project ini',
      'Perbaiki breakpoint responsive tablet dan mobile pada navbar ini'
    ]
  },
  'huashu-design': {
    title: 'Huashu Design (花叔Design)',
    keywords: ['huashu-design', 'prototype', 'slides', 'motion', 'mp4 export', 'ui mockup', 'animasi', 'bikin ppt'],
    subskills: ['3 Arah Konsep Desain High-Fidelity', 'Interactive HTML Slides', 'Motion & Keyframe Animations', 'MP4 / GIF Export'],
    tips: 'Pemicu: sebutkan "huashu-design", "buat prototype", "buat slide PPT", atau "buat animasi UI". Agen akan selalu memberikan 3 opsi arah desain.',
    prompts: [
      'Gunakan huashu-design untuk membuatkan 3 arah konsep mockup UI untuk produk baru kita',
      'Buatkan slide presentasi HTML interaktif tentang arsitektur sistem ini dengan animasi transisi halus',
      'Buat prototype animasi onboarding user dengan opsi export video MP4'
    ]
  },
  'mattpocock-skills': {
    title: 'Matt Pocock TypeScript & Dev Productivity',
    keywords: ['mattpocock', 'typescript', 'ts wizard', 'type safety', 'generics', 'type inference', 'productivity'],
    subskills: ['Advanced TypeScript Patterns', 'Type-Safe API Contracts', 'Generics & Conditional Types', 'TS Performance Tuning'],
    tips: 'Sebutkan "Matt Pocock" atau "advanced TypeScript" untuk menulis type TypeScript tingkat tinggi yang kokoh dan inferensial.',
    prompts: [
      'Bantu refactor types TypeScript ini ala Matt Pocock agar type-safe dan inferensinya presisi',
      'Gunakan trik TypeScript Matt Pocock untuk membuat generic builder pattern ini tanpa casting "as any"',
      'Optimasi compiler performance dan struktur type declaration d.ts di proyek ini'
    ]
  },
  'karpathy-skills': {
    title: 'Karpathy Operational & Coding Heuristics',
    keywords: ['karpathy', 'andrej karpathy', 'from scratch', 'first principles', 'deep learning intuition', 'micrograd style', 'clean ai'],
    subskills: ['First-Principles Implementations', 'Zero-Dependency Code', 'Intuitive Mental Models', 'Careful Empirical Debugging'],
    tips: 'Ketik "ala Karpathy" atau "first principles" untuk menyelesaikan masalah AI/ML atau coding dengan pendekatan mendasar tanpa boilerplate.',
    prompts: [
      'Implementasikan autograd neural network sederhana dari first principles ala Karpathy (tanpa PyTorch)',
      'Tinjau algoritma ini dengan mental model Andrej Karpathy: buat lebih sederhana, jernih, dan mudah dipahami',
      'Tuliskan script tokenization teks dari scratch dengan pendekatan micrograd-style'
    ]
  },
  'anthropic-skills': {
    title: 'Official Anthropic Claude Skills Library',
    keywords: ['anthropic-skills', 'mcp builder', 'canvas design', 'docx', 'pdf', 'pptx', 'xlsx', 'web artifacts builder'],
    subskills: ['MCP Server Builder', 'Canvas UI Design', 'Document Generation (DOCX, PDF, PPTX, XLSX)', 'Web Artifacts Creator'],
    tips: 'Gunakan saat ingin membuat dokumen Word/PDF/PPT/Excel secara terprogram atau membangun Custom MCP Server.',
    prompts: [
      'Gunakan anthropic-skills untuk membuat dokumen PDF laporan performa sistem yang rapi dan profesional',
      'Buatkan file spreadsheet XLSX dengan formula sum, margin kalkulasi, dan chart visual',
      'Rancang custom MCP server untuk menghubungkan database SQLite lokal ke agen AI'
    ]
  },
  'ponytail': {
    title: 'Ponytail Technical Debt Governance',
    keywords: ['ponytail', 'technical debt', 'code quality', 'debt governance', 'refactoring gains', 'architecture audit'],
    subskills: ['Technical Debt Audit Matrix', 'Quantified Refactoring Gains', 'Architecture Governance & Risk Score'],
    tips: 'Gunakan kata kunci "ponytail" untuk mengaudit kesehatan kode, mengukur hutang teknis, dan memprioritaskan refactoring bernilai tinggi.',
    prompts: [
      'Audit technical debt di folder src/ dengan skill ponytail dan hitung potensi refactor',
      'Buatkan strategi pengurangan technical debt bertahap untuk codebase ini',
      'Evaluasi kompleksitas siklomatis modul auth dan berikan rekomendasi refactoring'
    ]
  },
  'ui-ux-pro-max-skill': {
    title: 'UI/UX Pro Max Elite Design Intelligence',
    keywords: ['ui-ux-pro-max', 'design system', 'typography hierarchy', 'aesthetic polish', 'interaction patterns', 'elite ux'],
    subskills: ['World-Class Design Systems', 'Harmonic Typography Hierarchy', 'Complex Dashboard UX', 'Responsive State Patterns'],
    tips: 'Gunakan frasa "ui-ux-pro-max" untuk meminta AI merancang komponen antarmuka berkualitas profesional level industri.',
    prompts: [
      'Tingkatkan kualitas UI/UX dashboard ini menjadi level pro max dengan visual polish kelas dunia',
      'Rancang interaction pattern dan user flow untuk wizard checkout multi-step',
      'Buatkan skala hierarki tipografi dan palet warna harmonis untuk brand fintech kita'
    ]
  },
  'graphify': {
    title: 'Graphify Codebase Knowledge Graph',
    keywords: ['graphify', 'knowledge graph', 'dependency graph', 'architecture mapping', 'module interactions', 'code graph'],
    subskills: ['Dependency Extraction', 'Code Interaction Graphs', 'Architecture Topology Mapping'],
    tips: 'Ketik "graphify" untuk memetakan hubungan antar file, import, dependency, dan modul dalam proyek besar.',
    prompts: [
      'Petakan relasi dependency antar modul di project ini menggunakan graphify',
      'Buatkan visualisasi knowledge graph dari struktur database dan API routes kita',
      'Analisis keterkaitan circular dependency antar komponen di folder src/'
    ]
  },
  'addyosmani-agent-skills': {
    title: 'Addy Osmani Battle-Tested Engineering Skills',
    keywords: ['addyosmani', 'addy osmani', 'browser testing', 'devtools', 'api design', 'performance optimization', 'adr'],
    subskills: ['Web Performance (Core Web Vitals)', 'Chrome DevTools Automation', 'Architecture Decision Records (ADR)', 'API Design & Resilience'],
    tips: 'Sebutkan "Addy Osmani", "performance optimization", atau "ADR" untuk menerapkan standar software engineering Google Chrome team.',
    prompts: [
      'Optimasi web performance Core Web Vitals untuk landing page ini dengan petunjuk Addy Osmani',
      'Buatkan Architecture Decision Record (ADR) untuk keputusan memilih SQLite vs PostgreSQL',
      'Bantu review rancangan REST API ini mengikuti standar Addy Osmani untuk developer ergonomics'
    ]
  }
};

function getTriggerInfoForSkill(skill) {
  const key = (skill.name || '').toLowerCase();
  if (TRIGGER_KNOWLEDGE[key]) {
    return TRIGGER_KNOWLEDGE[key];
  }

  // Dynamic Generator for Built-in, Plugin, or Custom Skills:
  const name = skill.name || 'custom-skill';
  const desc = skill.description || '';

  const words = [];
  name.split(/[-_]/).forEach((w) => {
    if (w.length > 2 && !words.includes(w)) words.push(w);
  });

  const descWords = desc.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/);
  descWords.forEach((w) => {
    const lw = w.toLowerCase();
    if (lw.length > 3 && !['this', 'when', 'with', 'that', 'from', 'user', 'will', 'your', 'have', 'also'].includes(lw)) {
      if (!words.includes(lw) && words.length < 8) words.push(lw);
    }
  });

  return {
    title: `${capitalize(name.replace(/-/g, ' '))} Skill`,
    keywords: words.length > 0 ? words : [name, 'helper', 'automation'],
    subskills: skill.subfolders && skill.subfolders.length > 0 ? skill.subfolders.map((s) => `${s}/`) : null,
    tips: `Skill ini dipicu secara otomatis oleh Antigravity ketika prompt Anda memuat kata kunci atau topik yang relevan dengan deskripsinya.`,
    prompts: [
      `Tolong gunakan panduan ${name} untuk menganalisis dan menyelesaikan tugas ini`,
      `Jalankan alur kerja sesuai instruksi skill ${name} pada file proyek terkait`,
      `Bantu selesaikan task ini dengan menerapkan aturan dari skill ${name}`
    ]
  };
}

function openTriggerGuide(skill) {
  const trigger = getTriggerInfoForSkill(skill);
  const isActive = skill.isLibrarySkill ? skill.isActive : !skill.isDisabled;

  el.triggerModalSkillName.textContent = skill.name;

  // Status badge
  if (isActive) {
    el.triggerModalStatusBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    el.triggerModalStatusBadge.textContent = 'ACTIVE (ON)';
    el.triggerModalStatusInline.className = 'text-emerald-400 font-semibold';
    el.triggerModalStatusInline.textContent = 'ON (Aktif)';
  } else {
    el.triggerModalStatusBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700';
    el.triggerModalStatusBadge.textContent = 'INACTIVE (OFF)';
    el.triggerModalStatusInline.className = 'text-slate-400 font-semibold';
    el.triggerModalStatusInline.textContent = 'OFF (Nonaktif - Aktifkan dulu di Library)';
  }

  // Description
  el.triggerModalDesc.textContent = skill.description || 'Tidak ada deskripsi.';

  // Keywords
  el.triggerModalKeywords.innerHTML = trigger.keywords
    .map(
      (kw) =>
        `<span class="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-mono font-medium flex items-center gap-1"><span class="text-cyan-500">#</span>${escapeHtml(
          kw
        )}</span>`
    )
    .join('');

  // Subskills
  if (trigger.subskills && trigger.subskills.length > 0) {
    el.triggerModalSubskillsContainer.classList.remove('hidden');
    el.triggerModalSubskills.innerHTML = trigger.subskills
      .map(
        (sub) =>
          `<span class="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-medium flex items-center gap-1.5"><i data-lucide="check" class="w-3 h-3 text-purple-400"></i>${escapeHtml(
            sub
          )}</span>`
      )
      .join('');
  } else {
    el.triggerModalSubskillsContainer.classList.add('hidden');
  }

  // Prompts
  el.triggerModalPrompts.innerHTML = trigger.prompts
    .map(
      (p, idx) => `
      <div class="group p-3 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-amber-500/30 transition flex items-start justify-between gap-3">
        <div class="flex items-start gap-2.5">
          <span class="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
            ${idx + 1}
          </span>
          <p class="text-xs text-slate-200 font-mono leading-relaxed select-all">${escapeHtml(p)}</p>
        </div>
        <button class="btn-copy-prompt flex-shrink-0 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-500/30 text-slate-300 hover:text-amber-300 text-xs font-medium flex items-center gap-1.5 transition" data-prompt="${escapeHtml(
          p
        )}">
          <i data-lucide="copy" class="w-3.5 h-3.5"></i>
          <span>Salin</span>
        </button>
      </div>
    `
    )
    .join('');

  // Attach copy listeners
  el.triggerModalPrompts.querySelectorAll('.btn-copy-prompt').forEach((btn) => {
    btn.addEventListener('click', () => {
      const promptText = btn.getAttribute('data-prompt');
      copyTextToClipboard(promptText).then(() => {
        const origHtml = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i><span class="text-emerald-400">Tersalin!</span>`;
        lucide.createIcons();
        showToast('Prompt disalin ke clipboard! Siap di-paste ke chat Antigravity.', 'success');
        setTimeout(() => {
          btn.innerHTML = origHtml;
          lucide.createIcons();
        }, 2000);
      });
    });
  });

  openModal(el.triggerGuideModal);
  lucide.createIcons();
}

function copyTextToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

// ==========================================
// 🔍 DETAIL & EDIT MODAL
// ==========================================

async function openSkillDetail(skill) {
  state.selectedSkill = skill;

  // Header info
  el.detailSkillName.textContent = skill.name;
  el.detailPath.textContent = skill.folderPath;
  el.detailPath.title = skill.folderPath;
  el.detailScopeBadge.textContent = skill.isLibrarySkill ? 'library' : skill.scope;

  const isActive = skill.isLibrarySkill ? skill.isActive : !skill.isDisabled;

  if (isActive) {
    el.detailStatusBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    el.detailStatusBadge.textContent = 'ACTIVE (ON)';
    el.btnToggleLabel.textContent = 'Turn OFF';
  } else {
    el.detailStatusBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700';
    el.detailStatusBadge.textContent = 'INACTIVE (OFF)';
    el.btnToggleLabel.textContent = 'Turn ON';
  }

  // Preview tab
  el.previewDescription.textContent = skill.description || '(No description provided)';
  el.previewMarkdownBody.innerHTML = marked.parse(skill.content || '*No content available*');

  // Editor tab
  el.editSkillDesc.value = skill.description || '';
  el.editSkillContent.value = skill.content || '';

  if (skill.readOnly) {
    el.readOnlyWarning.classList.remove('hidden');
    el.btnSaveSkill.classList.add('hidden');
    el.btnToggleFromDetail.classList.add('hidden');
    el.btnDeleteFromDetail.classList.add('hidden');
    el.editSkillDesc.disabled = true;
    el.editSkillContent.disabled = true;
  } else {
    el.readOnlyWarning.classList.add('hidden');
    el.btnSaveSkill.classList.remove('hidden');
    el.btnToggleFromDetail.classList.remove('hidden');
    el.btnDeleteFromDetail.classList.remove('hidden');
    el.editSkillDesc.disabled = false;
    el.editSkillContent.disabled = false;
  }

  // Fetch full details and file tree
  try {
    const scopeParam = skill.isLibrarySkill ? 'library' : skill.scope;
    let url = `/api/skills/${scopeParam}/${encodeURIComponent(skill.folderName || skill.name)}`;
    if (skill.pluginName) url += `?plugin=${encodeURIComponent(skill.pluginName)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.tree) {
      renderFilesTree(data.tree);
    }
  } catch (e) {
    console.error('Error fetching tree:', e);
  }

  switchDetailTab('preview');
  openModal(el.viewSkillModal);
  lucide.createIcons();
}

function switchDetailTab(tab) {
  const tabs = ['preview', 'editor', 'files'];
  tabs.forEach((t) => {
    const btn = el[`tabBtn${capitalize(t)}`];
    const content = el[`tabContent${capitalize(t)}`];
    if (t === tab) {
      btn.className = 'py-2.5 border-b-2 border-indigo-500 text-indigo-400 transition flex items-center gap-1.5';
      content.classList.remove('hidden');
    } else {
      btn.className = 'py-2.5 border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5';
      content.classList.add('hidden');
    }
  });
  lucide.createIcons();
}

function renderFilesTree(tree) {
  let fileCount = 0;
  function buildTreeHtml(nodes, depth = 0) {
    return nodes
      .map((node) => {
        const indent = depth * 16;
        if (node.type === 'dir') {
          return `
            <div class="space-y-1">
              <div class="flex items-center gap-2 py-0.5 text-slate-300" style="padding-left: ${indent}px">
                <i data-lucide="folder" class="w-3.5 h-3.5 text-indigo-400"></i>
                <span class="font-semibold">${escapeHtml(node.name)}/</span>
              </div>
              ${node.children ? buildTreeHtml(node.children, depth + 1) : ''}
            </div>
          `;
        } else {
          fileCount++;
          return `
            <div class="flex items-center justify-between py-0.5 hover:bg-slate-900 px-2 rounded" style="padding-left: ${indent + 8}px">
              <div class="flex items-center gap-2 text-slate-400">
                <i data-lucide="file-text" class="w-3.5 h-3.5 text-slate-500"></i>
                <span class="${node.name === 'SKILL.md' ? 'text-indigo-300 font-semibold' : ''}">${escapeHtml(node.name)}</span>
              </div>
              <span class="text-[10px] text-slate-600">${formatBytes(node.size || 0)}</span>
            </div>
          `;
        }
      })
      .join('');
  }

  el.filesTreeContainer.innerHTML = buildTreeHtml(tree);
  el.detailFileCount.textContent = fileCount;
  lucide.createIcons();
}

// Save Skill from Detail Editor
async function handleSaveSkill() {
  if (!state.selectedSkill) return;

  const skill = state.selectedSkill;
  const description = el.editSkillDesc.value.trim();
  const content = el.editSkillContent.value;

  try {
    let url = '';
    if (skill.isLibrarySkill) {
      url = `/api/library/${encodeURIComponent(skill.name)}`;
    } else {
      url = `/api/skills/${skill.scope}/${encodeURIComponent(skill.folderName || skill.name)}`;
      if (skill.pluginName) url += `?plugin=${encodeURIComponent(skill.pluginName)}`;
    }

    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, content })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update skill');

    showToast(`Skill "${skill.name}" updated!`, 'success');
    state.selectedSkill.description = description;
    state.selectedSkill.content = content;
    el.previewDescription.textContent = description;
    el.previewMarkdownBody.innerHTML = marked.parse(content);
    switchDetailTab('preview');
    await refreshAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Toggle Non-Library Skill (for Explorer)
async function handleToggleExplorerSkill(skill) {
  try {
    let url = `/api/skills/${skill.scope}/${encodeURIComponent(skill.folderName)}/toggle`;
    const res = await fetch(url, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to toggle');

    const statusStr = data.isDisabled ? 'disabled' : 'enabled';
    showToast(`Skill "${skill.name}" is now ${statusStr}`, 'info');
    closeAllModals();
    await refreshAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Delete Prompt & Handler
function promptDeleteSkill(skill) {
  state.skillToDelete = skill;
  el.deleteSkillNameSpan.textContent = skill.name;
  openModal(el.deleteModal);
}

async function handleConfirmDelete() {
  if (!state.skillToDelete) return;

  const skill = state.skillToDelete;
  try {
    let url = '';
    if (skill.isLibrarySkill) {
      url = `/api/library/${encodeURIComponent(skill.name)}`;
    } else {
      url = `/api/skills/${skill.scope}/${encodeURIComponent(skill.folderName || skill.name)}`;
      if (skill.pluginName) url += `?plugin=${encodeURIComponent(skill.pluginName)}`;
    }

    const res = await fetch(url, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete');

    closeAllModals();
    showToast(`Skill "${skill.name}" deleted successfully`, 'success');
    await refreshAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Switch Workspace Handler
async function handleSaveWorkspace() {
  const newPath = el.inputWorkspacePath.value.trim();
  if (!newPath) return;

  try {
    const res = await fetch('/api/config/workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspacePath: newPath })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update workspace');

    closeAllModals();
    showToast('Active workspace updated', 'success');
    await fetchConfig();
    await refreshAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Helpers
function openModal(modal) {
  modal.classList.remove('hidden');
}

function closeModal(modal) {
  modal.classList.add('hidden');
}

function closeAllModals() {
  [el.addSkillModal, el.viewSkillModal, el.workspaceModal, el.deleteModal, el.triggerGuideModal].forEach(closeModal);
}

function isModalOpen() {
  return [el.addSkillModal, el.viewSkillModal, el.workspaceModal, el.deleteModal, el.triggerGuideModal].some(
    (m) => m && !m.classList.contains('hidden')
  );
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  const bg =
    type === 'success' ? 'bg-emerald-600 text-white' :
    type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-100 border border-slate-700';

  toast.className = `${bg} px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto`;
  toast.innerHTML = `
    <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info'}" class="w-4 h-4"></i>
    <span>${escapeHtml(message)}</span>
  `;

  el.toastContainer.appendChild(toast);
  lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
