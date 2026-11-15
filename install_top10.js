const AdmZip = require('adm-zip');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const matter = require('gray-matter');
const { execSync } = require('child_process');

const HOME_DIR = os.homedir();
const GLOBAL_SKILLS_DIR = path.join(HOME_DIR, '.gemini', 'config', 'skills');
const LIBRARY_DIR = path.join(HOME_DIR, '.gemini', 'config', 'library', 'skills');
const LIBRARY_META_FILE = path.join(HOME_DIR, '.gemini', 'config', 'library', 'library.json');

fs.ensureDirSync(GLOBAL_SKILLS_DIR);
fs.ensureDirSync(LIBRARY_DIR);

const repos = [
  {
    owner: "obra",
    repo: "superpowers",
    name: "superpowers",
    title: "Superpowers",
    description: "Superpowers is an agentic framework and core skill set: brainstorming, systematic debugging, test-driven development, plan execution, subagent dispatching, code review, and verification."
  },
  {
    owner: "mattpocock",
    repo: "skills",
    name: "mattpocock-skills",
    title: "Matt Pocock Skills",
    description: "Curated software engineering and developer productivity skills by Matt Pocock for Claude and AI coding agents."
  },
  {
    owner: "multica-ai",
    repo: "andrej-karpathy-skills",
    name: "karpathy-skills",
    title: "Andrej Karpathy Skills",
    description: "Andrej Karpathy operational principles, coding heuristics, and mental models distilled into reusable agent skills."
  },
  {
    owner: "anthropics",
    repo: "skills",
    name: "anthropic-skills",
    title: "Anthropic Skills",
    description: "Official Anthropic Claude skills library: MCP builder, canvas design, frontend design, document creation (docx, pdf, pptx, xlsx), web artifacts builder, and skill creator."
  },
  {
    owner: "DietrichGebert",
    repo: "ponytail",
    name: "ponytail",
    title: "Ponytail",
    description: "Full-stack code quality and technical debt governance skill suite: audit, debt reduction, refactoring gains, and architecture review."
  },
  {
    owner: "nextlevelbuilder",
    repo: "ui-ux-pro-max-skill",
    name: "ui-ux-pro-max-skill",
    title: "UI UX Pro Max",
    description: "Elite UI/UX design intelligence skill: modern design systems, typography hierarchy, responsive layouts, aesthetic polish, and interaction patterns."
  },
  {
    owner: "safishamsi",
    repo: "graphify",
    name: "graphify",
    title: "Graphify",
    description: "Knowledge graph and architecture mapping skill: extracts structural code relationships, dependency graphs, and module interaction maps."
  },
  {
    owner: "JuliusBrussee",
    repo: "caveman",
    name: "caveman",
    title: "Caveman",
    description: "Ultra-lean, token-efficient, concise coding and execution skill that strips out verbose AI pleasantries and delivers surgical, high-speed engineering."
  },
  {
    owner: "addyosmani",
    repo: "agent-skills",
    name: "addyosmani-agent-skills",
    title: "Addy Osmani Agent Skills",
    description: "25+ battle-tested software engineering skills by Addy Osmani: API design, browser testing with DevTools, code simplification, security hardening, performance optimization, and ADRs."
  },
  {
    owner: "Leonxlnx",
    repo: "taste-skill",
    name: "taste-skill",
    title: "Taste Skill",
    description: "Skills for premium frontend code, plus a redesign skill that audits and fixes existing UI projects"
  }
];

function getLibraryMeta() {
  if (fs.existsSync(LIBRARY_META_FILE)) {
    try {
      return fs.readJsonSync(LIBRARY_META_FILE);
    } catch (e) {
      return {};
    }
  }
  return {};
}

function saveLibraryMeta(meta) {
  fs.writeJsonSync(LIBRARY_META_FILE, meta, { spaces: 2 });
}

function installOne(item) {
  console.log(`\n========================================`);
  console.log(`[INSTALLING] ${item.title} (${item.owner}/${item.repo})...`);

  const tempZip = path.join(os.tmpdir(), `dl_${item.name}_${Date.now()}.zip`);
  const tempExtract = path.join(os.tmpdir(), `ext_${item.name}_${Date.now()}`);

  // Download
  let downloaded = false;
  for (const branch of ['main', 'master']) {
    try {
      const url = `https://github.com/${item.owner}/${item.repo}/archive/refs/heads/${branch}.zip`;
      execSync(`curl.exe -sL -f -o "${tempZip}" "${url}"`, { stdio: 'pipe' });
      downloaded = true;
      break;
    } catch (e) {}
  }

  if (!downloaded) {
    throw new Error(`Failed to download ${item.owner}/${item.repo}`);
  }

  // Extract
  fs.ensureDirSync(tempExtract);
  const zip = new AdmZip(tempZip);
  zip.extractAllTo(tempExtract, true);

  const entries = fs.readdirSync(tempExtract);
  let sourceDir = tempExtract;
  if (entries.length === 1 && fs.statSync(path.join(tempExtract, entries[0])).isDirectory()) {
    sourceDir = path.join(tempExtract, entries[0]);
  }

  const allFiles = fs.readdirSync(sourceDir);
  console.log(`Files found in root:`, allFiles.slice(0, 15).join(', '));

  // Determine or construct SKILL.md
  let skillMdPath = path.join(sourceDir, 'SKILL.md');
  let skillContent = '';
  let skillFrontmatter = {};

  if (fs.existsSync(skillMdPath)) {
    const raw = fs.readFileSync(skillMdPath, 'utf8');
    try {
      const parsed = matter(raw);
      skillFrontmatter = parsed.data || {};
      skillContent = parsed.content || raw;
    } catch (e) {
      skillContent = raw;
    }
  } else {
    // Check if there is README.md or CLAUDE.md or AGENTS.md
    const cand = ['README.md', 'CLAUDE.md', 'AGENTS.md', 'skill.md', 'rules.md'];
    let foundMd = null;
    for (const c of cand) {
      const p = path.join(sourceDir, c);
      if (fs.existsSync(p)) {
        foundMd = p;
        break;
      }
    }

    if (foundMd) {
      const raw = fs.readFileSync(foundMd, 'utf8');
      try {
        const parsed = matter(raw);
        skillFrontmatter = parsed.data || {};
        skillContent = parsed.content || raw;
      } catch (e) {
        skillContent = raw;
      }
    } else {
      skillContent = `# ${item.title}\n\n${item.description}\n`;
    }
  }

  const skillName = item.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const description = skillFrontmatter.description || item.description;

  const finalSkillMd = matter.stringify(skillContent, {
    name: skillName,
    description: description
  });

  // Destinations: Global & Library
  const globalDest = path.join(GLOBAL_SKILLS_DIR, skillName);
  const libraryDest = path.join(LIBRARY_DIR, skillName);

  fs.ensureDirSync(globalDest);
  fs.ensureDirSync(libraryDest);

  fs.copySync(sourceDir, globalDest, { filter: (src) => !src.includes('.git') });
  fs.copySync(sourceDir, libraryDest, { filter: (src) => !src.includes('.git') });

  fs.writeFileSync(path.join(globalDest, 'SKILL.md'), finalSkillMd, 'utf8');
  fs.writeFileSync(path.join(libraryDest, 'SKILL.md'), finalSkillMd, 'utf8');

  // Clean temp
  try {
    fs.removeSync(tempZip);
    fs.removeSync(tempExtract);
  } catch (e) {}

  return { skillName, description, globalDest, libraryDest };
}

function main() {
  const meta = getLibraryMeta();
  const summary = [];

  for (const item of repos) {
    try {
      const res = installOne(item);
      meta[res.skillName] = {
        name: res.skillName,
        targetScope: 'global',
        isActive: true,
        sourceUrl: `https://github.com/${item.owner}/${item.repo}`,
        description: res.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      console.log(`✅ [SUCCESS] ${res.skillName} installed to Global and Library!`);
      summary.push({ name: res.skillName, status: 'INSTALLED', path: res.globalDest });
    } catch (err) {
      console.error(`❌ [FAILED] ${item.name}: ${err.message}`);
      summary.push({ name: item.name, status: 'FAILED', error: err.message });
    }
  }

  saveLibraryMeta(meta);

  console.log(`\n========================================`);
  console.log(`TOP 10 SKILLS INSTALLATION FINISHED!`);
  console.table(summary);
}

main();

