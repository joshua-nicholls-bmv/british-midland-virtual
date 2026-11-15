export const BMA_ORIGINS=['https://britishmidlandvirtual.co.uk','https://www.britishmidlandvirtual.co.uk'];
export const ECV_ORIGINS=['https://europeancargovirtual.co.uk','https://www.europeancargovirtual.co.uk'];
export const APPLICATION_ORIGINS=[...BMA_ORIGINS,...ECV_ORIGINS];
export function applicationAirline(origin){
 if(ECV_ORIGINS.includes(origin))return 'ECV';
 if(BMA_ORIGINS.includes(origin))return 'BMA';
 throw new Error('Unknown application origin');
}
export function applicationAlert(a){
 const ecv=a.airline==='ECV';
 const users=ecv?['743747199883673630']:['1302378693901160579','563049560159813643'];
 return {channel:ecv?'1533120871412269127':'1526327360843026523',body:{
  content:`🛫 **New ${ecv?'ECV':'British Midland'} pilot application**\n${users.map(id=>`<@${id}>`).join(' ')} — a new ${ecv?'European Cargo Virtual':'British Midland Virtual'} website application is ready for review.\n\n[Review applications](https://britishmidlandvirtual.co.uk/management/applications.html)`,
  allowed_mentions:{parse:[],users},nonce:('a'+a.id.replaceAll('-','')).slice(0,25),enforce_nonce:true
 }};
}
