CREATE OR REPLACE FUNCTION public.consume_ai_rate_limit(
  request_limit integer DEFAULT 10,
  window_seconds integer DEFAULT 60
)
RETURNS TABLE(allowed boolean, retry_after_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  app_user_id uuid;
  request_time timestamptz := clock_timestamp();
  rate_limit public.ai_rate_limits%ROWTYPE;
BEGIN
  IF request_limit <= 0 OR window_seconds <= 0 THEN
    RAISE EXCEPTION 'Rate limit configuration must be positive';
  END IF;

  app_user_id := public.requesting_app_user_id();

  IF app_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.ai_rate_limits (
    user_id,
    window_started_at,
    request_count,
    updated_at
  ) VALUES (
    app_user_id,
    request_time,
    1,
    request_time
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    window_started_at = CASE
      WHEN request_time >= ai_rate_limits.window_started_at
        + make_interval(secs => window_seconds)
        THEN request_time
      ELSE ai_rate_limits.window_started_at
    END,
    request_count = CASE
      WHEN request_time >= ai_rate_limits.window_started_at
        + make_interval(secs => window_seconds)
        THEN 1
      ELSE LEAST(ai_rate_limits.request_count + 1, request_limit + 1)
    END,
    updated_at = request_time
  RETURNING * INTO rate_limit;

  allowed := rate_limit.request_count <= request_limit;
  retry_after_seconds := CASE
    WHEN allowed THEN 0
    ELSE GREATEST(
      1,
      CEIL(
        EXTRACT(
          EPOCH FROM (
            rate_limit.window_started_at
              + make_interval(secs => window_seconds)
              - request_time
          )
        )
      )::integer
    )
  END;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_rate_limit(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_ai_rate_limit(integer, integer) TO authenticated;
