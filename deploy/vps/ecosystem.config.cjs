module.exports = {
  apps: [
    {
      name: 'market-point-pro',
      script: 'server.js',
      cwd: '/var/www/market-point-pro',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '3000',
      },
    },
  ],
};
