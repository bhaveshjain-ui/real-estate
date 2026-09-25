-- Fictional Pune 3BHK listings for demo purposes.
-- Includes listings that recreate the scenario conflicts from the brief:
--   * Baner listings (#1, #2, #27) - far from Hinjewadi by commute
--   * Kothrud listings (#3, #4, #28) - far from Viman Nagar by commute
--   * A 5th-floor listing with no lift (#5)

insert into listings
  (source, source_url, title, locality, rent, bhk, bathrooms, floor, has_lift, parking, pet_friendly, furnished, amenities)
values
  ('manual', 'https://example.com/listings/baner-orchid-heights', '3BHK in Orchid Heights, Baner', 'Baner', 52000, 3, 2, 4, true, true, false, 'semi', array['Balcony','Gated Society','Power Backup']),
  ('manual', 'https://example.com/listings/baner-lake-view', '3BHK Lake View Apartment, Baner', 'Baner', 48000, 3, 2, 2, true, true, true, 'unfurnished', array['Gated Society','Near Metro']),
  ('manual', 'https://example.com/listings/kothrud-paud-road', '3BHK near Paud Road, Kothrud', 'Kothrud', 45000, 3, 2, 3, true, true, false, 'semi', array['Balcony','Power Backup']),
  ('manual', 'https://example.com/listings/kothrud-karve-corner', '3BHK Karve Corner, Kothrud', 'Kothrud', 50000, 3, 3, 6, true, false, false, 'furnished', array['Balcony','Gated Society','Clubhouse']),
  ('manual', 'https://example.com/listings/viman-nagar-no-lift', '3BHK Independent Building, Viman Nagar', 'Viman Nagar', 55000, 3, 2, 5, false, true, true, 'semi', array['Balcony']),
  ('manual', 'https://example.com/listings/hinjewadi-phase2-a', '3BHK Phase 2, Hinjewadi', 'Hinjewadi', 38000, 3, 2, 2, true, true, false, 'unfurnished', array['Gated Society','Power Backup']),
  ('manual', 'https://example.com/listings/hinjewadi-phase3-b', '3BHK Phase 3, Hinjewadi', 'Hinjewadi', 42000, 3, 2, 8, true, true, true, 'semi', array['Balcony','Gated Society','Near Metro','Power Backup']),
  ('manual', 'https://example.com/listings/wakad-datta-mandir', '3BHK near Datta Mandir Road, Wakad', 'Wakad', 40000, 3, 2, 3, true, true, false, 'unfurnished', array['Gated Society']),
  ('manual', 'https://example.com/listings/aundh-dp-road', '3BHK DP Road, Aundh', 'Aundh', 47000, 3, 2, 4, true, true, false, 'semi', array['Balcony','Near Metro']),
  ('manual', 'https://example.com/listings/kharadi-eon-view', '3BHK EON IT Park View, Kharadi', 'Kharadi', 58000, 3, 3, 7, true, true, true, 'furnished', array['Balcony','Gated Society','Swimming Pool','Power Backup']),
  ('manual', 'https://example.com/listings/kharadi-wagholi-road', '3BHK Wagholi Road, Kharadi', 'Kharadi', 44000, 3, 2, 2, true, false, false, 'unfurnished', array['Gated Society']),
  ('manual', 'https://example.com/listings/koregaon-park-lane6', '3BHK Lane 6, Koregaon Park', 'Koregaon Park', 65000, 3, 3, 3, true, true, true, 'furnished', array['Balcony','Gated Society','Near Metro','Swimming Pool']),
  ('manual', 'https://example.com/listings/kalyani-nagar-north-main', '3BHK North Main Road, Kalyani Nagar', 'Kalyani Nagar', 60000, 3, 3, 5, true, true, false, 'semi', array['Balcony','Power Backup']),
  ('manual', 'https://example.com/listings/magarpatta-cybercity', '3BHK Cybercity Annex, Magarpatta', 'Magarpatta', 50000, 3, 3, 4, true, true, true, 'furnished', array['Gated Society','Clubhouse','Power Backup']),
  ('manual', 'https://example.com/listings/hadapsar-solapur-road', '3BHK Solapur Road, Hadapsar', 'Hadapsar', 36000, 3, 2, 2, false, true, false, 'unfurnished', array[]::text[]),
  ('manual', 'https://example.com/listings/hadapsar-magarpatta-border', '3BHK Magarpatta Border, Hadapsar', 'Hadapsar', 39000, 3, 2, 6, true, true, false, 'semi', array['Balcony','Gated Society']),
  ('manual', 'https://example.com/listings/pimple-saudagar-central', '3BHK Central Avenue, Pimple Saudagar', 'Pimple Saudagar', 43000, 3, 2, 3, true, true, true, 'semi', array['Balcony','Near Metro']),
  ('manual', 'https://example.com/listings/balewadi-high-street', '3BHK near High Street, Balewadi', 'Balewadi', 46000, 3, 2, 9, true, true, false, 'furnished', array['Balcony','Gated Society','Power Backup']),
  ('manual', 'https://example.com/listings/bavdhan-anand-nagar', '3BHK Anand Nagar, Bavdhan', 'Bavdhan', 41000, 3, 2, 2, true, true, false, 'unfurnished', array['Gated Society']),
  ('manual', 'https://example.com/listings/karve-nagar-canal-road', '3BHK Canal Road, Karve Nagar', 'Karve Nagar', 44000, 3, 2, 3, true, true, true, 'semi', array['Balcony']),
  ('manual', 'https://example.com/listings/warje-ground-floor', '3BHK Ground Floor, Warje', 'Warje', 37000, 3, 2, 1, false, true, false, 'unfurnished', array[]::text[]),
  ('manual', 'https://example.com/listings/pashan-sus-road', '3BHK Sus Road, Pashan', 'Pashan', 45000, 3, 2, 4, true, true, false, 'semi', array['Balcony','Power Backup']),
  ('manual', 'https://example.com/listings/deccan-jm-road', '3BHK JM Road, Deccan', 'Deccan', 55000, 3, 3, 3, true, false, true, 'furnished', array['Balcony','Near Metro']),
  ('manual', 'https://example.com/listings/shivajinagar-fc-road', '3BHK FC Road, Shivajinagar', 'Shivajinagar', 58000, 3, 3, 5, true, true, false, 'semi', array['Gated Society','Near Metro','Power Backup']),
  ('manual', 'https://example.com/listings/yerwada-nagar-road', '3BHK Nagar Road, Yerwada', 'Yerwada', 42000, 3, 2, 2, true, true, true, 'unfurnished', array['Gated Society']),
  ('manual', 'https://example.com/listings/viman-nagar-clover-park', '3BHK Clover Park, Viman Nagar', 'Viman Nagar', 62000, 3, 3, 8, true, true, true, 'furnished', array['Balcony','Gated Society','Swimming Pool','Power Backup']),
  ('manual', 'https://example.com/listings/baner-pashan-link-road', '3BHK Baner-Pashan Link Road', 'Baner', 56000, 3, 3, 1, true, true, false, 'semi', array['Balcony','Gated Society','Near Metro']),
  ('manual', 'https://example.com/listings/kothrud-ideal-colony', '3BHK Ideal Colony, Kothrud', 'Kothrud', 39000, 3, 2, 2, false, true, false, 'unfurnished', array[]::text[]),
  ('manual', 'https://example.com/listings/koregaon-park-north-main', '3BHK North Main Road, Koregaon Park', 'Koregaon Park', 70000, 3, 3, 6, true, true, true, 'furnished', array['Balcony','Gated Society','Near Metro','Swimming Pool','Power Backup']),
  ('manual', 'https://example.com/listings/hinjewadi-ground-floor', '3BHK Ground Floor, Hinjewadi', 'Hinjewadi', 35000, 3, 2, 1, false, true, false, 'unfurnished', array[]::text[])
on conflict (source_url) do nothing;
