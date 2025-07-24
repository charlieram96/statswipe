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
}

export const SwipeZone: React.FC<SwipeZoneProps> = ({
  onStatRecorded,
  disabled = false,
  allPlayers,
  teamA,
  teamB,
}) => {
  // Add prop validation to prevent crashes
  if (!onStatRecorded || !allPlayers || !teamA || !teamB) {
    console.warn('SwipeZone: Missing required props');
    return null;
  }

  const insets = useSafeAreaInsets();
  
  // The stat zones should cover the entire screen height above the swipe zone
  const SWIPE_ZONE_HEIGHT = insets.bottom + 120; // Fixed height for swipe zone
  const STAT_ZONES_HEIGHT = height - insets.bottom - SWIPE_ZONE_HEIGHT - insets.top - 10;
  const ZONE_HEIGHT = STAT_ZONES_HEIGHT / 2;
  const ZONE_WIDTH = width / 4; // 4 columns for consistent layout
  
  const SWIPE_ZONE_TOP = STAT_ZONES_HEIGHT;
  const STAT_ZONES_TOP = 0; 
  
  // Define screen zones as a grid layout (4x2 grid covering full height above swipe zone)
  const STAT_ZONES = {
    // Top row (4 squares, each taking 1/4 width)
    block: { 
      x: 0, 
      y: STAT_ZONES_TOP, 
      width: ZONE_WIDTH, 
      height: ZONE_HEIGHT, 
      label: 'BLOCK',
      icon: 'shield',
      color: 'rgba(50, 50, 50, 0.95)',
      highlightColor: 'rgba(70, 70, 70, 1.0)'
    },
    turnover: { 
      x: ZONE_WIDTH, 
      y: STAT_ZONES_TOP, 
      width: ZONE_WIDTH, 
      height: ZONE_HEIGHT, 
      label: 'TURNOVER',
      icon: 'sync-outline',
      color: 'rgba(60, 40, 40, 0.95)',
      highlightColor: 'rgba(80, 50, 50, 1.0)'
    },
    foul: { 
      x: ZONE_WIDTH * 2, 
      y: STAT_ZONES_TOP, 
      width: ZONE_WIDTH, 
      height: ZONE_HEIGHT, 
      label: 'FOUL',
      icon: 'alert-circle',
      color: 'rgba(60, 60, 40, 0.95)',
      highlightColor: 'rgba(80, 80, 50, 1.0)'
    },
    steal: { 
      x: ZONE_WIDTH * 3, 
      y: STAT_ZONES_TOP, 
      width: ZONE_WIDTH, 
      height: ZONE_HEIGHT, 
      label: 'STEAL',
      icon: 'hand-right-outline',
      color: 'rgba(40, 60, 40, 0.95)',
      highlightColor: 'rgba(50, 80, 50, 1.0)'
    },
    // Bottom row (4 squares, each taking 1/4 width)
    shot2_attempt: { 
      x: 0, 
      y: STAT_ZONES_TOP + ZONE_HEIGHT, 
      width: ZONE_WIDTH, 
      height: ZONE_HEIGHT, 
      label: '2PT',
      icon: 'basketball',
      color: 'rgba(40, 50, 60, 0.95)',
      highlightColor: 'rgba(50, 65, 80, 1.0)'
    },
    shot3_attempt: { 
      x: ZONE_WIDTH, 
      y: STAT_ZONES_TOP + ZONE_HEIGHT, 
      width: ZONE_WIDTH, 
      height: ZONE_HEIGHT, 
      label: '3PT',
      icon: 'radio-button-on-outline',
      color: 'rgba(50, 40, 60, 0.95)',
      highlightColor: 'rgba(65, 50, 80, 1.0)'
    },
    rebound: { 
      x: ZONE_WIDTH * 2, 
      y: STAT_ZONES_TOP + ZONE_HEIGHT, 
      width: ZONE_WIDTH, 
      height: ZONE_HEIGHT, 
      label: 'REBOUND',
      icon: 'trending-up',
      color: 'rgba(60, 50, 40, 0.95)',
      highlightColor: 'rgba(80, 65, 50, 1.0)'
    },
    assist: { 
      x: ZONE_WIDTH * 3, 
      y: STAT_ZONES_TOP + ZONE_HEIGHT, 
      width: ZONE_WIDTH, 
      height: ZONE_HEIGHT, 
      label: 'ASSIST',
      icon: 'people',
      color: 'rgba(40, 60, 50, 0.95)',
      highlightColor: 'rgba(50, 80, 65, 1.0)'
    },
  };

  const [isActive, setIsActive] = useState(false);
  const [currentPosition, setCurrentPosition] = useState({ x: -1, y: -1 });
  const [selectedStat, setSelectedStat] = useState<EventType | 'shot2_attempt' | 'shot3_attempt' | 'assist' | null>(null);
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);
  const [showAssistModal, setShowAssistModal] = useState(false);
  const [hasMovedOverStatZone, setHasMovedOverStatZone] = useState(false);
  const [trailPoints, setTrailPoints] = useState<TrailPoint[]>([]);
  
  const lastHoveredZoneRef = useRef<string | null>(null);
  const trailOpacity = useRef(new Animated.Value(0)).current;

  const getZoneAtPosition = (x: number, y: number): EventType | 'shot2_attempt' | 'shot3_attempt' | 'assist' | null => {
    for (const [eventType, zone] of Object.entries(STAT_ZONES)) {
      if (
        x >= zone.x &&
        x <= zone.x + zone.width &&
        y >= zone.y &&
        y <= zone.y + zone.height
      ) {
        return eventType as EventType | 'shot2_attempt' | 'shot3_attempt' | 'assist';
      }
    }
    return null;
  };

  // Trail utility functions
  const addTrailPoint = useCallback((x: number, y: number) => {
    const now = Date.now();
    setTrailPoints(prevPoints => {
      // Remove points older than 500ms and limit to 25 points for performance
      const filteredPoints = prevPoints.filter(point => now - point.timestamp < 500);
      const limitedPoints = filteredPoints.slice(-24); // Keep last 24 points + new one = 25
      
      // Only add point if it's significantly different from the last point (reduces noise)
      const lastPoint = limitedPoints[limitedPoints.length - 1];
      if (lastPoint) {
        const distance = Math.sqrt(Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2));
        if (distance < 3) return limitedPoints; // Skip if movement is too small
      }
      
      return [...limitedPoints, { x, y, timestamp: now }];
    });
  }, []);

  const clearTrail = useCallback(() => {
    setTrailPoints([]);
    trailOpacity.setValue(0);
  }, []);

  const fadeOutTrail = useCallback(() => {
    Animated.timing(trailOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTrailPoints([]);
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
    if (trailPoints.length < 2) return null;
    
    const trailSegments = generateTaperedTrailPaths(trailPoints);
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
                stroke="rgba(255,255,255,0.2)"
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
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    
    onPanResponderGrant: (event: GestureResponderEvent) => {
      if (disabled) return;
      
      try {
        const { pageX, pageY } = event.nativeEvent;
        
        setIsActive(true);
        setHasMovedOverStatZone(false);
        lastHoveredZoneRef.current = null;
        setCurrentPosition({ x: pageX, y: pageY });
        
        // Initialize trail with offset correction
        clearTrail();
        addTrailPoint(pageX, pageY - 95);
        trailOpacity.setValue(1);
        
        lightHaptic();
      } catch (error) {
        console.error('Error in gesture start:', error);
        setIsActive(false);
      }
    },
    
    onPanResponderMove: (event: GestureResponderEvent) => {
      if (disabled) return;
      
      try {
        const { pageX, pageY } = event.nativeEvent;
        
        setCurrentPosition({ x: pageX, y: pageY });
        
        // Add trail point with offset correction (finger appears ~70px higher than pageY)
        addTrailPoint(pageX, pageY - 95);
        
        // Check if user has moved over a stat zone
        const currentZone = getZoneAtPosition(pageX, pageY);
        
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
      if (disabled) return;
      
      try {
        const { pageX, pageY } = event.nativeEvent;
        
        // Add final trail point with offset correction
        addTrailPoint(pageX, pageY - 95);
        
        // Check if user ended in swipe zone after moving over stat zones (cancel action)
        const isInSwipeZone = pageY >= SWIPE_ZONE_TOP;
        
        if (hasMovedOverStatZone && isInSwipeZone) {
          console.log('Gesture canceled - returned to swipe zone');
          lightHaptic();
        } else {
          const eventType = getZoneAtPosition(pageX, pageY);
          
          if (eventType) {
            console.log('Stat selected:', eventType);
            mediumHaptic();
            
            // Select the stat and show player selection
            setSelectedStat(eventType);
            setShowPlayerSelect(true);
          } else {
            console.log('Swipe outside any zone');
            lightHaptic();
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
      lastHoveredZoneRef.current = null;
    },
    
    onPanResponderTerminate: () => {
      // Reset state if gesture is terminated
      setIsActive(false);
      setCurrentPosition({ x: -1, y: -1 });
      setHasMovedOverStatZone(false);
      lastHoveredZoneRef.current = null;
      
      // Clear trail immediately
      clearTrail();
    },
  });

  const handlePlayerSelect = useCallback((playerId: string) => {
    if (!selectedStat) return;
    
    console.log('Player selected:', playerId, 'for stat:', selectedStat);
    
    // Record the stat for this player
    onStatRecorded(selectedStat, playerId);
    
    // If it's a shot, ask about assist
    if (selectedStat === 'shot2_attempt' || selectedStat === 'shot3_attempt') {
      setShowAssistModal(true);
    } else {
      // Clear selection
      setSelectedStat(null);
    }
    
    setShowPlayerSelect(false);
  }, [selectedStat, onStatRecorded]);

  const handleAssistSelect = useCallback((assistPlayerId: string | null) => {
    setShowAssistModal(false);
    
    if (assistPlayerId) {
      // Record assist for the selected player
      onStatRecorded('assist', assistPlayerId);
    }
    
    // Clear selection
    setSelectedStat(null);
  }, [onStatRecorded]);

  const renderStatZones = () => {
    if (!isActive) return null;

    const currentZone = getZoneAtPosition(currentPosition.x, currentPosition.y);

    return (
      <View style={styles.zonesOverlay}>
        {Object.entries(STAT_ZONES).map(([eventType, zone]) => {
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
              disabled && styles.disabledSwipeZone
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
                 isActive ? 'Swipe to a stat zone' : 'Touch here to start a swipe'}
              </Text>
            </View>
          </View>
        </View>

        {/* Player Selection Modal */}
        <Modal
          visible={showPlayerSelect}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Who {selectedStat?.replace('_attempt', '') || 'recorded this stat'}?
              </Text>
              
              <View style={styles.playerList}>
                {[...teamA, ...teamB].map((gamePlayer) => {
                  if (!gamePlayer || !gamePlayer.id) return null;
                  const player = allPlayers[gamePlayer.player_id];
                  return (
                    <TouchableOpacity
                      key={gamePlayer.id}
                      style={styles.playerOption}
                      onPress={() => handlePlayerSelect(gamePlayer.id)}
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
                style={styles.cancelButton}
                onPress={() => {
                  setShowPlayerSelect(false);
                  setSelectedStat(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
                {[...teamA, ...teamB].map((gamePlayer) => {
                  if (!gamePlayer || !gamePlayer.id) return null;
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
};

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