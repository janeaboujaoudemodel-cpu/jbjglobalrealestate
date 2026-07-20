
INSERT INTO public.branded_email_templates (owner_id, name, subject, body_html, brief, category)
SELECT ur.user_id, t.name, t.subject, t.body_html, t.brief, t.category
FROM public.user_roles ur
CROSS JOIN (VALUES
  (
    'Developer · Partnership Introduction',
    'JBJ Global Real Estate — a strategic partnership for {{developer_name}}',
    '<p style="margin:0 0 14px;">Dear team at {{developer_name}},</p><p style="margin:0 0 14px;">I am reaching out personally from JBJ Global Real Estate — a Dubai-based boutique brokerage placing UHNW investors into off-plan and ready inventory across the emirates. Your portfolio has consistently stood out for its design integrity and delivery track record, and I would like to propose a preferred partnership.</p><p style="margin:0 0 14px;">In exchange for early allocation on new launches, we commit to curated buyer introductions, private previews for our top clients, and co-branded briefings hosted from our HQ.</p><p style="margin:0 0 14px;">May I request a 20-minute call this week to align on your Q1 pipeline?</p><p style="margin:0 0 6px;">Warm regards,</p><p style="margin:0;">Jane Bou Jaoude — JBJ GLOBAL REAL ESTATE</p>',
    'Warm partnership introduction to a UAE developer, positioning JBJ as a boutique UHNW channel',
    'Developer'
  ),
  (
    'Developer · Launch Invitation',
    'Private preview invitation — {{launch_name}}',
    '<p style="margin:0 0 14px;">Dear {{developer_name}},</p><p style="margin:0 0 14px;">JBJ Global Real Estate is honoured to invite your team to co-host a private preview of {{launch_name}} at our Dubai headquarters. We will present the project to a hand-selected group of our top 20 clients — none of whom will be introduced without your written approval.</p><p style="margin:0 0 14px;">Kindly share your preferred date and any collateral you would like us to feature.</p><p style="margin:0 0 6px;">With appreciation,</p><p style="margin:0;">Jane Bou Jaoude — JBJ GLOBAL REAL ESTATE</p>',
    'Invite developer to host a private launch preview at JBJ HQ',
    'Developer'
  ),
  (
    'Developer · Briefing Follow-up',
    'Thank you for your briefing — next steps',
    '<p style="margin:0 0 14px;">Dear {{developer_name}},</p><p style="margin:0 0 14px;">Thank you for briefing our team on your latest inventory. The material was well-received internally, and we have already begun matching qualified clients to the units highlighted.</p><p style="margin:0 0 14px;">Please expect a shortlist of pre-qualified buyer profiles from our side within the next five working days. In parallel, could you share updated payment plans and any exclusive incentives available to preferred brokerages?</p><p style="margin:0 0 6px;">Sincerely,</p><p style="margin:0;">Jane Bou Jaoude — JBJ GLOBAL REAL ESTATE</p>',
    'Post-briefing thank you with commitment to send qualified buyer shortlist',
    'Developer'
  ),
  (
    'Brokerage · Referral Partnership',
    'A quiet referral partnership — JBJ Global Real Estate × {{brokerage_name}}',
    '<p style="margin:0 0 14px;">Dear {{brokerage_name}},</p><p style="margin:0 0 14px;">At JBJ Global Real Estate we are curating a small number of trusted brokerage partners for off-market cross-referrals — buyer leads we cannot service ourselves, in exchange for the same discretion in return.</p><p style="margin:0 0 14px;">If a low-noise, high-trust referral flow is of interest, I would welcome a short call to align on commissions, service standards and shared clients.</p><p style="margin:0 0 6px;">Kind regards,</p><p style="margin:0;">Jane Bou Jaoude — JBJ GLOBAL REAL ESTATE</p>',
    'Discreet referral partnership pitch to another Dubai brokerage',
    'Brokerage'
  ),
  (
    'Brokerage · Registered Follow-up',
    'Confirming your JBJ Marketplace registration',
    '<p style="margin:0 0 14px;">Dear team at {{brokerage_name}},</p><p style="margin:0 0 14px;">Welcome — your brokerage is now registered on the JBJ Global Real Estate marketplace. Your account will receive weekly access to our verified developer inventory, exclusive launch invites and priority commission structures.</p><p style="margin:0 0 14px;">Our relationship desk will reach out shortly to walk your senior brokers through the platform.</p><p style="margin:0 0 6px;">Warmly,</p><p style="margin:0;">Jane Bou Jaoude — JBJ GLOBAL REAL ESTATE</p>',
    'Confirmation email once a brokerage is registered on the JBJ marketplace',
    'Brokerage'
  ),
  (
    'Brokerage · Not Registered Nudge',
    'A quick note before we finalise our Q1 partner list',
    '<p style="margin:0 0 14px;">Dear {{brokerage_name}},</p><p style="margin:0 0 14px;">We are finalising the JBJ Global Real Estate preferred brokerage list for the quarter. Your firm is on our shortlist, but we have not yet received your registration.</p><p style="margin:0 0 14px;">If you would like access to our developer inventory, launch invites and shared client pipeline, please reply and I will share the registration link privately.</p><p style="margin:0 0 6px;">Best,</p><p style="margin:0;">Jane Bou Jaoude — JBJ GLOBAL REAL ESTATE</p>',
    'Gentle nudge to unregistered brokerage before quarterly partner list is finalised',
    'Brokerage'
  )
) AS t(name, subject, body_html, brief, category)
WHERE ur.role = 'owner'
  AND NOT EXISTS (
    SELECT 1 FROM public.branded_email_templates x
    WHERE x.owner_id = ur.user_id AND x.name = t.name
  );
