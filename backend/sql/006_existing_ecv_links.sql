-- Applied as allow_existing_ecv_account_links. Only existing ECV links are permitted.
alter table bmv_registration.applications drop constraint applications_pilot_id_check;
alter table bmv_registration.applications add constraint applications_pilot_id_check
check (pilot_id ~ '^BMA[0-9]{4}$' or (kind='link' and pilot_id ~ '^ECV[0-9]{4}$'));
