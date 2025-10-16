-- Drop old check constraints that limit to 100 characters
ALTER TABLE brand_hub DROP CONSTRAINT IF EXISTS brand_hub_what_you_sell_check;
ALTER TABLE brand_hub DROP CONSTRAINT IF EXISTS brand_hub_what_makes_unique_check;
ALTER TABLE brand_hub DROP CONSTRAINT IF EXISTS brand_hub_target_customer_check;

-- Add new check constraints for 250 characters
ALTER TABLE brand_hub 
  ADD CONSTRAINT brand_hub_what_you_sell_check 
  CHECK (char_length(what_you_sell) <= 250);

ALTER TABLE brand_hub 
  ADD CONSTRAINT brand_hub_what_makes_unique_check 
  CHECK (char_length(what_makes_unique) <= 250);

ALTER TABLE brand_hub 
  ADD CONSTRAINT brand_hub_target_customer_check 
  CHECK (char_length(target_customer) <= 250);