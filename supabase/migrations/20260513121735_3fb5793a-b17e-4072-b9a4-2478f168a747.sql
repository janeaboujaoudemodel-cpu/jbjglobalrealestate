UPDATE public.email_signature_presets SET address_line='Office SM1-195, Port Saeed, Deira, Dubai, UAE';
UPDATE public.email_signature_presets SET phone='+971 54 716 7107', email='Contact@JBJ.AE' WHERE name IN ('Founder / CEO','JBJ Executive Office');
UPDATE public.email_signature_presets SET phone=NULL WHERE phone ~ '000\s*000' OR phone ~ '000\s*0001' OR phone ~ '000\s*0002';
UPDATE public.email_signature_presets SET website='https://www.jbj.ae' WHERE website IS NULL OR website='';