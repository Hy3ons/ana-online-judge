-- Phase A backfill: copy shared workshop_problems header into each draft.
-- Idempotent: only fills drafts whose seed is still '' (the add-migration default).
-- Must run AFTER 0048 (adds draft header columns) and BEFORE the contract
-- migration that drops these columns from workshop_problems.
UPDATE workshop_drafts d
SET
	title = p.title,
	description = p.description,
	problem_type = p.problem_type,
	time_limit = p.time_limit,
	memory_limit = p.memory_limit,
	seed = p.seed,
	checker_language = p.checker_language,
	checker_path = p.checker_path,
	validator_language = p.validator_language,
	validator_path = p.validator_path,
	generator_script = p.generator_script,
	updated_at = NOW()
FROM workshop_problems p
WHERE d.workshop_problem_id = p.id
	AND d.seed = '';
