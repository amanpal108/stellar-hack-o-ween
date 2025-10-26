// CRACO configuration for passkey-kit TypeScript transpilation
// Based on: https://github.com/kalepail/passkey-kit#typescript-gotchas

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Ignore export warnings for passkey-kit
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        {
          module: /node_modules\/passkey-kit/,
          message: /Should not import the named export/,
        },
      ];
      
      // Add resolve extensions for TypeScript
      if (!webpackConfig.resolve.extensions.includes('.ts')) {
        webpackConfig.resolve.extensions.push('.ts', '.tsx');
      }
      
      // Add resolve fallbacks
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false,
      };
      
      // Disable source-map-loader for passkey-kit to prevent parsing errors
      webpackConfig.module.rules = webpackConfig.module.rules.map(rule => {
        if (rule.enforce === 'pre' && rule.use && rule.use.some(use => 
          use.loader && use.loader.includes('source-map-loader')
        )) {
          return {
            ...rule,
            exclude: [
              rule.exclude,
              /node_modules\/(passkey-kit|passkey-factory-sdk|passkey-kit-sdk|sac-sdk)/
            ].filter(Boolean)
          };
        }
        return rule;
      });
      
      // Add a new rule specifically for passkey-kit TypeScript files
      const oneOfRule = webpackConfig.module.rules.find(rule => rule.oneOf);
      
      if (oneOfRule) {
        // Insert before the file-loader (usually last)
        oneOfRule.oneOf.unshift({
          test: /\.(ts|tsx)$/,
          include: /node_modules\/(passkey-kit|passkey-factory-sdk|passkey-kit-sdk|sac-sdk)/,
          use: [
            {
              loader: require.resolve('babel-loader'),
              options: {
                presets: [
                  [require.resolve('@babel/preset-react'), { runtime: 'automatic' }],
                  [require.resolve('@babel/preset-typescript'), { allowNamespaces: true, allowDeclareFields: true }]
                ],
                plugins: [],
                cacheDirectory: true,
                cacheCompression: false,
                compact: false,
              },
            },
          ],
        });
      }

      return webpackConfig;
    },
  },
};

