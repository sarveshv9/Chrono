import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  PanResponderGestureState,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { HapticService } from '@/services/hapticsService';

// Spring configuration matching motion/react (stiffness: 520, damping: 34, mass: 0.45)
// useNativeDriver MUST be false so JS drag updates (setValue) and layout springs can coordinate without native lockup!
export const CELL = {
  stiffness: 520,
  damping: 34,
  mass: 0.45,
  useNativeDriver: false,
} as const;

export const moveItem = <T,>(list: readonly T[], from: number, to: number): T[] => {
  const next = [...list];
  const [taken] = next.splice(from, 1);
  next.splice(to, 0, taken);
  return next;
};

export type UseReorderListOptions<T> = {
  items: readonly T[];
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  onReorder: (next: T[]) => void;
  onCommit?: (next: T[]) => void;
  disabled?: boolean;
};

export function useReorderList<T>({
  items,
  getId,
  getLabel,
  onReorder,
  onCommit,
  disabled = false,
}: UseReorderListOptions<T>) {
  const [grabbed, setGrabbed] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [spoken, setSpoken] = useState('');

  const emit = useRef(onReorder);
  emit.current = onReorder;
  const settle = useRef(onCommit);
  settle.current = onCommit;
  const live = useRef(items);
  live.current = items;
  const snapshot = useRef<readonly T[] | null>(null);

  const indexOf = useCallback(
    (id: string) => live.current.findIndex((item) => getId(item) === id),
    [getId]
  );

  const grab = useCallback(
    (id: string) => {
      if (disabled) return;
      snapshot.current = live.current;
      setGrabbed(id);
      const at = indexOf(id);
      const item = live.current[at];
      if (item) {
        setSpoken(`${getLabel(item)} grabbed, position ${at + 1} of ${live.current.length}.`);
      }
      HapticService.toggleTimer();
    },
    [disabled, getLabel, indexOf]
  );

  const drop = useCallback(
    (id: string) => {
      snapshot.current = null;
      setGrabbed(null);
      setDragging(null);
      const at = indexOf(id);
      const item = live.current[at];
      if (item) {
        setSpoken(`${getLabel(item)} dropped at position ${at + 1}.`);
      }
      settle.current?.([...live.current]);
      HapticService.stageComplete();
    },
    [getLabel, indexOf]
  );

  const cancel = useCallback(() => {
    if (snapshot.current) emit.current([...snapshot.current]);
    snapshot.current = null;
    setGrabbed(null);
    setDragging(null);
    setSpoken('Reorder cancelled, original order restored.');
  }, []);

  const step = useCallback(
    (id: string, delta: -1 | 1) => {
      if (disabled) return;
      const from = indexOf(id);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= live.current.length) return;
      const next = moveItem(live.current, from, to);
      emit.current(next);
      const item = next[to];
      if (item) {
        setSpoken(`${getLabel(item)}, position ${to + 1} of ${next.length}.`);
      }
      if (snapshot.current === null) settle.current?.(next);
      HapticService.buttonPress();
    },
    [disabled, getLabel, indexOf]
  );

  const onDragStart = useCallback((id: string) => {
    snapshot.current = live.current;
    setDragging(id);
    setGrabbed(id);
    HapticService.toggleTimer();
  }, []);

  const onDragEnd = useCallback(
    (id: string) => {
      snapshot.current = null;
      setDragging(null);
      setGrabbed(null);
      const at = indexOf(id);
      const item = live.current[at];
      if (item) {
        setSpoken(`${getLabel(item)} dropped at position ${at + 1}.`);
      }
      settle.current?.([...live.current]);
      HapticService.stageComplete();
    },
    [getLabel, indexOf]
  );

  return {
    grabbed,
    dragging,
    spoken,
    grab,
    drop,
    cancel,
    step,
    onDragStart,
    onDragEnd,
  };
}

// 6-dot Grip Handle matching the user prompt's SVG geometry
export const GripIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 14,
  color = '#888888',
}) => (
  <Svg width={10} height={size} viewBox="0 0 10 14" fill={color}>
    <Circle cx="2.5" cy="2.5" r="1.2" />
    <Circle cx="7.5" cy="2.5" r="1.2" />
    <Circle cx="2.5" cy="7" r="1.2" />
    <Circle cx="7.5" cy="7" r="1.2" />
    <Circle cx="2.5" cy="11.5" r="1.2" />
    <Circle cx="7.5" cy="11.5" r="1.2" />
  </Svg>
);

export type ReorderListColors = {
  surface?: string;
  surfaceElevated?: string;
  surfaceBorder?: string;
  textPrimary?: string;
  textMuted?: string;
};

export type ReorderListProps<T> = UseReorderListOptions<T> & {
  children: (item: T, isGrabbed: boolean) => React.ReactNode;
  label?: string;
  itemHeight?: number;
  itemMargin?: number;
  colors?: ReorderListColors;
  setScrollEnabled?: (enabled: boolean) => void;
  onItemTap?: (item: T, index: number, isRightEdge: boolean) => void;
};

interface ItemRowProps<T> {
  item: T;
  id: string;
  index: number;
  totalItems: number;
  isLifted: boolean;
  rowHeight: number;
  rowMargin: number;
  colors: ReorderListColors;
  animY: Animated.Value;
  onStartDrag: (id: string) => void;
  onMoveDrag: (id: string, gestureState: PanResponderGestureState) => void;
  onEndDrag: (id: string, gestureState: PanResponderGestureState, wasDragging: boolean) => void;
  onCancelDrag: (id: string) => void;
  onStep: (id: string, delta: -1 | 1) => void;
  onDrop: (id: string) => void;
  onLayoutWidth: (id: string, width: number) => void;
  children: (item: T, isGrabbed: boolean) => React.ReactNode;
}

const ReorderItem = <T,>({
  item,
  id,
  index,
  totalItems,
  isLifted,
  rowHeight,
  rowMargin,
  colors,
  animY,
  onStartDrag,
  onMoveDrag,
  onEndDrag,
  onCancelDrag,
  onStep,
  onDrop,
  onLayoutWidth,
  children,
}: ItemRowProps<T>) => {
  const isDraggingRef = useRef(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlersRef = useRef({ onStartDrag, onMoveDrag, onEndDrag, onCancelDrag });
  handlersRef.current = { onStartDrag, onMoveDrag, onEndDrag, onCancelDrag };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  // 1. Grip PanResponder: Instant drag on touch with ZERO delay
  const gripPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: () => {
        isDraggingRef.current = true;
        handlersRef.current.onStartDrag(id);
      },

      onPanResponderMove: (_, gestureState) => {
        handlersRef.current.onMoveDrag(id, gestureState);
      },

      onPanResponderRelease: (_, gestureState) => {
        isDraggingRef.current = false;
        handlersRef.current.onEndDrag(id, gestureState, true);
      },

      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
        handlersRef.current.onCancelDrag(id);
      },
    })
  ).current;

  // 2. Card Body PanResponder: 160ms hold-to-drag anywhere inside the container
  const cardPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,

      // Once lifted/dragging, NEVER allow ScrollView to terminate!
      onPanResponderTerminationRequest: () => !isDraggingRef.current,

      onPanResponderGrant: () => {
        isDraggingRef.current = false;
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

        holdTimerRef.current = setTimeout(() => {
          isDraggingRef.current = true;
          handlersRef.current.onStartDrag(id);
        }, 160);
      },

      onPanResponderMove: (_, gestureState) => {
        if (!isDraggingRef.current) {
          // If vertical finger moves > 8px before 160ms, user is scrolling, so cancel hold
          if (Math.hypot(gestureState.dx, gestureState.dy) > 8) {
            if (holdTimerRef.current) {
              clearTimeout(holdTimerRef.current);
              holdTimerRef.current = null;
            }
          }
          return;
        }

        handlersRef.current.onMoveDrag(id, gestureState);
      },

      onPanResponderRelease: (_, gestureState) => {
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        const wasDragging = isDraggingRef.current;
        isDraggingRef.current = false;
        handlersRef.current.onEndDrag(id, gestureState, wasDragging);
      },

      onPanResponderTerminate: () => {
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        isDraggingRef.current = false;
        handlersRef.current.onCancelDrag(id);
      },
    })
  ).current;

  return (
    <Animated.View
      {...cardPanResponder.panHandlers}
      onLayout={(e) => onLayoutWidth(id, e.nativeEvent.layout.width)}
      style={[
        styles.itemRow,
        {
          height: rowHeight,
          marginBottom: rowMargin,
          borderColor: isLifted
            ? (colors.textPrimary || '#FFFFFF')
            : (colors.surfaceBorder || '#333333'),
          borderWidth: isLifted ? 1.5 : StyleSheet.hairlineWidth,
          backgroundColor: isLifted
            ? (colors.surfaceElevated || '#222222')
            : (colors.surface || '#111111'),
          zIndex: isLifted ? 9999 : 1,
          elevation: isLifted ? 30 : 0,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isLifted ? 0.35 : 0,
          shadowRadius: 10,
          transform: [
            { translateY: animY },
            { scale: isLifted ? 1.03 : 1.0 },
          ],
        },
      ]}
    >
      {/* 6-dot Grip Handle with Instant Drag PanResponder */}
      <View
        {...gripPanResponder.panHandlers}
        style={styles.gripWrap}
        hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
      >
        <GripIcon
          size={14}
          color={isLifted ? (colors.textPrimary || '#FFFFFF') : (colors.textMuted || '#888888')}
        />
      </View>

      {/* Item Content */}
      <View style={styles.childWrap}>
        {children(item, isLifted)}
      </View>

      {/* Quick Step Controls (Active when lifted/grabbed) */}
      {isLifted && (
        <View style={styles.stepControlsRow}>
          {index > 0 && (
            <TouchableOpacity
              onPress={() => onStep(id, -1)}
              style={[styles.stepBtn, { borderColor: colors.surfaceBorder, backgroundColor: colors.surface }]}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel="Move session up"
            >
              <Text style={[styles.stepBtnText, { color: colors.textPrimary }]}>▲</Text>
            </TouchableOpacity>
          )}

          {index < totalItems - 1 && (
            <TouchableOpacity
              onPress={() => onStep(id, 1)}
              style={[styles.stepBtn, { borderColor: colors.surfaceBorder, backgroundColor: colors.surface }]}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel="Move session down"
            >
              <Text style={[styles.stepBtnText, { color: colors.textPrimary }]}>▼</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => onDrop(id)}
            style={[styles.doneBtn, { backgroundColor: colors.textPrimary }]}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel="Done reordering session"
          >
            <Text style={[styles.doneBtnText, { color: colors.surface || '#000000' }]}>✓</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

export function ReorderList<T>({
  children,
  label,
  itemHeight = 48,
  itemMargin = 8,
  colors = {},
  setScrollEnabled,
  onItemTap,
  ...options
}: ReorderListProps<T>) {
  const { items, getId, onReorder, onCommit } = options;
  const list = useReorderList(options);
  const ITEM_HEIGHT = itemHeight + itemMargin;

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const activeDragIdRef = useRef<string | null>(null);
  const hoverIndexRef = useRef<number | null>(null);
  const itemWidthsRef = useRef<{ [key: string]: number }>({});

  // Fresh items reference to completely eliminate stale closures
  const liveItemsRef = useRef(items);
  liveItemsRef.current = items;

  // Individual persistent translateY animation values for every item
  const itemAnimsRef = useRef<{ [key: string]: Animated.Value }>({});
  const getItemAnim = useCallback((id: string) => {
    if (!itemAnimsRef.current[id]) {
      itemAnimsRef.current[id] = new Animated.Value(0);
    }
    return itemAnimsRef.current[id];
  }, []);

  const handleStartDrag = useCallback((id: string) => {
    const fromIdx = liveItemsRef.current.findIndex((b) => getId(b) === id);
    if (fromIdx === -1) return;

    activeDragIdRef.current = id;
    hoverIndexRef.current = fromIdx;

    // Reset this item's anim to 0 at the start of drag
    getItemAnim(id).setValue(0);

    setActiveDragId(id);
    list.onDragStart(id);
    setScrollEnabled?.(false);
  }, [getId, getItemAnim, list, setScrollEnabled]);

  const handleMoveDrag = useCallback((id: string, gestureState: PanResponderGestureState) => {
    if (activeDragIdRef.current !== id) return;

    const fromIdx = liveItemsRef.current.findIndex((b) => getId(b) === id);
    if (fromIdx === -1) return;

    const total = liveItemsRef.current.length;
    const minDy = -fromIdx * ITEM_HEIGHT;
    const maxDy = (total - 1 - fromIdx) * ITEM_HEIGHT;
    const clampedDy = Math.max(minDy, Math.min(maxDy, gestureState.dy));

    // Move the dragged item directly with the finger on every frame
    const dragAnim = getItemAnim(id);
    dragAnim.setValue(clampedDy);

    // Calculate hover index based on finger offset
    const newHover = Math.max(
      0,
      Math.min(total - 1, fromIdx + Math.round(clampedDy / ITEM_HEIGHT))
    );

    if (newHover !== hoverIndexRef.current) {
      hoverIndexRef.current = newHover;
      HapticService.buttonPress();

      // Smoothly spring other items out of the way
      liveItemsRef.current.forEach((item, j) => {
        const itemId = getId(item);
        if (itemId === id) return;
        let targetShift = 0;
        if (fromIdx < newHover) {
          if (j > fromIdx && j <= newHover) {
            targetShift = -ITEM_HEIGHT;
          }
        } else if (fromIdx > newHover) {
          if (j < fromIdx && j >= newHover) {
            targetShift = ITEM_HEIGHT;
          }
        }
        const anim = getItemAnim(itemId);
        Animated.spring(anim, {
          toValue: targetShift,
          ...CELL,
        }).start();
      });
    }
  }, [ITEM_HEIGHT, getId, getItemAnim]);

  const handleEndDrag = useCallback(
    (id: string, gestureState: PanResponderGestureState, wasDragging: boolean) => {
      if (!wasDragging) {
        // Quick tap: trigger edit or delete callback
        const fromIdx = liveItemsRef.current.findIndex((b) => getId(b) === id);
        if (fromIdx === -1) return;
        const currentItem = liveItemsRef.current[fromIdx];
        const width = itemWidthsRef.current[id] || 320;
        const isRightEdge = gestureState.x0 > width - 48;

        onItemTap?.(currentItem, fromIdx, isRightEdge);
        activeDragIdRef.current = null;
        hoverIndexRef.current = null;
        return;
      }

      // Reorder drop completion
      const fromIdx = liveItemsRef.current.findIndex((b) => getId(b) === id);
      const toIdx = hoverIndexRef.current ?? fromIdx;

      setScrollEnabled?.(true);
      setActiveDragId(null);
      activeDragIdRef.current = null;
      hoverIndexRef.current = null;

      // Stop and reset all animations synchronously BEFORE triggering state update
      Object.keys(itemAnimsRef.current).forEach((itemId) => {
        const anim = itemAnimsRef.current[itemId];
        anim.stopAnimation();
        anim.setValue(0);
      });

      if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
        const next = moveItem(liveItemsRef.current, fromIdx, toIdx);
        onReorder(next);
        onCommit?.(next);
      }
      list.onDragEnd(id);
    },
    [getId, list, onCommit, onItemTap, onReorder, setScrollEnabled]
  );

  const handleCancelDrag = useCallback((id: string) => {
    setScrollEnabled?.(true);
    setActiveDragId(null);
    activeDragIdRef.current = null;
    hoverIndexRef.current = null;

    Object.keys(itemAnimsRef.current).forEach((itemId) => {
      const anim = itemAnimsRef.current[itemId];
      anim.stopAnimation();
      anim.setValue(0);
    });

    list.cancel();
  }, [list, setScrollEnabled]);

  const handleLayoutWidth = useCallback((id: string, width: number) => {
    itemWidthsRef.current[id] = width;
  }, []);

  const handleStep = useCallback((id: string, delta: -1 | 1) => {
    list.step(id, delta);
  }, [list]);

  const handleDrop = useCallback((id: string) => {
    list.drop(id);
    setActiveDragId(null);
    activeDragIdRef.current = null;
    setScrollEnabled?.(true);
  }, [list, setScrollEnabled]);

  return (
    <View style={styles.container}>
      {items.map((item, idx) => {
        const id = getId(item);
        const isLifted = activeDragId === id || list.grabbed === id;
        return (
          <ReorderItem
            key={id}
            item={item}
            id={id}
            index={idx}
            totalItems={items.length}
            isLifted={isLifted}
            animY={getItemAnim(id)}
            rowHeight={itemHeight}
            rowMargin={itemMargin}
            colors={colors}
            onStartDrag={handleStartDrag}
            onMoveDrag={handleMoveDrag}
            onEndDrag={handleEndDrag}
            onCancelDrag={handleCancelDrag}
            onStep={handleStep}
            onDrop={handleDrop}
            onLayoutWidth={handleLayoutWidth}
          >
            {children}
          </ReorderItem>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  gripWrap: {
    width: 24,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  childWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 6,
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  doneBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  doneBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
});

export default ReorderList;
