// 构建并把 dist/ 推送到 gh-pages 分支（GitHub Pages：Deploy from a branch → gh-pages / root）
// 用法：npm run deploy
import { execSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';

const run = (cmd, cwd = process.cwd()) => execSync(cmd, { stdio: 'inherit', cwd });
const remote = execSync('git remote get-url origin').toString().trim();
const sha = execSync('git rev-parse --short HEAD').toString().trim();
const name = execSync('git config user.name').toString().trim();
const email = execSync('git config user.email').toString().trim();

run('npm run build');
writeFileSync('dist/.nojekyll', '');
rmSync('dist/.git', { recursive: true, force: true });
run('git init -q -b gh-pages', 'dist');
run('git add -A', 'dist');
run(`git -c user.name="${name}" -c user.email="${email}" commit -q -m "deploy: ${sha}"`, 'dist');
run(`git push -q --force ${remote} gh-pages`, 'dist');
rmSync('dist/.git', { recursive: true, force: true });
console.log(`\n已发布 ${sha} 到 gh-pages`);
