// Starts the website preview server (port 8080) and Expo together: `npm start`.
const { spawn } = require('child_process');
const path = require('path');
const web = spawn(process.execPath, [path.join(__dirname, 'serve-web.cjs')], { stdio: 'inherit' });
const expo = spawn('npx', ['expo', 'start', ...process.argv.slice(2)], { stdio: 'inherit', shell: true, cwd: __dirname });
const stop = () => { web.kill(); expo.kill(); process.exit(); };
process.on('SIGINT', stop);
expo.on('exit', stop);
