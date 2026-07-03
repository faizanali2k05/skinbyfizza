module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo (SDK 56) auto-includes the react-native-worklets
    // plugin required by Reanimated 4 and the expo-router transform.
    presets: ['babel-preset-expo'],
  };
};
