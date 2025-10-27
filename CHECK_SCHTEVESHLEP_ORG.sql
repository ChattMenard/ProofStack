-- Check schteveshlep's organization membership
SELECT 
  om.id,
  om.organization_id,
  om.user_id as profile_id_in_org_members,
  om.role,
  p.id as actual_profile_id,
  p.email,
  p.auth_uid,
  o.name as org_name
FROM organization_members om
LEFT JOIN profiles p ON om.user_id = p.id
LEFT JOIN organizations o ON om.organization_id = o.id
WHERE p.email = 'schteveshlep@protonmail.com' 
   OR om.organization_id = '1165940e-5926-4298-8c82-926a1b08ace5';

-- Also check if there's an organization_members record pointing to a non-existent profile
SELECT 
  om.*,
  o.name as org_name
FROM organization_members om
LEFT JOIN organizations o ON om.organization_id = o.id
WHERE om.organization_id = '1165940e-5926-4298-8c82-926a1b08ace5';
