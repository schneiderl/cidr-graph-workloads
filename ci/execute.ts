import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { derive } from '../src/derive.ts';
const sha = (value: string) => createHash('sha256').update(value).digest('hex');
const fixture = JSON.parse(readFileSync('ci/case.json', 'utf8'));
const plan = JSON.parse(readFileSync('ci/plan.json', 'utf8'));
assert.deepEqual(Object.keys(plan).sort(), ['schemaVersion', 'variantId']);
assert.equal(plan.schemaVersion, 2);
assert.ok(Object.hasOwn(fixture.variants, plan.variantId), 'approved variant');
const jobId = process.env.JOB_ID;
assert.ok(jobId && Object.hasOwn(fixture.requiredJobs, jobId), 'required job');
const required = fixture.requiredJobs[jobId];
const workflow = fixture.variants[plan.variantId];
if (process.env.GITHUB_ACTIONS === 'true') {
  const workflowRef = process.env.GITHUB_WORKFLOW_REF ?? '';
  assert.equal(workflowRef.split('/.github/workflows/')[1]?.split('@')[0], workflow, 'selected workflow identity');
  assert.ok(process.env.GITHUB_RUN_ID && process.env.GITHUB_SHA && process.env.GITHUB_RUN_ATTEMPT);
}
const run = (id: string, expected: string) => {
  const actual = sha(derive(fixture.seed, id, fixture.iterations));
  assert.equal(actual, expected, 'protected output');
  return actual;
};
const tests = Object.entries(required.tests).map(([id, expected]) => ({id, output: run(id, expected as string), status: 'pass'}));
const outputs = Object.fromEntries(Object.entries(required.outputs).map(([id, expected]) => [id, run(id, expected as string)]));
const receipt = {schemaVersion: 2, jobId, runId: process.env.GITHUB_RUN_ID ?? 'local', attempt: Number(process.env.GITHUB_RUN_ATTEMPT ?? '1'), commit: process.env.GITHUB_SHA ?? 'local', planDigest: sha(JSON.stringify(plan, null, 2) + '\n'), variantId: plan.variantId, workflow, tests, outputs};
mkdirSync('execution-' + jobId, {recursive:true});
writeFileSync('execution-' + jobId + '/execution.json', JSON.stringify(receipt) + '\n');
console.log(JSON.stringify({jobId, tests: tests.map(test => test.id), outputs: Object.keys(outputs)}));
