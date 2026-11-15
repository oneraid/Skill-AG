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
    owner: "Leonxlnx",
    repo: "taste-skill",
    defaultName: "taste-skill",
    description: "Skills for premium frontend code, plus a redesign skill that audits and fixes existing UI projects"
  },
  {
    owner: "LeoStehlik",
    repo: "no-slop-ui",
    defaultName: "no-slop-ui",
    description: "Design rules that stop agents from shipping glassmorphism, gradient abuse, and generic UI"
  },
  {
    owner: "funboy322",
    repo: "avoid-ai-design",
    defaultName: "avoid-ai-design",
    description: "Audits AI-generated frontend and rewrites it, with a scanner you can run on every UI edit"
  },
  {
    owner: "miqdadbadjuber",
    repo: "anti-slop",
    defaultName: "anti-slop",
    description: "UI rules for AI agents, plus a skill that cleans out AI-style code comments and design tropes"
  },
  {
    owner: "Netxeo",
    repo: "skill-file-design",
    defaultName: "netxeo-design-skill",
    description: "100+ anti-AI design laws and UI principles for Cursor, Windsurf, Cline, and Claude"
  },
  {
    owner: "GrubbyLee",
    repo: "design-guide",
    defaultName: "design-guide",
    description: "Makes your agent pick a design direction, lock a contract, build the UI and verify it"
  },
  {
    owner: "lotfb86",
    repo: "web-design-skills",
    defaultName: "web-design-skills",
    description: "Claude Code skills for frontend design, responsive layouts and DESIGN.md references"
  },
  {
    owner: "alchaincyf",
    repo: "huashu-design",
    defaultName: "huashu-design",
    description: "A design skill for prototypes, slides and motion, with MP4 export"
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

function installRepo(item) {
  console.log(`\n========================================`);
  console.log(`[START] Downloading ${item.defaultName} (${item.owner}/${item.repo})...`);

  const tempZip = path.join(os.tmpdir(), `dl_${item.defaultName}_${Date.now()}.zip`);
  const tempExtract = path.join(os.tmpdir(), `ext_${item.defaultName}_${Date.now()}`);

  try {
    // Try main branch
    let url = `https://github.com/${item.owner}/${item.repo}/archive/refs/heads/main.zip`;
    execSync(`curl.exe -sL -f -o "${tempZip}" "${url}"`, { stdio: 'pipe' });
  } catch (err) {
    try {
      // Fallback to master branch
      let url = `https://github.com/${item.owner}/${item.repo}/archive/refs/heads/master.zip`;
      execSync(`curl.exe -sL -f -o "${tempZip}" "${url}"`, { stdio: 'pipe' });
    } catch (err2) {
      throw new Error(`Could not download zip archive for ${item.owner}/${item.repo}`);
    }
  }

  // Extract
  fs.ensureDirSync(tempExtract);
  const zip = new AdmZip(tempZip);
  zip.extractAllTo(tempExtract, true);

  const entries = fs.readdirSync(tempExtract);
  const rootEntry = entries[0] ? path.join(tempExtract, entries[0]) : tempExtract;
  const sourceDir = fs.statSync(rootEntry).isDirectory() ? rootEntry : tempExtract;

  const filesInSource = fs.readdirSync(sourceDir);
  console.log(`Found files in ${item.defaultName}:`, filesInSource.join(', '));

  // Find SKILL.md or Markdown instructions
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
    // Look for README.md or rules file
    const cand = ['README.md', 'rules.md', 'design-guide.md', 'skill.md'];
    let foundMd = null;
    for (const c of cand) {
      const p = path.join(sourceDir, c);
      if (fs.existsSync(p)) {
        foundMd = p;
        break;
      }
    }
    if (!foundMd) {
      const md = filesInSource.find(f => f.endsWith('.md'));
      if (md) foundMd = path.join(sourceDir, md);
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
      skillContent = `# ${item.defaultName}\n\n${item.description}\n`;
    }
  }

  const skillName = item.defaultName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
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
      const res = installRepo(item);
      meta[res.skillName] = {
        name: res.skillName,
        targetScope: 'global',
        isActive: true,
        sourceUrl: `https://github.com/${item.owner}/${item.repo}`,
        description: res.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      console.log(`✅ [SUCCESS] ${res.skillName} installed to Global & Library!`);
      summary.push({ name: res.skillName, status: 'INSTALLED', globalPath: res.globalDest });
    } catch (err) {
      console.error(`❌ [FAILED] ${item.defaultName}: ${err.message}`);
      summary.push({ name: item.defaultName, status: 'FAILED', error: err.message });
    }
  }

  saveLibraryMeta(meta);

  console.log(`\n========================================`);
  console.log(`ALL SKILLS INSTALLATION FINISHED!`);
  console.table(summary);
}

main();
