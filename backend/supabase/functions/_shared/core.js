import { createHash, randomBytes } from 'node:crypto';
export const authEmail = id => `${id.toLowerCase()}@auth.britishmidlandvirtual.internal`;
export const hashToken = token => createHash('sha256').update(token).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');
export function pilotId(value) {
  const id = String(value || '').trim().toUpperCase();
  if (!/^BMA\d{4}$/.test(id)) throw new Error('Enter a BMA number such as BMA0001.');
  return id;
}
export const standardPassword = id => `${pilotId(id)}!`;
export const hasManagementRole = (roles,managementRoles) =>
  Array.isArray(roles) && managementRoles.some(id=>roles.includes(id));
export function canReview({guildId, channelId, roles, actorId, applicantId}, config) {
  return guildId === config.guild && channelId === config.channel &&
    hasManagementRole(roles,config.management) && actorId !== applicantId;
}
export function configuration(env) {
  const required = ['DISCORD_TOKEN','DISCORD_APPLICATION_ID','DISCORD_GUILD_ID',
    'DISCORD_MANAGEMENT_ROLE_IDS','DISCORD_PILOT_ROLE_ID','DISCORD_APPROVAL_CHANNEL_ID',
    'SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SERVICE_ROLE_KEY','DATABASE_URL','PUBLIC_ORIGIN','PILOT_DEFAULT_ROLE'];
  for (const key of required) if (!env[key]) throw new Error(`Missing ${key}`);
  for (const key of required.filter(k => k.endsWith('_ID')))
    if (!/^\d{17,20}$/.test(env[key])) throw new Error(`Invalid ${key}`);
  const origin = new URL(env.PUBLIC_ORIGIN);
  if (origin.protocol !== 'https:' || origin.origin !== env.PUBLIC_ORIGIN) throw new Error('PUBLIC_ORIGIN must be an HTTPS origin without a trailing slash.');
  if (new URL(env.SUPABASE_URL).protocol !== 'https:') throw new Error('Supabase HTTPS required');
  const management = env.DISCORD_MANAGEMENT_ROLE_IDS.split(',').map(id=>id.trim());
  if(management.some(id=>!/^\d{17,20}$/.test(id)))throw new Error('Invalid management role IDs');
  if (management.includes(env.DISCORD_PILOT_ROLE_ID) || management.includes(env.DISCORD_GUILD_ID))
    throw new Error('Management must be a distinct, restricted role.');
  return { guild:env.DISCORD_GUILD_ID, channel:env.DISCORD_APPROVAL_CHANNEL_ID,
    management, pilot:env.DISCORD_PILOT_ROLE_ID, origin:origin.origin };
}
