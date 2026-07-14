-- The runtime now consistently uses the public schema. If this database was
-- previously deployed with schema=scilab_api, copy its data once after the
-- public-schema migrations have created the destination tables. The legacy
-- schema is intentionally retained as a rollback/audit copy.
DO $$
DECLARE
  public_has_data BOOLEAN;
BEGIN
  IF to_regclass('public.user_account') IS NULL
    OR to_regclass('scilab_api.user_account') IS NULL THEN
    RETURN;
  END IF;

  EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.user_account LIMIT 1)'
  INTO public_has_data;

  IF public_has_data THEN
    RETURN;
  END IF;

  INSERT INTO public.user_account (
    user_id, email, password_hash, type, status, role, last_name, first_name,
    url_image, date_of_birth, gender, created_at, updated_at
  )
  SELECT
    user_id, email, password_hash, type::text::public.auth_provider,
    status::text::public.status_account, role::text::public.role_account,
    last_name, first_name, url_image, date_of_birth,
    gender::text::public.gender, created_at, updated_at
  FROM scilab_api.user_account
  ON CONFLICT DO NOTHING;

  INSERT INTO public.system_config (
    config_id, api_name, api_endpoint, api_key_encrypted, sync_frequency,
    is_active, last_tested_at, created_at, updated_at
  )
  SELECT
    config_id, api_name, api_endpoint, api_key_encrypted,
    sync_frequency::text::public.sync_frequency, is_active, last_tested_at,
    created_at, updated_at
  FROM scilab_api.system_config
  ON CONFLICT DO NOTHING;

  INSERT INTO public.ranking_metric (
    metric_id, code, display_name, metric_type, description
  )
  SELECT
    metric_id, code, display_name,
    metric_type::text::public.ranking_metric_type, description
  FROM scilab_api.ranking_metric
  ON CONFLICT DO NOTHING;

  INSERT INTO public.subject_area (
    subject_area_id, display_name, description
  )
  SELECT subject_area_id, display_name, description
  FROM scilab_api.subject_area
  ON CONFLICT DO NOTHING;

  INSERT INTO public.subject_category (
    subject_category_id, subject_area_id, display_name, description
  )
  SELECT subject_category_id, subject_area_id, display_name, description
  FROM scilab_api.subject_category
  ON CONFLICT DO NOTHING;

  INSERT INTO public.auth_session (
    auth_session_id, user_id, access_token_id_hash, refresh_token_hash,
    issued_at, access_token_expires_at, refresh_token_expires_at, revoked_at,
    last_used_at, rotated_at, created_at
  )
  SELECT
    auth_session_id, user_id, access_token_id_hash, refresh_token_hash,
    issued_at, access_token_expires_at, refresh_token_expires_at, revoked_at,
    last_used_at, rotated_at, created_at
  FROM scilab_api.auth_session
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_bookmark (
    user_bookmark_id, user_id, article_id, created_at
  )
  SELECT user_bookmark_id, user_id, article_id, created_at
  FROM scilab_api.user_bookmark
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_follow (
    user_follow_id, user_id, object_type, object_id, notify_mode, created_at
  )
  SELECT
    user_follow_id, user_id, object_type::text::public.follow_object_type,
    object_id, notify_mode::text::public.notify_mode, created_at
  FROM scilab_api.user_follow
  ON CONFLICT DO NOTHING;

  INSERT INTO public.notification (
    notification_id, user_id, title, message, related_object_type,
    related_object_id, is_read, created_at, read_at
  )
  SELECT
    notification_id, user_id, title, message,
    related_object_type::text::public.notification_object_type,
    related_object_id, is_read, created_at, read_at
  FROM scilab_api.notification
  ON CONFLICT DO NOTHING;

  INSERT INTO public.sync_log (
    sync_log_id, config_id, source, job_type, started_at, finished_at,
    total_fetched, total_inserted, total_updated, total_errors, orphan_found,
    orphan_processed, status, error_detail, created_at
  )
  SELECT
    sync_log_id, config_id, source::text::public.sync_source,
    job_type::text::public.sync_job_type, started_at, finished_at,
    total_fetched, total_inserted, total_updated, total_errors, orphan_found,
    orphan_processed, status::text::public.sync_status, error_detail, created_at
  FROM scilab_api.sync_log
  ON CONFLICT DO NOTHING;

  INSERT INTO public.journal_ranking (
    journal_ranking_id, journal_id, subject_category_id, metric_id, source,
    year, scope_key, value_txt, value_int, value_float, created_at
  )
  SELECT
    journal_ranking_id, journal_id::text, subject_category_id, metric_id,
    source::text::public.ranking_source, year, scope_key, value_txt,
    value_int, value_float, created_at
  FROM scilab_api.journal_ranking
  ON CONFLICT DO NOTHING;
END $$;
