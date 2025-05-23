import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // eslint: {
  //   ignoreDuringBuilds: true, // Temporarily disable ESLint for production build testing
  // },
  webpack(config, { isServer }) {
    if (isServer) {
      // Skip bundling of the native canvas addon
      config.plugins = config.plugins || [];
      config.plugins.push(
        new (require('webpack')).IgnorePlugin({ 
          resourceRegExp: /^canvas$/ 
        })
      );

      // Make sure webpack never walks into the Node build of Konva
      // When webpack tries to resolve 'konva', rewrite it to the browser file
      config.resolve.alias = config.resolve.alias || {};
      config.resolve.alias['konva/lib/index-node.js'] = 'konva/lib/index.js';
    }
    return config;
  },
};

export default nextConfig;
