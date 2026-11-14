import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, MD3LightTheme, PaperProvider, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import MapView from 'react-native-maps';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const theme = { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, primary: '#16465c', onPrimary: '#ffffff', primaryContainer: '#cee8f0', onPrimaryContainer: '#082f40', background: '#f7f9f8', surface: '#ffffff', surfaceVariant: '#e6eeee', onSurface: '#152b36', onSurfaceVariant: '#405863', outline: '#71898f' } };
type Screen = 'home' | 'warning' | 'ask' | 'result' | 'report' | 'settings';
type Language = 'vi' | 'en';
const copy = {
 vi: { status:'Chưa có tình trạng chính thức', notice:'Không lấy được tình trạng chính thức. Đừng coi bản đồ trống là hết cảnh báo.', source:'Xem thông tin chính thức', title:'Trước khi lên đường', description:'Kiểm tra thông tin chính thức và tình trạng đường trước khi quyết định di chuyển.', ask:'Đi đường này?', report:'Báo cáo ngập', settings:'Cài đặt', map:'Bản đồ chưa khả dụng trong bản dựng này.', warning:'Thông tin chính thức', warningBody:'Chưa có bản tin được xác minh. Hãy xem thông tin trực tiếp từ cơ quan chính thức.', open:'Mở trang NCHMF', back:'Quay lại', destination:'Điểm đến', origin:'Điểm xuất phát', mode:'Phương tiện', bike:'Xe máy', walk:'Đi bộ', car:'Ô tô', check:'Kiểm tra đường', refusal:'FloodScout không gợi ý đường nào.', refusalBody:'Hãy ở lại và làm theo hướng dẫn chính thức.', reason:'Tình trạng chính thức và dữ liệu đường chưa có. Không thể đánh giá tuyến đường.', dry:'Chỉ chụp từ chỗ khô ráo. Đừng đi vào nước để chụp.', reportBody:'Chức năng gửi báo cáo chưa khả dụng.', emergency:'113 · 114 · 115. FloodScout không phải đơn vị cứu hộ.', language:'Ngôn ngữ', privacy:'Vị trí và ảnh chỉ được yêu cầu khi bạn sử dụng tính năng cần đến chúng.' },
 en: { status:'Official status unavailable', notice:'Official status is unavailable. An empty map is not an all-clear.', source:'View official information', title:'Before you travel', description:'Check official information and road conditions before deciding whether to travel.', ask:'Check a way there?', report:'Report flooding', settings:'Settings', map:'Map unavailable in this build.', warning:'Official information', warningBody:'No verified bulletin is available. Check the official source directly.', open:'Open NCHMF website', back:'Back', destination:'Destination', origin:'Starting point', mode:'Travel mode', bike:'Motorbike', walk:'Walk', car:'Car', check:'Check roads', refusal:'FloodScout will not suggest a way.', refusalBody:'Stay, and follow the official instruction.', reason:'Official status and road data are unavailable. The route cannot be assessed.', dry:'Photograph only from dry ground. Do not enter the water to take a picture.', reportBody:'Report submission is unavailable.', emergency:'113 · 114 · 115. FloodScout is not a rescue service.', language:'Language', privacy:'Location and photos are requested only when you use a feature that needs them.' }
};
function AppContent() {
 const [language, setLanguage] = useState<Language>('vi');
 const [screen, setScreen] = useState<Screen>('home');
 const [origin, setOrigin] = useState('');
 const [destination, setDestination] = useState('');
 const [mode, setMode] = useState('bike');
 const [places, setPlaces] = useState<Array<{name: string; address: string}>>([]);
 const [searchStatus, setSearchStatus] = useState('');
 const searchPlaces = async () => {
  const base = process.env.EXPO_PUBLIC_MAPS_SERVER_URL;
  if (!base) { setSearchStatus(language === 'vi' ? 'Chưa cấu hình tìm địa điểm.' : 'Place search is not configured.'); return; }
  setSearchStatus(language === 'vi' ? 'Đang tìm…' : 'Searching…');
  try {
   const response = await fetch(base.replace(/\/$/, '') + '/api/places?q=' + encodeURIComponent(destination) + '&lang=' + language);
   if (!response.ok) throw new Error('Search failed');
   const result = await response.json();
   setPlaces(result.places);
   setSearchStatus(result.places.length ? '' : (language === 'vi' ? 'Không tìm thấy địa điểm.' : 'No places found.'));
  } catch { setPlaces([]); setSearchStatus(language === 'vi' ? 'Không thể tìm địa điểm. Thử lại sau.' : 'Place search unavailable. Try again later.'); }
 };
 const c = copy[language];
 const mapConfigured = Platform.OS === 'ios' || (Platform.OS === 'android' && Boolean(Constants.expoConfig?.extra?.googleMaps?.android) && Constants.executionEnvironment !== 'storeClient');
 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
  <View style={styles.header}><Text variant="headlineSmall" style={styles.brand}>FloodScout</Text><Button onPress={() => setLanguage(language === 'vi' ? 'en' : 'vi')} accessibilityLabel={language === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}>{language === 'vi' ? 'EN' : 'VI'}</Button></View>
  <Card mode="contained" style={styles.warning} accessible accessibilityLiveRegion="polite"><Card.Content><Text variant="titleMedium" style={styles.warningTitle}>{c.status}</Text><Text variant="bodyLarge">{c.notice}</Text><Button mode="text" onPress={() => setScreen('warning')} contentStyle={styles.touch}>{c.source}</Button></Card.Content></Card>
  {screen !== 'home' && <Button icon="arrow-left" onPress={() => setScreen('home')} contentStyle={styles.touch}>{c.back}</Button>}
  {screen === 'home' && <><View style={styles.map}>{mapConfigured ? <MapView style={StyleSheet.absoluteFill} initialRegion={{ latitude:16.061, longitude:108.218, latitudeDelta:0.06, longitudeDelta:0.06 }} /> : <Text variant="bodyLarge">{c.map}</Text>}</View><Text variant="headlineMedium" style={styles.heading}>{c.title}</Text><Text variant="bodyLarge">{c.description}</Text><Button mode="contained" onPress={() => setScreen('ask')} contentStyle={styles.touch}>{c.ask}</Button><Button mode="outlined" onPress={() => setScreen('report')} contentStyle={styles.touch}>{c.report}</Button><Button onPress={() => setScreen('settings')} contentStyle={styles.touch}>{c.settings}</Button></>}
  {screen === 'warning' && <><Text variant="headlineMedium">{c.warning}</Text><Text variant="bodyLarge">{c.warningBody}</Text><Button mode="outlined" onPress={() => { void Linking.openURL('https://nchmf.gov.vn/'); }} contentStyle={styles.touch}>{c.open}</Button><Text variant="bodyLarge">{c.emergency}</Text></>}
  {screen === 'ask' && <><Text variant="headlineMedium">{c.ask}</Text><TextInput mode="outlined" label={c.origin} value={origin} onChangeText={setOrigin}/><TextInput mode="outlined" label={c.destination} value={destination} onChangeText={value => { setDestination(value); setPlaces([]); }}/><Button mode="outlined" disabled={destination.trim().length < 2} onPress={searchPlaces} contentStyle={styles.touch}>{language === 'vi' ? 'Tìm địa điểm' : 'Search places'}</Button>{!!searchStatus && <Text accessibilityLiveRegion="polite">{searchStatus}</Text>}{places.map((place, index) => <Button key={index} onPress={() => { setDestination([place.name, place.address].filter(Boolean).join(', ')); setPlaces([]); }} contentStyle={styles.touch}>{[place.name, place.address].filter(Boolean).join(', ')}</Button>)}<Text variant="titleMedium">{c.mode}</Text><SegmentedButtons value={mode} onValueChange={setMode} buttons={[{ value:'bike', label:c.bike },{ value:'walk', label:c.walk },{ value:'car', label:c.car }]}/><Button mode="contained" disabled={!origin.trim() || !destination.trim()} onPress={() => setScreen('result')} contentStyle={styles.touch}>{c.check}</Button></>}
  {screen === 'result' && <View accessibilityLiveRegion="assertive"><Text variant="headlineMedium">{c.refusal}</Text><Text variant="bodyLarge">{c.refusalBody}</Text><Text variant="bodyLarge" style={styles.heading}>{c.reason}</Text><Button onPress={() => setScreen('warning')} contentStyle={styles.touch}>{c.source}</Button></View>}
  {screen === 'report' && <><Text variant="headlineMedium">{c.report}</Text><Card mode="contained" style={styles.warning}><Card.Content><Text variant="titleMedium">{c.dry}</Text></Card.Content></Card><Text variant="bodyLarge">{c.reportBody}</Text></>}
  {screen === 'settings' && <><Text variant="headlineMedium">{c.settings}</Text><Text variant="titleMedium">{c.language}</Text><Button mode="outlined" onPress={() => setLanguage(language === 'vi' ? 'en' : 'vi')} contentStyle={styles.touch}>Tiếng Việt / English</Button><Text variant="bodyLarge">{c.privacy}</Text></>}
 </ScrollView></SafeAreaView>;
}
export default function App() { return <SafeAreaProvider><PaperProvider theme={theme}><AppContent /></PaperProvider></SafeAreaProvider>; }
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:theme.colors.background},container:{width:'100%',maxWidth:460,alignSelf:'center',padding:16,gap:16,flexGrow:1},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},brand:{fontWeight:'800',color:theme.colors.primary},warning:{backgroundColor:'#ffedce'},warningTitle:{fontSize:18,fontWeight:'700'},map:{height:280,borderRadius:20,overflow:'hidden',justifyContent:'center',alignItems:'center',padding:20,backgroundColor:'#dcebe8'},heading:{marginTop:8},touch:{minHeight:48}});
