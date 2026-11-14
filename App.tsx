import React, { useEffect, useState } from 'react';
import { BackHandler, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, MD3LightTheme, PaperProvider, Text } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

// Dev 3/4 features (map, routing, report, speed gate).
import { COPY as MR } from '@/copy/mapReport';
import { DemoPanel } from '@/features/demo/DemoPanel';
import { useOfficialSource } from '@/features/fusion/officialSource';
import { useSegmentStates } from '@/features/fusion/segmentStates';
import { FloodMap } from '@/features/map/FloodMap';
import { Legend } from '@/features/map/StateChip';
import { loadReports } from '@/features/report/reportStore';
import { updateSession } from '@/features/routing/session';
import { AskScreen } from '@/screens/AskScreen';
import { ReportScreen } from '@/screens/ReportScreen';
import { ResultScreen } from '@/screens/ResultScreen';
import { SegmentScreen } from '@/screens/SegmentScreen';

const theme = { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, primary: '#16465c', onPrimary: '#ffffff', primaryContainer: '#cee8f0', onPrimaryContainer: '#082f40', background: '#f3f6f6', surface: '#ffffff', surfaceVariant: '#e6eeee', onSurface: '#152b36', onSurfaceVariant: '#405863', outline: '#71898f', secondaryContainer: '#cee8f0' } };
type Screen = 'home' | 'warning' | 'ask' | 'result' | 'segment' | 'report' | 'settings';
type Language = 'vi' | 'en';
const copy = {
 vi: { status:'Chưa có tình trạng chính thức', notice:'Không lấy được tình trạng chính thức. Đừng coi bản đồ trống là hết cảnh báo.', source:'Xem thông tin chính thức', title:'Trước khi lên đường', description:'Kiểm tra thông tin chính thức và tình trạng đường trước khi quyết định di chuyển.', ask:'Đi đường này?', report:'Báo cáo ngập', settings:'Cài đặt', warning:'Thông tin chính thức', warningBody:'Chưa có bản tin được xác minh. Hãy xem thông tin trực tiếp từ cơ quan chính thức.', open:'Mở trang NCHMF', back:'Quay lại', emergency:'113 · 114 · 115. FloodScout không phải đơn vị cứu hộ.', language:'Ngôn ngữ', privacy:'Vị trí và ảnh chỉ được yêu cầu khi bạn sử dụng tính năng cần đến chúng.' },
 en: { status:'Official status unavailable', notice:'Official status is unavailable. An empty map is not an all-clear.', source:'View official information', title:'Before you travel', description:'Check official information and road conditions before deciding whether to travel.', ask:'Check a way there?', report:'Report flooding', settings:'Settings', warning:'Official information', warningBody:'No verified bulletin is available. Check the official source directly.', open:'Open NCHMF website', back:'Back', emergency:'113 · 114 · 115. FloodScout is not a rescue service.', language:'Language', privacy:'Location and photos are requested only when you use a feature that needs them.' }
};
// Where "Back" goes from each screen.
const BACK: Partial<Record<Screen, Screen>> = { result: 'ask', segment: 'result' };

function AppContent() {
 const [language, setLanguage] = useState<Language>('vi');
 const [screen, setScreen] = useState<Screen>('home');
 const official = useOfficialSource();
 const states = useSegmentStates('motorbike');
 const c = copy[language];
 const mr = MR[language];
 const go = (s: Screen) => setScreen(s);

 useEffect(() => { void loadReports(); }, []);
 useEffect(() => {
  const sub = BackHandler.addEventListener('hardwareBackPress', () => {
   if (screen === 'home') return false;
   setScreen(BACK[screen] ?? 'home');
   return true;
  });
  return () => sub.remove();
 }, [screen]);

 const feedDown = official.feedStatus === 'unavailable';
 return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
  <View style={styles.header}><Text variant="headlineSmall" style={styles.brand}>FloodScout</Text><Button onPress={() => setLanguage(language === 'vi' ? 'en' : 'vi')} accessibilityLabel={language === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}>{language === 'vi' ? 'EN' : 'VI'}</Button></View>
  <Card mode="contained" style={styles.warning} accessible accessibilityLiveRegion="polite"><Card.Content><Text variant="titleMedium" style={styles.warningTitle}>{feedDown ? c.status : official.statements.length ? mr.warningInForce : mr.state_no_adverse_evidence}</Text><Text variant="bodyLarge">{feedDown ? c.notice : official.statements.length ? '' : mr.calmest}</Text>{official.simulated && <Text style={styles.simulated}>{mr.simulatedBadge}</Text>}<Button mode="text" onPress={() => setScreen('warning')} contentStyle={styles.touch}>{c.source}</Button></Card.Content></Card>
  {screen !== 'home' && <Button icon="arrow-left" onPress={() => setScreen(BACK[screen] ?? 'home')} contentStyle={styles.touch} style={styles.back}>{c.back}</Button>}
  {screen === 'home' && <>
   <FloodMap states={states} feedUnavailable={feedDown} statements={official.statements} height={300} attribution={mr.mapAttribution} onSegmentPress={(id) => { updateSession({ segmentId: id }); setScreen('segment'); }} />
   <Legend lang={language} />
   <Text style={styles.pilot}>{mr.pilotArea}</Text>
   <Text variant="headlineMedium" style={styles.heading}>{c.title}</Text><Text variant="bodyLarge">{c.description}</Text>
   <Button mode="contained" icon="map-search-outline" onPress={() => setScreen('ask')} contentStyle={styles.cta} labelStyle={styles.ctaLabel}>{c.ask}</Button>
   <Button mode="outlined" icon="camera-outline" onPress={() => setScreen('report')} contentStyle={styles.touch}>{c.report}</Button>
   <Button icon="cog-outline" onPress={() => setScreen('settings')} contentStyle={styles.touch}>{c.settings}</Button>
   <DemoPanel lang={language} />
  </>}
  {screen === 'warning' && <><Text variant="headlineMedium">{c.warning}</Text><Text variant="bodyLarge">{c.warningBody}</Text><Button mode="outlined" onPress={() => { void Linking.openURL('https://nchmf.gov.vn/'); }} contentStyle={styles.touch}>{c.open}</Button><Text variant="bodyLarge">{c.emergency}</Text></>}
  {screen === 'ask' && <AskScreen lang={language} go={go} />}
  {screen === 'result' && <ResultScreen lang={language} go={go} />}
  {screen === 'segment' && <SegmentScreen lang={language} go={go} />}
  {screen === 'report' && <ReportScreen lang={language} go={go} />}
  {screen === 'settings' && <><Text variant="headlineMedium">{c.settings}</Text><Text variant="titleMedium">{c.language}</Text><Button mode="outlined" onPress={() => setLanguage(language === 'vi' ? 'en' : 'vi')} contentStyle={styles.touch}>Tiếng Việt / English</Button><Text variant="bodyLarge">{c.privacy}</Text></>}
 </ScrollView></SafeAreaView>;
}
export default function App() { return <SafeAreaProvider><PaperProvider theme={theme}><AppContent /></PaperProvider></SafeAreaProvider>; }
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:theme.colors.background},container:{width:'100%',maxWidth:460,alignSelf:'center',padding:16,gap:16,flexGrow:1,paddingBottom:40},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},brand:{fontWeight:'800',color:theme.colors.primary},warning:{backgroundColor:'#ffedce'},warningTitle:{fontSize:18,fontWeight:'700'},simulated:{fontWeight:'700',fontSize:12,marginTop:4,opacity:0.8},heading:{marginTop:8,fontWeight:'800',color:'#152b36'},pilot:{fontSize:13,color:'#405863'},back:{alignSelf:'flex-start'},touch:{minHeight:48},cta:{minHeight:56},ctaLabel:{fontSize:17,fontWeight:'700'}});
