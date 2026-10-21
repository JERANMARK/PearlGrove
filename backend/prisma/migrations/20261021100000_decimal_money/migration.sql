-- Convert monetary values to fixed precision after verifying the local backup
-- and staging restore. MySQL converts existing values to two decimal places.
ALTER TABLE `product`
  MODIFY `price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  MODIFY `discountPrice` DECIMAL(12, 2) NULL;

ALTER TABLE `order`
  MODIFY `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE `orderitem`
  MODIFY `price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  MODIFY `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0;
