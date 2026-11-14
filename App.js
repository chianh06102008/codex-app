import React,{useRef,useState} from 'react';
import {Linking,Platform,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import MapView,{PROVIDER_GOOGLE} from 'react-native-maps';
import Constants from 'expo-constants';
import {vi,en} from './copy';

const center={latitude:16.061,longitude:108.218};
function Button({label,onPress,primary=false,selected,disabled=false}){
 return <Pressable accessibilityRole="button" accessibilityState={{selected,disabled}} disabled={disabled} onPress={onPress} style={[s.button,primary&&s.primary,selected&&s.selected,disabled&&s.disabled]}><Text style={[s.text,primary&&s.white]}>{label}</Text></Pressable>;
}
function Screen(){
 const [english,setEnglish]=useState(false);
 const [screen,setScreen]=useState('home');
 const [destination,setDestination]=useState('');
 const [mode,setMode]=useState('bike');
 const map=useRef(null);
 const c=english?en:vi;
 const configured=Constants.expoConfig?.extra?.googleMaps?.[Platform.OS] && Constants.executionEnvironment!=='storeClient';
 const zoom=async delta=>{
  const view=map.current;
  if(!view)return;
  try{
   const camera=await view.getCamera();
   if(map.current===view)view.animateCamera({zoom:Math.max(10,Math.min(19,(camera.zoom??13)+delta))});
  }catch{ /* Map remains optional during initialization. */ }
 };
 const goHome=()=>{setScreen('home');setDestination('');};
 return <SafeAreaView style={s.safe}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.column}>
  <View style={s.row}><View><Text accessibilityRole="header" style={s.heading}>FloodScout</Text><Text style={s.text}>Đà Nẵng</Text></View><Button label={english?'Tiếng Việt':'English'} onPress={()=>setEnglish(!english)}/></View>
  <View style={s.warning} accessibilityLiveRegion="polite"><Text accessibilityRole="header" style={s.warningText}>{c.status}</Text><Text style={s.warningText}>{c.notice}</Text><Button label={c.source} onPress={()=>Linking.openURL('https://nchmf.gov.vn/').catch(()=>{})}/></View>
  {screen==='home'&&<><View style={s.map}>{configured?<MapView ref={map} provider={PROVIDER_GOOGLE} style={StyleSheet.absoluteFill} initialCamera={{center,zoom:13,pitch:0,heading:0,altitude:0}} showsUserLocation={false} toolbarEnabled={false}/>:<Text style={s.text}>{english?'Google Maps unavailable in this build.':'Google Maps chưa có trong bản dựng này.'}</Text>}</View>
  {configured&&<View style={s.row}><Button label={english?'Zoom in':'Phóng to'} onPress={()=>zoom(1)}/><Button label={english?'Zoom out':'Thu nhỏ'} onPress={()=>zoom(-1)}/></View>}
  <Text accessibilityRole="header" style={s.heading}>{c.heading}</Text><Text style={s.text}>{c.hint}</Text><View style={s.footer}><Button label={c.ask} primary onPress={()=>setScreen('ask')}/></View></>}
  {screen==='ask'&&<><Text accessibilityRole="header" style={s.heading}>{c.ask}</Text><Text style={s.text}>{c.destination}</Text><TextInput accessibilityLabel={c.destination} value={destination} onChangeText={setDestination} maxLength={120} style={[s.input,s.text]}/><Text style={s.text}>{c.mode}</Text><View style={s.options}>{['bike','walk','car'].map(key=><Button key={key} label={c[key]} selected={mode===key} onPress={()=>setMode(key)}/>)}</View><Button label={c.check} primary disabled={!destination.trim()} onPress={()=>setScreen('result')}/><Button label={c.close} onPress={goHome}/></>}
  {screen==='result'&&<><View accessible accessibilityRole="alert" accessibilityLiveRegion="assertive"><Text style={s.heading}>{c.result}</Text><Text style={s.text}>{c.refusal}</Text></View><Button label={c.close} onPress={goHome}/></>}
 </ScrollView></SafeAreaView>;
}
export default function App(){return <SafeAreaProvider><Screen/></SafeAreaProvider>;}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#f7f9fc'},column:{width:'100%',maxWidth:460,alignSelf:'center',padding:16,gap:14,flexGrow:1},
 row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8},
 heading:{color:'#152538',fontSize:24,fontWeight:'700'},text:{color:'#152538',fontSize:16,flexShrink:1},
 warning:{padding:14,gap:8,backgroundColor:'#ffedce',borderLeftWidth:5,borderLeftColor:'#98510e'},
 warningText:{color:'#152538',fontSize:18},button:{minHeight:48,minWidth:48,borderRadius:14,paddingHorizontal:14,paddingVertical:10,justifyContent:'center',alignItems:'center',backgroundColor:'white',borderWidth:1,borderColor:'#60748a',flexShrink:1},
 primary:{backgroundColor:'#173f70',borderColor:'#173f70'},white:{color:'white',fontWeight:'700'},disabled:{opacity:.65},selected:{backgroundColor:'#d5e7ff',borderColor:'#173f70',borderWidth:2},
 map:{height:265,borderRadius:24,overflow:'hidden',justifyContent:'center',padding:18,backgroundColor:'#dce9e5'},
 footer:{marginTop:'auto'},input:{minHeight:48,padding:10,borderColor:'#60748a',borderWidth:1,borderRadius:14,backgroundColor:'white'},options:{flexDirection:'row',flexWrap:'wrap',gap:8}
});