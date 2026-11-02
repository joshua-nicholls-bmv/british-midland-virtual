// Keep all public-page footers identical using the shared template.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const navigation=fs.readFileSync(path.join(__dirname,'update-navigation.cjs'),'utf8');
const pages=[...navigation.match(/const pages=(\[.*?\]);/)[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);
const footer=fs.readFileSync(path.join(__dirname,'footer.html'),'utf8').trim();
for(const page of pages){const file=path.join(root,page),source=fs.readFileSync(file,'utf8');if(!/<footer\b[\s\S]*?<\/footer>/.test(source))throw Error('Missing footer: '+page);fs.writeFileSync(file,source.replace(/<footer\b[\s\S]*?<\/footer>/,()=>footer));}
console.log(`Updated ${pages.length} public-page footers.`);
