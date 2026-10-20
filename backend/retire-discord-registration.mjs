// Run only after the live website smoke test and draining the legacy queue.
if(!process.argv.includes('--retire-after-live-test'))throw Error('Complete the live website test, then supply --retire-after-live-test.');
const token=process.env.DISCORD_BOT_TOKEN,app='1550252275862085833',guild='1524310750410313808';
if(!token)throw Error('Set DISCORD_BOT_TOKEN privately in this terminal session.');
async function call(path,method='GET'){const r=await fetch('https://discord.com/api/v10/'+path,{method,headers:{Authorization:'Bot '+token},signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Discord returned '+r.status);return r.status===204?null:r.json();}
if((await call('oauth2/applications/@me')).id!==app)throw Error('Wrong Discord application.');
for(const scope of [`applications/${app}/guilds/${guild}/commands`,`applications/${app}/commands`]){
 for(const command of await call(scope))if(['register','link-pilot','registration-status'].includes(command.name)){await call(scope+'/'+command.id,'DELETE');console.log('Retired '+command.name);}
}
console.log('Only the three registration commands were targeted. Other bot commands were preserved.');
