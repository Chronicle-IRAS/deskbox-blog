import { readFileSync, writeFileSync } from 'node:fs';

const policy = readFileSync('deploy/csp-policy.txt', 'utf8').trim();

const outputs = [
  {
    template: 'deploy/headers.example',
    output: 'dist/_headers',
  },
  {
    template: 'deploy/nginx.example.conf',
    output: 'dist/nginx.conf',
  },
  {
    template: 'deploy/nginx-security-headers.example',
    output: 'dist/nginx-security-headers.conf',
  },
];

for (const { template, output } of outputs) {
  const source = readFileSync(template, 'utf8');
  const rendered = source.replaceAll('{{CSP_POLICY}}', policy);

  if (rendered.includes('{{')) {
    throw new Error(`${template} contains an unresolved placeholder.`);
  }

  writeFileSync(output, rendered);
  console.log(`Rendered ${output}`);
}
