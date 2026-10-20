export function isRegistrationInteraction(i) {
 const name = i?.data?.name;
 const id = i?.data?.custom_id;
 if(i?.type===2)return ['register','link-pilot','registration-status'].includes(name);
 if(i?.type===5 && ['register','link-pilot'].includes(id))return true;
 return [3,5].includes(i?.type) && typeof id==='string' && /^(approve|reject):[a-f0-9-]{36}$/.test(id);
}
