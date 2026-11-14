module.exports = () => {
 const androidGoogleMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_KEY;
 const iosGoogleMapsApiKey = process.env.GOOGLE_MAPS_IOS_KEY;
 return {
  name: 'FloodScout VN',
  slug: 'floodscout-vn',
  orientation: 'portrait',
  platforms: ['android', 'ios'],
  android: {package: 'vn.floodscout.app'},
  ios: {bundleIdentifier: 'vn.floodscout.app', supportsTablet: false},
  plugins: [['react-native-maps', {androidGoogleMapsApiKey, iosGoogleMapsApiKey}]],
  extra: {googleMaps: {android: Boolean(androidGoogleMapsApiKey), ios: Boolean(iosGoogleMapsApiKey)}}
 };
};
