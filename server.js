const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const matter = require('gray-matter');
const { exec } = require('child_process');
const AdmZip = require('adm-zip');

const app = express();
const PORT = process.env.PORT || 3456;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Paths
const HOME_DIR = os.homedir();
const GLOBAL_CONFIG_DIR = path.join(HOME_DIR, '.gemini', 'config');
const GLOBAL_SKILLS_DIR = path.join(GLOBAL_CONFIG_DIR, 'skills');
const PLUGINS_DIR = path.join(GLOBAL_CONFIG_DIR, 'plugins');
const BUILTIN_SKILLS_DIR = path.join(HOME_DIR, '.gemini', 'antigravity', 'builtin', 'skills');
const LIBRARY_DIR = path.join(GLOBAL_CONFIG_DIR, 'library', 'skills');
const LIBRARY_META_FILE = path.join(GLOBAL_CONFIG_DIR, 'library', 'library.json');

// In-memory or persisted configuration
let currentWorkspacePath = process.cwd();

// Helper to ensure directory exists
async function ensureDir(dirPath) {
  try {
    await fs.ensureDir(dirPath);
  } catch (err) {
    console.warn(`Could not ensure dir ${dirPath}:`, err.message);
  }
}

// Library Metadata Helpers
async function getLibraryMeta() {
  await ensureDir(path.dirname(LIBRARY_META_FILE));
  if (await fs.pathExists(LIBRARY_META_FILE)) {
    try {
      return await fs.readJson(LIBRARY_META_FILE);
    } catch (e) {
      return {};
    }
  }
  return {};
}

async function saveLibraryMeta(meta) {
  await ensureDir(path.dirname(LIBRARY_META_FILE));
  await fs.writeJson(LIBRARY_META_FILE, meta, { spaces: 2 });
}

// Check if a library skill is currently deployed/active in workspace or global
async function checkSkillActiveStatus(skillName, targetScope = 'workspace') {
  if (targetScope === 'workspace') {
    const ws1 = path.join(currentWorkspacePath, '.agents', 'skills', skillName);
    const ws2 = path.join(currentWorkspacePath, '.agent', 'skills', skillName);
    const exists1 = await fs.pathExists(ws1);
    const exists2 = await fs.pathExists(ws2);
    return exists1 || exists2;
  } else if (targetScope === 'global') {
    const glob = path.join(GLOBAL_SKILLS_DIR, skillName);
    return await fs.pathExists(glob);
  }
  return false;
}

// Read and parse a single skill folder
async function parseSkillFolder(folderPath, scope, extraMeta = {}) {
  try {
    const isDir = (await fs.stat(folderPath)).isDirectory();
    if (!isDir) return null;

    const folderName = path.basename(folderPath);
    const isDisabled = folderName.endsWith('.disabled') || (await fs.pathExists(path.join(folderPath, '.disabled')));
    const rawSkillName = folderName.replace(/\.disabled$/, '');

    const skillMdPath = path.join(folderPath, 'SKILL.md');
    let hasSkillMd = await fs.pathExists(skillMdPath);
    let frontmatter = {};
    let content = '';

    if (hasSkillMd) {
      const rawText = await fs.readFile(skillMdPath, 'utf8');
      try {
        const parsed = matter(rawText);
        frontmatter = parsed.data || {};
        content = parsed.content || '';
      } catch (e) {
        frontmatter = { error: 'YAML parse error: ' + e.message };
        content = rawText;
      }
    }

    // Subdirectories check
    const items = await fs.readdir(folderPath);
    const subfolders = [];
    const files = [];

    for (const item of items) {
      const itemPath = path.join(folderPath, item);
      const stat = await fs.stat(itemPath);
      if (stat.isDirectory()) {
        subfolders.push(item);
      } else {
        files.push(item);
      }
    }

    const id = `${scope}:::${folderName}`;

    return {
      id,
      name: frontmatter.name || rawSkillName,
      folderName,
      description: frontmatter.description || '(No description provided)',
      scope, // 'global', 'workspace', 'plugin', 'builtin'
      folderPath,
      skillMdPath: hasSkillMd ? skillMdPath : null,
      hasSkillMd,
      isDisabled,
      subfolders,
      files,
      frontmatter,
      content,
      readOnly: scope === 'builtin' || extraMeta.readOnly === true,
      pluginName: extraMeta.pluginName || null,
      updatedAt: (await fs.stat(skillMdPath ? skillMdPath : folderPath)).mtime
    };
  } catch (err) {
    return null;
  }
}

// Get all skills across scopes
async function getAllSkills(workspaceRoot) {
  const allSkills = [];

  // 1. Workspace Skills (.agents/skills and .agent/skills)
  if (workspaceRoot) {
    const wsSkills1 = path.join(workspaceRoot, '.agents', 'skills');
    const wsSkills2 = path.join(workspaceRoot, '.agent', 'skills');

    for (const wsDir of [wsSkills1, wsSkills2]) {
      if (await fs.pathExists(wsDir)) {
        const folders = await fs.readdir(wsDir);
        for (const f of folders) {
          const s = await parseSkillFolder(path.join(wsDir, f), 'workspace');
          if (s) allSkills.push(s);
        }
      }
    }
  }

  // 2. Global Skills (~/.gemini/config/skills)
  await ensureDir(GLOBAL_SKILLS_DIR);
  if (await fs.pathExists(GLOBAL_SKILLS_DIR)) {
    const folders = await fs.readdir(GLOBAL_SKILLS_DIR);
    for (const f of folders) {
      const s = await parseSkillFolder(path.join(GLOBAL_SKILLS_DIR, f), 'global');
      if (s) allSkills.push(s);
    }
  }

  // 3. Plugins Skills (~/.gemini/config/plugins/*/skills)
  if (await fs.pathExists(PLUGINS_DIR)) {
    const pluginFolders = await fs.readdir(PLUGINS_DIR);
    for (const plugin of pluginFolders) {
      const pluginSkillDir = path.join(PLUGINS_DIR, plugin, 'skills');
      if (await fs.pathExists(pluginSkillDir)) {
        const skillsInPlugin = await fs.readdir(pluginSkillDir);
        for (const f of skillsInPlugin) {
          const s = await parseSkillFolder(path.join(pluginSkillDir, f), 'plugin', { pluginName: plugin });
          if (s) allSkills.push(s);
        }
      }
    }
  }

  // 4. Built-in Skills (~/.gemini/antigravity/builtin/skills)
  if (await fs.pathExists(BUILTIN_SKILLS_DIR)) {
    const builtinFolders = await fs.readdir(BUILTIN_SKILLS_DIR);
    for (const f of builtinFolders) {
      const s = await parseSkillFolder(path.join(BUILTIN_SKILLS_DIR, f), 'builtin', { readOnly: true });
      if (s) allSkills.push(s);
    }
  }

  return allSkills;
}

// API Routes

// 1. App Configuration & Paths
app.get('/api/config', (req, res) => {
  res.json({
    homeDir: HOME_DIR,
    globalSkillsDir: GLOBAL_SKILLS_DIR,
    builtinSkillsDir: BUILTIN_SKILLS_DIR,
    libraryDir: LIBRARY_DIR,
    workspacePath: currentWorkspacePath,
    workspaceSkillsDir: path.join(currentWorkspacePath, '.agents', 'skills')
  });
});

app.post('/api/config/workspace', async (req, res) => {
  const { workspacePath } = req.body;
  if (!workspacePath) {
    return res.status(400).json({ error: 'workspacePath is required' });
  }

  if (!(await fs.pathExists(workspacePath))) {
    return res.status(400).json({ error: `Directory does not exist: ${workspacePath}` });
  }

  currentWorkspacePath = path.resolve(workspacePath);
  res.json({ success: true, workspacePath: currentWorkspacePath });
});

// ==========================================
// 📚 SKILL LIBRARY API ENDPOINTS
// ==========================================

// Get all skills in Library with active status
app.get('/api/library', async (req, res) => {
  try {
    await ensureDir(LIBRARY_DIR);
    const meta = await getLibraryMeta();
    const folders = await fs.readdir(LIBRARY_DIR);
    const librarySkills = [];

    for (const f of folders) {
      const folderPath = path.join(LIBRARY_DIR, f);
      const stat = await fs.stat(folderPath);
      if (!stat.isDirectory()) continue;

      const skill = await parseSkillFolder(folderPath, 'library');
      if (!skill) continue;

      const skillMeta = meta[skill.name] || {
        targetScope: 'workspace',
        createdAt: stat.birthtime,
        updatedAt: stat.mtime
      };

      const targetScope = skillMeta.targetScope || 'workspace';
      const isActuallyActive = await checkSkillActiveStatus(skill.name, targetScope);

      librarySkills.push({
        ...skill,
        targetScope,
        isActive: isActuallyActive,
        libraryMeta: skillMeta,
        createdAt: skillMeta.createdAt || stat.birthtime
      });
    }

    // Sort by most recently updated
    librarySkills.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({
      librarySkills,
      count: librarySkills.length,
      activeCount: librarySkills.filter(s => s.isActive).length
    });
  } catch (err) {
    console.error('Error fetching library skills:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add new skill directly to Library
app.post('/api/library', async (req, res) => {
  try {
    const { name, description, content, targetScope = 'workspace', activate = true, subdirs = [] } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Skill name is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Skill description is required for Antigravity' });
    }

    const cleanName = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-');

    await ensureDir(LIBRARY_DIR);
    const librarySkillFolder = path.join(LIBRARY_DIR, cleanName);

    if (await fs.pathExists(librarySkillFolder)) {
      return res.status(409).json({ error: `Skill "${cleanName}" already exists in your Library` });
    }

    await fs.ensureDir(librarySkillFolder);

    // Create subdirs if requested
    if (Array.isArray(subdirs)) {
      for (const sub of subdirs) {
        if (typeof sub === 'string' && sub.trim()) {
          await fs.ensureDir(path.join(librarySkillFolder, sub.trim()));
        }
      }
    }

    // Write SKILL.md
    const frontmatterData = {
      name: cleanName,
      description: description.trim()
    };
    const finalMarkdown = matter.stringify(content || `# ${cleanName}\n\nSkill instructions go here.\n`, frontmatterData);
    await fs.writeFile(path.join(librarySkillFolder, 'SKILL.md'), finalMarkdown, 'utf8');

    // Save metadata
    const meta = await getLibraryMeta();
    meta[cleanName] = {
      name: cleanName,
      targetScope,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // If activate is true, deploy immediately
    if (activate) {
      let destDir = '';
      if (targetScope === 'workspace') {
        destDir = path.join(currentWorkspacePath, '.agents', 'skills', cleanName);
      } else {
        destDir = path.join(GLOBAL_SKILLS_DIR, cleanName);
      }
      await fs.ensureDir(path.dirname(destDir));
      await fs.copy(librarySkillFolder, destDir);
      meta[cleanName].isActive = true;
    }

    await saveLibraryMeta(meta);

    const created = await parseSkillFolder(librarySkillFolder, 'library');
    res.status(201).json({
      success: true,
      skill: {
        ...created,
        targetScope,
        isActive: !!activate
      }
    });
  } catch (err) {
    console.error('Error creating library skill:', err);
    res.status(500).json({ error: err.message });
  }
});

// Toggle Active / Inactive (ON / OFF) for a Library skill
app.post('/api/library/:name/toggle', async (req, res) => {
  try {
    const { name } = req.params;
    const cleanName = name.trim();

    await ensureDir(LIBRARY_DIR);
    const librarySkillFolder = path.join(LIBRARY_DIR, cleanName);

    if (!(await fs.pathExists(librarySkillFolder))) {
      return res.status(404).json({ error: `Skill "${cleanName}" not found in Library` });
    }

    const meta = await getLibraryMeta();
    const skillMeta = meta[cleanName] || { targetScope: 'workspace' };
    const targetScope = req.body.targetScope || skillMeta.targetScope || 'workspace';

    let targetActiveFolder = '';
    if (targetScope === 'workspace') {
      targetActiveFolder = path.join(currentWorkspacePath, '.agents', 'skills', cleanName);
    } else {
      targetActiveFolder = path.join(GLOBAL_SKILLS_DIR, cleanName);
    }

    const isCurrentlyActive = await checkSkillActiveStatus(cleanName, targetScope);

    if (isCurrentlyActive) {
      // TURN OFF (Deactivate): Remove from active directory, but KEEP master in Library
      if (await fs.pathExists(targetActiveFolder)) {
        await fs.remove(targetActiveFolder);
      }
      // Also check if .disabled variant exists
      const disabledWs = path.join(path.dirname(targetActiveFolder), `${cleanName}.disabled`);
      if (await fs.pathExists(disabledWs)) {
        await fs.remove(disabledWs);
      }

      skillMeta.isActive = false;
      skillMeta.targetScope = targetScope;
      skillMeta.updatedAt = new Date().toISOString();
      meta[cleanName] = skillMeta;
      await saveLibraryMeta(meta);

      return res.json({
        success: true,
        name: cleanName,
        isActive: false,
        message: `Skill "${cleanName}" turned OFF (deactivated from ${targetScope})`
      });
    } else {
      // TURN ON (Activate): Copy from Library to target active directory
      await fs.ensureDir(path.dirname(targetActiveFolder));
      await fs.copy(librarySkillFolder, targetActiveFolder);

      skillMeta.isActive = true;
      skillMeta.targetScope = targetScope;
      skillMeta.updatedAt = new Date().toISOString();
      meta[cleanName] = skillMeta;
      await saveLibraryMeta(meta);

      return res.json({
        success: true,
        name: cleanName,
        isActive: true,
        message: `Skill "${cleanName}" turned ON (activated in ${targetScope})`
      });
    }
  } catch (err) {
    console.error('Error toggling library skill:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update a Library skill
app.put('/api/library/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { description, content, targetScope } = req.body;

    const librarySkillFolder = path.join(LIBRARY_DIR, name);
    if (!(await fs.pathExists(librarySkillFolder))) {
      return res.status(404).json({ error: `Skill "${name}" not found in Library` });
    }

    const skillMdPath = path.join(librarySkillFolder, 'SKILL.md');
    let currentData = {};
    if (await fs.pathExists(skillMdPath)) {
      const existing = await fs.readFile(skillMdPath, 'utf8');
      try {
        currentData = matter(existing).data || {};
      } catch (e) {}
    }

    const updatedData = {
      ...currentData,
      name: currentData.name || name,
      description: description !== undefined ? description.trim() : (currentData.description || '')
    };

    const finalMarkdown = matter.stringify(content || '', updatedData);
    await fs.writeFile(skillMdPath, finalMarkdown, 'utf8');

    // Update meta
    const meta = await getLibraryMeta();
    const skillMeta = meta[name] || {};
    if (targetScope) skillMeta.targetScope = targetScope;
    skillMeta.updatedAt = new Date().toISOString();
    meta[name] = skillMeta;
    await saveLibraryMeta(meta);

    // If currently active, sync update to deployed copy
    const activeScope = targetScope || skillMeta.targetScope || 'workspace';
    const isActive = await checkSkillActiveStatus(name, activeScope);
    if (isActive) {
      let targetActiveFolder = activeScope === 'workspace'
        ? path.join(currentWorkspacePath, '.agents', 'skills', name)
        : path.join(GLOBAL_SKILLS_DIR, name);

      if (await fs.pathExists(targetActiveFolder)) {
        await fs.copy(librarySkillFolder, targetActiveFolder);
      }
    }

    const updated = await parseSkillFolder(librarySkillFolder, 'library');
    res.json({
      success: true,
      skill: {
        ...updated,
        targetScope: activeScope,
        isActive
      }
    });
  } catch (err) {
    console.error('Error updating library skill:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete skill from Library
app.delete('/api/library/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const librarySkillFolder = path.join(LIBRARY_DIR, name);

    if (!(await fs.pathExists(librarySkillFolder))) {
      return res.status(404).json({ error: `Skill "${name}" not found in Library` });
    }

    const meta = await getLibraryMeta();
    const skillMeta = meta[name] || {};
    const targetScope = skillMeta.targetScope || 'workspace';

    // Remove from active directory if active
    let targetActiveFolder = targetScope === 'workspace'
      ? path.join(currentWorkspacePath, '.agents', 'skills', name)
      : path.join(GLOBAL_SKILLS_DIR, name);

    if (await fs.pathExists(targetActiveFolder)) {
      await fs.remove(targetActiveFolder);
    }
    const disabledFolder = path.join(path.dirname(targetActiveFolder), `${name}.disabled`);
    if (await fs.pathExists(disabledFolder)) {
      await fs.remove(disabledFolder);
    }

    // Remove from library folder
    await fs.remove(librarySkillFolder);

    // Remove from meta
    delete meta[name];
    await saveLibraryMeta(meta);

    res.json({ success: true, message: `Skill "${name}" deleted from Library` });
  } catch (err) {
    console.error('Error deleting library skill:', err);
    res.status(500).json({ error: err.message });
  }
});

// Import existing skill into Library (from built-in, plugin, workspace, or global)
app.post('/api/library/import', async (req, res) => {
  try {
    const { sourcePath, name, targetScope = 'workspace', activate = false } = req.body;

    if (!sourcePath || !(await fs.pathExists(sourcePath))) {
      return res.status(400).json({ error: 'Source skill path does not exist' });
    }

    const cleanName = (name || path.basename(sourcePath))
      .toLowerCase()
      .trim()
      .replace(/\.disabled$/, '')
      .replace(/[^a-z0-9_-]/g, '-');

    await ensureDir(LIBRARY_DIR);
    const destination = path.join(LIBRARY_DIR, cleanName);

    if (await fs.pathExists(destination)) {
      return res.status(409).json({ error: `Skill "${cleanName}" already exists in Library` });
    }

    // Copy to Library
    await fs.copy(sourcePath, destination);

    // Make sure SKILL.md has clean name
    const targetSkillMd = path.join(destination, 'SKILL.md');
    if (await fs.pathExists(targetSkillMd)) {
      const raw = await fs.readFile(targetSkillMd, 'utf8');
      try {
        const parsed = matter(raw);
        parsed.data.name = cleanName;
        await fs.writeFile(targetSkillMd, matter.stringify(parsed.content, parsed.data), 'utf8');
      } catch (e) {}
    }

    const meta = await getLibraryMeta();
    meta[cleanName] = {
      name: cleanName,
      targetScope,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (activate) {
      let destDir = targetScope === 'workspace'
        ? path.join(currentWorkspacePath, '.agents', 'skills', cleanName)
        : path.join(GLOBAL_SKILLS_DIR, cleanName);
      await fs.ensureDir(path.dirname(destDir));
      await fs.copy(destination, destDir);
      meta[cleanName].isActive = true;
    }

    await saveLibraryMeta(meta);

    const imported = await parseSkillFolder(destination, 'library');
    res.status(201).json({
      success: true,
      skill: {
        ...imported,
        targetScope,
        isActive: !!activate
      }
    });
  } catch (err) {
    console.error('Error importing to library:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper for shell exec
function runExec(cmd, options = {}) {
  return new Promise((resolve, reject) => {
    exec(cmd, options, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout);
    });
  });
}

// Recursively find a folder containing SKILL.md
async function findSkillFolderInDir(dirPath) {
  if (await fs.pathExists(path.join(dirPath, 'SKILL.md'))) {
    return dirPath;
  }
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== '.git' && entry.name !== 'node_modules') {
      const sub = path.join(dirPath, entry.name);
      const found = await findSkillFolderInDir(sub);
      if (found) return found;
    }
  }
  return null;
}

// Import Skill from URL (GitHub, OpenClaw, Raw Markdown, Git repo)
app.post('/api/library/import-url', async (req, res) => {
  let tempDir = null;
  try {
    let { url, targetScope = 'workspace', activate = true, customName } = req.body;

    if (!url || !url.trim()) {
      return res.status(400).json({ error: 'URL is required' });
    }
    url = url.trim();

    await ensureDir(LIBRARY_DIR);

    // Convert GitHub blob URL to raw URL if single markdown
    // e.g. https://github.com/owner/repo/blob/main/path/SKILL.md -> https://raw.githubusercontent.com/owner/repo/main/path/SKILL.md
    if (url.includes('github.com') && url.includes('/blob/') && url.endsWith('.md')) {
      url = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }

    const isRawMarkdown = url.includes('raw.githubusercontent.com') || url.endsWith('.md');

    if (isRawMarkdown) {
      // 1. Single Raw SKILL.md File Import
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file from URL (HTTP ${response.status})`);
      }
      const rawText = await response.text();
      let parsed = { data: {}, content: rawText };
      try {
        parsed = matter(rawText);
      } catch (e) {}

      const detectedName = customName || parsed.data.name || path.basename(new URL(url).pathname, '.md');
      const cleanName = detectedName.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');
      const targetFolder = path.join(LIBRARY_DIR, cleanName);

      if (await fs.pathExists(targetFolder)) {
        return res.status(409).json({ error: `Skill "${cleanName}" already exists in Library` });
      }

      await fs.ensureDir(targetFolder);

      // Ensure frontmatter
      const frontmatter = {
        name: cleanName,
        description: parsed.data.description || `Imported skill from ${url}`
      };
      const finalMd = matter.stringify(parsed.content || rawText, frontmatter);
      await fs.writeFile(path.join(targetFolder, 'SKILL.md'), finalMd, 'utf8');

      // Save meta & deploy
      const meta = await getLibraryMeta();
      meta[cleanName] = {
        name: cleanName,
        targetScope,
        isActive: false,
        sourceUrl: url,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (activate) {
        const dest = targetScope === 'workspace'
          ? path.join(currentWorkspacePath, '.agents', 'skills', cleanName)
          : path.join(GLOBAL_SKILLS_DIR, cleanName);
        await fs.ensureDir(path.dirname(dest));
        await fs.copy(targetFolder, dest);
        meta[cleanName].isActive = true;
      }
      await saveLibraryMeta(meta);

      const created = await parseSkillFolder(targetFolder, 'library');
      return res.status(201).json({
        success: true,
        skill: { ...created, targetScope, isActive: !!activate }
      });
    }

    // 2. GitHub Tree / Repository / OpenClaw Git Import
    tempDir = path.join(os.tmpdir(), `skill_ag_git_${Date.now()}`);
    await fs.ensureDir(tempDir);

    let repoUrl = url;
    let branch = '';
    let subpath = '';

    // Match GitHub tree URL: https://github.com/owner/repo/tree/branch/subpath
    const ghTreeMatch = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/?(.*)$/i);
    const ghRepoMatch = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git|\/)?$/i);

    if (ghTreeMatch) {
      const owner = ghTreeMatch[1];
      const repo = ghTreeMatch[2];
      branch = ghTreeMatch[3];
      subpath = ghTreeMatch[4] || '';
      repoUrl = `https://github.com/${owner}/${repo}.git`;
    } else if (ghRepoMatch) {
      const owner = ghRepoMatch[1];
      const repo = ghRepoMatch[2];
      repoUrl = `https://github.com/${owner}/${repo}.git`;
    }

    // Clone repo with depth 1
    const branchArg = branch ? `--branch "${branch}"` : '';
    await runExec(`git clone --depth 1 ${branchArg} "${repoUrl}" "${tempDir}"`);

    // Locate the source skill folder
    let sourceSkillDir = null;
    if (subpath) {
      const explicitPath = path.join(tempDir, subpath);
      if (await fs.pathExists(explicitPath)) {
        sourceSkillDir = explicitPath;
      }
    }

    if (!sourceSkillDir) {
      sourceSkillDir = await findSkillFolderInDir(tempDir);
    }

    if (!sourceSkillDir) {
      // If no SKILL.md found, check for README.md and wrap as SKILL.md
      const readmePath = path.join(tempDir, 'README.md');
      if (await fs.pathExists(readmePath)) {
        const readmeContent = await fs.readFile(readmePath, 'utf8');
        sourceSkillDir = tempDir;
        const autoName = customName || path.basename(repoUrl, '.git');
        const defaultFrontmatter = matter.stringify(readmeContent, {
          name: autoName,
          description: `Imported from ${url}`
        });
        await fs.writeFile(path.join(tempDir, 'SKILL.md'), defaultFrontmatter, 'utf8');
      } else {
        throw new Error('No SKILL.md or valid skill files found in the repository');
      }
    }

    // Determine clean name
    let detectedName = customName;
    if (!detectedName) {
      const skillMd = path.join(sourceSkillDir, 'SKILL.md');
      if (await fs.pathExists(skillMd)) {
        try {
          const raw = await fs.readFile(skillMd, 'utf8');
          detectedName = matter(raw).data?.name;
        } catch (e) {}
      }
      if (!detectedName) {
        detectedName = subpath ? path.basename(subpath) : path.basename(repoUrl, '.git');
      }
    }

    const cleanName = detectedName.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');
    const targetFolder = path.join(LIBRARY_DIR, cleanName);

    if (await fs.pathExists(targetFolder)) {
      return res.status(409).json({ error: `Skill "${cleanName}" already exists in Library` });
    }

    // Copy to Library (excluding .git)
    await fs.copy(sourceSkillDir, targetFolder, {
      filter: (src) => !src.includes('.git')
    });

    // Save meta & deploy
    const meta = await getLibraryMeta();
    meta[cleanName] = {
      name: cleanName,
      targetScope,
      isActive: false,
      sourceUrl: url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (activate) {
      const dest = targetScope === 'workspace'
        ? path.join(currentWorkspacePath, '.agents', 'skills', cleanName)
        : path.join(GLOBAL_SKILLS_DIR, cleanName);
      await fs.ensureDir(path.dirname(dest));
      await fs.copy(targetFolder, dest);
      meta[cleanName].isActive = true;
    }
    await saveLibraryMeta(meta);

    const created = await parseSkillFolder(targetFolder, 'library');
    res.status(201).json({
      success: true,
      skill: { ...created, targetScope, isActive: !!activate }
    });
  } catch (err) {
    console.error('Error importing from URL:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (tempDir && (await fs.pathExists(tempDir))) {
      await fs.remove(tempDir).catch(() => {});
    }
  }
});

// Import Skill from ZIP File (Base64 payload)
app.post('/api/library/import-zip', async (req, res) => {
  let tempZipPath = null;
  let tempExtractDir = null;
  try {
    const { zipBase64, filename, targetScope = 'workspace', activate = true, customName } = req.body;

    if (!zipBase64) {
      return res.status(400).json({ error: 'zipBase64 data is required' });
    }

    await ensureDir(LIBRARY_DIR);

    const buffer = Buffer.from(zipBase64.replace(/^data:.*?;base64,/, ''), 'base64');
    tempZipPath = path.join(os.tmpdir(), `upload_${Date.now()}.zip`);
    tempExtractDir = path.join(os.tmpdir(), `extract_${Date.now()}`);

    await fs.writeFile(tempZipPath, buffer);
    const zip = new AdmZip(tempZipPath);
    zip.extractAllTo(tempExtractDir, true);

    // Locate source skill folder
    let sourceSkillDir = await findSkillFolderInDir(tempExtractDir);
    if (!sourceSkillDir) {
      sourceSkillDir = tempExtractDir;
    }

    let detectedName = customName;
    const skillMd = path.join(sourceSkillDir, 'SKILL.md');
    if (await fs.pathExists(skillMd)) {
      try {
        const raw = await fs.readFile(skillMd, 'utf8');
        detectedName = detectedName || matter(raw).data?.name;
      } catch (e) {}
    }

    if (!detectedName) {
      detectedName = filename ? path.basename(filename, '.zip') : `skill-${Date.now()}`;
    }

    const cleanName = detectedName.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');
    const targetFolder = path.join(LIBRARY_DIR, cleanName);

    if (await fs.pathExists(targetFolder)) {
      return res.status(409).json({ error: `Skill "${cleanName}" already exists in Library` });
    }

    await fs.copy(sourceSkillDir, targetFolder, {
      filter: (src) => !src.includes('.git') && !src.includes('__MACOSX')
    });

    const meta = await getLibraryMeta();
    meta[cleanName] = {
      name: cleanName,
      targetScope,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (activate) {
      const dest = targetScope === 'workspace'
        ? path.join(currentWorkspacePath, '.agents', 'skills', cleanName)
        : path.join(GLOBAL_SKILLS_DIR, cleanName);
      await fs.ensureDir(path.dirname(dest));
      await fs.copy(targetFolder, dest);
      meta[cleanName].isActive = true;
    }
    await saveLibraryMeta(meta);

    const created = await parseSkillFolder(targetFolder, 'library');
    res.status(201).json({
      success: true,
      skill: { ...created, targetScope, isActive: !!activate }
    });
  } catch (err) {
    console.error('Error importing zip:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (tempZipPath && (await fs.pathExists(tempZipPath))) await fs.remove(tempZipPath).catch(() => {});
    if (tempExtractDir && (await fs.pathExists(tempExtractDir))) await fs.remove(tempExtractDir).catch(() => {});
  }
});

// Import Skill from Local Folder
app.post('/api/library/import-local', async (req, res) => {
  try {
    const { folderPath, targetScope = 'workspace', activate = true, customName } = req.body;

    if (!folderPath || !(await fs.pathExists(folderPath))) {
      return res.status(400).json({ error: `Folder not found: ${folderPath}` });
    }

    await ensureDir(LIBRARY_DIR);

    let detectedName = customName;
    const skillMd = path.join(folderPath, 'SKILL.md');
    if (await fs.pathExists(skillMd)) {
      try {
        const raw = await fs.readFile(skillMd, 'utf8');
        detectedName = detectedName || matter(raw).data?.name;
      } catch (e) {}
    }
    if (!detectedName) {
      detectedName = path.basename(folderPath);
    }

    const cleanName = detectedName.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');
    const targetFolder = path.join(LIBRARY_DIR, cleanName);

    if (await fs.pathExists(targetFolder)) {
      return res.status(409).json({ error: `Skill "${cleanName}" already exists in Library` });
    }

    await fs.copy(folderPath, targetFolder, {
      filter: (src) => !src.includes('.git')
    });

    const meta = await getLibraryMeta();
    meta[cleanName] = {
      name: cleanName,
      targetScope,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (activate) {
      const dest = targetScope === 'workspace'
        ? path.join(currentWorkspacePath, '.agents', 'skills', cleanName)
        : path.join(GLOBAL_SKILLS_DIR, cleanName);
      await fs.ensureDir(path.dirname(dest));
      await fs.copy(targetFolder, dest);
      meta[cleanName].isActive = true;
    }
    await saveLibraryMeta(meta);

    const created = await parseSkillFolder(targetFolder, 'library');
    res.status(201).json({
      success: true,
      skill: { ...created, targetScope, isActive: !!activate }
    });
  } catch (err) {
    console.error('Error importing local folder:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. List all skills
app.get('/api/skills', async (req, res) => {
  try {
    const skills = await getAllSkills(currentWorkspacePath);
    res.json({ skills, count: skills.length });
  } catch (err) {
    console.error('Error listing skills:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Get single skill details & file content
app.get('/api/skills/:scope/:name', async (req, res) => {
  try {
    const { scope, name } = req.params;
    let targetDir = '';

    if (scope === 'global') {
      targetDir = path.join(GLOBAL_SKILLS_DIR, name);
    } else if (scope === 'library') {
      targetDir = path.join(LIBRARY_DIR, name);
    } else if (scope === 'workspace') {
      const p1 = path.join(currentWorkspacePath, '.agents', 'skills', name);
      const p2 = path.join(currentWorkspacePath, '.agent', 'skills', name);
      targetDir = (await fs.pathExists(p1)) ? p1 : p2;
    } else if (scope === 'builtin') {
      targetDir = path.join(BUILTIN_SKILLS_DIR, name);
    } else if (scope === 'plugin') {
      const plugin = req.query.plugin;
      if (!plugin) return res.status(400).json({ error: 'Plugin name required for plugin scope' });
      targetDir = path.join(PLUGINS_DIR, plugin, 'skills', name);
    }

    if (!(await fs.pathExists(targetDir))) {
      return res.status(404).json({ error: 'Skill directory not found' });
    }

    const skill = await parseSkillFolder(targetDir, scope, {
      readOnly: scope === 'builtin',
      pluginName: req.query.plugin
    });

    // Also get full directory tree
    async function getDirTree(dir, relativeTo = dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const tree = [];
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(relativeTo, fullPath);
        if (entry.isDirectory()) {
          tree.push({
            name: entry.name,
            path: relPath,
            type: 'dir',
            children: await getDirTree(fullPath, relativeTo)
          });
        } else {
          tree.push({
            name: entry.name,
            path: relPath,
            type: 'file',
            size: (await fs.stat(fullPath)).size
          });
        }
      }
      return tree;
    }

    const tree = await getDirTree(targetDir);

    res.json({ skill, tree });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Create new skill
app.post('/api/skills', async (req, res) => {
  try {
    const { name, description, content, scope = 'global', subdirs = [] } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Skill name is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Skill description is required for Antigravity' });
    }

    // Sanitize name: lowercase, letters, numbers, hyphens
    const cleanName = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-');

    let baseDir = '';
    if (scope === 'global') {
      baseDir = GLOBAL_SKILLS_DIR;
    } else if (scope === 'workspace') {
      baseDir = path.join(currentWorkspacePath, '.agents', 'skills');
    } else {
      return res.status(400).json({ error: 'Scope must be global or workspace' });
    }

    await fs.ensureDir(baseDir);
    const targetFolder = path.join(baseDir, cleanName);

    if (await fs.pathExists(targetFolder)) {
      return res.status(409).json({ error: `Skill "${cleanName}" already exists in ${scope} scope` });
    }

    await fs.ensureDir(targetFolder);

    // Create subdirs like scripts/, references/, examples/
    if (Array.isArray(subdirs)) {
      for (const sub of subdirs) {
        if (typeof sub === 'string' && sub.trim()) {
          await fs.ensureDir(path.join(targetFolder, sub.trim()));
        }
      }
    }

    // Format SKILL.md with clean YAML frontmatter
    const frontmatterData = {
      name: cleanName,
      description: description.trim()
    };

    const finalMarkdown = matter.stringify(content || `# ${cleanName}\n\nSkill instructions go here.\n`, frontmatterData);

    await fs.writeFile(path.join(targetFolder, 'SKILL.md'), finalMarkdown, 'utf8');

    const created = await parseSkillFolder(targetFolder, scope);
    res.status(201).json({ success: true, skill: created });
  } catch (err) {
    console.error('Error creating skill:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Update an existing skill (SKILL.md content, name, description)
app.put('/api/skills/:scope/:name', async (req, res) => {
  try {
    const { scope, name } = req.params;
    const { description, content, newName } = req.body;

    if (scope === 'builtin') {
      return res.status(403).json({ error: 'Built-in skills are read-only' });
    }

    let baseDir = '';
    if (scope === 'global') {
      baseDir = GLOBAL_SKILLS_DIR;
    } else if (scope === 'workspace') {
      baseDir = path.join(currentWorkspacePath, '.agents', 'skills');
    } else if (scope === 'plugin') {
      const plugin = req.query.plugin;
      if (!plugin) return res.status(400).json({ error: 'Plugin name required' });
      baseDir = path.join(PLUGINS_DIR, plugin, 'skills');
    }

    let targetFolder = path.join(baseDir, name);
    if (!(await fs.pathExists(targetFolder))) {
      return res.status(404).json({ error: 'Skill directory not found' });
    }

    // If renaming
    if (newName && newName !== name) {
      const cleanNewName = newName.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');
      const newFolder = path.join(baseDir, cleanNewName);
      if (await fs.pathExists(newFolder)) {
        return res.status(409).json({ error: `Folder ${cleanNewName} already exists` });
      }
      await fs.rename(targetFolder, newFolder);
      targetFolder = newFolder;
    }

    const skillMdPath = path.join(targetFolder, 'SKILL.md');
    let currentData = {};
    if (await fs.pathExists(skillMdPath)) {
      const existing = await fs.readFile(skillMdPath, 'utf8');
      try {
        currentData = matter(existing).data || {};
      } catch (e) {}
    }

    const updatedData = {
      ...currentData,
      name: newName || currentData.name || path.basename(targetFolder),
      description: description !== undefined ? description.trim() : (currentData.description || '')
    };

    const finalMarkdown = matter.stringify(content || '', updatedData);
    await fs.writeFile(skillMdPath, finalMarkdown, 'utf8');

    const updated = await parseSkillFolder(targetFolder, scope);
    res.json({ success: true, skill: updated });
  } catch (err) {
    console.error('Error updating skill:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Delete skill (Permanent removal)
app.delete('/api/skills/:scope/:name', async (req, res) => {
  try {
    const { scope, name } = req.params;

    if (scope === 'builtin') {
      return res.status(403).json({ error: 'Cannot delete built-in skills' });
    }

    let baseDir = '';
    if (scope === 'global') {
      baseDir = GLOBAL_SKILLS_DIR;
    } else if (scope === 'workspace') {
      baseDir = path.join(currentWorkspacePath, '.agents', 'skills');
    } else if (scope === 'plugin') {
      const plugin = req.query.plugin;
      if (!plugin) return res.status(400).json({ error: 'Plugin name required' });
      baseDir = path.join(PLUGINS_DIR, plugin, 'skills');
    }

    const targetFolder = path.join(baseDir, name);
    if (!(await fs.pathExists(targetFolder))) {
      return res.status(404).json({ error: 'Skill directory not found' });
    }

    await fs.remove(targetFolder);
    res.json({ success: true, message: `Skill "${name}" deleted successfully` });
  } catch (err) {
    console.error('Error deleting skill:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Toggle Enable / Disable skill
app.post('/api/skills/:scope/:name/toggle', async (req, res) => {
  try {
    const { scope, name } = req.params;

    if (scope === 'builtin') {
      return res.status(403).json({ error: 'Cannot toggle built-in skills directly' });
    }

    let baseDir = '';
    if (scope === 'global') {
      baseDir = GLOBAL_SKILLS_DIR;
    } else if (scope === 'workspace') {
      baseDir = path.join(currentWorkspacePath, '.agents', 'skills');
    } else if (scope === 'plugin') {
      const plugin = req.query.plugin;
      if (!plugin) return res.status(400).json({ error: 'Plugin name required' });
      baseDir = path.join(PLUGINS_DIR, plugin, 'skills');
    }

    const currentFolder = path.join(baseDir, name);
    if (!(await fs.pathExists(currentFolder))) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    let targetFolder = '';
    let isNowDisabled = false;

    if (name.endsWith('.disabled')) {
      // Enable it by removing .disabled
      const enabledName = name.replace(/\.disabled$/, '');
      targetFolder = path.join(baseDir, enabledName);
      if (await fs.pathExists(targetFolder)) {
        return res.status(409).json({ error: `Cannot enable: ${enabledName} already exists` });
      }
      await fs.rename(currentFolder, targetFolder);
      isNowDisabled = false;
    } else {
      // Disable it by appending .disabled
      targetFolder = path.join(baseDir, `${name}.disabled`);
      if (await fs.pathExists(targetFolder)) {
        return res.status(409).json({ error: `Cannot disable: ${name}.disabled already exists` });
      }
      await fs.rename(currentFolder, targetFolder);
      isNowDisabled = true;
    }

    const updated = await parseSkillFolder(targetFolder, scope);
    res.json({ success: true, isDisabled: isNowDisabled, skill: updated });
  } catch (err) {
    console.error('Error toggling skill:', err);
    res.status(500).json({ error: err.message });
  }
});

// 8. Clone / Duplicate a skill (e.g. from builtin or other scope)
app.post('/api/skills/clone', async (req, res) => {
  try {
    const { sourcePath, targetScope = 'global', newName } = req.body;

    if (!sourcePath || !(await fs.pathExists(sourcePath))) {
      return res.status(400).json({ error: 'Source skill path does not exist' });
    }

    if (!newName || !newName.trim()) {
      return res.status(400).json({ error: 'New skill name is required' });
    }

    const cleanName = newName.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');
    let targetBaseDir = targetScope === 'workspace' 
      ? path.join(currentWorkspacePath, '.agents', 'skills') 
      : GLOBAL_SKILLS_DIR;

    await fs.ensureDir(targetBaseDir);
    const destination = path.join(targetBaseDir, cleanName);

    if (await fs.pathExists(destination)) {
      return res.status(409).json({ error: `Skill "${cleanName}" already exists in ${targetScope}` });
    }

    // Copy entire directory
    await fs.copy(sourcePath, destination);

    // Update name in SKILL.md if present
    const targetSkillMd = path.join(destination, 'SKILL.md');
    if (await fs.pathExists(targetSkillMd)) {
      const raw = await fs.readFile(targetSkillMd, 'utf8');
      try {
        const parsed = matter(raw);
        parsed.data.name = cleanName;
        await fs.writeFile(targetSkillMd, matter.stringify(parsed.content, parsed.data), 'utf8');
      } catch (e) {}
    }

    const cloned = await parseSkillFolder(destination, targetScope);
    res.status(201).json({ success: true, skill: cloned });
  } catch (err) {
    console.error('Error cloning skill:', err);
    res.status(500).json({ error: err.message });
  }
});

// 9. Read/Write specific file inside skill (scripts, references, etc.)
app.get('/api/skills/:scope/:name/file', async (req, res) => {
  try {
    const { scope, name } = req.params;
    const { filePath } = req.query;

    if (!filePath) return res.status(400).json({ error: 'filePath query param required' });

    let baseDir = '';
    if (scope === 'global') baseDir = GLOBAL_SKILLS_DIR;
    else if (scope === 'library') baseDir = LIBRARY_DIR;
    else if (scope === 'workspace') baseDir = path.join(currentWorkspacePath, '.agents', 'skills');
    else if (scope === 'builtin') baseDir = BUILTIN_SKILLS_DIR;
    else if (scope === 'plugin') baseDir = path.join(PLUGINS_DIR, req.query.plugin || '', 'skills');

    const fullFilePath = path.join(baseDir, name, filePath);
    // Security check to avoid directory traversal
    if (!fullFilePath.startsWith(path.join(baseDir, name))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!(await fs.pathExists(fullFilePath))) {
      return res.status(404).json({ error: 'File not found' });
    }

    const content = await fs.readFile(fullFilePath, 'utf8');
    res.json({ content, filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/skills/:scope/:name/file', async (req, res) => {
  try {
    const { scope, name } = req.params;
    const { filePath, content } = req.body;

    if (scope === 'builtin') return res.status(403).json({ error: 'Built-in skills are read-only' });
    if (!filePath) return res.status(400).json({ error: 'filePath is required' });

    let baseDir = '';
    if (scope === 'global') baseDir = GLOBAL_SKILLS_DIR;
    else if (scope === 'library') baseDir = LIBRARY_DIR;
    else if (scope === 'workspace') baseDir = path.join(currentWorkspacePath, '.agents', 'skills');
    else if (scope === 'plugin') baseDir = path.join(PLUGINS_DIR, req.query.plugin || '', 'skills');

    const fullFilePath = path.join(baseDir, name, filePath);
    if (!fullFilePath.startsWith(path.join(baseDir, name))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await fs.ensureDir(path.dirname(fullFilePath));
    await fs.writeFile(fullFilePath, content || '', 'utf8');

    res.json({ success: true, message: 'File saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Antigravity Skill Manager is running!`);
  console.log(`🌐 Local Web UI: http://localhost:${PORT}`);
  console.log(`📂 Active Workspace: ${currentWorkspacePath}`);
  console.log(`📂 Global Skills Dir: ${GLOBAL_SKILLS_DIR}`);
  console.log(`======================================================\n`);
});

