// PM2 process config for production deployment.
// Usage on the server:
//   pm2 start ecosystem.config.js --env production
//   pm2 save && pm2 startup    # autostart on reboot
module.exports = {
  apps: [
    {
      name: "nanma-api",
      script: "server.js",
      instances: 1,             // bump to "max" on multi-core VPSes
      exec_mode: "fork",        // use "cluster" if you raise instances
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      // PM2 reads ./.env automatically via dotenv inside server.js,
      // so we don't duplicate secrets here.
    },
  ],
};
