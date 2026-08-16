alter table public.analytics_events
drop constraint if exists analytics_events_event_name_check;

alter table public.analytics_events
add constraint analytics_events_event_name_check check (
  event_name in (
    'page_view',
    'product_view',
    'product_details_open',
    'customizer_open',
    'customizer_upload',
    'customizer_request',
    'contact_click',
    'facebook_click',
    'email_click',
    'shop_click',
    'reseller_modal_open',
    'reseller_email_click',
    'reseller_facebook_click'
  )
);
