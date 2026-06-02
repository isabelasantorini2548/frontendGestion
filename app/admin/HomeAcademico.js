import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  FlatList,
  Animated,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
  Modal, TextInput, KeyboardAvoidingView
} from 'react-native';
import { useRouter, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { BarChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Configuración de API
let determinedApiBaseUrl;
/*if (Platform.OS === 'android') {
  determinedApiBaseUrl = 'http://192.168.0.167:3001/api';
} else if (Platform.OS === 'ios') {
  determinedApiBaseUrl = 'http://192.168.0.167:3001/api';
} else {
  determinedApiBaseUrl = 'http://localhost:3001/api';
}*/
//const API_BASE_URL =  'https://evento.cidtec-uc.com';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://unibackend1-production.up.railway.app';

//const API_BASE_URL =  'https://unifrontend.onrender.com';
const TOKEN_KEY = 'adminAuthToken';

const getTokenAsync = async () => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (e) {
      console.error("Error al acceder a localStorage en web:", e);
      return null;
    }
  } else {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.error("Error al obtener token de SecureStore en nativo:", e);
      return null;
    }
  }
};

const deleteTokenAsync = async () => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error("Error al eliminar token de localStorage en web:", e);
    }
  } else {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.error("Error al eliminar token de SecureStore en nativo:", e);
    }
  }
};

const COLORS = {
  primary: '#E95A0C',
  primaryLight: '#FFEDD5',
  secondary: '#4B5563',
  accent: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  divider: '#D1D5DB',
  shadow: 'rgba(0, 0, 0, 0.05)',
  white: '#FFFFFF',
  black: '#000000',
};

const CARD_MARGIN = 12;
const MIN_CARD_WIDTH_DASHBOARD = 160;
const MAX_COLUMNS_DASHBOARD = 4;
const MIN_CARD_WIDTH_ACTIONS = 200;
const MAX_COLUMNS_ACTIONS = 3;

const DashboardCard = ({ title, value, icon, color, trend, description }) => {
  const trendColor = trend > 0 ? COLORS.success : COLORS.accent;
  
  return (
    <View style={[styles.dashboardCard, { backgroundColor: `${color}08` }]}>
      <View style={styles.cardHeader}>
        {/* Contenedor del icono circular como en la imagen */}
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Ionicons name={icon} size={22} color={COLORS.white} />
        </View>
        <Text style={styles.cardValue}>{value}</Text>
      </View>
      
      <View>
        <Text style={styles.cardTitle}>{title}</Text>
        
        {trend !== undefined && trend !== null ? (
          <View style={styles.cardTrend}>
            <Text style={[styles.cardTrendText, { color: trendColor }]}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% {trend > 0 ? '↑' : '↓'}
            </Text>
          </View>
        ) : null}
        
        {description && (
          <Text style={styles.cardDescription}>{description}</Text>
        )}
      </View>
    </View>
  );
};

const ActionCard = ({ action, onPress, cardWidth, index }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 100,
      bounciness: 8,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 100,
      bounciness: 8,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`Acción: ${action.title}`}
      style={{ margin: CARD_MARGIN / 2, width: cardWidth }}
    >
      <Animated.View
        style={[
          styles.actionCard,
          {
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={[styles.actionCardIconMinimal, { backgroundColor: action.color + '10' }]}>
          <Ionicons name={action.iconName} size={28} color={action.color} />
        </View>
        <View style={styles.actionCardContentMinimal}>
          <View style={styles.actionCardTitleContainerMinimal}>
            <Text style={styles.actionCardTitleMinimal} numberOfLines={1}>
              {action.title}
            </Text>
            {action.badge && (
              <View style={[styles.actionCardBadgeMinimal, { backgroundColor: action.badgeColor || COLORS.primary }]}>
                <Text style={styles.actionCardBadgeTextMinimal} numberOfLines={1}>
                  {action.badge}
                </Text>
              </View>
            )}
          </View>
          {action.description && (
            <Text style={styles.actionCardDescriptionMinimal} numberOfLines={2}>
              {action.description}
            </Text>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const MinimalBottomDock = ({ onLogout, onActionPress, isExpanded, onToggleExpanded }) => {
  const { width: windowWidth } = useWindowDimensions();
  const dockHeight = useRef(new Animated.Value(60)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(dockHeight, {
        toValue: isExpanded ? 200 : 60,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isExpanded]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const quickActions = [
    {
      id: 'add-user',
      title: 'Nuevo Usuario',
      icon: 'person-add-outline',
      color: COLORS.primary,
      action: '/admin/UsuariosA'
    },
    {
      id: 'pendientes',
      title: 'Pendientes',
      icon: 'document-text-outline',
      route: '/admin/EventosPendientes',
      color: COLORS.warning,
      //action: {
        //pathname: '/admin/EventosPendientes',
       // params: { area: 'academica'   }
        //}
      },
    {
      id: 'aprobados',
      title: 'Aprobados',
      icon: 'checkmark-circle-outline',
      color: COLORS.success,
      route: '/admin/EventosAprobados',
    },
    {
      id: 'settings',
      title: 'Ajustes',
      icon: 'settings-outline',
      color: COLORS.secondary,
      action: '/admin/Settings'
    }
  ];

  return (
    <Animated.View style={[styles.minimalDockContainer, { height: dockHeight }]}>
      <TouchableOpacity onPress={onToggleExpanded} style={styles.minimalDockToggle}>
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <Ionicons name="chevron-up-outline" size={20} color={COLORS.white} />
        </Animated.View>
        <Text style={styles.minimalDockToggleText}>Menú</Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.minimalDockExpandedContent}>
          <View style={styles.minimalDockQuickActions}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.minimalDockQuickActionButton}
                onPress={() => onActionPress(action.action)}
              >
                <Ionicons name={action.icon} size={22} color={action.color} />
                <Text style={[styles.minimalDockQuickActionText, { color: action.color }]}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={onLogout} style={styles.minimalDockLogoutButton}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
            <Text style={styles.minimalDockLogoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

const MinimalHeader = ({ nombreUsuario, facultad, unreadCount, onNotificationPress }) => {
  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <View style={styles.minimalHeaderContainer}>
     <View style={styles.minimalHeaderTop}>
      <View style={styles.minimalHeaderGreeting}>
        <Text style={styles.minimalGreetingText}>{getCurrentGreeting()},</Text>
        <Text style={styles.minimalUserNameText}>{nombreUsuario}</Text>
      </View>
      
        <NotificationBell 
          notificationCount={unreadCount} 
          onPress={onNotificationPress} 
        />
      </View>
      <Text style={styles.minimalUserFacultyText}>
        {facultad || 'Sin facultad asignada'} 
      </Text>
      
      <Text style={styles.minimalHeaderTitle}>Panel de Usuario Académico</Text>
    </View>
  );
};
const NotificationBell = ({ notificationCount, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.notificationBell}>
    <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
    {notificationCount > 0 && (
      <View style={styles.notificationBadge}>
        <Text style={styles.notificationBadgeText}>
          {notificationCount > 99 ? '99+' : notificationCount}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);
const NotificationsModal = ({ visible, onClose, notifications, markAsRead }) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="slide"
    onRequestClose={onClose}
  >
    <View style={styles.notificationsModalOverlay}>
      <View style={styles.notificationsModalContent}>
        <View style={styles.notificationsModalHeader}>
          <Text style={styles.notificationsModalTitle}>Notificaciones</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.notificationsList}>
          {notifications.length === 0 ? (
            <View style={styles.emptyNotifications}>
              <Ionicons name="notifications-off-outline" size={48} color={COLORS.textTertiary} />
              <Text style={styles.emptyNotificationsText}>No hay notificaciones nuevas</Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification.idnotification || notification.id}
                style={[
                  styles.notificationItem,
                  !notification.read && styles.notificationItemUnread
                ]}
                onPress={() => {
                  markAsRead(notification.idnotification || notification.id);
                  // Aquí puedes navegar según el tipo de notificación
                  if (notification.tipo === 'nuevo_evento' && notification.id_relacionado) {
                    onClose();
                    router.push(`/admin/EventDetailScreen?eventId=${notification.id_relacionado}`);
                  }
                }}
              >
                <View style={styles.notificationIconContainer}>
                  <Ionicons
                    name={getNotificationIcon(notification.tipo)}
                    size={20}
                    color={COLORS.primary}
                  />
                  {!notification.read && <View style={styles.unreadDot} />}
                </View>
                <View style={styles.notificationContent}>
                  <Text style={[styles.notificationTitle, !notification.read && styles.notificationTitleUnread]}>
                    {notification.titulo || notification.title}
                  </Text>
                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {notification.mensaje || notification.message}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {notification.created_at 
                      ? new Date(notification.created_at).toLocaleDateString('es-ES', { 
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                        })
                      : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
        
        {notifications.length > 0 && (
          <TouchableOpacity style={styles.markAllReadButton} onPress={() => {
            notifications.filter(n => !n.read).forEach(n => markAsRead(n.idnotification || n.id));
          }}>
            <Text style={styles.markAllReadText}>Marcar todas como leídas</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  </Modal>
);

const getNotificationIcon = (type) => {
  switch (type) {
    case 'nuevo_evento': return 'calendar-outline';
    case 'evento_aprobado': return 'checkmark-circle-outline';
    case 'evento_rechazado': return 'close-circle-outline';
    case 'recordatorio': return 'alarm-outline';
    case 'comite_invitacion': return 'people-outline';
    case 'mensaje_nuevo': return 'chatbubble-outline';
    default: return 'notifications-outline';
  }
};
const ROL_COLORS = { admin: '#FF6B35', creador: '#007AFF', logistica: '#34C759', academico: '#9B59B6' };

const ChatEmbed = ({ userId, userRole, userName }) => {
  const [vista, setVista]           = useState('eventos'); // 'eventos' | 'chat'
  const [eventos, setEventos]       = useState([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [eventoActual, setEventoActual]     = useState(null);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [connected, setConnected]   = useState(false);
  const socketRef   = useRef(null);
  const flatListRef = useRef(null);
  const ioRef       = useRef(null);

  // ─── Cargar eventos del usuario ───────────────────────────────────
  useEffect(() => {
    const cargarEventos = async () => {
      try {
        const token = Platform.OS === 'web'
          ? localStorage.getItem('adminAuthToken')
          : await SecureStore.getItemAsync('adminAuthToken');

        const res = await fetch(`${API_BASE_URL}/eventos`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        // Solo aprobados con comité
        const aprobados = Array.isArray(data)
          ? data.filter(e => e.estado === 'aprobado')
          : [];
        setEventos(aprobados);
      } catch (e) {
        console.warn('Error cargando eventos:', e.message);
      } finally {
        setLoadingEventos(false);
      }
    };
    cargarEventos();
  }, []);
// ─── Cargar SOLO los eventos donde el usuario es del comité ───────

useEffect(() => {
  const cargarEventos = async () => {
    try {
      const token = Platform.OS === 'web'
        ? localStorage.getItem('adminAuthToken')
        : await SecureStore.getItemAsync('adminAuthToken');

      // Cargar eventos del comité Y eventos que creé yo
      const [resComite, resCreados] = await Promise.all([
        fetch(`${API_BASE_URL}/dashboard/my-committee-events`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/eventos`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const dataComite  = await resComite.json();
      const dataCreados = await resCreados.json();

      const eventosComite = dataComite.events || [];

      // Solo aprobados creados por este usuario (idacademico)
      const eventosCreados = Array.isArray(dataCreados)
        ? dataCreados.filter(e =>
            e.estado === 'aprobado' &&
            String(e.idacademico) === String(userId)
          )
        : [];

      // Unir sin duplicados por idevento
      const idsVistos = new Set(eventosComite.map(e => e.idevento));
      const extras    = eventosCreados.filter(e => !idsVistos.has(e.idevento));

      setEventos([...eventosComite, ...extras]);

    } catch (e) {
      console.warn('Error cargando eventos:', e.message);
    } finally {
      setLoadingEventos(false);
    }
  };
  cargarEventos();
}, []);
  // ─── Conectar socket al seleccionar evento ────────────────────────
  const abrirChat = (evento) => {
    setEventoActual(evento);
    setMessages([]);
    setVista('chat');
const esMiembroComite = evento.Comite?.some(
      miembro => String(miembro.idusuario) === String(userId)
    );

    if (!esMiembroComite) {
      Alert.alert('Acceso Denegado', 'Solo los miembros del comité pueden acceder a este chat');
      return;
    }

    setEventoActual(evento);
    setMessages([]);
    setVista('chat');
    import('socket.io-client').then(mod => {
      ioRef.current = mod.io || mod.default;

      // Desconectar anterior si existe
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

     const socket = ioRef.current(API_BASE_URL, {
  transports: ['polling', 'websocket'],  // polling primero en web
  upgrade: true,
  reconnection: true,
  reconnectionAttempts: 5,
  timeout: 10000
});
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        socket.emit('join_event', {
          eventoId: String(evento.idevento),
          userId,
          role: userRole,
          userName: userId
        });
      });

      socket.on('disconnect', () => setConnected(false));

      socket.on('history', (h) => {
        setMessages(h.map((m, i) => ({ ...m, id: `h_${i}` })));
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
      });

      socket.on('receive_message', (msg) => {
        setMessages(prev => [...prev, { ...msg, id: `m_${Date.now()}` }]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      });
       socket.on('error', (error) => {
        console.error('❌ Error en socket:', error);
        Alert.alert('Error', error.message || 'Error en el chat');
      });
    });
  };

  const volverAEventos = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave_event', { eventoId: String(eventoActual?.idevento) });
      socketRef.current.disconnect();
    }
    setVista('eventos');
    setConnected(false);
    setMessages([]);
  };

  const handleSend = () => {
    const texto = input.trim();
    if (!texto || !socketRef.current?.connected) return;
    socketRef.current.emit('send_message', {
      eventoId: String(eventoActual?.idevento),
      userId, role: userRole, userName: userId, message: texto
    });
    setInput('');
  };

  if (vista === 'eventos') {
    return (
      <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
        <View style={{ padding: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#666' }}>
            Selecciona un evento para chatear
          </Text>
        </View>

         {loadingEventos ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : eventos.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Ionicons name="people-outline" size={40} color="#ccc" />
            <Text style={{ color: '#aaa', marginTop: 10, textAlign: 'center' }}>
              No eres miembro de ningún comité aún
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 12 }}>
            {eventos.map((evento) => (
              <TouchableOpacity
                key={evento.idevento || evento.id}
                onPress={() => abrirChat(evento)}
                style={{
                  backgroundColor: '#fff', borderRadius: 12, padding: 14,
                  marginBottom: 10, flexDirection: 'row', alignItems: 'center',
                  borderLeftWidth: 4, borderLeftColor: COLORS.primary,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 }}>
                    {evento.nombreevento || 'Sin nombre'}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#888' }}>
                    {evento.fechaevento?.split('T')[0] || '–'} · {evento.lugarevento || '–'}
                  </Text>
                  {evento.Comite && evento.Comite.length > 0 && (
                    <Text style={{ fontSize: 11, color: COLORS.primary, marginTop: 4 }}>
                      👥 {evento.Comite.length} miembro{evento.Comite.length > 1 ? 's' : ''} en el comité
                    </Text>
                  )}
                </View>
                <Ionicons name="chatbubbles-outline" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      {/* Sub-header del evento */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 12, paddingVertical: 10,
        backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee'
      }}>
        <TouchableOpacity onPress={volverAEventos}>
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A1A1A' }} numberOfLines={1}>
            {eventoActual?.nombreevento || 'Evento'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: connected ? '#34C759' : '#FF3B30' }} />
            <Text style={{ fontSize: 10, color: '#888' }}>{connected ? 'En línea' : 'Conectando...'}</Text>
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => {
          if (item.system) return (
            <View style={{ alignItems: 'center', marginVertical: 6 }}>
              <Text style={{ fontSize: 11, color: '#bbb', fontStyle: 'italic' }}>{item.text}</Text>
            </View>
          );
          const isMe = String(item.userId) === String(userId);
          const color = ROL_COLORS[item.role] || '#888';
          return (
            <View style={{ flexDirection: 'row', marginVertical: 3, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <View style={{ maxWidth: '75%' }}>
                {!isMe && (
                  <Text style={{ fontSize: 11, color, fontWeight: '600', marginBottom: 2, marginLeft: 4 }}>
                    {item.userName}
                  </Text>
                )}
                <View style={{
                  backgroundColor: isMe ? COLORS.primary : '#fff',
                  paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16,
                  borderBottomRightRadius: isMe ? 2 : 16,
                  borderBottomLeftRadius: isMe ? 16 : 2
                }}>
                  <Text style={{ fontSize: 14, color: isMe ? '#fff' : '#1A1A1A' }}>{item.message}</Text>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Ionicons name="chatbubbles-outline" size={36} color="#ddd" />
            <Text style={{ color: '#ccc', fontSize: 13, marginTop: 8 }}>Aún no hay mensajes en este evento</Text>
          </View>
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{
          flexDirection: 'row', padding: 10, backgroundColor: '#fff',
          borderTopWidth: 1, borderColor: '#eee', gap: 8
        }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#999"
            style={{
              flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20,
              paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, backgroundColor: '#f9f9f9'
            }}
            multiline
            editable={connected}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || !connected}
            style={{
              backgroundColor: !input.trim() || !connected ? '#ccc' : COLORS.primary,
              borderRadius: 20, paddingHorizontal: 16, justifyContent: 'center'
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};
const HomeAcademicoScreen = () => {
  const params = useLocalSearchParams();
  const nombreUsuario = params.nombre || 'Administrador';
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [pendingContentCount, setPendingContentCount] = useState('0');
  const [activeUsersCount, setActiveUsersCount] = useState('0');
  const [isBannerExpanded, setIsBannerExpanded] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);
  const unreadCount = notifications.filter(notif => !notif.read).length;
  const [approvedEventsCount, setApprovedEventsCount] = useState('0');
  const [comiteeEvents, setComiteeEvents] = useState([]);
  const [loadingComitee, setLoadingComitee] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
const [userProfile, setUserProfile] = useState({
  nombre: '',
  apellidopat: '',
  apellidomat: '',
  facultad: null,
  loading: true,
});
// 🔔 Fetch de notificaciones
const fetchNotifications = useCallback(async () => {
  try {
    const token = await getTokenAsync();
    if (!token) return;

    const response = await axios.get(`${API_BASE_URL}/notificaciones`, {
      headers: { 'Authorization': `Bearer ${token}` },
      timeout: 8000,
    });

    // Mapear respuesta a formato esperado
    const mapped = (response.data || []).map(n => ({
      ...n,
      read: n.estado === 'leido' || n.read === true
    }));
    
    setNotifications(mapped);
  } catch (error) {
    console.error('Error al cargar notificaciones:', error);
  }
}, []);

// 🔔 Marcar como leída
const markNotificationAsRead = useCallback(async (notificationId) => {
  try {
    const token = await getTokenAsync();
    if (!token) return;

    await axios.patch(
      `${API_BASE_URL}/notificaciones/${notificationId}/read`,
      {},
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    // Actualizar estado local
    setNotifications(prev => 
      prev.map(n => 
        (n.idnotification === notificationId || n.id === notificationId)
          ? { ...n, read: true, estado: 'leido' }
          : n
      )
    );
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
  }
}, []);
const fetchCommitteeEvents = useCallback(async () => {
  setLoadingComitee(true);
  try {
    const token = await getTokenAsync();
    if (!token) return;

    const response = await axios.get(`${API_BASE_URL}/dashboard/my-committee-events`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    setComiteeEvents(response.data.events || []);
  } catch (error) {
    console.error('Error al cargar eventos como comité:', error);
  } finally {
    setLoadingComitee(false);
  }
}, []);
  const fetchDashboardData = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const token = await getTokenAsync();
      if (!token) {
        console.error("No se encontró token de autenticación");
        setLoadingDashboard(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/dashboard/my-stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 10000,
      });

      const data = response.data;
      console.log('Estructura de counts:', data.estadoCounts);
        console.log('✅ Status:', response.status);
    console.log('📦 Data completa:', JSON.stringify(response.data, null, 2));

    const counts = data.estadoCounts || {};
      console.log('Datos recibidos del dashboard:', data);
      setPendingContentCount(data.pendingContent?.toString() || '0');
      setActiveUsersCount(data.activeUsers?.toString() || '0');
      setApprovedEventsCount(data.estadoCounts?.aprobado?.toString() || '0')

       setDashboardStats([
      { 
        title: 'Eventos Aprobados', 
        value: data.estadoCounts?.aprobado?.toString() || '0', 
        icon: 'checkmark-circle', 
        color: COLORS.success,
        description: 'Total aprobados'
      },
      { 
        title: 'Eventos Pendientes', 
        value: data.estadoCounts?.pendiente?.toString() || '0', 
        icon: 'time', 
        color: COLORS.warning,
        description: 'Total pendientes'
      },
      { 
        title: 'Eventos Cancelados', 
        value: data.estadoCounts?.cancelado?.toString() || '0', 
        icon: 'close-circle', 
        color: COLORS.accent,
        description: 'Total cancelados'
      },
      { 
        title: 'Eventos Vencidos', 
        value: data.estadoCounts?.vencido?.toString() || '0', 
        icon: 'calendar-outline', 
        color: COLORS.secondary,
        description: 'Total vencidos'
      },
      { 
        title: 'Eventos Rechazados', 
        value: data.estadoCounts?.rechazado?.toString() || '0', 
        icon: 'remove-circle', 
        color: '#6366F1', // Indigo para diferenciar
        description: 'Total rechazados'
      },
      { 
        title: 'Eventos Totales', 
        value: data.totalEvents?.toString() || '0', 
        icon: 'apps', 
        color: COLORS.info,
        trend: -3.2,
        description: 'Último mes'
      },
      { 
        title: 'Estabilidad Sistema', 
        value: `${data.systemStability || 0}%`, 
        icon: 'stats-chart',
        color: COLORS.success,
        trend: 2.1,
        description: 'Rendimiento óptimo'
      },
      ]);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
      console.log('❌ Error status:', error.response?.status);
    console.log('❌ Error data:', JSON.stringify(error.response?.data));
      Alert.alert(
        'Error',
        `No se pudieron cargar los datos del panel. ${error.message || ''}`,
        [{ text: 'Entendido' }]
      );
    } finally {
      setLoadingDashboard(false);
    }
  }, []);
  const fetchHistoricalData = useCallback(async () => {
  try {
    const token = await getTokenAsync();
    if (!token) return;

    const response = await axios.get(`${API_BASE_URL}/dashboard/my-historical`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    setHistoricalData(response.data.historical || []);
  } catch (error) {
    console.error('Error al cargar datos históricos:', error);
  }
}, []);
const fetchUserProfile = useCallback(async () => {
  try {
    const token = await getTokenAsync();
    if (!token) {
      router.replace('/');
      return;
    }

    const response = await axios.get(`${API_BASE_URL}/profile`, {
      headers: { 'Authorization': `Bearer ${token}` },
      timeout: 8000,
    });
    
    const user = response.data;
    
    // ✅ CORRECCIÓN: Verifica si el backend devuelve "Sin facultad" literal
    const facultad = user.facultad === "Sin facultad" 
      ? "Sin facultad asignada" 
      : user.facultad;
    
    setUserProfile({
      nombre: user.nombre || '',
      apellidopat: user.apellidopat || '',
      apellidomat: user.apellidomat || '',
      facultad: facultad, // Ya incluye el mensaje corregido
      id: user.id || null,
      loading: false,
    });
    console.log('Perfil recibido:', response);
    if (Platform.OS === 'web') {
  localStorage.setItem('usuario', JSON.stringify({
    id:     user.id,
    nombre: user.nombre || '',
    role:   user.role || 'academico'
  }));
} else {
  await AsyncStorage.setItem('usuario', JSON.stringify({
    id:     user.id,
    nombre: user.nombre || '',
    role:   user.role || 'academico'
  }));
}
  } catch (error) {
    console.error('Error al cargar perfil de usuario:', error);
    Alert.alert('Error', 'No se pudo cargar tu información personal.');
    setUserProfile((prev) => ({ ...prev, loading: false }));
  }
}, []);
useEffect(() => {
  const checkAuthAndLoadData = async () => {
    const token = await getTokenAsync();

    if (!token) {
      router.replace('/');
      return;
    }

    await Promise.allSettled([
      fetchDashboardData(),
      fetchUserProfile(),
      fetchHistoricalData(),
      fetchCommitteeEvents(),
      fetchNotifications(),
    ]);
  };

  checkAuthAndLoadData();
   const interval = setInterval(fetchNotifications, 30000);
  return () => clearInterval(interval);
}, [fetchDashboardData, fetchUserProfile, fetchHistoricalData,fetchHistoricalData, router]);
  const { columns: dashboardColumns, cardWidth: dashboardCardWidth } = useMemo(() => {
    let numColumns = Math.floor(windowWidth / (MIN_CARD_WIDTH_DASHBOARD + CARD_MARGIN));
    numColumns = Math.min(numColumns, MAX_COLUMNS_DASHBOARD);
    const cols = numColumns > 0 ? numColumns : 1;
    const totalMargin = CARD_MARGIN * (cols - 1);
    const width = (windowWidth - 32 - totalMargin) / cols; // 32 = paddingHorizontal * 2
    return { columns: cols, cardWidth: Math.max(width, MIN_CARD_WIDTH_DASHBOARD) };
  }, [windowWidth]);

  const { columns: actionsColumns, cardWidth: actionsCardWidth } = useMemo(() => {
    let numColumns = Math.floor(windowWidth / (MIN_CARD_WIDTH_ACTIONS + CARD_MARGIN));
    numColumns = Math.min(numColumns, MAX_COLUMNS_ACTIONS);
    const cols = numColumns > 0 ? numColumns : 1;
    const totalMargin = CARD_MARGIN * (cols - 1);
    const width = (windowWidth - 32 - totalMargin) / cols;
    return { columns: cols, cardWidth: Math.max(width, MIN_CARD_WIDTH_ACTIONS) };
  }, [windowWidth]);

  const [dashboardStats, setDashboardStats] = useState([
    { title: 'Usuarios Activos', value: 'cargando...', icon: 'people-outline', color: COLORS.primary, trend: null },
    { title: 'Eventos Totales', value: 'cargando...', icon: 'calendar-outline', color: COLORS.info, trend: null },
    { title: 'Contenidos Pendientes', value: 'cargando...', icon: 'document-text-outline', color: COLORS.warning, trend: null },
    { title: 'Estabilidad Sistema', value: 'cargando...', icon: 'pulse-outline', color: COLORS.success, trend: null },
  ]);

  const adminActions = useMemo(() => [
  {
    id: '0',
    title: 'Proyecto del Evento',
    iconName: 'clipboard-outline',
    route: '/admin/ProyectoEvento',
    color: COLORS.primary,
    description: 'Gestión de proyectos institucionales',
    badge: 'Activo',
    badgeColor: COLORS.success,
  },
  {
    id: '1',
    title: 'Gestión de Usuarios',
    iconName: 'people-outline',
    route: '/admin/UsuarioAcademico',
    color: COLORS.secondary,
    description: 'Administración de cuentas de usuario',
  },
  {
    id: '2',
    title: 'Reportes Avanzados',
    iconName: 'document-text-outline',
    route: '/admin/reportes',
    color: COLORS.secondary,
    description: 'Generación de reportes detallados',
    badge: 'Nuevo',
    badgeColor: COLORS.accent,
  },
  {
    id: '3',
    title: 'Eventos Pendientes',
    iconName: 'timer-outline',
    route: '/admin/EventosPendientes',
    color: COLORS.warning,
    description: 'Revisión y aprobación de eventos',
    badgeColor: COLORS.warning,
  },
  {
    id: '4',
    title: 'Eventos Aprobados',
    iconName: 'checkmark-circle-outline',
    route: '/admin/EventosAprobados',
    color: COLORS.success,
    description: 'Gestión de eventos ya aprobados',
    badgeColor: COLORS.black
  },
  {
    id: '5',
    title: 'Reportes Avanzados',
    iconName: 'document-text-outline',
    route: '/admin/reportes',
    color: COLORS.secondary,
    description: 'Generación de reportes detallados',
    badge: 'Nuevo',
    badgeColor: COLORS.accent,
  },
  {
    id: '6',
    title: 'Eventos Cancelados',
    iconName: 'document-text-outline',
    route: '/admin/EventosCancelados',
    color: COLORS.secondary,
    description: 'Gestión de eventos cancelados',
    badge: 'Nuevo',
    badgeColor: COLORS.accent,
  },
  {
    id: '7',
    title: 'Eventos Rechazados',
    iconName: 'document-text-outline',
    route: '/admin/EventosRechazados',
    color: COLORS.secondary,
    description: 'Gestión de eventos rechazados',
    badge: 'Nuevo',
    badgeColor: COLORS.accent,
  },
  {
    id: '8',
    title: 'Eventos Vencidos',
    iconName: 'document-text-outline',
    route: '/admin/EventosVencidos',
    color: COLORS.secondary,
    description: 'Gestión de eventos vencidos',
    badge: 'Nuevo',
    badgeColor: COLORS.accent,
  },

], [pendingContentCount]);

const handleActionPress = (action) => {
  if (action && action.role) {
    router.push({
      pathname: '/admin/EventosAprobados',
      params: { role: action.role } // ← PASA EL ROL
    });
    return;
  }

  if (action && action.route) {
    router.push(action.route);
    return;
  }

  Alert.alert('Funcionalidad en Desarrollo', 'Esta característica estará disponible próximamente.');
};

 const handleLogout = async () => {
  const performLogout = async () => {
    try {
      await deleteTokenAsync();
      
      // Limpiar estado local
      setDashboardStats([
        { title: 'Usuarios Activos', value: '—', icon: 'people-outline', color: COLORS.primary },
        { title: 'Eventos Totales', value: '—', icon: 'calendar-outline', color: COLORS.info },
        { title: 'Contenidos Pendientes', value: '—', icon: 'document-text-outline', color: COLORS.warning },
        { title: 'Estabilidad Sistema', value: '—', icon: 'pulse-outline', color: COLORS.success },
      ]);
      setHistoricalData([]);
      setUserProfile({
        nombre: '',
        apellidopat: '',
        apellidomat: '',
        facultad: null,
        loading: false,
      });

      // Redirigir al login
      router.replace('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      router.replace('/'); // Forzar redirección incluso con error
    }
  };

  if (Platform.OS === 'web') {
    // ✅ Usar confirm nativo del navegador para web
    if (window.confirm('¿Está seguro que desea cerrar la sesión actual?')) {
      await performLogout();
    }
  } else {
    // ✅ Usar Alert para móviles (iOS/Android)
    Alert.alert(
      'Confirmar Cierre de Sesión',
      '¿Está seguro que desea cerrar la sesión actual?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive', 
          onPress: performLogout 
        },
      ],
      { cancelable: true }
    );
  }
};

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: isBannerExpanded ? 220 : 80 }
        ]}
      >
        <MinimalHeader
          nombreUsuario={userProfile.nombre ? `${userProfile.nombre} ${userProfile.apellidopat}` : nombreUsuario}
          facultad={userProfile.facultad || 'Cargando...'}
          unreadCount={unreadCount}
          onNotificationPress={() => setShowNotifications(true)}
        />
        
<View style={styles.dashboardSectionMinimal}>
  <View style={styles.sectionHeaderMinimal}>
    <Text style={styles.sectionTitleMinimal}>Resumen de Actividad</Text>
    <Text style={styles.sectionSubtitleMinimal}>Métricas clave del sistema</Text>
  </View>

  {loadingDashboard ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Cargando estadísticas...</Text>
    </View>
  ) : (
    <View style={styles.dashboardGridMinimal}>
      {dashboardStats.map((stat, index) => (
        <View key={index} style={{ width: dashboardCardWidth }}>
          <DashboardCard {...stat} />
        </View>
      ))}
    </View>
  )}

{historicalData.length > 0 && (
  <View style={styles.chartContainer}>
    <Text style={styles.chartTitle}>Eventos por Mes (últimos 6 meses)</Text>
    <BarChart
      data={{
        labels: historicalData.map(d => d.name || ''),
        datasets: [{
          data: historicalData.map(d => d.eventos ?? 0)
        }]
      }}
      width={windowWidth - 40}
      height={220}
      chartConfig={{
        backgroundColor: COLORS.surface,
        backgroundGradientFrom: COLORS.surface,
        backgroundGradientTo: COLORS.surface,
        color: (opacity = 1) => `rgba(233, 90, 12, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(31, 41, 55, ${opacity})`,
        style: { borderRadius: 16 },
        propsForLabels: { fontSize: 10 },
        barPercentage: 0.7,
      }}
      style={styles.chart}
      verticalLabelRotation={15}
      showValuesOnTopOfBars={false}
      fromZero
    />
  </View>
)}
</View>
<View style={styles.committeeSection}>
  <View style={styles.sectionHeaderMinimal}>
    <Text style={styles.sectionTitleMinimal}>Mis Eventos como Comité</Text>
    <Text style={styles.sectionSubtitleMinimal}>Eventos en los que participas como miembro del comité</Text>
  </View>

  {loadingComitee ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Cargando tus eventos como comité...</Text>
    </View>
  ) : comiteeEvents.length === 0 ? (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={40} color={COLORS.textTertiary} />
      <Text style={styles.emptyStateText}>No eres miembro de ningún comité aún.</Text>
    </View>
  ) : (
 <FlatList
  data={comiteeEvents}
  keyExtractor={(item) => item.idevento.toString()}
  renderItem={({ item }) => (
    <TouchableOpacity
      style={styles.tableRow}
      onPress={() => router.push(`/admin/EventDetailComite?eventId=${item.idevento}`)}
      activeOpacity={0.8}
    >
      {/* Estado - columna izquierda */}
      <View style={styles.tableCellStatus}>
        {item.estado && (
          <View style={[
            styles.statusBadge,
            {
              backgroundColor: 
                item.estado === 'aprobado' ? COLORS.success + '20' :
                item.estado === 'pendiente' ? COLORS.warning + '20' :
                COLORS.accent + '20'
            }
          ]}>
            <Text style={[
              styles.statusText,
              {
                color: 
                  item.estado === 'aprobado' ? COLORS.success :
                  item.estado === 'pendiente' ? COLORS.warning :
                  COLORS.accent
              }
            ]}>
              {item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}
            </Text>
          </View>
        )}
      </View>

      {/* Nombre y descripción - columna central */}
      <View style={styles.tableCellName}>
        <Text style={styles.tableEventName} numberOfLines={1}>
          {item.nombreevento || 'Sin título'}
        </Text>
        <Text style={styles.tableEventDescription} numberOfLines={1}>
          {item.descripcion || 'Sin descripción'}
        </Text>
      </View>

      {/* Badge "Como Comité" - columna derecha */}
      <View style={styles.tableCellRole}>
        <View style={styles.roleBadge}>
          <Ionicons name="shield-checkmark" size={16} color={COLORS.primary} />
          <Text style={styles.roleBadgeText}>Como Comité</Text>
        </View>
      </View>
    </TouchableOpacity>
  )}
  contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
  showsVerticalScrollIndicator={false}
/>
  )}
</View>
        <View style={styles.actionsSectionMinimal}>
          <View style={styles.sectionHeaderMinimal}>
            <Text style={styles.sectionTitleMinimal}>Herramientas de Gestión</Text>
            <Text style={styles.sectionSubtitleMinimal}>Acceda a las funcionalidades principales</Text>
          </View>
          <View style={styles.actionsGridMinimal}>
            <FlatList
              data={adminActions}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <ActionCard
                  action={item}
                  onPress={() => handleActionPress(item)}
                  cardWidth={actionsCardWidth}
                  index={index}
                />
              )}
              numColumns={actionsColumns}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              key={actionsColumns}
            />
          </View>
        </View>
      </ScrollView>

      <MinimalBottomDock
        onLogout={handleLogout}
        onActionPress={handleActionPress}
        isExpanded={isBannerExpanded}
        onToggleExpanded={() => setIsBannerExpanded(!isBannerExpanded)}
      />
       <NotificationsModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        markAsRead={markNotificationAsRead}
      />

      <MinimalBottomDock
        onLogout={handleLogout}
        onActionPress={handleActionPress}
        isExpanded={isBannerExpanded}
        onToggleExpanded={() => setIsBannerExpanded(!isBannerExpanded)}
      />
      {!isBannerExpanded && (
        <TouchableOpacity
          style={{
            position: 'absolute', bottom: 78, right: 20,
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: COLORS.primary,
            justifyContent: 'center', alignItems: 'center',
            elevation: 8, shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25, shadowRadius: 6,
          }}
          onPress={() => setIsChatOpen(true)}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* ── CHAT MODAL ── */}
      {isChatOpen && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-start',
          paddingTop: StatusBar.currentHeight || 0, zIndex: 2000,
        }}>
          <View style={{
            width: '88%', maxWidth: 400, height: '85%',
            backgroundColor: '#F4F7F9',
            borderTopRightRadius: 20, borderBottomRightRadius: 20,
            marginLeft: 'auto', elevation: 10,
          }}>
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between',
              alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13,
              backgroundColor: COLORS.surface, borderBottomWidth: 1,
              borderColor: COLORS.border, borderTopRightRadius: 20,
            }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.textPrimary }}>
                Chat General
              </Text>
              <TouchableOpacity onPress={() =>{ 
                if (!userProfile.id) {
                Alert.alert('Espera', 'Cargando tu perfil...');
                return;
                }
              setIsChatOpen(true);}}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <ChatEmbed
                userId={String(userProfile.id)}
                 userRole={userProfile.role || 'academico'}
                 userName={userProfile.nombre || 'Académico'}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  committeeSection: {
  width: '100%',
  paddingHorizontal: 20,
  marginTop: 40,
  marginBottom: 60,
},  // 🔔 Notificaciones
  notificationBell: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 2,
  },
  notificationsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  notificationsModalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  notificationsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  notificationsModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  notificationsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyNotifications: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyNotificationsText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textTertiary,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: 12,
  },
  notificationItemUnread: {
    backgroundColor: COLORS.primaryLight + '30',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  notificationIconContainer: {
    position: 'relative',
    paddingTop: 4,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  notificationTitleUnread: {
    fontWeight: '700',
  },
  notificationMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  markAllReadButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  markAllReadText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  minimalHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
tableRow: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: COLORS.surface,
  borderRadius: 12,
  paddingVertical: 12,
  paddingHorizontal: 16,
  marginBottom: 8,
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
  borderLeftWidth: 3,
  borderLeftColor: COLORS.primary,
},
tableCellStatus: {
  width: 80,
  alignItems: 'flex-start',
  justifyContent: 'center',
},
statusBadge: {
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 8,
  minWidth: 60,
  alignItems: 'center',
},
statusText: {
  fontSize: 11,
  fontWeight: '600',
  textTransform: 'capitalize',
  textAlign: 'center',
},
tableCellName: {
  flex: 1,
  marginLeft: 12,
  marginRight: 12,
},
tableEventName: {
  fontSize: 15,
  fontWeight: '700',
  color: COLORS.textPrimary,
  marginBottom: 2,
},
tableEventDescription: {
  fontSize: 12,
  color: COLORS.textTertiary,
},
tableCellRole: {
  width: 90,
  alignItems: 'center',
  justifyContent: 'center',
},
roleBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  backgroundColor: COLORS.primaryLight,
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
},
roleBadgeText: {
  fontSize: 11,
  fontWeight: '600',
  color: COLORS.primary,
},
eventCard: {
  backgroundColor: COLORS.surface,
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
  borderLeftWidth: 4,
  borderLeftColor: COLORS.primary,
},
eventCardHeader: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 12,
  marginBottom: 8,
},
eventCardTextContainer: {
  flex: 1,
},
eventTitle: {
  fontSize: 16,
  fontWeight: '700',
  color: COLORS.textPrimary,
  flex: 1,
},
eventSubtitle: {
  fontSize: 12,
  color: COLORS.textSecondary,
  marginTop: 2,
},
eventDescription: {
  fontSize: 14,
  color: COLORS.textTertiary,
  lineHeight: 20,
  marginBottom: 8,
},
eventRoleBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  backgroundColor: COLORS.primaryLight,
  borderRadius: 20,
  paddingHorizontal: 12,
  paddingVertical: 4,
  alignSelf: 'flex-start',
},
eventStatusBadge: {
  position: 'absolute',
  top: 8,
  right: 8,
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
  minWidth: 70,
  alignItems: 'center',
},
eventStatusText: {
  fontSize: 11,
  fontWeight: '600',
  textTransform: 'capitalize',
},
eventRoleBadgeText: {
  fontSize: 12,
  fontWeight: '600',
  color: COLORS.primary,
},
eventRoleBadge: {
  backgroundColor: COLORS.primaryLight,
  borderRadius: 8,
  paddingHorizontal: 8,
  paddingVertical: 4,
  alignSelf: 'flex-start',
  marginTop: 8,
},
eventRoleBadgeText: {
  fontSize: 10,
  fontWeight: '600',
  color: COLORS.primary,
},
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  dashboardCard: {
  borderRadius: 20,
  padding: 20,
  marginBottom: 12,
  minHeight: 160,
  justifyContent: 'space-between',
  // Sutil borde para definir la tarjeta en fondos blancos
  borderWidth: 1,
  borderColor: 'rgba(0,0,0,0.02)',
},
iconContainer: {
  width: 44,
  height: 44,
  borderRadius: 12, // Estilo moderno semi-redondeado
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 2,
},
cardValue: {
  fontSize: 32,
  fontWeight: '800',
  color: COLORS.textPrimary,
},
cardTitle: {
  fontSize: 15,
  fontWeight: '700',
  color: COLORS.textPrimary,
  marginTop: 12,
},
cardDescription: {
  fontSize: 12,
  color: COLORS.textTertiary,
  marginTop: 4,
},
  minimalHeaderContainer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: (StatusBar.currentHeight || 0) + 24,
    paddingBottom: 24,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
 
cardHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
},

cardTrend: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  marginBottom: 4,
},
cardTrendText: {
  fontSize: 12,
  fontWeight: '600',
},

  minimalHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  minimalHeaderAdminText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  minimalNotificationButton: {
    position: 'relative',
    padding: 4,
  },
  minimalUserFacultyText: {
  fontSize: 16,
  fontWeight: '600',
  color: COLORS.textSecondary,
  marginBottom: 8,
},
  minimalNotificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  minimalNotificationBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  minimalHeaderGreeting: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 4,
  },
  minimalGreetingText: {
    fontSize: 22,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  minimalUserNameText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  minimalHeaderTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sectionHeaderMinimal: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  sectionTitleMinimal: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  sectionSubtitleMinimal: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  dashboardSectionMinimal: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 40,
  },
  dashboardGridMinimal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_MARGIN,
    justifyContent: 'space-between',
  },
  dashboardCardMinimal: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  dashboardCardHeaderMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dashboardCardValueMinimal: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  dashboardCardTitleMinimal: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  dashboardCardTrendMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  dashboardCardTrendTextMinimal: {
    fontSize: 12,
    fontWeight: '600',
  },
  dashboardCardDescriptionMinimal: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  actionsSectionMinimal: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 40,
    marginBottom: 60,
  },
  actionsGridMinimal: {
    width: '100%',
  },
  actionCardMinimal: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  actionCardIconMinimal: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardContentMinimal: {
    flex: 1,
  },
  actionCardTitleContainerMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionCardTitleMinimal: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  actionCardBadgeMinimal: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  actionCardBadgeTextMinimal: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
  actionCardDescriptionMinimal: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  minimalDockContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  minimalDockToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  minimalDockToggleText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  minimalDockExpandedContent: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
  },
  minimalDockQuickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 15,
    gap: 10,
  },
  minimalDockQuickActionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    width: '22%',
  },
  minimalDockQuickActionText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  minimalDockLogoutButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    width: '100%',
  },
  minimalDockLogoutButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  chartContainer: {
  marginTop: 24,
  backgroundColor: COLORS.surface,
  borderRadius: 16,
  padding: 16,
  alignItems: 'center',
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 6,
  elevation: 3,
},
chartTitle: {
  fontSize: 16,
  fontWeight: '700',
  color: COLORS.textPrimary,
  marginBottom: 12,
},
chart: {
  borderRadius: 8,
  marginVertical: 8,
},
});

export default HomeAcademicoScreen;