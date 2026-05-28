-- problem_votes.level 의미 변경에 따른 데이터 마이그레이션
--   이전: NULL = "Not Ratable" 의견
--   이후: 0    = "Not Ratable" (PS 문제 아님)
--         NULL = "난이도 매기지 못하겠음" (의견/태그만 남김)
UPDATE "problem_votes" SET "level" = 0 WHERE "level" IS NULL;
