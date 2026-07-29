-- Track which product (premium / premium_plus / upgrade_to_plus) was sold per payment.
-- Mirrors the PRODUCTS catalog in api/_constants.js.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS product text;

COMMENT ON COLUMN payments.product IS 'Product slug: premium | premium_plus | upgrade_to_plus';
