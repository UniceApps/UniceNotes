module.exports = ({ config }) => {
  const measurePlugin = [
    '@measuresh/react-native',
    {
      androidApiKey: process.env.MEASURE_ANDROID_API_KEY,
      androidApiUrl: 'https://ingest.measure.sh',
      iosApiKey: process.env.MEASURE_IOS_API_KEY,
      iosApiUrl: 'https://ingest.measure.sh',
    },
  ];

  return {
    ...config,
    plugins: [...(config.plugins ?? []), measurePlugin],
    extra: {
      eas: {
        projectId: 'ec0ebd57-7227-4cd2-a71e-344e0a5fffe5',
      },
      github_hash: process.env.EAS_BUILD_GIT_COMMIT_HASH,
    },
  };
};