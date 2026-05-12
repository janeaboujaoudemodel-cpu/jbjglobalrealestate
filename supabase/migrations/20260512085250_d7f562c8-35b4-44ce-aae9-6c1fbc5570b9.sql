DO $$
DECLARE
  v_pairs text[][] := ARRAY[
    ARRAY['email_template_library','body_html'],
    ARRAY['developer_messages','content'],
    ARRAY['broker_messages','content'],
    ARRAY['crm_client_notes','body'],
    ARRAY['crm_brokerage_notes','body'],
    ARRAY['crm_notes','body'],
    ARRAY['crm_brokerage_actions','body'],
    ARRAY['hunt_templates','content'],
    ARRAY['hunt_outreach','content'],
    ARRAY['hr_training_modules','content'],
    ARRAY['hr_modules','content'],
    ARRAY['executive_knowledge_base','content'],
    ARRAY['assistant_communications','content'],
    ARRAY['posts','content'],
    ARRAY['notifications','body'],
    ARRAY['rel_email_campaigns','body_html']
  ];
  v_pair text[];
BEGIN
  FOREACH v_pair SLICE 1 IN ARRAY v_pairs LOOP
    EXECUTE format(
      'UPDATE public.%I SET %I = replace(replace(replace(%I, %L, %L), %L, %L), %L, %L) WHERE %I ILIKE %L OR %I ILIKE %L',
      v_pair[1], v_pair[2],
      v_pair[2], '+971 56 591 1000', '+971 54 716 7107',
      '+971565911000', '+971547167107',
      '565911000', '547167107',
      v_pair[2], '%565911000%',
      v_pair[2], '%56 591 1000%'
    );
  END LOOP;
END $$;