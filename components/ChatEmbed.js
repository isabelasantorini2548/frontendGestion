import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

// ─── Usa el mismo API_BASE_URL que el resto de tu app ────────────────
const API_BASE_URL = 'https://backendgestion-production.up.railway.app';
const TOKEN_KEY    = 'adminAuthToken';

const COLORS = {
  primary: '#E95A0C', primaryLight: '#FFEDD5',
  success: '#10B981', warning: '#F59E0B',
  accent: '#EF4444',  secondary: '#4B5563',
  surface: '#FFFFFF', background: '#F9FAFB',
  border: '#E5E7EB',  textPrimary: '#1F2937',
  textSecondary: '#6B7280', textTertiary: '#9CA3AF',
  white: '#FFFFFF',
};

const ROL_COLORS = {
  admin: '#FF6B35', creador: '#007AFF',
  logistica: '#34C759', academico: '#9B59B6',
};

const getToken = async () => {
  if (Platform.OS === 'web') return localStorage.getItem(TOKEN_KEY);
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

const Burbuja = ({ item, myId }) => {
  if (item.system) return (
    <View style={{ alignItems: 'center', marginVertical: 6 }}>
      <Text style={{ fontSize: 11, color: '#bbb', fontStyle: 'italic' }}>{item.text}</Text>
    </View>
  );
  const isMe = String(item.userId) === String(myId);
  const color = ROL_COLORS[item.role] || '#888';
  return (
    <View style={{ flexDirection: 'row', marginVertical: 3, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
      <View style={{ maxWidth: '75%' }}>
        {!isMe && (
          <Text style={{ fontSize: 11, color, fontWeight: '600', marginBottom: 2, marginLeft: 4 }}>
            {item.userName || item.userId}
          </Text>
        )}
        <View style={{
          backgroundColor: isMe ? COLORS.primary : COLORS.white,
          paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16,
          borderBottomRightRadius: isMe ? 2 : 16,
          borderBottomLeftRadius: isMe ? 16 : 2,
          shadowColor: '#000', shadowOpacity: 0.05,
          shadowOffset: { width: 0, height: 1 }, shadowRadius: 2, elevation: 1,
        }}>
          <Text style={{ fontSize: 14, color: isMe ? '#fff' : COLORS.textPrimary }}>{item.message}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Panel de input ───────────────────────────────────────────────────
const InputPanel = ({ input, setInput, onSend, connected }) => (
  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <View style={{
      flexDirection: 'row', padding: 10, backgroundColor: COLORS.white,
      borderTopWidth: 1, borderColor: COLORS.border, gap: 8, alignItems: 'flex-end',
    }}>
      <TextInput
        value={input} onChangeText={setInput}
        placeholder={connected ? 'Escribe un mensaje...' : 'Conectando...'}
        placeholderTextColor="#999"
        editable={connected}
        multiline
        style={{
          flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20,
          paddingHorizontal: 14, paddingVertical: 8, fontSize: 14,
          backgroundColor: '#f9f9f9', maxHeight: 100,
        }}
      />
      <TouchableOpacity
        onPress={onSend}
        disabled={!input.trim() || !connected}
        style={{
          backgroundColor: (!input.trim() || !connected) ? '#ccc' : COLORS.primary,
          borderRadius: 20, width: 44, height: 44,
          justifyContent: 'center', alignItems: 'center',
        }}
      >
        <Ionicons name="send" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  </KeyboardAvoidingView>
);

const VistaChat = ({ eventoId, titulo, subtitulo, roomId, userId, userRole, userName, onVolver }) => {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [connected, setConnected] = useState(false);
  const socketRef  = useRef(null);
  const flatRef    = useRef(null);
  const ioRef      = useRef(null);

   const roomIdRef   = useRef(roomId);
  const userIdRef   = useRef(userId);
  const userRoleRef = useRef(userRole);
  const userNameRef = useRef(userName);
  const eventoIdRef = useRef(eventoId);

useEffect(() => {
  const _roomId   = roomIdRef.current;
    const _userId   = userIdRef.current;
    const _userRole = userRoleRef.current;
    const _userName = userNameRef.current;
    const _eventoId = eventoIdRef.current;
  if (!_userId) return;

  let socket;
  let isMounted = true;

  import('socket.io-client').then(mod => {
    const io = mod.io || mod.default;
    
    socket = io(API_BASE_URL, {
      transports: ['websocket'],        // ← CLAVE: sin polling
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 20000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket conectado:', socket.id);
      if (!isMounted) return;
      setConnected(true);
      
      if (roomId.startsWith('private_')) {
        socket.emit('join_private', { roomId, userId, userName });
      } else {
        socket.emit('join_event', { 
          eventoId: String(eventoId), 
          userId, 
          role: userRole, 
          userName 
        });
      }
    });

    socket.on('history', (h) => {
      if (!isMounted) return;
      console.log('📜 Historial recibido:', h.length);
      // Solo reemplazar si hay mensajes, evita borrar al reconectar
      if (h.length > 0) {
        setMessages(h.map((m, i) => ({ ...m, id: `h_${i}` })));
      }
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    });

    socket.on('receive_message', (msg) => {
      if (!isMounted) return;
      setMessages(prev => [...prev, { ...msg, id: `m_${Date.now()}_${Math.random()}` }]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    });

    socket.on('private_message', (msg) => {
      if (!isMounted) return;
      setMessages(prev => [...prev, { ...msg, id: `p_${Date.now()}_${Math.random()}` }]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Error socket:', err.message);
      if (isMounted) setConnected(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('⚠️ Desconectado:', reason);
      if (isMounted) setConnected(false);
    });

    socket.on('error', (e) => {
      Alert.alert('Error', e.message || 'Error en el chat');
    });
  });

  return () => {
    isMounted = false;
    if (socket) {
      if (roomId.startsWith('private_')) {
        socket.emit('leave_private', { roomId });
      } else {
        socket.emit('leave_event', { eventoId: String(eventoId) });
      }
      socket.disconnect();
    }
  };
}, []);
 const handleSend = () => {
  const texto = input.trim();
  console.log(' Intentando enviar:', {
    texto,
    connected: socketRef.current?.connected,
    roomId,
    userId,
    socketId: socketRef.current?.id
  });

  if (!texto) {
    console.log(' Mensaje vacío');
    return;
  }
  if (!socketRef.current?.connected) {
    console.log(' Socket no conectado');
    Alert.alert('Error', 'No hay conexión con el servidor de chat');
    return;
  }

  if (roomId.startsWith('private_')) {
    console.log('FRONTEND Enviando mensaje privado...');
    socketRef.current.emit('send_private', { 
      roomId, userId, userName, role: userRole, message: texto 
    });
  } else {
    console.log('FRONTEND Enviando mensaje grupal...', { eventoId, userId });
    socketRef.current.emit('send_message', { 
      eventoId: String(eventoId), 
      userId, 
      role: userRole, 
      userName, 
      message: texto 
    });
  }
  setInput('');
  console.log('✅ [FRONTEND] Mensaje enviado al socket');
};
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 12, paddingVertical: 10,
        backgroundColor: COLORS.white, borderBottomWidth: 1, borderColor: COLORS.border,
      }}>
        <TouchableOpacity onPress={onVolver}>
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textPrimary }} numberOfLines={1}>
            {titulo}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: connected ? '#34C759' : '#FF3B30' }} />
            <Text style={{ fontSize: 10, color: COLORS.textTertiary }}>
              {subtitulo} · {connected ? 'En línea' : 'Conectando...'}
            </Text>
          </View>
        </View>
      </View>

      {/* Mensajes */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 12, flexGrow: 1 }}
        renderItem={({ item }) => <Burbuja item={item} myId={userId} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Ionicons name="chatbubbles-outline" size={40} color="#ddd" />
            <Text style={{ color: '#ccc', fontSize: 13, marginTop: 8 }}>
              {connected ? 'Aún no hay mensajes' : 'Conectando al chat...'}
            </Text>
          </View>
        }
      />

      <InputPanel input={input} setInput={setInput} onSend={handleSend} connected={connected} />
    </View>
  );
};
const VistaEvento = ({ evento, userId, userRole, userName, onVolver }) => {
  const [tab, setTab]         = useState('grupal'); // 'grupal' | 'miembros'
  const [chatPrivado, setChatPrivado] = useState(null); // miembro seleccionado

  const miembros = (evento.Comite || []).filter(m => String(m.idusuario) !== String(userId));

  if (chatPrivado) {
    const roomId = 'private_' + [userId, chatPrivado.idusuario]
  .map(String)
  .map(Number)        
  .sort((a, b) => a - b)
  .join('_');
    return (
      <VistaChat
        eventoId={evento.idevento}
        titulo={chatPrivado.nombre || chatPrivado.usuario?.nombre || `Usuario ${chatPrivado.idusuario}`}
        subtitulo="Chat privado"
        roomId={roomId}
        userId={userId} userRole={userRole} userName={userName}
        onVolver={() => setChatPrivado(null)}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 12, paddingVertical: 10,
        backgroundColor: COLORS.white, borderBottomWidth: 1, borderColor: COLORS.border,
      }}>
        <TouchableOpacity onPress={onVolver}>
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.textPrimary }} numberOfLines={1}>
          {evento.nombreevento || 'Evento'}
        </Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: COLORS.white, borderBottomWidth: 1, borderColor: COLORS.border }}>
        {[
          { id: 'grupal',   label: 'Chat Grupal',  icon: 'chatbubbles-outline' },
          { id: 'miembros', label: 'Miembros',      icon: 'people-outline' },
        ].map(t => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setTab(t.id)}
            style={{
              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 6, paddingVertical: 12,
              borderBottomWidth: tab === t.id ? 2 : 0,
              borderBottomColor: COLORS.primary,
            }}
          >
            <Ionicons name={t.icon} size={16} color={tab === t.id ? COLORS.primary : COLORS.textTertiary} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: tab === t.id ? COLORS.primary : COLORS.textTertiary }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenido según tab */}
      {tab === 'grupal' ? (
        <VistaChat
          eventoId={evento.idevento}
          titulo={`#${evento.nombreevento}`}
          subtitulo={`${(evento.Comite || []).length} miembros`}
          roomId={String(evento.idevento)}
          userId={userId} userRole={userRole} userName={userName}
          onVolver={onVolver}
          // Ocultamos el header interno porque ya tenemos el de arriba
          _sinHeader
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {miembros.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Ionicons name="people-outline" size={40} color="#ddd" />
              <Text style={{ color: '#ccc', fontSize: 13, marginTop: 8 }}>No hay otros miembros</Text>
            </View>
          ) : (
            miembros.map((m) => {
              const nombre = m.nombre || m.usuario?.nombre || `Usuario ${m.idusuario}`;
              const apellido = m.apellidopat || m.usuario?.apellidopat || '';
              const rol = m.rol_comite || m.role || 'miembro';
              const initial = nombre.charAt(0).toUpperCase();
              const colorRol = ROL_COLORS[rol] || COLORS.secondary;

              return (
                <TouchableOpacity
                  key={m.idusuario}
                  onPress={() => setChatPrivado(m)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    backgroundColor: COLORS.white, borderRadius: 12,
                    padding: 14, marginBottom: 8,
                    shadowColor: '#000', shadowOpacity: 0.04,
                    shadowOffset: { width: 0, height: 1 }, shadowRadius: 3, elevation: 1,
                  }}
                >
                  {/* Avatar */}
                  <View style={{
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: colorRol + '20',
                    justifyContent: 'center', alignItems: 'center',
                    borderWidth: 2, borderColor: colorRol + '40',
                  }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: colorRol }}>{initial}</Text>
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.textPrimary }}>
                      {nombre} {apellido}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colorRol }} />
                      <Text style={{ fontSize: 11, color: COLORS.textTertiary, textTransform: 'capitalize' }}>{rol}</Text>
                    </View>
                  </View>

                  {/* Botón mensaje */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    backgroundColor: COLORS.primaryLight, borderRadius: 20,
                    paddingHorizontal: 12, paddingVertical: 6,
                  }}>
                    <Ionicons name="chatbubble-outline" size={14} color={COLORS.primary} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.primary }}>Mensaje</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
};

// ─── Componente principal exportable ─────────────────────────────────
// ─── Componente principal exportable ─────────────────────────────────
const ChatEmbed = ({ userId, userRole, userName }) => {
  const [vista, setVista]               = useState('eventos');
  const [eventos, setEventos]           = useState([]);
  const [loadingEventos, setLoading]    = useState(true);
  const [eventoActual, setEventoActual] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const token = await getToken();
        
        // 1. Obtener eventos como comité
        const resComite = await fetch(`${API_BASE_URL}/dashboard/my-committee-events`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const dataComite = await resComite.json();
        const eventosComite = dataComite.events || [];

        // 2. Obtener eventos creados por el usuario
        const resCreados = await fetch(`${API_BASE_URL}/eventos`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const dataCreados = await resCreados.json();
        const eventosCreados = Array.isArray(dataCreados)
          ? dataCreados.filter(e => e.estado === 'aprobado' && String(e.idacademico) === String(userId))
          : [];

        // 3. Cargar detalles completos de cada evento (incluyendo comité)
        const eventosCompletos = await Promise.all(
          [...eventosComite, ...eventosCreados].map(async (evento) => {
            try {
              const resDetalle = await fetch(`${API_BASE_URL}/eventos/${evento.idevento}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              const detalle = await resDetalle.json();
              return detalle;
            } catch (e) {
              console.warn(`Error cargando evento ${evento.idevento}:`, e);
              return evento;
            }
          })
        );

        // Eliminar duplicados
        const idsVistos = new Set();
        const eventosUnicos = eventosCompletos.filter(e => {
          if (idsVistos.has(e.idevento)) return false;
          idsVistos.add(e.idevento);
          return true;
        });

        console.log('📋 Eventos cargados:', eventosUnicos.length);
        eventosUnicos.forEach(e => {
          console.log(`Evento ${e.idevento}:`, {
            nombre: e.nombreevento,
            miembrosComite: e.Comite?.length || 0,
            comite: e.Comite
          });
        });

        setEventos(eventosUnicos);
      } catch (e) {
        console.error('❌ Error cargando eventos:', e);
        Alert.alert('Error', 'No se pudieron cargar los eventos del chat');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  if (vista === 'evento' && eventoActual) {
    return (
      <VistaEvento
        evento={eventoActual}
        userId={userId} userRole={userRole} userName={userName}
        onVolver={() => { setVista('eventos'); setEventoActual(null); }}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ padding: 14, backgroundColor: COLORS.white, borderBottomWidth: 1, borderColor: COLORS.border }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textSecondary }}>
          Selecciona un evento
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
          {eventos.map((evento) => {
            const comite = evento.Comite || evento.comite || [];
            const nMiembros = comite.length;
            
            return (
              <TouchableOpacity
                key={evento.idevento}
                onPress={() => { 
                  console.log('🔵 Abriendo evento:', evento.idevento, 'Miembros:', nMiembros);
                  setEventoActual(evento); 
                  setVista('evento'); 
                }}
                style={{
                  backgroundColor: COLORS.white, borderRadius: 12, padding: 14,
                  marginBottom: 10, flexDirection: 'row', alignItems: 'center',
                  borderLeftWidth: 4, borderLeftColor: COLORS.primary,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 }}>
                    {evento.nombreevento || 'Sin nombre'}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.textTertiary }}>
                    {evento.fechaevento?.split('T')[0] || '–'} · {evento.lugarevento || '–'}
                  </Text>
                  {nMiembros > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                      <Ionicons name="people-outline" size={12} color={COLORS.primary} />
                      <Text style={{ fontSize: 11, color: COLORS.primary, fontWeight: '600' }}>
                        {nMiembros} miembro{nMiembros !== 1 ? 's' : ''} en el comité
                      </Text>
                    </View>
                  )}
                </View>
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Ionicons name="chatbubbles-outline" size={22} color={COLORS.primary} />
                  <Text style={{ fontSize: 10, color: COLORS.primary, fontWeight: '600' }}>Abrir</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

export default ChatEmbed;
