// A ScrollView with an always-visible scrollbar on the right.
// The user can scroll normally with a finger, OR drag the bar (thumb) up and down.
// Built only with React Native's own components, so it works in Expo Go.
import { useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type ScrollViewInstance,
  type ScrollViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TRACK_MARGIN = 8; // space above and below the bar
const MIN_THUMB_HEIGHT = 48; // so the thumb never gets too small to grab

type Props = ScrollViewProps & { children: ReactNode };

export function ScrollViewWithBar({ children, ...scrollViewProps }: Props) {
  const scrollRef = useRef<ScrollViewInstance>(null);

  // Heights we need to size and place the thumb.
  const [visibleHeight, setVisibleHeight] = useState(0); // height of the screen area
  const [contentHeight, setContentHeight] = useState(0); // height of all the content

  // Current scroll position. `scrollY` moves the thumb; `offset` is a plain copy used while dragging.
  const [scrollY] = useState(() => new Animated.Value(0));
  const offset = useRef(0);

  // Where the finger and the content were when a drag started.
  const dragStart = useRef({ pageY: 0, offset: 0 });

  // --- Bar math ---
  const trackHeight = Math.max(visibleHeight - TRACK_MARGIN * 2, 0);
  const maxScroll = Math.max(contentHeight - visibleHeight, 0); // how far the content can move
  const thumbHeight =
    contentHeight > 0 ? Math.max((visibleHeight / contentHeight) * trackHeight, MIN_THUMB_HEIGHT) : 0;
  const maxThumbMove = Math.max(trackHeight - thumbHeight, 1); // how far the thumb can move
  const showBar = maxScroll > 0; // only show the bar when there is something to scroll

  // Move the thumb down as the content scrolls down.
  const thumbTranslateY = scrollY.interpolate({
    inputRange: [0, Math.max(maxScroll, 1)],
    outputRange: [0, maxThumbMove],
    extrapolate: 'clamp',
  });

  // Drag handlers: moving the thumb by N pixels scrolls the content by the same proportion.
  function onDragStart(e: GestureResponderEvent) {
    dragStart.current = { pageY: e.nativeEvent.pageY, offset: offset.current };
  }
  function onDragMove(e: GestureResponderEvent) {
    const fingerMoved = e.nativeEvent.pageY - dragStart.current.pageY;
    const y = dragStart.current.offset + fingerMoved * (maxScroll / maxThumbMove);
    const clamped = Math.min(Math.max(y, 0), maxScroll);
    scrollRef.current?.scrollTo({ y: clamped, animated: false });
  }

  return (
    // SafeAreaView keeps the content above the iPhone's home bar at the bottom.
    <SafeAreaView style={styles.wrapper} edges={['bottom']}>
      <View style={styles.wrapper}>
        <ScrollView
          {...scrollViewProps}
          ref={scrollRef}
          showsVerticalScrollIndicator={false} // hide iOS's own bar; we draw ours
          scrollEventThrottle={16}
          onLayout={(e) => setVisibleHeight(e.nativeEvent.layout.height)}
          onContentSizeChange={(_w, h) => setContentHeight(h)}
          onScroll={(e) => {
            const y = e.nativeEvent.contentOffset.y;
            offset.current = y;
            scrollY.setValue(y);
          }}>
          {children}
        </ScrollView>

        {showBar && (
          <View style={[styles.track, { height: trackHeight }]} pointerEvents="box-none">
            {/* The wide, invisible touch area makes the thin thumb easy to grab. */}
            <Animated.View
              style={[styles.touchArea, { height: thumbHeight, transform: [{ translateY: thumbTranslateY }] }]}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderTerminationRequest={() => false} // keep the drag even if the finger slides off
              onResponderGrant={onDragStart}
              onResponderMove={onDragMove}>
              <View style={styles.thumb} />
            </Animated.View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  track: {
    position: 'absolute',
    top: TRACK_MARGIN,
    right: 2,
    width: 24,
    alignItems: 'center',
  },
  touchArea: {
    width: 24,
    alignItems: 'center',
  },
  thumb: {
    flex: 1,
    width: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
  },
});
