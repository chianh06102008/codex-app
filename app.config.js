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
  plugins: [
   ['react-native-maps', {androidGoogleMapsApiKey, iosGoogleMapsApiKey}],
   ['expo-location', {locationWhenInUsePermission: 'FloodScout dùng vị trí khi bạn đang mở ứng dụng để đặt điểm xuất phát và ẩn bản đồ khi bạn đang chạy xe.'}],
   ['expo-image-picker', {cameraPermission: 'FloodScout dùng máy ảnh để bạn chụp đường ngập từ chỗ khô ráo.', photosPermission: 'FloodScout cho phép bạn chọn một ảnh đường ngập có sẵn.'}]
  ],
  extra: {googleMaps: {android: Boolean(androidGoogleMapsApiKey), ios: Boolean(iosGoogleMapsApiKey)}}
 };
};
