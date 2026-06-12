import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Platform, ActivityIndicator, Alert, KeyboardAvoidingView, Modal, PanResponder, Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
const { width } = Dimensions.get('window');
const isMobile = width < 768;
const TIPOS_DE_EVENTO = [
  { id: '1', label: 'Curricular' },
  { id: '2', label: 'Extracurricular' },
  { id: '3', label: 'Marketing' },
  { id: '4', label: 'Internacionalización/Marketing' },
  { id: '5', label: 'Marketing/Extracurricular ' }
];
const SEGMENTO_OBJETIVO = [
  { id: '1', label: 'Estudiantes' },
  { id: '2', label: 'Docentes' },
  { id: '3', label: 'Público Externo' },
  { id: '4', label: 'Influencers' },
  { id: '5', label: 'Otro' }
];
const CLASIFICACION_ESTRATEGICA = {
  '1': { label: 'Academica y Cientifica', subcategorias: [
    { id: '1a', label: 'Congresos' },
    { id: '1b', label: 'Seminarios' },
    { id: '1c', label: 'Simposios' },
    { id: '1d', label: 'Conferencias' },
    { id: '1e', label: 'Charlas Especializadas' },
    { id: '1f', label: 'Master Class' },
    { id: '1g', label: 'Conversatorio' },
    { id: '1h', label: 'Coloquios' },
    { id: '1i', label: 'Mesas Redondas' },
    { id: '1j', label: 'Paneles' },
    { id: '1k', label: 'Ferias Academicas' },
    { id: '1l', label: 'Defenzas de Proyecto de grado' },
    { id: '1m', label: 'evaluaciones Integrales' },
    { id: '1n', label: 'Jornada de actualizacion estudiantil y docente' },
  ] },
  '2': { label: 'Institucionales y Ceremoniales', subcategorias: [
    { id: '2a', label: 'Actos de colacion ' },
    { id: '2b', label: 'Aniversarios institucionales' },
    { id: '2c', label: 'Inauguraciones de infraestructura o programas' },
    { id: '2d', label: 'Reconocimientos y premiaciones' },
    { id: '2e', label: 'Lanzamientos oficiales institucionales' },
    { id: '2f', label: 'Firma de convenios y alianzas' },
    { id: '2g', label: 'Tertulias' },
    { id: '2h', label: 'Ceremonias protocolares' },
  ] },
  '3': { label: 'Culturales, Deportivos y Sociales', subcategorias: [
    { id: '3a', label: 'Ferias culturales y artísticas' },
    { id: '3b', label: 'Campeonatos deportivos' },
    { id: '3c', label: 'Actividades recreativas o festivas (Día del Estudiante, Día de la Mujer, Día del Maestro)' },
    { id: '3d', label: 'Talleres de bienestar físico o mental' },
    { id: '3e', label: 'Jornadas de voluntariado interno' },
    { id: '3f', label: 'Eventos culturales' },
  ] },
  '4': { label: 'Extension Universitaria, Vinculacion Profesional y Atraccion Estudiantil', subcategorias: [
    { id: '4a', label: 'Visita de colegios ' },
    { id: '4b', label: 'Visita a ferias en colegios' },
    { id: '4c', label: 'Auspicios actividades intercolegiales (Ej: El y Ella, torneos deportivos) ' },
    { id: '4d', label: 'Torneo de Padel Intercolegial' },
    { id: '4e', label: 'Ferias de innovación y emprendimiento' },
    { id: '4f', label: 'Ferias de empleabilidad' },
    { id: '4g', label: 'Hackathons, bootcamps, pitch days ' },
    { id: '4h', label: 'Charlas y talleres con empresas' },
    { id: '4i', label: 'Proyectos de responsabilidad universitaria' },
    { id: '4j', label: 'Campañas solidarias' },
    { id: '4k', label: 'Voluntariados' },
    { id: '4l', label: 'Encuentros de egresados y networking' },
    { id: '4m', label: 'Lanzamientos de proyectos estratégicos o colaborativos' },
  ] },
  '5': { label: 'Internacionalizacion y Posicionamiento', subcategorias: [
    { id: '5a', label: 'Programas internacionales y de intercambio' },
    { id: '5b', label: 'Semana Nomads' },
    { id: '5c', label: 'Actividades con consulados y embajadas' },
    { id: '5d', label: 'TEDx UNIFRANZ' },
    { id: '5e', label: 'Foro Internacional de Economía Creativa' },
    { id: '5f', label: 'Cartel Bienal BICEBE' },
    { id: '5g', label: 'Eventos internacionales de visibilidad y alianzas' },
    { id: '5h', label: 'Lanzamientos estratégicos o de marca universitaria' },
  ] }
};
const LUGARES_CON_AREAS = {
  'Cala-Cala': {
    label: 'Campus CalaCala',
    areas: [
      { id: 'cn-1', nombre: 'Biblioteca' },
      { id: 'cn-2', nombre: 'Hall' },
      { id: 'cn-3', nombre: 'Boulevard' }
    ]
  },
  'Central': {
    label: 'Campus Central',
    areas: [
      { id: 'cs-1', nombre: 'Auditorio' },
      { id: 'cs-2', nombre: 'Jardin 1' },
      { id: 'cs-3', nombre: 'Jardín 2' },
      { id: 'cs-4', nombre: 'Biblioteca' },
      { id: 'cs-5', nombre: 'Aula 310' },
      { id: 'cs-6', nombre: 'GAme Room' },
    ]
  },
  'campus-centro': {
    label: 'Campus Centro',
    areas: [
      { id: 'cc-1', nombre: 'Centro de Convenciones' },
      { id: 'cc-2', nombre: 'Sala Polivalente' }
    ]
  }
};
const OBJETIVOS_EVENTO_MAP = {
  modeloPedagogico: 1,
  posicionamiento: 2,
  internacionalizacion: 3,
  rsu: 4,
  fidelizacion: 5,
  otro: 6
};
// Función para obtener el icono según el tipo de notificación
const getNotificationIcon = (type) => {
  switch (type) {
    case 'nuevo_evento': return 'calendar';
    case 'evento_aprobado': return 'checkmark-circle';
    case 'evento_rechazado': return 'close-circle';
    case 'recordatorio': return 'alarm';
    default: return 'notifications';
  }
};
const NotificationBell = ({ notificationCount, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.notificationBell}>
    <Ionicons name="notifications-outline" size={24} color="#333" />
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
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.notificationsList}>
          {notifications.length === 0 ? (
            <Text style={styles.noNotificationsText}>No hay notificaciones</Text>
          ) : (
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id || notification.idnotification}
                style={[
                  styles.notificationItem,
                  (!notification.read && notification.estado !== 'leido') && styles.notificationItemUnread
                ]}
                onPress={() => markAsRead(notification.id || notification.idnotification)}
              >
                <View style={styles.notificationIconContainer}>
                  <Ionicons 
                    name={getNotificationIcon(notification.type || notification.tipo)} 
                    size={20} 
                    color="#e95a0c" 
                    style={styles.notificationIcon} 
                  />
                  {(!notification.read && notification.estado !== 'leido') && (
                    <View style={styles.unreadDot} />
                  )}
                </View>
                <View style={styles.notificationContentContainer}>
                  <Text style={[
                    styles.notificationText,
                    (!notification.read && notification.estado !== 'leido') && styles.notificationTextUnread
                  ]}>
                    {notification.title || notification.titulo}
                  </Text>
                  <Text style={styles.notificationMessage}>
                    {notification.message || notification.mensaje}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {dayjs(notification.timestamp || notification.created_at).format('DD/MM/YYYY HH:mm')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
);
const getTokenAsync = async () => {
  const TOKEN_KEY = 'adminAuthToken';
  try {
    let token;
    if (Platform.OS === 'web') {
      token = localStorage.getItem(TOKEN_KEY);
    } else {
      token = await SecureStore.getItemAsync(TOKEN_KEY);
    }
    return (token && token !== 'null' && token !== '') ? token : null;
  } catch (e) {
    console.error("Error al obtener el token:", e);
    return null;
  }
};
const formatCurrency = (value) => `Bs ${Number(value).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
const TablaPresupuesto = ({
  titulo,
  items,
  setItems,
  totalGeneral,
  handlePresupuestoChange,
  eliminarFilaPresupuesto,
  agregarFilaPresupuesto
}) => (
  <View style={styles.tablaContainer}>
    <Text style={styles.tablaTitulo}>{titulo}</Text>
    <View style={styles.tablaHeader}>
      <Text style={[styles.headerText, { flex: 0.5 }]}>N°</Text>
      <Text style={[styles.headerText, { flex: 2 }]}>Descripción</Text>
      <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Cant.</Text>
      <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Precio</Text>
      <Text style={[styles.headerText, { flex: 1.5, textAlign: 'right' }]}>Total</Text>
      <Text style={[styles.headerText, { flex: 0.5 }]}></Text>
    </View>
    {items.map((item, index) => {
      const totalItem = (parseFloat(item.cantidad) || 0) * (parseFloat(item.precio) || 0);
      return (
        <View key={item.key} style={styles.tablaRow}>
          <Text style={[styles.rowText, { flex: 0.5, textAlign: 'center' }]}>{index + 1}</Text>
          <TextInput
            style={[styles.rowInput, { flex: 2 }]}
            value={item.descripcion}
            onChangeText={(text) => handlePresupuestoChange(items, setItems, index, 'descripcion', text)}
            placeholder="Descripción"
          />
          <TextInput
            style={[styles.rowInput, { flex: 1, textAlign: 'center' }]}
            value={item.cantidad}
            onChangeText={(text) => handlePresupuestoChange(items, setItems, index, 'cantidad', text.replace(/[^0-9.]/g, ''))}
            keyboardType="numeric"
            placeholder="0"
          />
          <TextInput
            style={[styles.rowInput, { flex: 1, textAlign: 'center' }]}
            value={item.precio}
            onChangeText={(text) => handlePresupuestoChange(items, setItems, index, 'precio', text.replace(/[^0-9.]/g, ''))}
            keyboardType="numeric"
            placeholder="0.00"
          />
          <Text style={[styles.rowText, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(totalItem)}</Text>
          <TouchableOpacity onPress={() => eliminarFilaPresupuesto(items, setItems, index)} style={[styles.deleteButtonSmall, { flex: 0.5 }]}>
            <Ionicons name="close-circle" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      );
    })}
    <TouchableOpacity onPress={() => agregarFilaPresupuesto(setItems)} style={styles.addButtonSmall}>
      <Text style={styles.addButtonTextSmall}>+ Añadir Fila</Text>
    </TouchableOpacity>
    <View style={styles.totalRow}>
      <Text style={styles.totalText}>TOTAL</Text>
      <Text style={styles.totalAmount}>{formatCurrency(totalGeneral)}</Text>
    </View>
  </View>
);
const GoogleStyleCalendarView = ({ fechaHoraSeleccionada, setFechaHoraSeleccionada, eventos, title }) => {
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false });
    }
    return days;
  };
  const getEventsForDay = (date) => {
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    return eventos.filter(evento => {
      const fechaEventoStr = evento.fechaevento.split('T')[0];
      return fechaEventoStr === dateStr;
    });
  };
  const navigateMonth = (direction) => {
    const newDate = new Date(fechaHoraSeleccionada);
    newDate.setMonth(newDate.getMonth() + direction);
    setFechaHoraSeleccionada(newDate);
  };
  const days = getDaysInMonth(fechaHoraSeleccionada);
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return (
    <View style={styles.googleCalendarContainer}>
      {title && (
        <View style={styles.calendarTitleContainer}>
          <Text style={styles.calendarTitle}>{title}</Text>
        </View>
      )}
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#e95a0c" />
        </TouchableOpacity>
        <Text style={styles.monthYearText}>
          {dayjs(fechaHoraSeleccionada).format('MMMM YYYY').toUpperCase()}
        </Text>
        <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color="#e95a0c" />
        </TouchableOpacity>
      </View>
      <View style={styles.weekDaysHeader}>
        {weekDays.map(day => (
          <View key={day} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>
      <View style={styles.daysGrid}>
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day.date);
          const isSelected = dayjs(fechaHoraSeleccionada).format('YYYY-MM-DD') === dayjs(day.date).format('YYYY-MM-DD');
          const isToday = dayjs().format('YYYY-MM-DD') === dayjs(day.date).format('YYYY-MM-DD');
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                !day.isCurrentMonth && styles.dayCellInactive,
                isSelected && styles.dayCellSelected,
                isToday && styles.dayCellToday
              ]}
              onPress={() => {
                const newDate = new Date(day.date);
                newDate.setHours(fechaHoraSeleccionada.getHours());
                newDate.setMinutes(fechaHoraSeleccionada.getMinutes());
                setFechaHoraSeleccionada(newDate);
              }}
            >
              <View style={styles.dayCellContent}>
                <Text style={[
                  styles.dayNumber,
                  !day.isCurrentMonth && styles.dayNumberInactive,
                  isSelected && styles.dayNumberSelected,
                  isToday && styles.dayNumberToday
                ]}>
                  {day.date.getDate()}
                </Text>
                {dayEvents.length > 0 && (
                  <View style={styles.eventIndicators}>
                    <View style={[styles.eventDot, { backgroundColor: dayEvents.length > 1 ? '#ff6b6b' : '#e95a0c' }]} />
                    {dayEvents.length > 1 && <Text style={styles.eventCount}>+{dayEvents.length - 1}</Text>}
                  </View>
                )}
                {dayEvents.length > 0 && isSelected && (
                  <View style={styles.eventPreview}>
                    {dayjs(evento.horaevento.split('+')[0], 'HH:mm:ss').format('HH:mm')} {evento.nombreevento}
                    {dayEvents.slice(0, 2).map((evento, idx) => (
                      <Text key={idx} style={styles.eventPreviewText}>
                        {dayjs(evento.horaevento.split('+')[0], 'HH:mm:ss').format('HH:mm')} {evento.nombreevento}
                      </Text>
                    ))}
                    {dayEvents.length > 2 && <Text style={styles.eventPreviewMore}>+{dayEvents.length - 2} más</Text>}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
const ConflictModal = ({ showConflictModal, setShowConflictModal, conflictoDetectado, setConflictoDetectado }) => (
  <Modal
    visible={showConflictModal}
    transparent={true}
    animationType="fade"
    onRequestClose={() => setShowConflictModal(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Ionicons name="warning" size={32} color="#ff6b6b" />
          <Text style={styles.modalTitle}>Conflicto de Horario</Text>
        </View>
        {conflictoDetectado && (
          <View>
            <Text style={styles.modalMessage}>Se detectó un conflicto con el siguiente evento:</Text>
            <View style={styles.conflictEventCard}>
              <Text style={styles.conflictEventTitle}>{conflictoDetectado.nombreevento}</Text>
              <Text style={styles.conflictEventDetails}>
                {dayjs(conflictoDetectado.horaevento.split('+')[0], 'HH:mm:ss').format('HH:mm')} - {conflictoDetectado.lugarevento}
              </Text>
              <Text style={styles.conflictEventResponsible}>Responsable: {conflictoDetectado.responsable_evento}</Text>
            </View>
            <Text style={styles.modalWarning}>Se recomienda mantener al menos 2 horas de separación entre eventos.</Text>
          </View>
        )}
        <View style={styles.modalButtons}>
          <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setShowConflictModal(false)}>
            <Text style={styles.modalButtonSecondaryText}>Elegir otra hora</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalButtonPrimary} onPress={() => {
            setShowConflictModal(false);
            setConflictoDetectado(null);
          }}>
            <Text style={styles.modalButtonPrimaryText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);
const EventosDelDiaMejorado = ({ eventosDelDia, fechaHoraSeleccionada, verificarConflictoHorario }) => {
  if (eventosDelDia.length === 0) return null;
  return (
    <View style={styles.eventosDelDiaContainer}>
      <View style={styles.eventosDelDiaHeader}>
        <Ionicons name="calendar-outline" size={20} color="#e95a0c" />
        <Text style={styles.eventosDelDiaTitle}>Eventos en {dayjs(fechaHoraSeleccionada).format('DD/MM/YYYY')}</Text>
        <View style={styles.eventCountBadge}>
          <Text style={styles.eventCountText}>{eventosDelDia.length}</Text>
        </View>
      </View>
      <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
        {eventosDelDia.map((evento, index) => {
          const horaEventoString = (evento.horaevento || '').split('+')[0].trim();
          const horaEvento = dayjs(`2000-01-01 ${horaEventoString}`, 'YYYY-MM-DD HH:mm:ss');
          const isHoraValida = horaEvento.isValid();
          const isConflict = verificarConflictoHorario(
            dayjs(fechaHoraSeleccionada).format('YYYY-MM-DD') + 'T' + dayjs(fechaHoraSeleccionada).format('HH:mm:ss')
          ).some(e => e.id === evento.id || e.idevento === evento.idevento);
          return (
            <View key={index} style={[styles.eventoCard, isConflict && styles.eventoCardConflict]}>
              <View style={styles.eventoCardHeader}>
                <View style={styles.eventoTimeContainer}>
                  <Ionicons name="time-outline" size={16} color={isConflict ? "#ff6b6b" : "#e95a0c"} />
                  <Text style={[styles.eventoTime, isConflict && styles.eventoTimeConflict]}>
                    {isHoraValida ? horaEvento.format('HH:mm') : 'Hora no disponible'}
                  </Text>
                </View>
                {isConflict && (
                  <View style={styles.conflictBadge}>
                    <Ionicons name="warning" size={12} color="white" />
                    <Text style={styles.conflictBadgeText}>Conflicto</Text>
                  </View>
                )}
              </View>
              <Text style={styles.eventoNombre}>{evento.nombreevento}</Text>
              <View style={styles.eventoDetails}>
                <View style={styles.eventoDetailRow}>
                  <Ionicons name="location-outline" size={14} color="#666" />
                  <Text style={styles.eventoDetailText}>{evento.lugarevento}</Text>
                </View>
                <View style={styles.eventoDetailRow}>
                  <Ionicons name="person-outline" size={14} color="#666" />
                  <Text style={styles.eventoDetailText}>{evento.responsable_evento}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.eventosDelDiaFooter}>
        <Text style={styles.eventosDelDiaNote}>Verifica que tu nuevo evento no genere conflictos de horario</Text>
      </View>
    </View>
  );
};
const ConfirmModal = ({ showConfirmModal, setShowConfirmModal, handleSubmitConfirmed, isLoading, formData }) => (
  <Modal
    visible={showConfirmModal}
    transparent={true}
    animationType="slide"
    onRequestClose={() => setShowConfirmModal(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.confirmModalContent}>
        <View style={styles.confirmModalHeader}>
          <Ionicons name="information-circle" size={32} color="#3498db" />
          <Text style={styles.confirmModalTitle}>Confirmar Envío</Text>
        </View>
        <Text style={styles.confirmModalMessage}>
          ¿Estás seguro de que deseas crear este evento? Una vez enviado, no podrás modificarlo.
        </Text>
        <View style={styles.confirmModalDetails}>
          <Text style={styles.confirmModalDetailTitle}>Resumen del Evento:</Text>
          <Text style={styles.confirmModalDetail}><Text style={styles.detailLabel}>Nombre: </Text>{formData.nombreevento}</Text>
          <Text style={styles.confirmModalDetail}>
            <Text style={styles.detailLabel}>Fecha: </Text>{dayjs(formData.fechaHoraSeleccionada).format('DD/MM/YYYY')}
          </Text>
        </View>
        <View style={styles.confirmModalButtons}>
          <TouchableOpacity style={[styles.confirmModalButton, styles.confirmModalButtonCancel]} onPress={() => setShowConfirmModal(false)}>
            <Text style={styles.confirmModalButtonTextCancel}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.confirmModalButton, styles.confirmModalButtonConfirm]} onPress={handleSubmitConfirmed} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmModalButtonTextConfirm}>Sí, Crear Evento</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);
const ProyectoEvento = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [errors, setErrors] = useState({});
  const [eventos, setEventos] = useState([]);
  const [eventosDelDia, setEventosDelDia] = useState([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictoDetectado, setConflictoDetectado] = useState(null);
  const scrollViewRef = useRef(null);
  const objetivosSectionRef = useRef(null);
  const [objetivosSectionY, setObjetivosSectionY] = useState(0); // ✅ Nueva variable para guardar posición
  const [isScrollingToObjetivos, setIsScrollingToObjetivos] = useState(false);
  const [nombreevento, setNombreevento] = useState('');
  const [lugarevento, setLugarevento] = useState('');
  const [nombreResponsable, setNombreResponsable] = useState('');
  const [tiposSeleccionados, setTiposSeleccionados] = useState({});
  const [textoOtroTipo, setTextoOtroTipo] = useState('');
  const [textoTiposSeleccionados, setTextoTiposSeleccionados] = useState('');
  const [recursosDisponibles, setRecursosDisponibles] = useState([]);
  const [recursosSeleccionados, setRecursosSeleccionados] = useState([]);
  const [recursosTecnologicos, setRecursosTecnologicos] = useState([{ nombre: '', cantidad: '' }]);
  const [mobiliario, setMobiliario] = useState([{ nombre: '', cantidad: '' }]);
  const [vajilla, setVajilla] = useState([{ nombre: '', cantidad: '' }]);
  const [segmentosTextoPersonalizado, setSegmentosTextoPersonalizado] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [clasificacionSeleccionada, setClasificacionSeleccionada] = useState('');
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState('');
  const [showClasificacionModal, setShowClasificacionModal] = useState(false);
  const [showSubcategoriaModal, setShowSubcategoriaModal] = useState(false);
  const [showLugarModal, setShowLugarModal] = useState(false);
const [campusSeleccionado, setCampusSeleccionado] = useState(null);
const [areaSeleccionada, setAreaSeleccionada] = useState(null); 
  const [notifications, setNotifications] = useState([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [seccionObjetivosVisible, setSeccionObjetivosVisible] = useState(false);
  const [seccionResultadosVisible, setSeccionResultadosVisible] = useState(false);
  const [seccionComiteVisible, setSeccionComiteVisible] = useState(false);
  const [seccionRecursosVisible, setSeccionRecursosVisible] = useState(false);
  const [seccionPresupuestoVisible, setSeccionPresupuestoVisible] = useState(false);
  const resultadosSectionRef = useRef(null);
  const [isScrollingToResultados, setIsScrollingToResultados] = useState(false);
  const comiteSectionRef = useRef(null);
  const [isScrollingToComite, setisScrollingToComite] = useState(false);
  const recursosSectionRef = useRef(null);
  const [isScrollingToRecursos, setIsScrollingToRecursos] = useState(false);
  const [recursos, setRecursos] = useState([{ nombre_recurso: '', cantidad: '' }]);
  const presupuestoSectionRef = useRef(null);
  const [isScrollingToPresupuesto, setIsScrollingToPresupuesto] = useState(false);
  const [usuariosComite,setUsuariosComite] = useState([]);
  const [comiteSeleccionado, setComiteSeleccionado] = useState([]);
  const addRecursoTecnologico = () => setRecursosTecnologicos(prev => [...prev, { nombre: '', cantidad: '' }]);
  const removeRecursoTecnologico = (index) => setRecursosTecnologicos(prev => prev.filter((_, i) => i !== index));
  const updateRecursoTecnologico = (value, index, field) => {
    const nuevos = [...recursosTecnologicos];
    nuevos[index][field] = value;
    setRecursosTecnologicos(nuevos);
  };
  // Mobiliario
  const addMobiliario = () => setMobiliario(prev => [...prev, { nombre: '', cantidad: '' }]);
  const removeMobiliario = (index) => setMobiliario(prev => prev.filter((_, i) => i !== index));
  const updateMobiliario = (value, index, field) => {
    const nuevos = [...mobiliario];
    nuevos[index][field] = value;
    setMobiliario(nuevos);
  };
  // Vajilla
  const addVajilla = () => setVajilla(prev => [...prev, { nombre: '', cantidad: '' }]);
  const removeVajilla = (index) => setVajilla(prev => prev.filter((_, i) => i !== index));
  const updateVajilla = (value, index, field) => {
    const nuevos = [...vajilla];
    nuevos[index][field] = value;
    setVajilla(nuevos);
  };
  const [fechaHoraSeleccionada, setFechaHoraSeleccionada] = useState(() => {
    let initialDate = dayjs();
    if (params.selectedDate) {
      initialDate = dayjs(params.selectedDate);
      if (params.selectedHour) {
        initialDate = initialDate.hour(parseInt(params.selectedHour, 10)).minute(0).second(0);
      }
      return initialDate.toDate();
    }
    return new Date();
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [objetivos, setObjetivos] = useState({
    modeloPedagogico: false,
    posicionamiento: false,
    internacionalizacion: false,
    rsu: false,
    fidelizacion: false,
    otro: false,
    otroTexto: ''
  });
  const [argumentacion, setArgumentacion] = useState('');
  const [objetivosPDI, setObjetivosPDI] = useState(['', '', '']);
  const [segmentoObjetivo, setSegmentoObjetivo] = useState({
    estudiantes: false,
    docentes: false,
    publicoExterno: false,
    influencers: false,
    otro: false,
    otroTexto: ''
  });
  const [resultadosEsperados, setResultadosEsperados] = useState({
    participacion: '',
    satisfaccion: '',
    otro: ''
  });
  const [egresos, setEgresos] = useState([{ key: 'egreso-1', descripcion: '', cantidad: '', precio: '' }]);
  const [ingresos, setIngresos] = useState([{ key: 'ingreso-1', descripcion: '', cantidad: '', precio: '' }]);
  const totalEgresos = useMemo(() => egresos.reduce((acc, item) => acc + (parseFloat(item.cantidad) || 0) * (parseFloat(item.precio) || 0), 0), [egresos]);
  const totalIngresos = useMemo(() => ingresos.reduce((acc, item) => acc + (parseFloat(item.cantidad) || 0) * (parseFloat(item.precio) || 0), 0), [ingresos]);
  const balance = useMemo(() => totalIngresos - totalEgresos, [totalIngresos, totalEgresos]);
  
  const fetchNotifications = async () => {
    try {
    const token = await getTokenAsync();
    console.log("Token obtenido:", token);
    if (!token || token === 'null' || token === '') {
      console.warn("Token inválido, redirigiendo al login");
      router.replace('/login');
      return;
    }
      const response = await axios.get(`${API_BASE_URL}/notificaciones`, {
         headers: { 'Authorization': `Bearer ${token}` } 
        });
      console.log("Notificaciones:", response.data);
   const mappedNotifications = (response.data || []).map(notif => ({
      id: notif.id || notif.idnotification,           // ID único
      idusuario: notif.idusuario,
      title: notif.titulo || notif.title,             // Título
      message: notif.mensaje || notif.message,         // Mensaje
      type: notif.tipo || notif.type,                 // Tipo
      estado: notif.estado,                           // Estado (leido/no_leido)
      read: notif.estado === 'leido',                 // Convertir estado a booleano
      created_at: notif.created_at || notif.timestamp // Fecha
    }));

    setNotifications(mappedNotifications);
    setUnreadCount(mappedNotifications.filter(n => !n.read).length);

  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
  }
};

  const markNotificationAsRead = async (notificationId) => {
    if (!authToken || authToken === 'null' || authToken === '') return;
    try {
      await axios.patch(`${API_BASE_URL}/notificaciones/${notificationId}/read`, {}, { headers: { Authorization: `Bearer ${authToken}` } });
      setNotifications(prev => prev.map(n => n.idusuario === notificationId ? { ...n, read: true, estado: 'leido' } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };
  const fetchUserInfo = async () => {
    if (!authToken) return null;
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${authToken}` } });
      setUserRole(response.data.role || response.data.rol);
      return response.data;
    } catch (error) {
      console.error('Error al obtener información del usuario:', error);
      return null;
    }
  };
const fetchUsuariosComite = async () => {
  try {
     const token = await getTokenAsync();
      console.log("Token obtenido:", token);
     if (!token || token === 'null' || token === '') {
    console.warn("Token inválido, redirigiendo al login");
    router.replace('/login');
    return;
  }
    const response = await axios.get(`${API_BASE_URL}/users/comite`, {
      headers: { 'Authorization': `Bearer ${token}`}
    });
     console.log("Usuarios del comité:", response.data);
      const uniqueUsuarios = [];
    const seenIds = new Set();
    
    for (const usuario of response.data) {
      // Si el usuario no ha sido visto antes, añádelo a la lista
      if (!seenIds.has(usuario.id)) {
        seenIds.add(usuario.id);
        uniqueUsuarios.push(usuario);
      }
    }
    
    setUsuariosComite(uniqueUsuarios);

  } catch (error) {
    console.error('Error al cargar usuarios para comité:', error);
    Alert.alert("Error", "No se pudieron cargar los miembros del comité. Revisa la consola.");
  }
};
  const verificarConflictoHorario = (fechaHora) => {
    const fechaFormateada = dayjs(fechaHora).format('YYYY-MM-DD');
    const horaFormateada = dayjs(fechaHora).format('HH:mm');
    const eventosEnMismaFecha = eventos.filter(evento => dayjs(evento.fechaevento).format('YYYY-MM-DD') === fechaFormateada);
    const conflictos = eventosEnMismaFecha.filter(evento => {
      const horaEventoString = (evento.horaevento || '').split('+')[0].trim();
      const horaEvento = dayjs(horaEventoString, 'HH:mm:ss');
      if (!horaEvento.isValid()) return false;
      const horaSeleccionada = dayjs(horaFormateada, 'HH:mm');
      const diferencia = Math.abs(horaEvento.diff(horaSeleccionada, 'minutes'));
      return diferencia < 120;
    });
    return conflictos;
  };
  const handleClockTimeChange = (newDate) => {
    const conflictos = verificarConflictoHorario(newDate);
    if (conflictos.length > 0) {
      setConflictoDetectado(conflictos[0]);
      setShowConflictModal(true);
    } else {
      setFechaHoraSeleccionada(newDate);
    }
  };
  useEffect(() => {
    if (authToken) {
      fetchUserInfo();
      fetchNotifications();
      fetchUsuariosComite();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [authToken]);
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      const token = await getTokenAsync();
      setAuthToken(token);
      if (!token) {
        Alert.alert("Error", "No se encontró un token de autenticación. Por favor, inicia sesión.");
        router.push("/login");
        return;
      }
      try {
        const userInfo = await fetchUserInfo();
        if (userInfo) setUserRole(userInfo.role || userInfo.rol);
        const responseRecursos = await axios.get(`${API_BASE_URL}/recursos`, {
          headers: { Authorization: `Bearer ${token}` } 
        });
         let recursosRaw = responseRecursos.data;
  if (!Array.isArray(recursosRaw)) {
    // Intenta encontrar el array en propiedades comunes
    if (Array.isArray(responseRecursos.data.data)) {
      recursosRaw = responseRecursos.data.data;
    } else if (Array.isArray(responseRecursos.data.recursos)) {
      recursosRaw = responseRecursos.data.recursos;
    } else {
      recursosRaw = [];
    }
  }
       const validResources = recursosRaw
    .map(recurso => {
      // Determina el ID correcto (prioriza idrecurso, pero acepta id)
      const idCorrecto = recurso.idrecurso ?? recurso.id ?? null;
      return {
        ...recurso,
        idrecurso: idCorrecto, // Asegura que siempre exista idrecurso
        nombre_recurso: recurso.nombre_recurso || recurso.nombre || 'Recurso sin nombre',
        recurso_tipo: recurso.recurso_tipo || 'otro'
      };
    })
    .filter(recurso => 
      recurso.idrecurso != null && 
      recurso.nombre_recurso && 
      recurso.nombre_recurso.trim() !== ''
    );
  
  console.log('✅ Recursos normalizados:', validResources);
  setRecursosDisponibles(validResources);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        Alert.alert("Error", "No se pudieron cargar los datos necesarios.");
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);
  useEffect(() => {
    const selectedIds = Object.keys(tiposSeleccionados);
    const selectedLabels = selectedIds.map(id => {
      const tipoEncontrado = TIPOS_DE_EVENTO.find(tipo => tipo.id === id);
      return tipoEncontrado ? tipoEncontrado.label : '';
    });
    setTextoTiposSeleccionados(selectedLabels.join(', '));
  }, [tiposSeleccionados]);
  useEffect(() => {
    const selectedDateStr = dayjs(fechaHoraSeleccionada).format('YYYY-MM-DD');
    const eventsDelDia = eventos.filter(e => e.fechaevento === selectedDateStr);
    setEventosDelDia(eventsDelDia);
  }, [eventos, fechaHoraSeleccionada]);
  const addResource = () => setRecursos(prev => [...prev, { nombre_recurso: '', cantidad: '' }]);
  const removeResource = (indexToRemove) => setRecursos(prev => prev.filter((_, index) => index !== indexToRemove));
  const updateResource = (text, indexToUpdate, field) => {
  const nuevosRecursos = [...recursos];
  nuevosRecursos[indexToUpdate][field] = text;
  setRecursos(nuevosRecursos);
};
  const handleInputChange = (field, value) => {
    if (field === 'nombreevento') setNombreevento(value);
    if (field === 'lugarevento') setLugarevento(value);
    if (field === 'nombreResponsable') setNombreResponsable(value);
    if (errors[field]) setErrors(prevErrors => ({ ...prevErrors, [field]: null }));
  };
  const onChangeTimeEventoPrincipal = (event, selectedDate) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const newHour = selectedDate.getHours();
      const newMinute = selectedDate.getMinutes();
      const updateDate = new Date(fechaHoraSeleccionada);
      updateDate.setHours(newHour, newMinute, 0, 0);
      const conflictos = verificarConflictoHorario(updateDate);
      if (conflictos.length > 0) {
        setConflictoDetectado(conflictos[0]);
        setShowConflictModal(true);
      } else {
        setFechaHoraSeleccionada(updateDate);
      }
    }
  };
  const handleCheckboxChange = (setter, key) => setter(prev => ({ ...prev, [key]: !prev[key] }));
  const handleOtroTextChange = (setter, text) => setter(prev => ({ ...prev, otroTexto: text }));
  const handleResultadoChange = (key, value) => setResultadosEsperados(prev => ({ ...prev, [key]: value }));
  const handlePresupuestoChange = (items, setItems, index, field, value) => {
    const nuevosItems = [...items];
    nuevosItems[index][field] = value;
    setItems(nuevosItems);
  };
  const agregarFilaPresupuesto = (setItems) => setItems(prev => [...prev, { key: `item-${Date.now()}`, descripcion: '', cantidad: '', precio: '' }]);
  const eliminarFilaPresupuesto = (items, setItems, index) => {
    if (items.length > 1) setItems(prev => prev.filter((_, i) => i !== index));
  };
  const handleRecursoChange = (idrecurso) => {
    if (idrecurso == null) return;
     const idString = String(idrecurso);
    setRecursosSeleccionados(prev => {
      if(prev.includes(idString)){
        return prev.filter(r => r !== idString);
      } else {
        return [...prev, idString];
      }
  });
  };
  const handleTipoEventoChange = (id) => {
    setTiposSeleccionados(prev => {
      const newState = { ...prev };
      if (newState[id]) delete newState[id];
      else newState[id] = true;
      return newState;
    });
  };
  const handleObjetivoPDIChange = (index, value) => {
    const newObjetivos = [...objetivosPDI];
    newObjetivos[index] = value;
    setObjetivosPDI(newObjetivos);
  };
const scrollToObjetivos = () => {
  setSeccionObjetivosVisible(true);
  setTimeout(() => {
    if (objetivosSectionRef.current && scrollViewRef.current) {
      setIsScrollingToObjetivos(true);
      objetivosSectionRef.current.measureLayout(
        scrollViewRef.current.getInnerViewNode(),
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 60, animated: true });
          setTimeout(() => setIsScrollingToObjetivos(false), 1000);
        },
        (error) => {
          console.warn("Error al medir layout:", error);
          setIsScrollingToObjetivos(false);
        }
      );
    }
  }, 0); 
};
const scrollToResultados = () => {
  setSeccionResultadosVisible(true)
  setTimeout(() => {
    if (resultadosSectionRef.current && scrollViewRef.current) {
      setIsScrollingToResultados(true);
      resultadosSectionRef.current.measureLayout(
        scrollViewRef.current.getInnerViewNode(),
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 60, animated: true });
          setTimeout(() => setIsScrollingToResultados(false), 1000);
        },
        (error) => {
          console.warn("Error al medir layout para Resultados:", error);
          setIsScrollingToResultados(false);
        }
      );
    }
  }, 0);
};
const scrollToComite = () => {
  setSeccionComiteVisible(true);
  setTimeout(() => {
    if (comiteSectionRef.current && scrollViewRef.current) { 
      setisScrollingToComite(true); 
      comiteSectionRef.current.measureLayout(
        scrollViewRef.current.getInnerViewNode(),
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 60, animated: true });
          setTimeout(() => setisScrollingToComite(false), 1000);
        },
        (error) => {
          console.warn("Error al medir layout para Comité:", error);
          setisScrollingToComite(false);
        }
      );
    }
  }, 0);
};
const scrollToRecursos = () => {
  setSeccionRecursosVisible(true);
  setTimeout(() => {
    if (recursosSectionRef.current && scrollViewRef.current) { 
      setIsScrollingToRecursos(true); 
      recursosSectionRef.current.measureLayout(
        scrollViewRef.current.getInnerViewNode(),
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 60, animated: true });
          setTimeout(() => setIsScrollingToRecursos(false), 1000);
        },
        (error) => {
          console.warn("Error al medir layout para Recursos:", error);
          setIsScrollingToRecursos(false);
        }
      );
    }
  }, 0);
};
const scrollToPresupuesto = () => {
  setSeccionPresupuestoVisible(true);
  setTimeout(() => {
    if (presupuestoSectionRef.current && scrollViewRef.current) { // ✅ Referencia correcta
      setIsScrollingToPresupuesto(true); // ✅ Estado correcto
      presupuestoSectionRef.current.measureLayout(
        scrollViewRef.current.getInnerViewNode(),
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 60, animated: true });
          setTimeout(() => setIsScrollingToPresupuesto(false), 1000);
        },
        (error) => {
          console.warn("Error al medir layout para Presupuesto:", error);
          setIsScrollingToPresupuesto(false);
        }
      );
    }
  }, 0);
};
  const validateForm = () => {
  const newErrors = {};
  if (!nombreevento.trim()) {
    newErrors.nombreevento = 'El nombre del evento es obligatorio.';
  }
  if (Object.values(tiposSeleccionados).every(v => !v)) {
    newErrors.tipos = 'Selecciona al menos un tipo de evento.';
  }
  if (tiposSeleccionados['5'] && !textoOtroTipo.trim()) {
    newErrors.textoOtroTipo = 'Describe el otro tipo de evento.';
  }
  if (Object.values(objetivos).every(v => !v)) {
    newErrors.objetivos = 'Selecciona al menos un objetivo.';
  }
  if (objetivos.otro && !objetivos.otroTexto.trim()) {
    newErrors.objetivosOtroTexto = 'Describe el otro objetivo.';
  }
  if (!argumentacion.trim()) {
    newErrors.argumentacion = 'La argumentación es obligatoria.';
  }
  if (!clasificacionSeleccionada) {
    newErrors.clasificacionSeleccionada = 'La clasificación estratégica es obligatoria.';
  }
  if (clasificacionSeleccionada && 
      CLASIFICACION_ESTRATEGICA[clasificacionSeleccionada]?.subcategorias && 
      !subcategoriaSeleccionada) {
    newErrors.subcategoriaSeleccionada = 'Selecciona una subcategoría.';
  }
  console.log('Errores de validación:', newErrors);
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
const confirmSubmit = () => {
  console.log("Validando formulario...");
  console.log("Estado actual:", {
    nombreevento,
    lugarevento,
    tiposSeleccionados,
    objetivos,
    argumentacion,
    clasificacionSeleccionada,
    subcategoriaSeleccionada,
    fechaHoraSeleccionada: dayjs(fechaHoraSeleccionada).format('YYYY-MM-DD HH:mm:ss'),
    comiteSeleccionado,
    recursosTecnologicos,
    mobiliario,
    vajilla
  });
  if (!validateForm()) {
    console.log("Formulario inválido:", errors);
    Alert.alert(
      'Formulario Incompleto',
      'Por favor, corrige los campos marcados en rojo antes de continuar.'
    );
    return;
  }
  setShowConfirmModal(true);
};
  const handleSubmitConfirmed = async () => {
    console.log("Iniciando envío del evento...");
    setShowConfirmModal(false);
    setIsLoading(true);
    if (!authToken) {
      Alert.alert("Error de Autenticación", "No se puede enviar el formulario. Intenta iniciar sesión de nuevo.");
      setIsLoading(false);
      return;
    }
    try {
      if (!nombreevento.trim()) throw new Error('El nombre del evento es obligatorio');
      const tiposParaEnviar = Object.keys(tiposSeleccionados)
        .filter(id => tiposSeleccionados[id])
        .map(id => {
          const tipoObjeto = TIPOS_DE_EVENTO.find(tipo => tipo.id === id);
          return tipoObjeto ? {
            id: parseInt(id, 10),
            texto_personalizado: id === '5' && textoOtroTipo.trim() !== '' ? textoOtroTipo.trim() : undefined
          } : null;
        })
        .filter(item => item !== null);
      if (tiposParaEnviar.length === 0) throw new Error('Debes seleccionar al menos un tipo de evento');
       const objetivoParaEnviar = [];
       Object.keys(objetivos)
      .filter(key => objetivos[key] === true && key !== 'otroTexto')
      .forEach(key => {
          if (objetivos[key]) { // Si está seleccionado
        objetivoParaEnviar.push(OBJETIVOS_EVENTO_MAP[key]);
       }
      });
      if (objetivos.otro && objetivos.otroTexto.trim()) {
    objetivoParaEnviar.push({
        id: OBJETIVOS_EVENTO_MAP.otro,
        texto_personalizado: objetivos.otroTexto.trim()
    });
}
if (objetivos.otro) {
    const pdiObjetivos = objetivosPDI
        .filter(o => o.trim() !== '') // Solo los que tienen texto
        .map(texto => ({
            id: OBJETIVOS_EVENTO_MAP.otro, // Todos estos van con el ID 6 ('otro')
            texto_personalizado: texto.trim()
        }));
    objetivoParaEnviar.push(...pdiObjetivos); // Agregarlos al arreglo
}
      if (objetivoParaEnviar.length === 0) throw new Error('debes seleccionar al menos un objetivo ');
        const segmentosParaEnviar = [];
    const validKeys = ['estudiantes', 'docentes', 'publicoExterno', 'influencers'];
    Object.keys(segmentoObjetivo)
      .filter(key => segmentoObjetivo[key] === true && validKeys.includes(key))
      .forEach(key => {
        const label = {
          estudiantes: 'Estudiantes',
          docentes: 'Docentes',
          publicoExterno: 'Público Externo',
          influencers: 'Influencers'
        }[key];
        const segmentoData = SEGMENTO_OBJETIVO.find(s => s.label === label);
        if (segmentoData) {
          segmentosParaEnviar.push({
            id: parseInt(segmentoData.id, 10),
            texto_personalizado: segmentosTextoPersonalizado[key] || null
          });
        }
      });
   const nuevosRecursos = [
      // Recursos tecnológicos
      ...recursosTecnologicos
        .filter(r => r.nombre && r.nombre.trim() !== '')
        .map(r => ({
          nombre_recurso: r.nombre.trim(),
          cantidad: parseInt(r.cantidad) || 1,
          recurso_tipo: 'tecnologico'
        })),
      // Mobiliario
      ...mobiliario
        .filter(r => r.nombre && r.nombre.trim() !== '')
        .map(r => ({
          nombre_recurso: r.nombre.trim(),
          cantidad: parseInt(r.cantidad) || 1,
          recurso_tipo: 'mobiliario'
        })),
      // Vajilla
      ...vajilla
        .filter(r => r.nombre && r.nombre.trim() !== '')
        .map(r => ({
          nombre_recurso: r.nombre.trim(),
          cantidad: parseInt(r.cantidad) || 1,
          recurso_tipo: 'vajilla'
        }))
    ];
    const recursosExistentes = recursosSeleccionados
      .filter(id => id != null)
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id));
      const presupuestoData = {
        egresos: egresos
          .filter(item => item.descripcion.trim() !== '')
          .map(item => ({
            descripcion: item.descripcion,
            cantidad: parseFloat(item.cantidad) || 0,
            precio_unitario: parseFloat(item.precio) || 0,
            total: (parseFloat(item.cantidad) || 0) * (parseFloat(item.precio) || 0)
          })),
        ingresos: ingresos
          .filter(item => item.descripcion.trim() !== '')
          .map(item => ({
            descripcion: item.descripcion,
            cantidad: parseFloat(item.cantidad) || 0,
            precio_unitario: parseFloat(item.precio) || 0,
            total: (parseFloat(item.cantidad) || 0) * (parseFloat(item.precio) || 0)
          })),
        total_egresos: totalEgresos,
        total_ingresos: totalIngresos,
        balance: balance
      };
      const todosLosObjetivos = [
  ...objetivoParaEnviar,
  // Añade los objetivos PDI como objetivos de tipo "otro"
  ...objetivosPDI
    .filter(texto => texto.trim() !== '')
    .map(texto => ({
      id: OBJETIVOS_EVENTO_MAP.otro, // Usa el ID para "otro"
      texto_personalizado: texto.trim()
    }))
];
      const eventoPayload = {
         nombreevento: nombreevento.trim(),
      lugarevento: lugarevento.trim() || 'Por definir',
      fechaevento: dayjs(fechaHoraSeleccionada).format('YYYY-MM-DD'),
      horaevento: dayjs(fechaHoraSeleccionada).format('HH:mm:ss'), // ✅ CORRECCIÓN AQUÍ
      argumentacion: argumentacion.trim() || null,
     
      
      resultados_esperados: JSON.stringify(resultadosEsperados),
      tipos_de_evento: tiposParaEnviar,
      objetivos: todosLosObjetivos,
      segmentos_objetivo: segmentosParaEnviar.length > 0 ? segmentosParaEnviar : null,
      recursos_existentes: recursosExistentes.length > 0 ? recursosExistentes : null, // ✅ NUEVO
      recursos_nuevos: nuevosRecursos.length > 0 ? nuevosRecursos : null,
      presupuesto: presupuestoData, // ✅ NUEVO
      idclasificacion: parseInt(clasificacionSeleccionada, 10) || null,
      idsubcategoria: parseInt(subcategoriaSeleccionada, 10) || null,
      comite: comiteSeleccionado.length > 0 ? comiteSeleccionado : null,
      };
       console.log('Payload a enviar:', JSON.stringify(eventoPayload, null, 2));
      const response = await axios.post(`${API_BASE_URL}/eventos`, eventoPayload, {
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      });
 console.log('Respuesta del servidor:', response.data);
  console.log('Respuesta del servidor:', response.data);
      Alert.alert('Éxito', 'El evento ha sido creado correctamente.', [
  {
    text: 'OK',
    onPress: () => router.replace('/')
  }
]);
    } catch (error) {
      let errorMessage = "Ocurrió un error desconocido.";
      if (error.response) {
      // Error del servidor
      errorMessage = error.response.data.message 
        || error.response.data.error 
        || JSON.stringify(error.response.data)
        || `Error del servidor: ${error.response.status}`;
    } else if (error.request) {
      // No hay respuesta del servidor
      errorMessage = "No se pudo conectar con el servidor. Revisa tu conexión.";
    } else {
      // Error en la configuración
      errorMessage = error.message || "Error desconocido";
    }
    Alert.alert('Error al crear el evento', errorMessage);
  } finally {
    setIsLoading(false);
  }
};
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Crear Evento</Text>
        <NotificationBell notificationCount={unreadCount} onPress={() => setShowNotificationsModal(true)} />
      </View>
      <View style={styles.mainContainer}>
        {width > 768 && (
          <View style={styles.calendarColumn}>
            <View style={styles.calendarSection}>
              <GoogleStyleCalendarView
                fechaHoraSeleccionada={fechaHoraSeleccionada}
                setFechaHoraSeleccionada={setFechaHoraSeleccionada}
                eventos={eventos}
                title="Fecha de Realización"
              />
              <EventosDelDiaMejorado
                eventosDelDia={eventosDelDia}
                fechaHoraSeleccionada={fechaHoraSeleccionada}
                verificarConflictoHorario={verificarConflictoHorario}
              />
            </View>
          </View>
        )}
        <ScrollView
          ref={scrollViewRef}
          style={styles.formColumn}
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>I. DATOS GENERALES</Text>
            <Text style={styles.label}>Nombre del Evento</Text>
            <View style={[styles.inputGroup, errors.nombreevento && styles.inputError]}>
              <Ionicons name="text-outline" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={nombreevento}
                onChangeText={(text) => handleInputChange('nombreevento', text)}
                placeholder="Nombre del evento"
              />
            </View>
            {errors.nombreevento && <Text style={styles.errorText}>{errors.nombreevento}</Text>}
            <Text style={styles.label}>Clasificación Estratégica</Text>
            <TouchableOpacity
              style={[styles.inputGroup, errors.clasificacionSeleccionada && styles.inputError]}
              onPress={() => setShowClasificacionModal(true)}
            >
              <Ionicons name="options-outline" size={20} style={styles.inputIcon} />
              <Text style={styles.input}>
                {clasificacionSeleccionada
                  ? CLASIFICACION_ESTRATEGICA[clasificacionSeleccionada]?.label || 'Selecciona una categoría'
                  : 'Selecciona una categoría'}
              </Text>
            </TouchableOpacity>
            {errors.clasificacionSeleccionada && <Text style={styles.errorText}>{errors.clasificacionSeleccionada}</Text>}
            {clasificacionSeleccionada && CLASIFICACION_ESTRATEGICA[clasificacionSeleccionada]?.subcategorias && (
              <>
                <Text style={styles.label}>Subcategoría</Text>
                <TouchableOpacity
                  style={[styles.inputGroup, errors.subcategoriaSeleccionada && styles.inputError]}
                  onPress={() => setShowSubcategoriaModal(true)}
                >
                  <Ionicons name="list-outline" size={20} style={styles.inputIcon} />
                  <Text style={styles.input}>
                    {subcategoriaSeleccionada
                      ? CLASIFICACION_ESTRATEGICA[clasificacionSeleccionada].subcategorias.find(s => s.id === subcategoriaSeleccionada)?.label || 'Selecciona una subcategoría'
                      : 'Selecciona una subcategoría'}
                  </Text>
                </TouchableOpacity>
                {errors.subcategoriaSeleccionada && <Text style={styles.errorText}>{errors.subcategoriaSeleccionada}</Text>}
              </>
            )}
    <Text style={styles.label}>Lugar del Evento</Text>
<TouchableOpacity
  style={[styles.inputGroup, errors.lugarevento && styles.inputError]}
  onPress={() => {
    setCampusSeleccionado(null);
    setShowLugarModal(true);
  }}
>
  <Ionicons name="location-outline" size={20} style={styles.inputIcon} />
  <Text style={styles.input}>
    {lugarevento
      ? lugarevento
      : 'Selecciona un lugar para el evento'}
  </Text>
</TouchableOpacity>
{errors.lugarevento && <Text style={styles.errorText}>{errors.lugarevento}</Text>}
            {width <= 768 && (
              <>
                <Text style={styles.label}>Fecha de Realización</Text>
                <GoogleStyleCalendarView
                  fechaHoraSeleccionada={fechaHoraSeleccionada}
                  setFechaHoraSeleccionada={setFechaHoraSeleccionada}
                  eventos={eventos}
                  title="Fecha de Realización"
                />
                <EventosDelDiaMejorado
                  eventosDelDia={eventosDelDia}
                  fechaHoraSeleccionada={fechaHoraSeleccionada}
                  verificarConflictoHorario={verificarConflictoHorario}
                />
              </>
            )}
            <Text style={styles.label}>Tipo de Evento (puede seleccionar más de un tipo)</Text>
            {TIPOS_DE_EVENTO.map((item) => (
              <TouchableOpacity key={item.id} style={styles.checkboxRow} onPress={() => handleTipoEventoChange(item.id)}>
                <Ionicons name={tiposSeleccionados[item.id] ? "checkbox" : "square-outline"} size={24} color={tiposSeleccionados[item.id] ? "#e95a0c" : "#888"} />
                <Text style={styles.checkboxLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
            {errors.tipos && <Text style={styles.errorText}>{errors.tipos}</Text>}
            {tiposSeleccionados['5'] && (
              <View style={styles.otroInputContainer}>
                <TextInput style={styles.input} value={textoOtroTipo} onChangeText={setTextoOtroTipo} placeholder="¿Cuál?" />
              </View>
            )}
            <TouchableOpacity style={styles.gotoButton} onPress={scrollToObjetivos}>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              <Text style={styles.gotoButtonText}>Ir a Objetivos</Text>
            </TouchableOpacity>
          </View>
          {seccionObjetivosVisible && (
            <>
          <View
            style={[styles.formSection, isScrollingToObjetivos && styles.formSectionHighlighted]}
            ref={objetivosSectionRef}
            onLayout={(event) => {
              const { y } = event.nativeEvent.layout;
              setObjetivosSectionY(y);
            }}
          >
            <Text style={styles.sectionTitle}>II. OBJETIVOS</Text>
          <Text style={styles.label}>Objetivos de Evento (puede seleccionar más de un objetivo):</Text>
<View style={styles.checkboxContainer}>
  <View style={styles.checkboxColumn}>
    {[
      { key: 'modeloPedagogico', label: 'Modelo Pedagógico' },
      { key: 'posicionamiento', label: 'Posicionamiento' },
      { key: 'internacionalizacion', label: 'Internacionalización' }
    ].map((item) => (
      <TouchableOpacity key={item.key} style={styles.checkboxRow} onPress={() => handleCheckboxChange(setObjetivos, item.key)}>
        <Ionicons name={objetivos[item.key] ? "checkbox" : "square-outline"} size={24} color={objetivos[item.key] ? "#e95a0c" : "#888"} />
        <Text style={styles.checkboxLabel}>{item.label}</Text>
      </TouchableOpacity>
    ))}
  </View>
  <View style={styles.checkboxColumn}>
    {[
      { key: 'rsu', label: 'RSU' },
      { key: 'fidelizacion', label: 'Fidelización' },
      { key: 'otro', label: 'Otro' }
    ].map((item) => (
      <TouchableOpacity key={item.key} style={styles.checkboxRow} onPress={() => handleCheckboxChange(setObjetivos, item.key)}>
        <Ionicons name={objetivos[item.key] ? "checkbox" : "square-outline"} size={24} color={objetivos[item.key] ? "#e95a0c" : "#888"} />
        <Text style={styles.checkboxLabel}>{item.label}</Text>
      </TouchableOpacity>
    ))}
  </View>
</View>
{errors.objetivos && <Text style={styles.errorText}>{errors.objetivos}</Text>}
{objetivos.otro && (
  <View style={styles.otroInputContainer}>
    <TextInput
      style={styles.input}
      value={objetivos.otroTexto}
      onChangeText={(text) => handleOtroTextChange(setObjetivos, text)}
      placeholder="¿Cuál?"
    />
    {objetivos.otroTexto.trim() && <Text style={styles.selectedText}>Selección: {objetivos.otroTexto}</Text>}
  </View>
)}
   <Text style={styles.label}>Objetivo(s) del PDI Asociado(s):</Text>
<View style={styles.objetivosPDIGrid}>
  {objetivosPDI.map((objetivo, index) => (
    <View key={index} style={[styles.objetivoPDIRow, styles.objetivoPDIColumn]}>
      <Text style={styles.objetivoPDINumber}>{index + 1}.</Text>
      <TextInput
        style={styles.objetivoPDIInput}
        value={objetivo}
        onChangeText={(text) => handleObjetivoPDIChange(index, text)}
        placeholder={`Objetivo ${index + 1}`}
        multiline
      />
    </View>
  ))}
</View>
           <Text style={styles.label}>Definición del Segmento Objetivo (puede seleccionar más de un público):</Text>
<View style={styles.checkboxContainer}>
  <View style={styles.checkboxColumn}>
    {[
      { key: 'estudiantes', label: 'Estudiantes' },
      { key: 'docentes', label: 'Docentes' }
    ].map((item) => {
      const stateKey = item.key;
      return (
        <TouchableOpacity key={stateKey} style={styles.checkboxRow} onPress={() => handleCheckboxChange(setSegmentoObjetivo, stateKey)}>
          <Ionicons name={segmentoObjetivo[stateKey] ? "checkbox" : "square-outline"} size={24} color={segmentoObjetivo[stateKey] ? "#e95a0c" : "#888"} />
          <Text style={styles.checkboxLabel}>{item.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
  <View style={styles.checkboxColumn}>
    {[
      { key: 'publicoExterno', label: 'Público Externo' },
      { key: 'influencers', label: 'Influencers' },
      { key: 'otro', label: 'Otro' }
    ].map((item) => {
      const stateKey = item.key;
      return (
        <TouchableOpacity key={stateKey} style={styles.checkboxRow} onPress={() => handleCheckboxChange(setSegmentoObjetivo, stateKey)}>
          <Ionicons name={segmentoObjetivo[stateKey] ? "checkbox" : "square-outline"} size={24} color={segmentoObjetivo[stateKey] ? "#e95a0c" : "#888"} />
          <Text style={styles.checkboxLabel}>{item.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
</View>
            {segmentoObjetivo.otro && (
              <View style={styles.otroInputContainer}>
                <TextInput
                  style={styles.input}
                  value={segmentoObjetivo.otroTexto}
                  onChangeText={(text) => handleOtroTextChange(setSegmentoObjetivo, text)}
                  placeholder="¿Cuál?"
                />
                {segmentoObjetivo.otroTexto.trim() && <Text style={styles.selectedText}>Selección: {segmentoObjetivo.otroTexto}</Text>}
              </View>
            )}
            <Text style={styles.label}>Argumentación:</Text>
            <View style={[styles.inputGroup, { alignItems: 'flex-start' }, errors.argumentacion && styles.inputError]}>
              <Ionicons name="text-outline" size={20} style={[styles.inputIcon, { paddingTop: 14 }]} />
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                placeholder="Breve descripción sustentada de la congruencia del evento con los objetivos especificados"
                value={argumentacion}
                onChangeText={setArgumentacion}
              />
            </View>
            {errors.argumentacion && <Text style={styles.errorText}>{errors.argumentacion}</Text>}
            <TouchableOpacity style={styles.gotoButton} onPress={scrollToResultados}>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              <Text style={styles.gotoButtonText}>Ir a Resultados Esperados y Comite</Text>
            </TouchableOpacity>
          </View>
           </>
          )}
            {seccionResultadosVisible && (
              <>
          <View 
          style={[styles.formSection, isScrollingToResultados && styles.formSectionHighlighted]}
            ref={resultadosSectionRef}
            >
            <Text style={styles.sectionTitle}>III. RESULTADOS ESPERADOS</Text>
            <View style={styles.resultadoRow}>
              <Text style={styles.resultadoLabel}>Participación Efectiva</Text>
              <TextInput
                style={styles.resultadoInput}
                placeholder="Ej: 150"
                value={resultadosEsperados.participacion}
                onChangeText={(text) => handleResultadoChange('participacion', text)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.resultadoRow}>
              <Text style={styles.resultadoLabel}>Índice de Satisfacción</Text>
              <TextInput
                style={styles.resultadoInput}
                placeholder="Ej: 90% de satisfacción"
                value={resultadosEsperados.satisfaccion}
                onChangeText={(text) => handleResultadoChange('satisfaccion', text)}
              />
            </View>
            <View style={styles.resultadoRow}>
              <Text style={styles.resultadoLabel}>Otro</Text>
              <TextInput
                style={styles.resultadoInput}
                placeholder="Otro resultado medible"
                value={resultadosEsperados.otro}
                onChangeText={(text) => handleResultadoChange('otro', text)}
              />
            </View>
          </View>
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>IV. COMITÉ DEL EVENTO</Text>
           <Text style={styles.comiteDescription}>Selecciona a los miembros del comité del evento:</Text>
{usuariosComite.length > 0 ? (
  <View style={styles.comiteList}>
    {usuariosComite.map(usuario => (
  <TouchableOpacity
    key={usuario.id}
    style={styles.checkboxRow}
    onPress={() => {
      if (comiteSeleccionado.includes(usuario.id)) {
        setComiteSeleccionado(prev => prev.filter(id => id !== usuario.id));
      } else {
        setComiteSeleccionado(prev => [...prev, usuario.id]);
      }
    }}
  >
    <Ionicons
      name={comiteSeleccionado.includes(usuario.id) ? "checkbox" : "square-outline"}
      size={24}
      color={comiteSeleccionado.includes(usuario.id) ? "#e95a0c" : "#888"}
    />
    <View style={styles.comiteUserText}>
      <Text style={styles.checkboxLabel}>{usuario.nombreCompleto}</Text>
   <Text style={[styles.comiteUserRole, { fontSize: 12, color: '#666', fontStyle: 'italic' }]}>
        {usuario.role === 'academico'
          ? `Académico - ${usuario.facultad || 'Sin facultad'}${usuario.carrera ? ` (${usuario.carrera})` : ''}  `
          : usuario.role.charAt(0).toUpperCase() + usuario.role.slice(1)}
      </Text>
          </View>
        </TouchableOpacity>
      ))}
  </View>
) : (
  <Text style={styles.comitePlaceholder}>Cargando usuarios...</Text>
)}
            <TouchableOpacity style={styles.gotoButton} onPress={scrollToRecursos}>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              <Text style={styles.gotoButtonText}>Ir a Recursos Necesarios</Text>
            </TouchableOpacity>
          </View>
          </>
            )}
          {seccionRecursosVisible && (
  <>
    <View
      style={[styles.formSection, isScrollingToRecursos && styles.formSectionHighlighted]}
      ref={recursosSectionRef}
    >
      <Text style={styles.sectionTitle}>V. RECURSOS NECESARIOS</Text>
      
      {/* === Recursos Disponibles de la Base de Datos === */}
      <View style={styles.subsection}>
        <Text style={styles.subsectionTitle}>Recursos Disponibles</Text>
        <Text style={styles.subsectionDescription}>
          Selecciona los recursos existentes que necesitarás para tu evento:
        </Text>
        
        {recursosDisponibles.length > 0 ? (
          <View style={styles.recursosDisponiblesGrid}>
            {recursosDisponibles.map((recurso) => {
              // ✅ Usa SIEMPRE idrecurso para consistencia
              const isSelected = recursosSeleccionados.includes(recurso.idrecurso);
              return (
                <TouchableOpacity
                  key={String(recurso.idrecurso)} // ✅ Convierte a string para evitar problemas de tipo
                  style={[
                    styles.recursoDisponibleCard,
                    isSelected && styles.recursoDisponibleCardSelected
                  ]}
                  onPress={() => handleRecursoChange(recurso.idrecurso)}
                >
                  <View style={styles.recursoCheckboxContainer}>
                    <Ionicons
                      name={isSelected ? "checkbox" : "square-outline"}
                      size={24}
                      color={isSelected ? "#e95a0c" : "#888"}
                    />
                  </View>
                  <View style={styles.recursoInfo}>
                    <Text style={styles.recursoNombre}>{recurso.nombre_recurso}</Text>
                    <Text style={styles.recursoTipo}>
                      {recurso.recurso_tipo === 'tecnologico' ? 'Tecnológico' : 
                       recurso.recurso_tipo === 'mobiliario' ? 'Mobiliario' : 'Vajilla'}
                    </Text>
                    <Text style={styles.recursoCantidad}>
                      Disponibles: {recurso.cantidad || 'N/A'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={styles.noRecursosText}>
            📦 No hay recursos disponibles en este momento. Puedes agregar recursos nuevos manualmente más abajo.
          </Text>
        )}
      </View>
      
      {/* ... resto de las secciones (Recursos Tecnológicos, Mobiliario, Vajilla) ... */}
      
      <TouchableOpacity style={styles.gotoButton} onPress={scrollToPresupuesto}>
        <Ionicons name="arrow-forward" size={20} color="#ffffff" />
        <Text style={styles.gotoButtonText}>Ir a Presupuesto</Text>
      </TouchableOpacity>
    </View>
  </>
)} 
            {seccionPresupuestoVisible && (
              <>
              <View 
              style={[styles.formSection, isScrollingToPresupuesto && styles.formSectionHighlighted]}
              ref={presupuestoSectionRef}
            >
            <Text style={styles.sectionTitle}>VI. PRESUPUESTO</Text>
            <TablaPresupuesto
              titulo="EGRESOS"
              items={egresos}
              setItems={setEgresos}
              totalGeneral={totalEgresos}
              handlePresupuestoChange={handlePresupuestoChange}
              eliminarFilaPresupuesto={eliminarFilaPresupuesto}
              agregarFilaPresupuesto={agregarFilaPresupuesto}
            />
            <TablaPresupuesto
              titulo="INGRESOS"
              items={ingresos}
              setItems={setIngresos}
              totalGeneral={totalIngresos}
              handlePresupuestoChange={handlePresupuestoChange}
              eliminarFilaPresupuesto={eliminarFilaPresupuesto}
              agregarFilaPresupuesto={agregarFilaPresupuesto}
            />
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceText}>BALANCE ECONÓMICO</Text>
              <Text style={[styles.balanceAmount, { color: balance >= 0 ? '#27ae60' : '#c0392b' }]}>
                {formatCurrency(balance)}
              </Text>
            </View>
          </View>
          </>
        )}
          {/* Modales */}
          <Modal visible={showClasificacionModal} transparent animationType="fade" onRequestClose={() => setShowClasificacionModal(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Selecciona Clasificación</Text>
                <ScrollView>
                  {Object.entries(CLASIFICACION_ESTRATEGICA).map(([id, data]) => (
                    <TouchableOpacity
                      key={id}
                      style={styles.modalOption}
                      onPress={() => {
                        setClasificacionSeleccionada(id);
                        setSubcategoriaSeleccionada('');
                        setShowClasificacionModal(false);
                      }}
                    >
                      <Text style={styles.modalOptionText}>{data.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setShowClasificacionModal(false)}>
                  <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <Modal visible={showSubcategoriaModal} transparent animationType="fade" onRequestClose={() => setShowSubcategoriaModal(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Selecciona Subcategoría</Text>
                <ScrollView>
                  {CLASIFICACION_ESTRATEGICA[clasificacionSeleccionada]?.subcategorias.map((sub) => (
                    <TouchableOpacity
                      key={sub.id}
                      style={styles.modalOption}
                      onPress={() => {
                        setSubcategoriaSeleccionada(sub.id);
                        setShowSubcategoriaModal(false);
                      }}
                    >
                      <Text style={styles.modalOptionText}>{sub.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setShowSubcategoriaModal(false)}>
                  <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <Modal
  visible={showLugarModal}
  transparent
  animationType="fade"
  onRequestClose={() => setShowLugarModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>
        {campusSeleccionado ? `Selecciona un área en ${LUGARES_CON_AREAS[campusSeleccionado].label}` : 'Selecciona un campus'}
      </Text>
      <ScrollView>
        {campusSeleccionado ? (
          // Mostrar áreas del campus seleccionado
          LUGARES_CON_AREAS[campusSeleccionado].areas.map((area) => (
            <TouchableOpacity
              key={area.id}
              style={styles.modalOption}
              onPress={() => {
                setLugarevento(area.nombre);
                setShowLugarModal(false);
                setCampusSeleccionado(null);
              }}
            >
              <Text style={styles.modalOptionText}>{area.nombre}</Text>
            </TouchableOpacity>
          ))
        ) : (
          // Mostrar lista de campus
          Object.entries(LUGARES_CON_AREAS).map(([key, data]) => (
            <TouchableOpacity
              key={key}
              style={styles.modalOption}
              onPress={() => setCampusSeleccionado(key)}
            >
              <Text style={styles.modalOptionText}>{data.label}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      {/* Botón "Volver" si ya se eligió campus */}
      {campusSeleccionado && (
        <TouchableOpacity
          style={[styles.modalButtonSecondary, { marginTop: 10 }]}
          onPress={() => setCampusSeleccionado(null)}
        >
          <Text style={styles.modalButtonSecondaryText}>← Volver a campus</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.modalButtonSecondary}
        onPress={() => setShowLugarModal(false)}
      >
        <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
        </ScrollView>
      </View>
      <View style={styles.fixedBottomContainer}>
        <TouchableOpacity 
          onPress={confirmSubmit} 
          disabled={isLoading} 
          style={[styles.floatingActionButton, isLoading && styles.buttonDisabled]}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Crear</Text>
          )}
        </TouchableOpacity>
      </View>
      <ConfirmModal
        showConfirmModal={showConfirmModal}
        setShowConfirmModal={setShowConfirmModal}
        handleSubmitConfirmed={handleSubmitConfirmed}
        isLoading={isLoading}
        formData={{ nombreevento, lugarevento, nombreResponsable, fechaHoraSeleccionada }}
      />
      <NotificationsModal
        visible={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        notifications={notifications}
        markAsRead={markNotificationAsRead}
      />
      <ConflictModal
        showConflictModal={showConflictModal}
        setShowConflictModal={setShowConflictModal}
        conflictoDetectado={conflictoDetectado}
        setConflictoDetectado={setConflictoDetectado}
      />
    </KeyboardAvoidingView>
);
};
const styles = StyleSheet.create({
  gotoButton: {
    backgroundColor: '#e95a0c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  gotoButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // ... resto de estilos originales
  confirmModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  mainContainer: {
    flex: 1,
    flexDirection: width > 768 ? 'row' : 'column',
    paddingHorizontal: 20,
  },
  calendarColumn: {
    marginTop: 10,
    width: width > 768 ? '30%' : '100%',
    marginRight: width > 768 ? 20 : 0,
    marginBottom: width <= 768 ? 20 : 0,
  },
  formColumn: {
    marginTop: 10,
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrollContentContainer: {
    paddingBottom: 60,
  },
  calendarSection: {
    marginBottom: 20,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
    lineHeight: 18,
  },
  checkboxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  formSectionHighlighted: {
  backgroundColor: '#fff5f0', // Fondo naranja muy claro
  borderColor: '#e95a0c', // Borde naranja
  borderWidth: 2,
  shadowColor: '#e95a0c',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 4,
},
  checkboxColumn: {
    flex: 1,
    marginRight: 10,
  },
  // === Estilos para recursos disponibles ===
recursosDisponiblesGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 10,
  marginBottom: 15,
},
recursoDisponibleCard: {
  backgroundColor: '#f8f9fa',
  borderRadius: 8,
  padding: 12,
  borderWidth: 1,
  borderColor: '#e0e0e0',
  width: '48%',
  marginBottom: 10,
  flexDirection: 'row',
  alignItems: 'center',
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
},
recursoDisponibleCardSelected: {
  backgroundColor: '#fff5f0',
  borderColor: '#e95a0c',
  borderWidth: 2,
},
recursoCheckboxContainer: {
  marginRight: 10,
},
recursoInfo: {
  flex: 1,
},
recursoNombre: {
  fontSize: 14,
  fontWeight: '600',
  color: '#333',
  marginBottom: 4,
},
recursoTipo: {
  fontSize: 12,
  color: '#666',
  fontStyle: 'italic',
  marginBottom: 2,
},
recursoCantidad: {
  fontSize: 12,
  color: '#27ae60',
  fontWeight: '500',
},
noRecursosText: {
  fontStyle: 'italic',
  color: '#999',
  textAlign: 'center',
  marginTop: 10,
  fontSize: 14,
  paddingVertical: 15,
},
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationBell: {
    position: 'relative',
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  calendarTitleContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e95a0c',
    textAlign: 'left'
  },
  notificationsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationsModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  comiteList: {
  marginTop: 10,
},
comiteUserText: {
  marginLeft: 10,
},
comiteUserRole: {
  fontSize: 14,
  color: '#333',
  fontWeight:'600',
  marginBottom:2,
  fontStyle: 'italic',
},
comitePlaceholder: {
  fontStyle: 'italic',
  color: '#999',
  textAlign: 'center',
  marginTop: 10,
},
  notificationsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  notificationsModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationsList: {
    flex: 1,
  },
  noNotificationsText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 50,
    fontSize: 16,
    fontStyle: 'italic',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 5,
    backgroundColor: '#ffffff',
  },
  notificationItemUnread: {
    backgroundColor: '#f8f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#e95a0c',
    shadowColor: '#e95a0c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  // ... dentro de StyleSheet.create({
objetivoPDIRow: {
  flexDirection: 'row',
  alignItems: 'flex-start', // Alinea el número y el input desde la parte superior
  marginBottom: 10,
},
objetivoPDINumber: {
  fontSize: 16,
  color: '#333',
  marginRight: 10,
  marginTop: 12,
  fontWeight: '500'
},
objetivoPDIInput: {
  flex: 1,
  backgroundColor: '#F4F7F9',
  borderWidth: 1,
  borderColor: '#E0E0E0',
  borderRadius: 8,
  paddingVertical: 12,
  paddingHorizontal: 16,
  fontSize: 16,
  color: '#333',
  textAlignVertical: 'top',
  minHeight: 50,
  maxHeight: 100, 
},
  notificationIconContainer: {
    position: 'relative',
    marginRight: 15,
    paddingTop: 2,
  },
  notificationIcon: {
    marginRight: 0,
  },
  recursosDisponiblesGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 10,
},
recursoDisponibleCard: {
  backgroundColor: '#f8f9fa',
  borderRadius: 8,
  padding: 12,
  borderWidth: 1,
  borderColor: '#e0e0e0',
  width: '48%',
  marginBottom: 10,
  flexDirection: 'row',
  alignItems: 'center',
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
},
recursoDisponibleCardSelected: {
  backgroundColor: '#fff5f0',
  borderColor: '#e95a0c',
  borderWidth: 2,
},
recursoCheckboxContainer: {
  marginRight: 10,
},
recursoInfo: {
  flex: 1,
},
recursoNombre: {
  fontSize: 14,
  fontWeight: '600',
  color: '#333',
  marginBottom: 4,
},
recursoTipo: {
  fontSize: 12,
  color: '#666',
  fontStyle: 'italic',
  marginBottom: 2,
},
recursoCantidad: {
  fontSize: 12,
  color: '#27ae60',
  fontWeight: '500',
},
noRecursosText: {
  fontStyle: 'italic',
  color: '#999',
  textAlign: 'center',
  marginTop: 10,
  fontSize: 14,
  paddingVertical: 15,
},
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  notificationContentContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    lineHeight: 20,
  },
  notificationTextUnread: {
    fontWeight: '600',
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  eventDataContainer: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 6,
    marginTop: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#e95a0c',
  },
  eventDataText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 2,
    lineHeight: 16,
  },
  confirmModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  objetivosPDIGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
},
objetivoPDIColumn: {
  width: '48%', // Aproximadamente la mitad del ancho, con un pequeño margen entre columnas
  marginBottom: 10,
},
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginLeft: 12,
  },
  confirmModalMessage: {
    fontSize: 16,
    color: '#4a5568',
    marginBottom: 20,
    lineHeight: 22,
    textAlign: 'center',
  },
  confirmModalDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  confirmModalDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 12,
  },
  confirmModalDetail: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 8,
    lineHeight: 20,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#2d3748',
  },
  confirmModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmModalButtonCancel: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  confirmModalButtonConfirm: {
    backgroundColor: '#e95a0c',
  },
  confirmModalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
  },
  confirmModalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: '#F4F7F9'
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    paddingHorizontal: isMobile ? 15 : 20,
    paddingTop: isMobile ? 15 : 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e95a0c',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    marginHorizontal: -20,
    marginTop: -12,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    fontWeight: '500'
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 18
  },
  inputError: {
    borderColor: 'red'
  },
  errorText: {
    color: 'red',
    marginLeft: 10,
    marginBottom: 10,
    fontSize: 12
  },
  inputIcon: {
    paddingHorizontal: 12,
    color: '#888'
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    paddingRight: 15,
    fontSize: 16,
    color: '#333'
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 15
  },
  datePickerText: {
    fontSize: 16,
    color: '#333'
  },
  otroInputContainer: {
    marginLeft: 36,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F8F9FA'
  },
  objetivoPDIRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  objetivoPDINumber: {
    fontSize: 16,
    color: '#333',
    marginRight: 10,
    marginTop: 12,
    fontWeight: '500'
  },
  objetivoPDIInput: {
    flex: 1,
    backgroundColor: '#F4F7F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 50
  },
  resultadoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  resultadoLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1
  },
  resultadoInput: {
    flex: 2,
    backgroundColor: '#F4F7F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333'
  },
  comiteDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'justify'
  },
  tablaContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 25,
    padding: 5
  },
  tablaTitulo: {
    textAlign: 'center',
    fontWeight: 'bold',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7
  },
  tablaHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 5,
    paddingVertical: 8
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 12
  },
  tablaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 2
  },
  rowText: {
    paddingHorizontal: 5,
    fontSize: 12
  },
  rowInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 4,
    margin: 2,
    fontSize: 12,
    backgroundColor: '#fff'
  },
  deleteButtonSmall: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addButtonSmall: {
    padding: 8
  },
  addButtonTextSmall: {
    color: '#007BFF',
    textAlign: 'center'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7
  },
  totalText: {
    fontWeight: 'bold',
    marginRight: 20
  },
  totalAmount: {
    fontWeight: 'bold'
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 8,
    marginTop: 10
  },
  balanceText: {
    fontWeight: 'bold',
    fontSize: 16
  },
  balanceAmount: {
    fontWeight: 'bold',
    fontSize: 16
  },
  submitButton: {
    backgroundColor: '#e95a0c',
    paddingVertical:16,
    paddingHorizontal: 25,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor:"#000",
      shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity:0.3,
    elevation: 8,
    marginTop: 20
  },
    floatingActionButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#e95a0c',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#f9bda3'
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  subsection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subsectionDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 15,
    lineHeight: 18,
  },
  resourceInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 10,
    paddingRight: 10,
  },
  resourceInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    paddingRight: 15,
    fontSize: 16,
    color: '#333'
  },
  removeButton: {
    padding: 5
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10
  },
  addButtonText: {
    color: '#007bff',
    fontSize: 16,
    marginLeft: 5
  },
  googleCalendarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden'
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 1
  },
  weekDaysHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  weekDayCell: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center'
  },
  weekDayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666'
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#ffffff'
  },
  dayCell: {
    width: '14.28%',
    minHeight: 80,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#e8e8e8',
    paddingTop: 8,
    paddingHorizontal: 4
  },
  dayCellInactive: {
    backgroundColor: '#f8f9fa'
  },
  dayCellSelected: {
    backgroundColor: '#fff5f0',
    borderColor: '#e95a0c',
    borderWidth: 2,
    borderRadius: 6,
    margin: -1
  },
  dayCellToday: {
    backgroundColor: '#e8f4fd'
  },
  dayCellContent: {
    flex: 1,
    alignItems: 'center'
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4
  },
  dayNumberInactive: {
    color: '#999'
  },
  dayNumberSelected: {
    color: '#e95a0c',
    fontWeight: 'bold',
    fontSize: 18
  },
  dayNumberToday: {
    backgroundColor: '#2196f3',
    color: 'white',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden'
  },
  eventIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 2
  },
  eventCount: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500'
  },
  eventPreview: {
    marginTop: 4,
    width: '100%'
  },
  eventPreviewText: {
    fontSize: 8,
    color: '#333',
    marginBottom: 1,
    textAlign: 'center'
  },
  eventPreviewMore: {
    fontSize: 8,
    color: '#e95a0c',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  eventosDelDiaContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden'
  },
  eventosDelDiaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  eventosDelDiaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1
  },
  eventCountBadge: {
    backgroundColor: '#e95a0c',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  eventCountText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  eventsList: {
    maxHeight: 200,
    paddingHorizontal: 16,
  },
  eventoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventoCardConflict: {
    borderColor: '#ff6b6b',
    backgroundColor: '#fff5f5',
  },
  eventoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventoTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventoTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e95a0c',
    marginLeft: 4,
  },
  eventoTimeConflict: {
    color: '#ff6b6b',
  },
  conflictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  conflictBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    marginLeft: 4,
    fontWeight: '600',
  },
  eventoNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  eventoDetails: {
    marginLeft: 4,
  },
  eventoDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventoDetailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  eventosDelDiaFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  eventosDelDiaNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  conflictEventCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  conflictEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  conflictEventDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  conflictEventResponsible: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  modalWarning: {
    fontSize: 12,
    color: '#ff6b6b',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButtonSecondary: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  modalButtonPrimary: {
    backgroundColor: '#e95a0c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  selectedText: {
    fontSize: 14,
    color: '#e95a0c',
    marginTop: 5,
    marginLeft: 10,
  },
});
export default ProyectoEvento;