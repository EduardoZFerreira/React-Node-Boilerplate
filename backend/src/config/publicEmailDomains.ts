// Domains excluded from the "auto-create a tenant from the email domain"
// registration flow (see UserService.createUser) — a shared personal-email
// provider is not a company, so it must never be treated as one organization.
// This is a starting point, not exhaustive — tune it for your market (e.g.
// add regional providers) when forking this boilerplate.
export const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.com.br',
  'hotmail.com',
  'hotmail.com.br',
  'outlook.com',
  'outlook.com.br',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'gmx.com',
  'yandex.com',
  'bol.com.br',
  'uol.com.br',
  'terra.com.br',
  'ig.com.br',
]);
