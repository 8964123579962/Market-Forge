const fs = require('fs');
const path = require('path');
exports.handler = async (event) => {
 if(event.httpMethod!=='POST') return {statusCode:405,body:'Method Not Allowed'};
 const secret=process.env.SYNC_SECRET;
 const sent=event.headers['x-sync-secret'];
 if(secret && sent!==secret) return {statusCode:401,body:'Unauthorized'};
 const item=JSON.parse(event.body||'{}');
 const file=path.join('/tmp','mods.json');
 let mods=[];
 try{mods=JSON.parse(fs.readFileSync(file,'utf8'));}catch{}
 const idx=mods.findIndex(x=>x.name===item.name);
 if(idx>=0) mods[idx]=item; else mods.unshift(item);
 fs.writeFileSync(file,JSON.stringify(mods,null,2));
 return {statusCode:200,body:JSON.stringify({ok:true,count:mods.length})};
}
