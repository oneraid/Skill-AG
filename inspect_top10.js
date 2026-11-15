const AdmZip = require('adm-zip');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const repos = [
  { owner: "obra", repo: "superpowers", name: "superpowers" },
  { owner: "mattpocock", repo: "skills", name: "mattpocock-skills" },
  { owner: "multica-ai", repo: "andrej-karpathy-skills", name: "karpathy-skills" },
  { owner: "anthropics", repo: "skills", name: "anthropic-skills" },
  { owner: "DietrichGebert", repo: "ponytail", name: "ponytail" },
  { owner: "nextlevelbuilder", repo: "ui-ux-pro-max-skill", name: "ui-ux-pro-max-skill" },
  { owner: "safishamsi", repo: "graphify", name: "graphify" },
  { owner: "JuliusBrussee", repo: "caveman", name: "caveman" },
  { owner: "addyosmani", repo: "agent-skills", name: "addyosmani-agent-skills" },
  { owner: "Leonxlnx", repo: "taste-skill", name: "taste-skill" }
];

async function inspect() {
  const tempDir = path.join(os.tmpdir(), 'top10_inspect_' + Date.now());
  fs.ensureDirSync(tempDir);

  for (const item of repos) {
    console.log(`\n----------------------------------------`);
    console.log(`Inspecting ${item.name} (${item.owner}/${item.repo})...`);
    const tempZip = path.join(tempDir, `${item.name}.zip`);
    const tempExt = path.join(tempDir, item.name);

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
      console.log(`❌ Failed to download zip for ${item.owner}/${item.repo}`);
      continue;
    }

    fs.ensureDirSync(tempExt);
    const zip = new AdmZip(tempZip);
    zip.extractAllTo(tempExt, true);

    const entries = fs.readdirSync(tempExt);
    const rootEntry = entries[0] ? path.join(tempExt, entries[0]) : tempExt;
    const sourceDir = fs.statSync(rootEntry).isDirectory() ? rootEntry : tempExt;

    const files = fs.readdirSync(sourceDir);
    console.log(`Root files:`, files.slice(0, 15).join(', '));

    // Check if skills/ subdirectory exists
    const skillsSub = path.join(sourceDir, 'skills');
    if (fs.existsSync(skillsSub) && fs.statSync(skillsSub).isDirectory()) {
      const subSkills = fs.readdirSync(skillsSub);
      console.log(`Sub-skills found in skills/:`, subSkills.join(', '));
    }
  }
}

inspect();

