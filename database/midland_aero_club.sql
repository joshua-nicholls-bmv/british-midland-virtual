-- Midland Aero Club. Apply before distributing the MAC-capable BMAcars build.
-- Existing airline purposes, scoring, pilot totals, ranks and permissions stay intact.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.pireps DROP CONSTRAINT pireps_purpose_check;
ALTER TABLE public.pireps ADD CONSTRAINT pireps_purpose_check CHECK
 (flight_purpose IS NULL OR flight_purpose IN ('SCHEDULED','POSITIONING','TRAINING','CHARTER','CUSTOM','MAC'));
ALTER TABLE public.active_flights DROP CONSTRAINT active_flights_purpose_check;
ALTER TABLE public.active_flights ADD CONSTRAINT active_flights_purpose_check CHECK
 (flight_purpose IS NULL OR flight_purpose IN ('SCHEDULED','POSITIONING','TRAINING','CHARTER','CUSTOM','MAC'));
ALTER TABLE public.flight_notification_events DROP CONSTRAINT flight_notification_events_purpose_check;
ALTER TABLE public.flight_notification_events ADD CONSTRAINT flight_notification_events_purpose_check CHECK
 (flight_purpose IS NULL OR flight_purpose IN ('SCHEDULED','POSITIONING','TRAINING','CHARTER','CUSTOM','MAC'));

-- Validate both directions: club registrations cannot masquerade as airline flights,
-- and unrelated registrations cannot be submitted as MAC.
DO $setup$
DECLARE target text;
BEGIN
 FOREACH target IN ARRAY ARRAY['pireps','active_flights'] LOOP
  EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (
    CASE WHEN upper(btrim(registration)) IN (''G-WARB'',''G-JIMH'',''G-SHED'',''G-BLZH'',''G-NWFG'',''G-RGAH'')
      OR flight_purpose = ''MAC'' OR flight_number = ''MAC''
    THEN coalesce(flight_purpose = ''MAC'' AND flight_number = ''MAC'' AND departure = ''EGBO''
      AND upper(btrim(registration)) IN (''G-WARB'',''G-JIMH'',''G-SHED'',''G-BLZH'',''G-NWFG'',''G-RGAH''),false)
    ELSE true END)', target, target || '_mac_identity_check');
 END LOOP;
END $setup$;

-- No new access grants or privileged functions. Existing fleet access is reused.
CREATE FUNCTION public.mac_fixed_home() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $function$
BEGIN
 IF NEW.registration IN ('G-WARB','G-JIMH','G-SHED','G-BLZH','G-NWFG','G-RGAH') THEN
  NEW.fleet_class := 'MAC';
  NEW.current_location := 'EGBO';
  NEW.lifecycle_status := 'CURRENT';
  NEW.operational_status := 'AVAILABLE';
 END IF;
 RETURN NEW;
END $function$;
REVOKE ALL ON FUNCTION public.mac_fixed_home() FROM PUBLIC;
CREATE TRIGGER mac_fixed_home BEFORE INSERT OR UPDATE ON public.fleet
 FOR EACH ROW EXECUTE FUNCTION public.mac_fixed_home();

-- Fail rather than overwrite any registration assigned since preflight inspection.
INSERT INTO public.fleet(registration,aircraft_type,aircraft_name,fleet_class,lifecycle_status,operational_status,current_location) VALUES
 ('G-WARB','PA-28','Loan — The Flying School','MAC','CURRENT','AVAILABLE','EGBO'),
 ('G-JIMH','Reims-Cessna F152','Loan — The Flying School','MAC','CURRENT','AVAILABLE','EGBO'),
 ('G-SHED','PA-28','Club aircraft','MAC','CURRENT','AVAILABLE','EGBO'),
 ('G-BLZH','C152','Club aircraft','MAC','CURRENT','AVAILABLE','EGBO'),
 ('G-NWFG','C172','Club aircraft','MAC','CURRENT','AVAILABLE','EGBO'),
 ('G-RGAH','DA40 NG','Club aircraft','MAC','CURRENT','AVAILABLE','EGBO');
COMMIT;
