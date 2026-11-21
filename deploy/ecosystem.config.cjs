// Guruji Palmistry — PM2 config, if you prefer PM2 to systemd on a VPS.
//
//   npm install -g pm2
//   pm2 start deploy/ecosystem.config.cjs
//   pm2 save && pm2 startup     # run the command it prints, so it survives reboots
//   pm2 logs guruji
//
// Put the secrets in /var/www/guruji/.env (chmod 600) — the server reads it on start.
module.exports = {
  apps: [{
    name: 'guruji',
    script: 'server.js',
    cwd: '/var/www/guruji',
    instances: 1,              // one process: the rate limiter and slot holds are in memory
    exec_mode: 'fork',
    autorestart: true,
    max_memory_restart: '400M',
    env: { NODE_ENV: 'production', PORT: 3456, HOST: '127.0.0.1' }
  }]
};
