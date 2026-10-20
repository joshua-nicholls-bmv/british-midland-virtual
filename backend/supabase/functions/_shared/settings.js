// Non-secret, user-approved BMV configuration. Token is entered privately in Edge secrets.
const defaults={
 DISCORD_PUBLIC_KEY:'050535e033a7fd3dc82fcd2826ae5911b5dd90b666dfa559a874c3015836eedb',
 DISCORD_APPLICATION_ID:'1550252275862085833',DISCORD_GUILD_ID:'1524310750410313808',
 DISCORD_MANAGEMENT_ROLE_IDS:'1533157539838038176,1524313823337648128',
 DISCORD_PILOT_ROLE_ID:'1528102947802841158',DISCORD_APPROVAL_CHANNEL_ID:'1526469962460565518',
 LINK_PAGE_URL:'https://britishmidlandvirtual.co.uk/registration/',
 DISCORD_VERIFIED_ROLE_ID:'1560397538119655485'
};
export function setting(name){
 const value=Deno.env.get(`BMV_REG_${name}`) || (name==='DISCORD_TOKEN' ? Deno.env.get('DISCORD_BOT_TOKEN') : undefined) || defaults[name];
 if(!value)throw new Error(`Missing BMV_REG_${name}`);
 return value;
}
