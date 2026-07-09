import { chromium } from 'playwright';
const base='http://localhost:4325';const errors=[];
const b=await chromium.launch();const p=await b.newPage();
p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
p.on('pageerror',e=>errors.push('PAGEERROR: '+e.message));
async function get(path){await p.goto(base+path,{waitUntil:'networkidle'});await p.waitForTimeout(500);return await p.textContent('body');}
const home=await get('/');
const calc=/How much are missed calls costing you/.test(home);
const dental=/AI receptionist|dental/i.test(await get('/dental'))&&p.url().includes('/dental');
const medical=/medical/i.test(await get('/medical'));
const legal=/law firm/i.test(await get('/legal'));
const ruby=/PracticeVoice AI vs Ruby/.test(await get('/vs/ruby'));
const ans=/answering service/i.test(await get('/vs/answering-service'));
const smith=/Smith\.ai/.test(await get('/vs/smith-ai'));
const contact=/See your AI receptionist in action|Book a demo/i.test(await get('/contact'));
// try submitting the form (function 404 in dev -> treated as sent)
await get('/contact');
await p.fill('#name','Test Dr').catch(()=>{});
await p.fill('#email','t@t.com').catch(()=>{});
await p.click('button[type=submit]').catch(()=>{});
await p.waitForTimeout(700);
const formSent=/got it|Thanks/i.test(await p.textContent('body'));
const appErrors=errors.filter(e=>!/ERR_CONNECTION_RESET|fonts.googleapis|404|Failed to load resource/.test(e));
console.log(JSON.stringify({calc,dental,medical,legal,ruby,ans,smith,contact,formSent,appErrors},null,2));
await b.close();
process.exit((calc&&dental&&medical&&legal&&ruby&&ans&&smith&&contact&&formSent&&appErrors.length===0)?0:1);
