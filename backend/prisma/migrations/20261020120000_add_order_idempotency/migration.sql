-- Existing Order rows remain valid: both fields are nullable, and MySQL permits
-- multiple NULL values in a unique index. This migration is additive only.
ALTER TABLE `order`
  ADD COLUMN `idempotencyKey` VARCHAR(191) NULL,
  ADD COLUMN `payloadHash` VARCHAR(64) NULL;

CREATE UNIQUE INDEX `Order_idempotencyKey_key`
  ON `order` (`idempotencyKey`);
