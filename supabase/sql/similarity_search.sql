-- Function: Find similar knowledge sources using cosine similarity
-- Takes a query embedding and bot_id, returns top-k most relevant documents

CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding VECTOR(768),
  match_bot_id UUID,
  match_count INT DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  source_type TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ks.id,
    ks.title,
    ks.content,
    ks.source_type,
    1 - (ks.embedding <=> query_embedding) AS similarity
  FROM knowledge_sources ks
  WHERE ks.bot_id = match_bot_id
    AND ks.embedding IS NOT NULL
  ORDER BY ks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
