import { readdirSync } from 'fs';
import { resolve } from 'path';
console.log('cwd:', process.cwd());
console.log('home:', process.env.HOME);
try { console.log('scripts dir:', readdirSync(resolve(process.cwd(), 'scripts'))); } catch(e) { console.log('no scripts in cwd'); }
try { console.log('/home/user dir:', readdirSync('/home/user').slice(0, 20)); } catch(e) { console.log('no /home/user'); }
try { console.log('/vercel dir:', readdirSync('/vercel').slice(0, 10)); } catch(e) { console.log('no /vercel'); }
try { console.log('/vercel/share dir:', readdirSync('/vercel/share').slice(0, 10)); } catch(e) { console.log('no /vercel/share'); }
