-- Rebuild the research_chunks ivfflat index now that the table is populated.
-- The original index (0023) was created on an empty table → centroids trained on
-- zero rows. Dropping + recreating with ~4500 rows present trains proper centroids
-- (equivalent to REINDEX for ivfflat's purpose). lists=100 suits a few thousand rows.
-- ivfflat build needs ~63MB; prod default maintenance_work_mem is 32MB → bump it
-- for this session so the CREATE succeeds on the small tier.
SET maintenance_work_mem = '128MB';
DROP INDEX IF EXISTS research_chunks_embedding_idx;
CREATE INDEX research_chunks_embedding_idx
  ON research_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
RESET maintenance_work_mem;
