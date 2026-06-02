// app/evento-chat.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform,
  StyleSheet, SafeAreaView, ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { io } from 'socket.io-client';

const BACKEND_URL = 'https://unibackend1-production.up.railway.app';

const ROL_CONFIG = {
  admin:     { color: '#FF6B35', label: 'Admin',     icono: 'A' },
  creador:   { color: '#007AFF', label: 'Creador',   icono: 'C' },
  logistica: { color: '#34C759', label: 'Logística', icono: 'L' },
};

export default function EventoChatScreen() {
  const { eventoId, userId, userRole, userName, eventoNombre } = useLocalSearchParams();

  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [connected, setConnected]   = useState(false);
  const [connecting, setConnecting] = useState(true);

  const socketRef   = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setConnecting(false);
      socket.emit('join_event', { eventoId, userId, role: userRole, userName });
    });

    socket.on('connect_error', () => {
      setConnected(false);
      setConnecting(false);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('history', (historial) => {
      setMessages(historial.map((m, i) => ({ ...m, id: `h_${i}` })));
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 120);
    });

    socket.on('receive_message', (msg) => {
      setMessages(prev => [...prev, { ...msg, id: `m_${Date.now()}_${Math.random()}` }]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 120);
    });

    socket.on('user_joined', ({ userName: nombre, role }) => {
      setMessages(prev => [...prev, {
        id: `sys_${Date.now()}`,
        system: true,
        text: `${nombre || 'Un usuario'} (${ROL_CONFIG[role]?.label || role}) se unió`
      }]);
    });

    return () => {
      socket.emit('leave_event', { eventoId });
      socket.disconnect();
    };
  }, [eventoId]);

  const handleSend = () => {
    const texto = input.trim();
    if (!texto || !socketRef.current?.connected) return;
    socketRef.current.emit('send_message', {
      eventoId, userId, role: userRole, userName, message: texto
    });
    setInput('');
  };

  const renderMessage = ({ item }) => {
    if (item.system) {
      return (
        <View style={styles.systemRow}>
          <Text style={styles.systemText}>{item.text}</Text>
        </View>
      );
    }

    const isMe   = String(item.userId) === String(userId);
    const rolCfg = ROL_CONFIG[item.role] || { color: '#888', label: item.role, icono: '?' };
    const hora   = item.timestamp
      ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <View style={[styles.row, isMe ? styles.rowMe : styles.rowOther]}>
        {!isMe && (
          <View style={[styles.avatar, { backgroundColor: rolCfg.color + '22' }]}>
            <Text style={[styles.avatarText, { color: rolCfg.color }]}>{rolCfg.icono}</Text>
          </View>
        )}
        <View style={styles.bubbleCol}>
          {!isMe && (
            <Text style={[styles.senderName, { color: rolCfg.color }]}>
              {item.userName || `Usuario ${item.userId}`}
              <Text style={styles.roleBadge}> · {rolCfg.label}</Text>
            </Text>
          )}
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
            <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
              {item.message}
            </Text>
            <Text style={[styles.hora, isMe && styles.horaMe]}>{hora}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (connecting) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.connectingText}>Conectando al chat...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {eventoNombre || `Evento #${eventoId}`}
          </Text>
          <View style={styles.headerStatus}>
            <View style={[styles.statusDot, { backgroundColor: connected ? '#34C759' : '#FF3B30' }]} />
            <Text style={styles.statusText}>{connected ? 'En línea' : 'Sin conexión'}</Text>
          </View>
        </View>
        <View style={[styles.rolChip, { backgroundColor: (ROL_CONFIG[userRole]?.color || '#888') + '22' }]}>
          <Text style={[styles.rolChipText, { color: ROL_CONFIG[userRole]?.color || '#888' }]}>
            {ROL_CONFIG[userRole]?.label || userRole}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Aún no hay mensajes.{'\n'}¡Sé el primero en escribir!</Text>
            </View>
          }
        />

        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={connected ? 'Escribe un mensaje...' : 'Sin conexión...'}
            placeholderTextColor="#999"
            style={styles.input}
            multiline
            editable={connected}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || !connected}
            style={[styles.sendBtn, (!input.trim() || !connected) && styles.sendBtnDisabled]}
          >
            <Text style={styles.sendBtnText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F5F5F5' },
  centered:       { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  connectingText: { fontSize: 14, color: '#666' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#E8E8E8', gap: 8
  },
  backBtn:      { padding: 4 },
  backText:     { fontSize: 22, color: '#007AFF' },
  headerCenter: { flex: 1 },
  headerTitle:  { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  headerStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusDot:    { width: 7, height: 7, borderRadius: 4 },
  statusText:   { fontSize: 11, color: '#888' },
  rolChip:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  rolChipText:  { fontSize: 12, fontWeight: '600' },
  listContent:  { padding: 16, paddingBottom: 8 },
  emptyBox:     { alignItems: 'center', paddingTop: 60 },
  emptyText:    { fontSize: 14, color: '#AAA', textAlign: 'center', lineHeight: 22 },
  systemRow:    { alignItems: 'center', marginVertical: 10 },
  systemText:   { fontSize: 12, color: '#BBB', fontStyle: 'italic' },
  row:          { flexDirection: 'row', marginVertical: 4, alignItems: 'flex-end' },
  rowMe:        { justifyContent: 'flex-end' },
  rowOther:     { justifyContent: 'flex-start' },
  avatar:       { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarText:   { fontSize: 13, fontWeight: '700' },
  bubbleCol:    { maxWidth: '75%' },
  senderName:   { fontSize: 12, fontWeight: '600', marginBottom: 3, marginLeft: 4 },
  roleBadge:    { fontWeight: '400', color: '#AAA' },
  bubble:       { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMe:     { backgroundColor: '#007AFF', borderBottomRightRadius: 4 },
  bubbleOther:  { backgroundColor: '#FFF', borderBottomLeftRadius: 4, shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 2, elevation: 1 },
  bubbleText:   { fontSize: 15, lineHeight: 21, color: '#1A1A1A' },
  bubbleTextMe: { color: '#FFF' },
  hora:         { fontSize: 11, color: '#AAA', marginTop: 4, textAlign: 'right' },
  horaMe:       { color: 'rgba(255,255,255,0.65)' },
  inputRow:     { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 8,
                  backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E8E8E8' },
  input:        { flex: 1, borderWidth: 1, borderColor: '#DDD', borderRadius: 22,
                  paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#1A1A1A',
                  maxHeight: 100, backgroundColor: '#F9F9F9' },
  sendBtn:         { backgroundColor: '#007AFF', borderRadius: 22, paddingHorizontal: 18, paddingVertical: 10 },
  sendBtnDisabled: { backgroundColor: '#B0C4DE' },
  sendBtnText:     { color: '#FFF', fontWeight: '600', fontSize: 15 },
});