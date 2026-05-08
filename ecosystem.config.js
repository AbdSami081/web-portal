module.exports = {
  apps: [
    {
      name: "next-app",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 8001", // Your internal IIS proxy port
      instances: "max",      // Use all CPU cores for better performance
      exec_mode: "cluster",  // Enables clustering
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};