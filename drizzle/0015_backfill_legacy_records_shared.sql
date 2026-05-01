-- Legacy records (created before the crowd_data sharing toggle existed) were
-- implicitly part of the public /ev aggregate as long as they were approved.
-- Mark all approved-but-unshared rows as shared to preserve historical display.
-- New records flow through the explicit isShared toggle.
UPDATE charging_records
SET is_shared = 1
WHERE approval_status = 'approved' AND is_shared = 0;
