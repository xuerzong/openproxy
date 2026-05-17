WITH ranked_defaults AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY team_id
      ORDER BY updated_at DESC, created_at DESC, id DESC
    ) AS row_num
  FROM api_key_folders
  WHERE is_default = true
)
UPDATE api_key_folders AS folders
SET is_default = false,
    updated_at = now()
FROM ranked_defaults
WHERE folders.id = ranked_defaults.id
  AND ranked_defaults.row_num > 1;
