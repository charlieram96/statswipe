import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Modal,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { EventType, GamePlayer, Player } from '../lib/supabase';
import { FONTS } from '../constants/fonts';
import { StealFromModal } from './StealFromModal';
import { FoulOnModal } from './FoulOnModal';

const { width, height } = Dimensions.get('window');

// Trail point interface
interface TrailPoint {
  x: number;
  y: number;
  timestamp: number;
}

// Haptic feedback helpers
const lightHaptic = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    console.warn('Light haptic failed:', error);
  }
};

const mediumHaptic = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.warn('Medium haptic failed:', error);
  }
};

interface SwipeZoneProps {
  onStatRecorded: (eventType: EventType | 'shot2_attempt' | 'shot3_attempt' | 'assist', playerId: string) => void;
  disabled?: boolean;
  allPlayers: { [key: string]: Player };
  teamA: GamePlayer[];
  teamB: GamePlayer[];
  selectedPlayer?: GamePlayer | null;
  onPlayerDeselected?: () => void;
  gameMode?: 1 | 2 | 3 | 4 | 5 | null;
}

export const SwipeZone: React.FC<SwipeZoneProps> = React.memo(({
  onStatRecorded,
  disabled = false,
  allPlayers,
  teamA,
  teamB,
  selectedPlayer,
  onPlayerDeselected,
  gameMode,
}) => {
  // Add prop validation to prevent crashes
  if (!onStatRecorded || !allPlayers || !teamA || !teamB) {
    console.warn('SwipeZone: Missing required props');
    return null;
  }

  const insets = useSafeAreaInsets();
  
  // Memoize calculations to avoid re-calculations during render
  const dimensions = React.useMemo(() => {
    const swipeZoneHeight = insets.bottom + 120;
    const statZonesHeight = height - swipeZoneHeight - insets.top - 8;
    const rowHeight = statZonesHeight / 3;
    const swipeZoneTop = statZonesHeight + insets.top;
    const statZonesTop = insets.top;
    
    return {
      SWIPE_ZONE_HEIGHT: swipeZoneHeight,
      STAT_ZONES_HEIGHT: statZonesHeight,
      ROW_HEIGHT: rowHeight,
      SWIPE_ZONE_TOP: swipeZoneTop,
      STAT_ZONES_TOP: statZonesTop,
    };
  }, [insets.bottom, insets.top]);
  
  const { SWIPE_ZONE_HEIGHT, STAT_ZONES_HEIGHT, ROW_HEIGHT, SWIPE_ZONE_TOP, STAT_ZONES_TOP } = dimensions; 
  
  // Define screen zones as a 3-row layout
  const getStatZones = () => {
    // Base zones that don't change
    const baseZones = {
      // Row 1: TURNOVER, BLOCK (2 zones, 50% width each)
      turnover: { 
        x: 0, // Start from left edge
        y: STAT_ZONES_TOP, 
        width: width * 0.5, // 50% width
        height: ROW_HEIGHT, 
        label: 'TURNOVER',
        icon: 'sync-outline',
        color: 'rgba(60, 40, 40, 0.95)',
        highlightColor: 'rgba(80, 50, 50, 1.0)'
      },
      block: { 
        x: width * 0.5, // Start from middle
        y: STAT_ZONES_TOP, 
        width: width * 0.5, // 50% width
        height: ROW_HEIGHT, 
        label: 'BLOCK',
        icon: 'shield',
        color: 'rgba(50, 50, 50, 0.95)',
        highlightColor: 'rgba(70, 70, 70, 1.0)'
      },
      
      // Row 2: STEAL, FOUL (2 zones, 50% width each)
      steal: { 
        x: 0, // Start from left edge
        y: STAT_ZONES_TOP + ROW_HEIGHT, 
        width: width * 0.5, // 50% width
        height: ROW_HEIGHT, 
        label: 'STEAL',
        icon: 'hand-right-outline',
        color: 'rgba(40, 60, 40, 0.95)',
        highlightColor: 'rgba(50, 80, 50, 1.0)'
      },
      foul: { 
        x: width * 0.5, // Start from middle
        y: STAT_ZONES_TOP + ROW_HEIGHT, 
        width: width * 0.5, // 50% width
        height: ROW_HEIGHT, 
        label: 'FOUL',
        icon: 'alert-circle',
        color: 'rgba(60, 60, 40, 0.95)',
        highlightColor: 'rgba(80, 80, 50, 1.0)'
      },
      
      // Row 3: 3PT ATTEMPT, 2PT ATTEMPT, REBOUND (3 zones)
      shot3_attempt: { 
        x: 0, 
        y: STAT_ZONES_TOP + (ROW_HEIGHT * 2), 
        width: width / 3, 
        height: ROW_HEIGHT, 
        label: '3PT ATTEMPT',
        icon: 'radio-button-on-outline',
        color: 'rgba(50, 40, 60, 0.95)',
        highlightColor: 'rgba(65, 50, 80, 1.0)'
      },
      shot2_attempt: { 
        x: width / 3, 
        y: STAT_ZONES_TOP + (ROW_HEIGHT * 2), 
        width: width / 3, 
        height: ROW_HEIGHT, 
        label: '2PT ATTEMPT',
        icon: 'basketball',
        color: 'rgba(40, 50, 60, 0.95)',
        highlightColor: 'rgba(50, 65, 80, 1.0)'
      },
      rebound: { 
        x: (width / 3) * 2, 
        y: STAT_ZONES_TOP + (ROW_HEIGHT * 2), 
        width: width / 3, 
        height: ROW_HEIGHT, 
        label: 'REBOUND',
        icon: 'trending-up',
        color: 'rgba(60, 50, 40, 0.95)',
        highlightColor: 'rgba(80, 65, 50, 1.0)'
      },
    };

    return baseZones;
  };

  const [isActive, setIsActive] = useState(false);
  const [currentPosition, setCurrentPosition] = useState({ x: -1, y: -1 });
  const [showAssistModal, setShowAssistModal] = useState(false);
  const [showStealFromModal, setShowStealFromModal] = useState(false);
  const [showFoulOnModal, setShowFoulOnModal] = useState(false);
  const [hasMovedOverStatZone, setHasMovedOverStatZone] = useState(false);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [shotContext, setShotContext] = useState<'2pt' | '3pt' | null>(null);
  
  const lastHoveredZoneRef = useRef<string | null>(null);
  const trailOpacity = useRef(new Animated.Value(0)).current;

  const getZoneAtPosition = (x: number, y: number): EventType | 'shot2_attempt' | 'shot3_attempt' | 'shot2_make' | 'shot2_miss' | 'shot3_make' | 'shot3_miss' | null => {
    const zones = getCurrentStatZones();
    for (const [eventType, zone] of Object.entries(zones)) {
      if (
        x >= zone.x &&
        x <= zone.x + zone.width &&
        y >= zone.y &&
        y <= zone.y + zone.height
      ) {
        return eventType as EventType | 'shot2_attempt' | 'shot3_attempt' | 'shot2_make' | 'shot2_miss' | 'shot3_make' | 'shot3_miss';
      }
    }
    return null;
  };

  // Get current stat zones (including dynamic transformations)
  const getCurrentStatZones = () => {
    const baseZones = getStatZones();
    
    // If hovering over shot attempts, transform other zones
    if (hoveredZone === 'shot2_attempt') {
      return {
        turnover: baseZones.turnover,
        block: baseZones.block,
        steal: baseZones.steal,
        foul: baseZones.foul,
        shot2_attempt: baseZones.shot2_attempt,
        shot2_make: {
          ...baseZones.shot3_attempt,
          label: '2PT MAKE',
          icon: 'checkmark-circle',
          color: 'rgba(40, 80, 40, 0.95)',
          highlightColor: 'rgba(50, 100, 50, 1.0)'
        },
        shot2_miss: {
          ...baseZones.rebound,
          label: '2PT MISS',
          icon: 'close-circle',
          color: 'rgba(80, 40, 40, 0.95)',
          highlightColor: 'rgba(100, 50, 50, 1.0)'
        }
      };
    } else if (hoveredZone === 'shot3_attempt') {
      return {
        turnover: baseZones.turnover,
        block: baseZones.block,
        steal: baseZones.steal,
        foul: baseZones.foul,
        shot3_attempt: baseZones.shot3_attempt,
        shot3_make: {
          ...baseZones.shot2_attempt,
          label: '3PT MAKE',
          icon: 'checkmark-circle',
          color: 'rgba(40, 80, 40, 0.95)',
          highlightColor: 'rgba(50, 100, 50, 1.0)'
        },
        shot3_miss: {
          ...baseZones.rebound,
          label: '3PT MISS',
          icon: 'close-circle',
          color: 'rgba(80, 40, 40, 0.95)',
          highlightColor: 'rgba(100, 50, 50, 1.0)'
        }
      };
    }
    
    return baseZones;
  };

  const trailRef = useRef<TrailPoint[]>([]);
  const [, bump] = useState(0);      // dummy to force render
  const lastFrame = useRef(0);

  const clearTrail = () => {
    trailRef.current = [];
    trailOpacity.setValue(0);
  };

  const lastRenderRef = useRef(0);
  // Trail utility functions
  const addTrailPoint = useCallback((x: number, y: number) => {
    const now = Date.now();
    // keep recent 500 ms
    const pts = trailRef.current.filter(p => now - p.timestamp < 500).slice(-50);
    const last = pts[pts.length - 1];
    if (!last || Math.hypot(x - last.x, y - last.y) >= 3) {
      pts.push({ x, y, timestamp: now });
      trailRef.current = pts;
    }
    // throttle re-render to 30 fps
    if (now - lastFrame.current > 33) {
      lastFrame.current = now;
      bump(n => n + 1);
    }
  }, []);

  // Clear state when player is deselected
  useEffect(() => {
    if (!selectedPlayer) {
      setIsActive(false);
      setCurrentPosition({ x: -1, y: -1 });
      setHasMovedOverStatZone(false);
      setHoveredZone(null);
      lastHoveredZoneRef.current = null;
      clearTrail();
    }
  }, [selectedPlayer, clearTrail]);

  const fadeOutTrail = useCallback(() => {
    Animated.timing(trailOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      trailRef.current = [];
    });
  }, []);

  // Generate SVG path from trail points
  const generateTrailPath = useCallback((points: TrailPoint[]) => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length - 1; i++) {
      const currentPoint = points[i];
      const nextPoint = points[i + 1];
      
      // Use quadratic bezier curves for smooth trail
      const controlX = (currentPoint.x + nextPoint.x) / 2;
      const controlY = (currentPoint.y + nextPoint.y) / 2;
      
      path += ` Q ${currentPoint.x} ${currentPoint.y} ${controlX} ${controlY}`;
    }
    
    // Add the last point
    if (points.length > 1) {
      const lastPoint = points[points.length - 1];
      path += ` L ${lastPoint.x} ${lastPoint.y}`;
    }
    
    return path;
  }, []);

  // Generate multiple trail segments with tapering effect
  const generateTaperedTrailPaths = useCallback((points: TrailPoint[]) => {
    if (points.length < 2) return [];
    
    const segments = [];
    const segmentLength = Math.max(1, Math.floor(points.length / 8)); // Create 8 segments
    
    for (let i = 0; i < points.length - 1; i += segmentLength) {
      const segmentPoints = points.slice(i, Math.min(i + segmentLength + 1, points.length));
      if (segmentPoints.length < 2) continue;
      
      const path = generateTrailPath(segmentPoints);
      const progress = i / (points.length - 1); // 0 to 1, where 0 is oldest (tail), 1 is newest (tip)
      
      // Calculate width: tip (newest) is thickest, tail (oldest) is thinnest
      const maxWidth = 18; // Made tip thicker
      const minWidth = 2;
      const width = minWidth + (maxWidth - minWidth) * progress; // Tip gets thicker as progress approaches 1
      
      // Keep consistent opacity as requested
      const opacity = 0.9;
      
      segments.push({
        path,
        width,
        opacity,
        isNewest: i >= points.length - segmentLength - 1
      });
    }
    
    return segments;
  }, [generateTrailPath]);

  // Trail renderer component
  const renderTrail = () => {
    if (trailRef.current.length < 2) return null;
    
    const trailSegments = generateTaperedTrailPaths(trailRef.current);
    if (trailSegments.length === 0) return null;
    
    return (
      <Animated.View 
        style={[
          styles.trailContainer,
          { opacity: trailOpacity }
        ]}
        pointerEvents="none"
      >
        <Svg 
          height={height} 
          width={width}
          style={StyleSheet.absoluteFillObject}
        >
          {trailSegments.map((segment, index) => (
            <React.Fragment key={index}>
              {/* Outer glow for each segment */}
              <Path
                d={segment.path}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth={segment.width + 4}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.4"
              />
              {/* Main trail segment */}
              <Path
                d={segment.path}
                stroke="rgba(255,255,255,0.95)"
                strokeWidth={segment.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity={segment.opacity}
              />
              {/* Inner bright line for newest segments */}
              {segment.isNewest && (
                <Path
                  d={segment.path}
                  stroke="rgba(255,255,255,1.0)"
                  strokeWidth={Math.max(1, segment.width * 0.3)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity="1.0"
                />
              )}
            </React.Fragment>
          ))}
        </Svg>
      </Animated.View>
    );
  };


  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled && !!selectedPlayer,
    onMoveShouldSetPanResponder: () => !disabled && !!selectedPlayer,
    
    onPanResponderGrant: (event: GestureResponderEvent) => {
      if (disabled || !selectedPlayer) return;
      
      try {
        const { pageX, pageY } = event.nativeEvent;
        
        setIsActive(true);
        setHasMovedOverStatZone(false);
        lastHoveredZoneRef.current = null;
        setCurrentPosition({ x: pageX, y: pageY });
        
        // Initialize trail
        // Use locationY (relative to swipe zone) + SWIPE_ZONE_TOP to get absolute position
        clearTrail();
        addTrailPoint(pageX, pageY);
        trailOpacity.setValue(1);
        
        lightHaptic();
      } catch (error) {
        console.error('Error in gesture start:', error);
        setIsActive(false);
      }
    },
    
    onPanResponderMove: (event: GestureResponderEvent) => {
      if (disabled || !selectedPlayer) return;
      
      try {
        const { pageX, pageY } = event.nativeEvent;
        
        setCurrentPosition({ x: pageX, y: pageY });
        
        // Add trail point
        // Use locationY + SWIPE_ZONE_TOP for correct absolute position
        addTrailPoint(pageX, pageY);
        const currentZone = getZoneAtPosition(pageX, pageY);
        
        // Update hovered zone for dynamic transformations
        setHoveredZone(currentZone);
        
        // Vibrate when entering a new zone for the first time during this gesture
        if (currentZone && currentZone !== lastHoveredZoneRef.current) {
          lightHaptic();
          lastHoveredZoneRef.current = currentZone;
        }
        
        if (currentZone && !hasMovedOverStatZone) {
          setHasMovedOverStatZone(true);
        }
      } catch (error) {
        console.error('Error in gesture move:', error);
      }
    },
    
    onPanResponderRelease: (event: GestureResponderEvent) => {
      if (disabled || !selectedPlayer) return;
      
      // Only process release if gesture was active
      if (!isActive) return;
      
      try {
        const { pageX, pageY } = event.nativeEvent;
        
        // Add final trail point
        addTrailPoint(pageX, pageY);
        
        // Check if user ended in swipe zone after moving over stat zones (cancel action)
        const isInSwipeZone = pageY >= SWIPE_ZONE_TOP;
        
        if (hasMovedOverStatZone && isInSwipeZone) {
          console.log('Gesture canceled - returned to swipe zone');
          lightHaptic();
          // Deselect player when canceling
          if (onPlayerDeselected) {
            onPlayerDeselected();
          }
        } else {
          const eventType = getZoneAtPosition(pageX, pageY);
          
          if (eventType && selectedPlayer) {
            console.log('Stat selected:', eventType, 'for player:', selectedPlayer.id);
            mediumHaptic();
            
            // Handle different stat types with new behaviors
            if (eventType === 'steal') {
              // Show modal to select who was stolen from
              setShowStealFromModal(true);
            } else if (eventType === 'foul') {
              // Show modal to select who was fouled
              setShowFoulOnModal(true);
            } else if (eventType === 'shot2_attempt' || eventType === 'shot3_attempt') {
              // Record the shot attempt
              setShotContext(eventType === 'shot2_attempt' ? '2pt' : '3pt');
              onStatRecorded(eventType, selectedPlayer.id);
              // Only ask about assist if not 1v1 mode
              if (gameMode !== 1) {
                setShowAssistModal(true);
              } else {
                // In 1v1, just deselect player
                if (onPlayerDeselected) {
                  onPlayerDeselected();
                }
              }
            } else if (eventType === 'shot2_make' || eventType === 'shot2_miss' || eventType === 'shot3_make' || eventType === 'shot3_miss') {
              // Handle shot make/miss from dynamic zones
              onStatRecorded(eventType, selectedPlayer.id);
              // Ask about assist if it was a make (and not 1v1 mode)
              if (eventType === 'shot2_make' || eventType === 'shot3_make') {
                setShotContext(eventType === 'shot2_make' ? '2pt' : '3pt');
                if (gameMode !== 1) {
                  setShowAssistModal(true);
                } else {
                  // In 1v1, just deselect player
                  if (onPlayerDeselected) {
                    onPlayerDeselected();
                  }
                }
              } else {
                // No assist for misses, just deselect
                if (onPlayerDeselected) {
                  onPlayerDeselected();
                }
              }
            } else {
              // For turnover, block, rebound - record directly
              onStatRecorded(eventType, selectedPlayer.id);
              // Deselect player after recording
              if (onPlayerDeselected) {
                onPlayerDeselected();
              }
            }
          } else if (!eventType) {
            console.log('Swipe outside any zone');
            lightHaptic();
            // Deselect player when swiping outside zones
            if (onPlayerDeselected) {
              onPlayerDeselected();
            }
          }
        }
        
        // Fade out trail
        fadeOutTrail();
      } catch (error) {
        console.error('Error in gesture end:', error);
        fadeOutTrail();
      }
      
      // Reset state
      setIsActive(false);
      setCurrentPosition({ x: -1, y: -1 });
      setHasMovedOverStatZone(false);
      setHoveredZone(null);
      lastHoveredZoneRef.current = null;
    },
    
    onPanResponderTerminate: () => {
      // Reset state if gesture is terminated
      setIsActive(false);
      setCurrentPosition({ x: -1, y: -1 });
      setHasMovedOverStatZone(false);
      setHoveredZone(null);
      lastHoveredZoneRef.current = null;
      
      // Clear trail immediately
      clearTrail();
    },
  });


  const handleAssistSelect = useCallback((assistPlayerId: string | null) => {
    setShowAssistModal(false);
    setShotContext(null);
    
    if (assistPlayerId) {
      // Record assist for the selected player
      onStatRecorded('assist', assistPlayerId);
    }
    
    // Clear selection and deselect player
    if (onPlayerDeselected) {
      onPlayerDeselected();
    }
  }, [onStatRecorded, onPlayerDeselected]);

  const handleStealFromSelect = useCallback((gamePlayerId: string) => {
    setShowStealFromModal(false);
    
    if (selectedPlayer) {
      // Record turnover for the victim (if not team)
      if (gamePlayerId !== 'team') {
        onStatRecorded('turnover', gamePlayerId);
      }
      
      // Record steal for the original player
      onStatRecorded('steal', selectedPlayer.id);
    }
    
    // Clear selection and deselect player
    if (onPlayerDeselected) {
      onPlayerDeselected();
    }
  }, [selectedPlayer, onStatRecorded, onPlayerDeselected]);

  const handleStealFromTeam = useCallback(() => {
    setShowStealFromModal(false);
    
    if (selectedPlayer) {
      // Only record steal for the original player (no individual turnover)
      onStatRecorded('steal', selectedPlayer.id);
    }
    
    // Clear selection and deselect player
    if (onPlayerDeselected) {
      onPlayerDeselected();
    }
  }, [selectedPlayer, onStatRecorded, onPlayerDeselected]);

  const handleFoulOnSelect = useCallback((gamePlayerId: string) => {
    setShowFoulOnModal(false);
    
    if (selectedPlayer) {
      // Record foul for the fouling player (the selected player)
      onStatRecorded('foul', selectedPlayer.id);
      
      // The person who was fouled doesn't get a negative stat recorded
      // (fouls are tracked on the person who committed them)
    }
    
    // Clear selection and deselect player
    if (onPlayerDeselected) {
      onPlayerDeselected();
    }
  }, [selectedPlayer, onStatRecorded, onPlayerDeselected]);

  const handleFoulOnTeam = useCallback(() => {
    setShowFoulOnModal(false);
    
    if (selectedPlayer) {
      // Record technical/general foul for the fouling player
      onStatRecorded('foul', selectedPlayer.id);
    }
    
    // Clear selection and deselect player
    if (onPlayerDeselected) {
      onPlayerDeselected();
    }
  }, [selectedPlayer, onStatRecorded, onPlayerDeselected]);

  const renderStatZones = () => {
    if (!isActive) return null;

    const currentZone = getZoneAtPosition(currentPosition.x, currentPosition.y);
    const zones = getCurrentStatZones();

    return (
      <View style={styles.zonesOverlay}>
        {Object.entries(zones).map(([eventType, zone]) => {
          const isHighlighted = currentZone === eventType;
          
          return (
            <View
              key={eventType}
              style={[
                styles.statZone,
                {
                  left: zone.x,
                  top: zone.y,
                  width: zone.width,
                  height: zone.height,
                  backgroundColor: isHighlighted ? zone.highlightColor : zone.color,
                },
              ]}
            >
              <View style={styles.zoneContent}>
                <Ionicons 
                  name={zone.icon as any} 
                  size={32} 
                  color={isHighlighted ? "#fff" : "rgba(255, 255, 255, 0.7)"} 
                  style={styles.zoneIcon}
                />
                <Text style={[
                  styles.statZoneText,
                  isHighlighted && styles.highlightedZoneText
                ]}>
                  {zone.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const currentZone = getZoneAtPosition(currentPosition.x, currentPosition.y);
  const isHoveringOverZone = currentZone !== null;

  // Get opposite team players for steal/foul modals
  const getOppositeTeamPlayers = () => {
    if (!selectedPlayer) return [];
    const selectedTeam = selectedPlayer.team;
    const oppositeTeam = selectedTeam === 'A' ? 'B' : 'A';
    return oppositeTeam === 'A' ? teamA : teamB;
  };

  try {
    return (
      <>
        {renderStatZones()}
        {renderTrail()}

        {/* Swipe Zone */}
        <View style={[styles.container, { height: SWIPE_ZONE_HEIGHT }]}>
          <View
            {...panResponder.panHandlers}
            style={[
              styles.swipeZone,
              isActive && !isHoveringOverZone && styles.activeSwipeZone,
              isActive && isHoveringOverZone && styles.cancelSwipeZone,
              (disabled || !selectedPlayer) && styles.disabledSwipeZone
            ]}
          >
            <View style={styles.swipeZoneContent}>
              <Ionicons 
                name={isActive && isHoveringOverZone ? "close" : isActive ? "trending-up" : "finger-print"} 
                size={24} 
                color={isActive ? "#fff" : "rgba(255, 255, 255, 0.6)"} 
                style={styles.swipeZoneIcon}
              />
              <Text style={[
                styles.instructionText,
                isActive && !isHoveringOverZone && styles.activeInstructionText,
                isActive && isHoveringOverZone && styles.cancelInstructionText,
                disabled && styles.disabledInstructionText
              ]}>
                {isActive && isHoveringOverZone ? 'Release here to cancel' : 
                 isActive ? 'Swipe to a stat zone' : 
                 selectedPlayer ? `Swipe for ${allPlayers[selectedPlayer.player_id]?.name || 'Player'}` :
                 'Select a player first'}
              </Text>
            </View>
          </View>
        </View>


        {/* Assist Modal */}
        <Modal
          visible={showAssistModal}
          transparent
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Was there an assist?</Text>
              
              <View style={styles.playerList}>
                {(selectedPlayer?.team === 'A' ? teamA : teamB).map((gamePlayer) => {
                  if (!gamePlayer || !gamePlayer.id || gamePlayer.id === selectedPlayer?.id) return null;
                  const player = allPlayers[gamePlayer.player_id];
                  return (
                    <TouchableOpacity
                      key={gamePlayer.id}
                      style={styles.playerOption}
                      onPress={() => handleAssistSelect(gamePlayer.id)}
                    >
                      <Text style={styles.playerOptionText}>
                        {player?.name || 'Unknown'} 
                        {player?.jersey_num && ` (#${player.jersey_num})`}
                      </Text>
                      <Text style={styles.teamIndicator}>
                        Team {gamePlayer.team}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              <TouchableOpacity
                style={styles.noAssistButton}
                onPress={() => handleAssistSelect(null)}
              >
                <Text style={styles.noAssistButtonText}>No Assist</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Steal From Modal */}
        <StealFromModal
          visible={showStealFromModal}
          onClose={() => setShowStealFromModal(false)}
          onSelectPlayer={handleStealFromSelect}
          onSelectTeam={handleStealFromTeam}
          oppositeTeamPlayers={getOppositeTeamPlayers()}
          allPlayers={allPlayers}
        />

        {/* Foul On Modal */}
        <FoulOnModal
          visible={showFoulOnModal}
          onClose={() => setShowFoulOnModal(false)}
          onSelectPlayer={handleFoulOnSelect}
          onSelectTeam={handleFoulOnTeam}
          oppositeTeamPlayers={getOppositeTeamPlayers()}
          allPlayers={allPlayers}
        />
      </>
    );
  } catch (error) {
    console.error('SwipeZone render error:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red' }}>SwipeZone Error</Text>
      </View>
    );
  }
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  swipeZone: {
    flex: 1,
    backgroundColor: '#37464D',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2B373F',
  },
  swipeZoneContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeZoneIcon: {
    marginBottom: 8,
  },
  activeSwipeZone: {
    backgroundColor: '#FF6723',
  },
  cancelSwipeZone: {
    backgroundColor: '#ff3b30',
  },
  disabledSwipeZone: {
    backgroundColor: '#131E24',
  },
  instructionText: {
    fontSize: 16,
    fontFamily: FONTS.orbitron.medium,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  activeInstructionText: {
    color: '#fff',
    fontSize: 18,
  },
  cancelInstructionText: {
    color: '#fff',
    fontSize: 18,
  },
  disabledInstructionText: {
    color: '#999',
  },
  trailContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
  },
  zonesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  statZone: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoneContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  zoneIcon: {
    marginBottom: 8,
  },
  statZoneText: {
    fontSize: 12,
    fontFamily: FONTS.orbitron.bold,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  highlightedZoneText: {
    color: '#fff',
    fontSize: 14,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#37464D',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#2B373F',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.orbitron.bold,
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
  },
  playerList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  playerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2B373F',
  },
  playerOptionText: {
    fontSize: 16,
    fontFamily: FONTS.orbitron.medium,
    flex: 1,
    color: '#fff',
  },
  teamIndicator: {
    fontSize: 12,
    fontFamily: FONTS.orbitron.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: '#131E24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cancelButton: {
    paddingVertical: 12,
    backgroundColor: '#37464D',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2B373F',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: FONTS.orbitron.medium,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  noAssistButton: {
    paddingVertical: 16,
    backgroundColor: '#FF6723',
    borderRadius: 8,
    alignItems: 'center',
  },
  noAssistButtonText: {
    fontSize: 16,
    fontFamily: FONTS.orbitron.medium,
    color: '#131E24',
  },
});