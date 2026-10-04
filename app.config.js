const { withAppDelegate } = require('expo/config-plugins');

// KSCrash (Measure) re-protects __DATA_CONST on dlopen: crashes the simulator in map_images_nolock
const SWAP_RESET = [
  '#if targetEnvironment(simulator)',
  '    // undo KSCrash __cxa_throw swap (no toggle in Measure)',
  '    if let reset = dlsym(UnsafeMutableRawPointer(bitPattern: -2), "ksct_swapReset") {',
  '      unsafeBitCast(reset, to: (@convention(c) () -> Void).self)()',
  '    }',
  '#endif',
].join('\n');

const withMeasureSimulatorFix = (config) =>
  withAppDelegate(config, (mod) => {
    if (!mod.modResults.contents.includes('ksct_swapReset')) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /^\/\/ @generated end measure-init$/m,
        `$&\n${SWAP_RESET}`,
      );
    }
    return mod;
  });

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
    // mods run in reverse order: the fix must be listed before Measure
    plugins: [...(config.plugins ?? []), withMeasureSimulatorFix, measurePlugin],
    extra: {
      eas: {
        projectId: 'ec0ebd57-7227-4cd2-a71e-344e0a5fffe5',
      },
      github_hash: process.env.EAS_BUILD_GIT_COMMIT_HASH,
    },
  };
};
