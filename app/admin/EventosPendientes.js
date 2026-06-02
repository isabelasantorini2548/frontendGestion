import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity, StatusBar,
  Alert, ActivityIndicator, RefreshControl, Platform, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
//const API_BASE_URL = 'https://evento.cidtec-uc.com';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://unibackend1-production.up.railway.app';
//const API_BASE_URL =  'https://unifrontend.onrender.com';
const TOKEN_KEY = 'adminAuthToken';

const COLORS = {
  primary: '#E95A0C', primaryLight: '#FF7A3D', accent: '#4CAF50',
  background: '#F8F9FA', surface: '#FFFFFF', success: '#2E7D32',
  warning: '#FFA726', danger: '#E53935', info: '#3498db', purple: '#9b59b6',
  blue: '#2196F3', white: '#FFFFFF', grayLight: '#E0E0E0',
  grayMedium: '#BDBDBD', grayText: '#757575', darkText: '#212121',
  cardShadow: '#000000', border: '#E8E8E8', pendingOrange: '#FF9800',
  pendingLight: '#FFF3E0',
};

// ── Helpers de fecha ────────────────────────────────────────────────────────
const isEventExpired = (eventDate) => {
  if (!eventDate) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  let eventDateObj;
  
  if (typeof eventDate === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(eventDate)) {
      eventDateObj = new Date(eventDate);
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(eventDate)) {
      const [day, month, year] = eventDate.split('/').map(Number);
      eventDateObj = new Date(year, month - 1, day);
    } else { eventDateObj = new Date(eventDate); }
  } else { eventDateObj = new Date(eventDate); }
  
  if (isNaN(eventDateObj.getTime())) return false;
  eventDateObj.setHours(0,0,0,0);
  const diffDays = Math.ceil((eventDateObj - today) / (1000*60*60*24));
  return diffDays <= 3; // ≤3 días = considerado "por vencer"
};

const getDaysRemaining = (eventDate) => {
  if (!eventDate) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  let eventDateObj;
  
  if (typeof eventDate === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(eventDate)) {
      eventDateObj = new Date(eventDate);
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(eventDate)) {
      const [day, month, year] = eventDate.split('/').map(Number);
      eventDateObj = new Date(year, month - 1, day);
    } else { eventDateObj = new Date(eventDate); }
  } else { eventDateObj = new Date(eventDate); }
  
  if (isNaN(eventDateObj.getTime())) return null;
  eventDateObj.setHours(0,0,0,0);
  return Math.ceil((eventDateObj - today) / (1000*60*60*24));
};

const formatSubmittedDate = (date) => {
  if (!date) return 'Sin fecha';
  const now = new Date(); const submittedDate = new Date(date);
  const diff = Math.floor((now - submittedDate) / 1000);
  if (diff < 3600) return `Hace ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff/3600)} h`;
  const days = Math.floor(diff / 86400);
  return `Hace ${days} día${days>1?'s':''}`;
};

const getTokenAsync = async () => {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  } else {
    try { return await SecureStore.getItemAsync(TOKEN_KEY); } catch { return null; }
  }
};

const deleteTokenAsync = async () => {
  try {
    if (Platform.OS === 'web') localStorage.removeItem(TOKEN_KEY);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (e) { console.error("Error al eliminar token:", e); }
};

// ── Card de Evento ─────────────────────────────────────────────────────────
const PendingEventCard = ({ event, onView, onApprove, onReject, onMarkExpired, onMarkCancelled }) => {
  const fechaEvento = event.fechaevento || event.date;
  const expired = isEventExpired(fechaEvento);
  const daysRemaining = getDaysRemaining(fechaEvento);
  const isAlreadyExpired = daysRemaining !== null && daysRemaining < 0;
  const isUrgent = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3;

  const getStatusBadge = () => {
    if (isAlreadyExpired) return { text:'VENCIDO', icon:'close-circle', bg:COLORS.danger, color:COLORS.white };
    if (isUrgent) return { text:`⚠️ ${daysRemaining}d`, icon:'warning', bg:COLORS.warning, color:COLORS.white };
    return { text:'Pendiente', icon:'time', bg:COLORS.pendingOrange, color:COLORS.white };
  };
  const badge = getStatusBadge();

  return (
    <View style={[styles.eventCard, expired && styles.eventCardExpired]}>
      {/* Header */}
      <View style={styles.eventHeader}>
        <View style={styles.titleContainer}>
          <Text style={[styles.eventTitle, expired && styles.eventTitleExpired]} numberOfLines={2}>
            {event.nombreevento || event.title || 'Sin título'}
          </Text>
          <View style={styles.idBadge}>
            <Text style={styles.idText}>#{event.idevento || event.id}</Text>
          </View>
        </View>
        <View style={[styles.pendingBadge, { backgroundColor: badge.bg }]}>
          <Ionicons name={badge.icon} size={14} color={badge.color} />
          <Text style={[styles.pendingText, { color: badge.color }]}>{badge.text}</Text>
        </View>
      </View>

      {/* Alerta de vencimiento */}
      {(isUrgent || isAlreadyExpired) && (
        <View style={[styles.expiredAlert, { 
          backgroundColor: isAlreadyExpired ? '#FFEBEE' : '#FFF8E1',
          borderLeftColor: isAlreadyExpired ? COLORS.danger : COLORS.warning 
        }]}>
          <Ionicons name="alert-circle" size={16} color={isAlreadyExpired ? COLORS.danger : COLORS.warning} />
          <Text style={[styles.expiredAlertText, { color: isAlreadyExpired ? COLORS.danger : COLORS.warning }]}>
            {isAlreadyExpired 
              ? `Vencido hace ${Math.abs(daysRemaining)} día${Math.abs(daysRemaining)!==1?'s':''}`
              : daysRemaining === 0 ? '¡Se ejecuta hoy! Revisar urgentemente'
              : `Se ejecuta en ${daysRemaining} día${daysRemaining!==1?'s':''}`}
          </Text>
        </View>
      )}

      {/* Descripción */}
      {(event.descripcion || event.description) && (event.descripcion || event.description) !== 'Sin descripción' && (
        <Text style={styles.eventDescription} numberOfLines={2}>
          {event.descripcion || event.description}
        </Text>
      )}

      {/* Info grid */}
      <View style={styles.infoGrid}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.grayText} />
          <Text style={[styles.infoText, expired && { color: COLORS.danger, fontWeight:'600' }]}>
            {fechaEvento?.split('T')[0] || 'Sin fecha'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.grayText} />
          <Text style={styles.infoText} numberOfLines={1}>
            {event.lugarevento || event.location || 'Sin ubicación'}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footerContainer}>
        <View style={styles.academicoInfo}>
          <Ionicons name="person-circle-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.academicoName}>
            {event.academico?.nombre || event.organizer || 'Académico'}
          </Text>
        </View>
        <Text style={styles.submittedDate}>
          {formatSubmittedDate(event.submittedDate || event.createdAt)}
        </Text>
      </View>

      {/* Botones de acción */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.viewButton]} onPress={() => onView(event)}>
          <Ionicons name="eye-outline" size={18} color={COLORS.blue} />
          <Text style={[styles.actionButtonText, { color: COLORS.blue }]}>Ver</Text>
        </TouchableOpacity>
        
        {!isAlreadyExpired ? (
          <>
            <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={() => onApprove(event)}>
              <Ionicons name="checkmark" size={18} color={COLORS.white} />
              <Text style={[styles.actionButtonText, { color: COLORS.white }]}>Aprobar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => onReject(event)}>
              <Ionicons name="close" size={18} color={COLORS.danger} />
              <Text style={[styles.actionButtonText, { color: COLORS.danger }]}>Rechazar</Text>
            </TouchableOpacity>
             <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => onMarkCancelled(event)}>
              <Ionicons name="close" size={18} color={COLORS.info} />
              <Text style={[styles.actionButtonText, { color: COLORS.info }]}>Cancelar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => onMarkExpired(event)}>
            <Ionicons name="archive-outline" size={18} color={COLORS.white} />
            <Text style={[styles.actionButtonText, { color: COLORS.white }]}>Archivar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ── Componente Principal ───────────────────────────────────────────────────
const EventosPendientes = () => {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userprofile, setUserprofile] = useState({ facultad: null, nombre: '', email: '' });

  const fetchPendingEvents = useCallback(async () => {
    try {
      const token = await getTokenAsync();
      if (!token) { Alert.alert('Sesión Expirada', 'Inicia sesión de nuevo.'); router.replace('/LoginAdmin'); return; }

      // Perfil
      const responseP = await axios.get(`${API_BASE_URL}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }, timeout: 15000 });
      setUserprofile({ facultad: responseP.data.facultad, nombre: responseP.data.nombre, email: responseP.data.email });

      // Eventos pendientes
      const response = await axios.get(`${API_BASE_URL}/eventos/pendientes`, {
        headers: { 'Authorization': `Bearer ${token}` }, timeout: 15000 });
      
      const allPending = Array.isArray(response.data) ? response.data : [];
      // Opcional: ordenar por urgencia (más cercanos primero)
      const sorted = allPending.sort((a,b) => {
        const da = getDaysRemaining(a.fechaevento || a.date) ?? 999;
        const db = getDaysRemaining(b.fechaevento || b.date) ?? 999;
        return da - db;
      });
      
      setEvents(sorted);
    } catch (error) {
      console.error('Error al cargar eventos pendientes:', error);
      Alert.alert('Error', 'No se pudieron cargar los eventos pendientes.');
      if (error.response?.status === 401 || error.response?.status === 403) {
        await deleteTokenAsync(); router.replace('/LoginAdmin');
      }
    } finally { setLoading(false); setRefreshing(false); }
  }, [router]);

  useFocusEffect(useCallback(() => { fetchPendingEvents(); }, [fetchPendingEvents]));

  const onRefresh = useCallback(() => { setRefreshing(true); fetchPendingEvents(); }, [fetchPendingEvents]);

  const handleView = (event) => router.push({ pathname:'/admin/EventDetailScreen', params:{ eventId: event.idevento || event.id }});

  const handleAction = async (event, action) => {
    const config = {
      aprobar: { title:'Aprobar Evento', text:'aprobar', success:'✓ Evento Aprobado', endpoint:'aprobar' },
      rechazar: { title:'Rechazar Evento', text:'rechazar', success:'✓ Evento Rechazado', endpoint:'rechazar' },
      vencer: { title:'Marcar como Vencido', text:'archivar como vencido', success:'✓ Evento Archivado', endpoint:'vencer' },
      cancelar: { title:'Cancelar Evento', text:'cancelar', success:'✓ Evento Cancelado', endpoint:'cancelar', color: COLORS.info }
    }[action];
    
    if (!config) return;
    
    Alert.alert(config.title, `¿${config.text} "${event.nombreevento || event.title}"?`, [
    { text:'Cancelar', style:'cancel' },
    { 
      text:'Confirmar', 
      style: action==='aprobar' ? 'default' : 'destructive', 
      onPress: async () => {
        try {
          const token = await getTokenAsync();
          const endpoint = config.endpoint === 'vencer' ? 'estado' : config.endpoint;
          await axios.put(
            `${API_BASE_URL}/eventos/${event.idevento || event.id}/${endpoint}`,
            config.endpoint === 'vencer' ? { estado: 'vencido' } : config.endpoint === 'cancelar' ? { estado: 'cancelado' } : {},
            { headers: { 'Authorization': `Bearer ${token}` }}
          );
          
          setEvents(prev => prev.filter(e => (e.idevento || e.id) !== (event.idevento || event.id)));
          Alert.alert(config.success, action==='aprobar' ? 'Redirigiendo...' : '', [
            { text: action==='aprobar' ? 'Ver aprobados' : 'OK', onPress: () => action==='aprobar' && router.replace('/admin/EventosAprobados') }
          ]);
        } catch (err) { 
          console.error(err); 
          Alert.alert('Error', `No se pudo ${config.text} el evento`); 
        }
      }
    }
  ]);
  };

  // Stats para banner
  const stats = useMemo(() => {
    const urgent = events.filter(e => { const d=getDaysRemaining(e.fechaevento||e.date); return d!==null && d>=0 && d<=3; }).length;
    const expired = events.filter(e => { const d=getDaysRemaining(e.fechaevento||e.date); return d!==null && d<0; }).length;
    return { total: events.length, urgent, expired };
  }, [events]);

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Cargando eventos pendientes...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={()=>router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Eventos Pendientes</Text>
          <Text style={styles.headerSubtitle}>
            {stats.total} evento{stats.total!==1?'s':''} • {stats.urgent>0 && <Text style={{color:COLORS.warning}}>{stats.urgent} por vencer</Text>}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh} disabled={refreshing}>
          <Ionicons name="refresh" size={24} color={COLORS.white} style={refreshing && {transform:[{rotate:'180deg'}]}} />
        </TouchableOpacity>
      </View>

      {/* Banner resumen */}
      {stats.total > 0 && (
        <View style={styles.summaryBanner}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name={stats.expired>0 ? "alert-circle" : "hourglass-outline"} size={24} color={stats.expired>0 ? COLORS.danger : COLORS.pendingOrange} />
          </View>
          <View style={styles.summaryTextContainer}>
            <Text style={styles.summaryTitle}>
              {stats.expired>0 ? '⚠️ Atención Requerida' : 'Revisión Pendiente'}
            </Text>
            <Text style={styles.summarySubtitle}>
              {stats.expired>0 
                ? `${stats.expired} evento${stats.expired!==1?'s':''} ya vencido${stats.expired!==1?'s':''}` 
                : `${stats.total} evento${stats.total!==1?'s':''} esperando aprobación`}
            </Text>
          </View>
        </View>
      )}

      {/* Lista */}
      <FlatList
        data={events}
        renderItem={({item}) => (
          <PendingEventCard 
            event={item}
            onView={handleView}
            onApprove={(e)=>handleAction(e,'aprobar')}
            onReject={(e)=>handleAction(e,'rechazar')}
            onMarkExpired={(e)=>handleAction(e,'vencer')}
            onMarkCancelled={(e)=>handleAction(e,'cancelar')}
          />
        )}
        keyExtractor={(item)=>`pending-${item.idevento||item.id}`}
        style={styles.eventsList}
        contentContainerStyle={styles.eventsListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={80} color={COLORS.grayMedium} />
            </View>
            <Text style={styles.emptyTitle}>¡Todo al día!</Text>
            <Text style={styles.emptyText}>No hay eventos pendientes de aprobación</Text>
          </View>
        }
      />
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:COLORS.background},
  loadingContainer:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:COLORS.background},
  loadingText:{marginTop:16,fontSize:16,color:COLORS.grayText,fontWeight:'500'},
  
  // Header
  header:{backgroundColor:COLORS.primary,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingTop:Platform.OS==='ios'?50:16,paddingBottom:16,paddingHorizontal:16,...Platform.select({ios:{shadowColor:COLORS.cardShadow,shadowOffset:{width:0,height:2},shadowOpacity:0.15,shadowRadius:8},android:{elevation:4}})},
  backButton:{padding:8,marginRight:8},
  headerTextContainer:{flex:1},
  headerTitle:{fontSize:20,fontWeight:'bold',color:COLORS.white},
  headerSubtitle:{fontSize:13,color:'rgba(255,255,255,0.8)',marginTop:2},
  refreshButton:{padding:8,marginLeft:8},
  
  // Summary Banner
  summaryBanner:{backgroundColor:COLORS.white,flexDirection:'row',alignItems:'center',marginHorizontal:16,marginTop:16,padding:16,borderRadius:16,borderLeftWidth:4,borderLeftColor:COLORS.pendingOrange,...Platform.select({ios:{shadowColor:COLORS.cardShadow,shadowOffset:{width:0,height:2},shadowOpacity:0.08,shadowRadius:8},android:{elevation:2}})},
  summaryIconContainer:{width:48,height:48,borderRadius:24,backgroundColor:COLORS.pendingLight,justifyContent:'center',alignItems:'center',marginRight:12},
  summaryTextContainer:{flex:1},
  summaryTitle:{fontSize:16,fontWeight:'700',color:COLORS.darkText,marginBottom:2},
  summarySubtitle:{fontSize:13,color:COLORS.grayText},
  
  // List
  eventsList:{flex:1},
  eventsListContent:{padding:16},
  
  // Card
  eventCard:{backgroundColor:COLORS.surface,borderRadius:16,padding:16,marginBottom:16,...Platform.select({ios:{shadowColor:COLORS.cardShadow,shadowOffset:{width:0,height:2},shadowOpacity:0.08,shadowRadius:8},android:{elevation:2}})},
  eventCardExpired:{borderLeftWidth:4,borderLeftColor:COLORS.danger,backgroundColor:COLORS.danger+'08'},
  eventHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12},
  titleContainer:{flex:1,flexDirection:'row',alignItems:'flex-start',marginRight:12},
  eventTitle:{fontSize:17,fontWeight:'700',color:COLORS.darkText,flex:1,marginRight:8},
  eventTitleExpired:{color:COLORS.danger,textDecorationLine:'line-through'},
  idBadge:{backgroundColor:COLORS.background,paddingHorizontal:8,paddingVertical:3,borderRadius:6},
  idText:{fontSize:12,fontWeight:'700',color:COLORS.primary},
  pendingBadge:{flexDirection:'row',alignItems:'center',paddingHorizontal:10,paddingVertical:4,borderRadius:12,gap:4},
  pendingText:{fontSize:11,fontWeight:'600',color:COLORS.white},
  
  // Alert
  expiredAlert:{flexDirection:'row',alignItems:'center',padding:10,borderRadius:8,marginBottom:12,borderLeftWidth:3,gap:6},
  expiredAlertText:{fontSize:12,fontWeight:'600',flex:1},
  
  // Description & Info
  eventDescription:{fontSize:14,color:COLORS.grayText,lineHeight:20,marginBottom:12},
  infoGrid:{flexDirection:'row',justifyContent:'space-between',marginBottom:10,gap:12},
  infoRow:{flexDirection:'row',alignItems:'center',flex:1,gap:6},
  infoText:{fontSize:13,color:COLORS.grayText,fontWeight:'500',flex:1},
  
  // Footer
  footerContainer:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingTop:12,marginBottom:12,borderTopWidth:1,borderTopColor:COLORS.border},
  academicoInfo:{flexDirection:'row',alignItems:'center',gap:6},
  academicoName:{fontSize:12,color:COLORS.grayText,fontWeight:'500'},
  submittedDate:{fontSize:11,color:COLORS.grayMedium},
  
  // Actions
  actionButtonsContainer:{flexDirection:'row',gap:8,paddingTop:12,borderTopWidth:1,borderTopColor:COLORS.border},
  actionButton:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',paddingVertical:10,borderRadius:10,gap:6},
  viewButton:{backgroundColor:COLORS.background,borderWidth:1,borderColor:COLORS.blue},
  approveButton:{backgroundColor:COLORS.success},
  rejectButton:{backgroundColor:COLORS.background,borderWidth:1,borderColor:COLORS.danger},
  actionButtonText:{fontSize:13,fontWeight:'600'},
  
  // Empty
  emptyContainer:{flex:1,justifyContent:'center',alignItems:'center',paddingVertical:80,paddingHorizontal:32},
  emptyIconContainer:{width:120,height:120,borderRadius:60,backgroundColor:COLORS.background,justifyContent:'center',alignItems:'center',marginBottom:20},
  emptyTitle:{fontSize:22,fontWeight:'bold',color:COLORS.darkText,marginBottom:8},
  emptyText:{fontSize:15,color:COLORS.grayText,textAlign:'center',lineHeight:22},
});

EventosPendientes.options = { headerShown: false };
export default EventosPendientes;