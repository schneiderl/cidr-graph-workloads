# Controlled CI graph workload

Only ci/plan.json may change during experiments. Both required jobs perform deterministic CPU work and write protected execution receipts. The catalog supplies fixed job schedules. Run a job locally with JOB_ID=<job> node ci/execute.ts using Node 24 or newer.
