const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const matter = require('gray-matter');

const HOME_DIR = os.homedir();
const GLOBAL_SKILLS_DIR = path.join(HOME_DIR, '.gemini', 'config', 'skills');
const LIBRARY_DIR = path.join(HOME_DIR, '.gemini', 'config', 'library', 'skills');
const LIBRARY_META_FILE = path.join(HOME_DIR, '.gemini', 'config', 'library', 'library.json');

fs.ensureDirSync(GLOBAL_SKILLS_DIR);
fs.ensureDirSync(LIBRARY_DIR);

const repos = [
  {
    url: "https://github.com/Leonxlnx/taste-skill",
    defaultName: "taste-skill",
    description: "Skills for premium frontend code, plus a redesign skill that audits and fixes existing UI projects"
  },
  {
    url: "https://github.com/LeoStehlik/no-slop-ui",
    defaultName: "no-slop-ui",
    description: "Design rules that stop agents from shipping glassmorphism, gradient abuse, and generic UI"
  },
  {
    url: "https://github.com/funboy322/avoid-ai-design",
    defaultName: "avoid-ai-design",
    description: "Audits AI-generated frontend and rewrites it, with a scanner you can run on every UI edit"
  },
  {
    url: "https://github.com/miqdadbadjuber/anti-slop",
    defaultName: "anti-slop",
    description: "UI rules for AI agents, plus a skill that cleans out AI-style code comments and design tropes"
  },
  {
    url: "https://github.com/Netxeo/skill-file-design",
    defaultName: "netxeo-design-skill",
    description: "100+ anti-AI design laws and UI principles for Cursor, Windsurf, Cline, and Claude"
  },
  {
    url: "https://github.com/GrubbyLee/design-guide",
    defaultName: "design-guide",
    description: "Makes your agent pick a design direction, lock a contract, build the UI and verify it"
  },
  {
    url: "https://github.com/lotfb86/web-design-skills",
    defaultName: "web-design-skills",
    description: "Claude Code skills for frontend design, responsive layouts and DESIGN.md references"
  },
  {
    url: "https://github.com/alchaincyf/huashu-design",
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

function run() {
  const meta = getLibraryMeta();
  const results = [];
  const tempDir = path.join(os.tmpdir(), 'skill_install_' + Date.now());
  fs.ensureDirSync(tempDir);

  for (const item of repos) {
    const cloneTarget = path.join(tempDir, item.defaultName);
    console.log(`\n========================================`);
    console.log(`Fetching ${item.defaultName} (${item.url})...`);

    try {
      execSync(`git clone --depth 1 "${item.url}" "${cloneTarget}"`, { stdio: 'pipe' });
    } catch (err) {
      console.error(`Failed to clone ${item.url}: ${err.message}`);
      results.push({ name: item.defaultName, status: 'error', error: err.message });
      continue;
    }

    // Inspect files
    const allFiles = fs.readdirSync(cloneTarget);
    console.log(`Files found:`, allFiles.join(', '));

    // Check if there is an existing SKILL.md
    let skillMdPath = path.join(cloneTarget, 'SKILL.md');
    let skillContent = '';
    let skillFrontmatter = {};

    if (fs.existsSync(skillMdPath)) {
      const raw = fs.readFileSync(skillMdPath, 'utf8');
      const parsed = matter(raw);
      skillFrontmatter = parsed.data || {};
      skillContent = parsed.content || '';
    } else {
      // Look for any .md file like README.md or rules file
      const candidates = ['README.md', 'rules.md', 'design-guide.md', 'skill.md'];
      let foundMd = null;
      for (const cand of candidates) {
        const p = path.join(cloneTarget, cand);
        if (fs.existsSync(p)) {
          foundMd = p;
          break;
        }
      }
      if (!foundMd) {
        // take first .md file
        const mdFile = allFiles.find(f => f.endsWith('.md'));
        if (mdFile) foundMd = path.join(cloneTarget, mdFile);
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

    // Ensure valid Antigravity frontmatter
    const skillName = (skillFrontmatter.name || item.defaultName).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const description = skillFrontmatter.description || item.description;

    const finalSkillMd = matter.stringify(skillContent, {
      name: skillName,
      description: description
    });

    // Destination 1: Global Skills Directory (~/.gemini/config/skills/<skillName>)
    const globalDest = path.join(GLOBAL_SKILLS_DIR, skillName);
    fs.ensureDirSync(globalDest);

    // Destination 2: Library (~/.gemini/config/library/skills/<skillName>)
    const libraryDest = path.join(LIBRARY_DIR, skillName);
    fs.ensureDirSync(libraryDest);

    // Copy repo contents (excluding .git)
    fs.copySync(cloneTarget, globalDest, { filter: (src) => !src.includes('.git') });
    fs.copySync(cloneTarget, libraryDest, { filter: (src) => !src.includes('.git') });

    // Write updated SKILL.md to both
    fs.writeFileSync(path.join(globalDest, 'SKILL.md'), finalSkillMd, 'utf8');
    fs.writeFileSync(path.join(libraryDest, 'SKILL.md'), finalSkillMd, 'utf8');

    // Register in library.json
    meta[skillName] = {
      name: skillName,
      targetScope: 'global',
      isActive: true,
      sourceUrl: item.url,
      description: description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log(`✅ Installed "${skillName}" globally and in Library!`);
    results.push({ name: skillName, status: 'installed', globalPath: globalDest, libraryPath: libraryDest });
  }

  saveLibraryMeta(meta);

  // Clean temp
  try {
    fs.removeSync(tempDir);
  } catch (e) {}

  console.log(`\n========================================`);
  console.log(`Installation complete! Summary:`);
  console.table(results);
}

run();

