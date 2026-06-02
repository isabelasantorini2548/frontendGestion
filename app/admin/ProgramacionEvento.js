import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Platform, ActivityIndicator, Alert, KeyboardAvoidingView, Image
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import dayjs from 'dayjs';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://unibackend1-production.up.railway.app';
const TOKEN_KEY = 'adminAuthToken';

const COLORS = {
  primary: '#E95A0C',
  primaryLight: '#FFF3EC',
  primaryMid: '#FDE8D8',
  surface: '#FFFFFF',
  background: '#F6F7FA',
  border: '#E8EAF0',
  borderFocus: '#E95A0C',
  text: '#1A1D23',
  textSecondary: '#64748B',
  textMuted: '#9CA3AF',
  success: '#10B981',
  successLight: '#ECFDF5',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  shadow: 'rgba(0,0,0,0.06)',
};

const getTokenAsync = async () => {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
  } else {
    try { return await SecureStore.getItemAsync(TOKEN_KEY); } catch (e) { return null; }
  }
};

LocaleConfig.locales['es'] = {
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthNamesShort: ['Ene.','Feb.','Mar.','Abr.','May.','Jun.','Jul.','Ago.','Sep.','Oct.','Nov.','Dic.'],
  dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  dayNamesShort: ['Dom.','Lun.','Mar.','Mié.','Jue.','Vie.','Sáb.'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

const parseDateSafe = (date) => {
  if (!date) return new Date().toISOString().split('T')[0];
  if (date instanceof Date) {
    if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
    return date.toISOString().split('T')[0];
  }
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return new Date().toISOString().split('T')[0];
  return parsed.toISOString().split('T')[0];
};

const formatActivityForSubmit = (actividad) => ({
  nombreActividad: actividad.nombreActividad?.trim() || '',
  responsable: actividad.responsable?.trim() || '',
  fechaInicio: parseDateSafe(actividad.fechaInicio),
  fechaFin: parseDateSafe(actividad.fechaFin),
});

const formatAmbienteForSubmit = (ambiente) => ({
  nombre: ambiente.nombre?.trim() || '',
  requisito: ambiente.requisito?.trim() || '',
  observaciones: ambiente.observaciones?.trim() || '',
});

const formatServicioForSubmit = (servicio) => ({
  nombreServicio: servicio.nombreServicio?.trim() || '',
  caracteristica: servicio.caracteristica?.trim() || '',
  fechaInicio: parseDateSafe(servicio.fechaInicio),
  observaciones: servicio.observaciones?.trim() || '',
});

// ─── Sección de Actividades ───────────────────────────────────────────────────
const SeccionActividades = ({ titulo, actividades, setActividades, handleActividadDateChange, errors, fechaevento }) => {
  const fechaBase = fechaevento instanceof Date && !isNaN(fechaevento) ? fechaevento : new Date();

  const agregarActividad = () => {
    setActividades(prev => [...prev, {
      key: `act-${titulo.replace(/\s/g, '')}-${Date.now()}`,
      nombreActividad: '',
      responsable: '',
      fechaInicio: new Date(fechaBase),
      fechaFin: new Date(fechaBase),
      showDatePickerInicio: false,
      showDatePickerFin: false,
    }]);
  };

  const eliminarActividad = (index) => {
    setActividades(prev => prev.filter((_, i) => i !== index));
  };

  // Icon mapping for section titles
  const getIcon = () => {
    if (titulo.includes('Previas')) return 'time-outline';
    if (titulo.includes('Durante')) return 'play-circle-outline';
    return 'checkmark-done-outline';
  };

  const getAccentColor = () => {
    if (titulo.includes('Previas')) return '#3B82F6';
    if (titulo.includes('Durante')) return COLORS.primary;
    return COLORS.success;
  };

  const accent = getAccentColor();

  return (
    <View style={styles.card}>
      {/* Section Header */}
      <View style={[styles.sectionHeader, { borderLeftColor: accent }]}>
        <View style={[styles.sectionIconWrap, { backgroundColor: accent + '15' }]}>
          <Ionicons name={getIcon()} size={18} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{titulo}</Text>
          <Text style={styles.sectionSubtitle}>{actividades.length} actividad{actividades.length !== 1 ? 'es' : ''} registrada{actividades.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {actividades.map((actividad, index) => (
        <View key={actividad.key} style={styles.subCard}>
          {/* Sub-card header */}
          <View style={styles.subCardHeader}>
            <View style={styles.actIndexBadge}>
              <Text style={styles.actIndexText}>{index + 1}</Text>
            </View>
            <Text style={styles.subCardTitle}>Actividad #{index + 1}</Text>
            <TouchableOpacity onPress={() => eliminarActividad(index)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
            </TouchableOpacity>
          </View>

          <FormField
            label="Nombre de la Actividad"
            icon="archive-outline"
            value={actividad.nombreActividad}
            onChangeText={(text) => {
              setActividades(prev => {
                const s = [...prev];
                s[index] = { ...s[index], nombreActividad: text };
                return s;
              });
            }}
            placeholder="Ej: Preparación del espacio"
            error={errors[`${titulo}_${index}_nombre`]}
          />

          <FormField
            label="Responsable"
            icon="person-outline"
            value={actividad.responsable}
            onChangeText={(text) => {
              setActividades(prev => {
                const s = [...prev];
                s[index] = { ...s[index], responsable: text };
                return s;
              });
            }}
            placeholder="Nombre del responsable"
            error={errors[`${titulo}_${index}_responsable`]}
          />

          <View style={styles.dateRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.fieldLabel}>Fecha Inicio</Text>
              <TouchableOpacity
                onPress={() => setActividades(prev => {
                  const s = [...prev];
                  s[index] = { ...s[index], showDatePickerInicio: true };
                  return s;
                })}
                style={styles.datePill}
              >
                <Ionicons name="calendar-outline" size={15} color={COLORS.primary} />
                <Text style={styles.datePillText}>{actividad.fechaInicio.toLocaleDateString('es-ES')}</Text>
              </TouchableOpacity>
              {actividad.showDatePickerInicio && (
                <DateTimePicker
                  value={actividad.fechaInicio}
                  mode="date"
                  display="default"
                  onChange={(event, date) => handleActividadDateChange(index, 'fechaInicio', event, date, setActividades)}
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Fecha Fin</Text>
              <TouchableOpacity
                onPress={() => setActividades(prev => {
                  const s = [...prev];
                  s[index] = { ...s[index], showDatePickerFin: true };
                  return s;
                })}
                style={styles.datePill}
              >
                <Ionicons name="calendar-outline" size={15} color={COLORS.primary} />
                <Text style={styles.datePillText}>{actividad.fechaFin.toLocaleDateString('es-ES')}</Text>
              </TouchableOpacity>
              {actividad.showDatePickerFin && (
                <DateTimePicker
                  value={actividad.fechaFin}
                  mode="date"
                  display="default"
                  minimumDate={actividad.fechaInicio}
                  onChange={(event, date) => handleActividadDateChange(index, 'fechaFin', event, date, setActividades)}
                />
              )}
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity onPress={agregarActividad} style={[styles.addBtn, { borderColor: accent }]}>
        <Ionicons name="add-circle" size={20} color={accent} />
        <Text style={[styles.addBtnText, { color: accent }]}>Añadir Actividad</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Reusable FormField ───────────────────────────────────────────────────────
const FormField = ({ label, icon, value, onChangeText, placeholder, error, multiline }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.inputRow, error && styles.inputRowError]}>
      <Ionicons name={icon} size={17} color={error ? COLORS.danger : COLORS.textMuted} style={styles.inputIcon} />
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const programacionEvento = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const getInitialDate = () => {
    if (params.selectedDate) {
      let initialDate = dayjs(params.selectedDate);
      if (params.selectedHour) {
        initialDate = initialDate.hour(parseInt(params.selectedHour, 10)).minute(0).second(0);
      }
      return initialDate.toDate();
    }
    return new Date();
  };

  const [authToken, setAuthToken] = useState(null);
  const [nombreevento, setNombreevento] = useState('');
  const [lugarevento, setLugarevento] = useState('');
  const [responsable, setResponsable] = useState('');
  const [fechaHoraSeleccionada, setFechaHoraSeleccionada] = useState(getInitialDate());
  const [actividadesPrevias, setActividadesPrevias] = useState([]);
  const [actividadesDurante, setActividadesDurante] = useState([]);
  const [actividadesPost, setActividadesPost] = useState([]);
  const [idtipoevento, setIdtipoevento] = useState('');
  const [serviciosContratados, setServiciosContratados] = useState([]);
  const [ambientes, setAmbientes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoadingEventos, setIsLoadingEventos] = useState(false);
  const [comiteSeleccionado, setComiteSeleccionado] = useState([]);
  const [layoutsDisponibles, setLayoutsDisponibles] = useState([]);
  const [layoutSeleccionado, setLayoutSeleccionado] = useState(null);
  const [cargandoLayouts, setCargandoLayouts] = useState(false);

  const { idevento } = params;
  const isEditing = !!idevento;

  const formatToISODate = (date) => {
    if (!(date instanceof Date) || isNaN(date.valueOf())) return new Date().toISOString().split('T')[0];
    return date.toISOString().split('T')[0];
  };
  const formatToISOTime = (date) => {
    if (!(date instanceof Date) || isNaN(date.valueOf())) return new Date().toTimeString().split(' ')[0].substring(0, 5);
    return date.toTimeString().split(' ')[0].substring(0, 5);
  };

  const handleActividadDateChange = (index, field, event, selectedDate, setActividades) => {
    const pickerFlag = field === 'fechaInicio' ? 'showDatePickerInicio' : 'showDatePickerFin';
    setActividades(prev => {
      const s = [...prev];
      if (s[index]) s[index] = { ...s[index], [pickerFlag]: false };
      return s;
    });
    if (event.type === 'set' && selectedDate) {
      setActividades(prev => {
        const s = [...prev];
        if (s[index]) {
          s[index] = { ...s[index], [field]: selectedDate };
          if (field === 'fechaInicio' && s[index].fechaFin < selectedDate) s[index].fechaFin = selectedDate;
        }
        return s;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!nombreevento.trim()) newErrors.nombreevento = 'El nombre del evento es requerido.';
    const validateActivityList = (list, listName) => {
      list.forEach((act, index) => {
        if (!act.nombreActividad?.trim()) newErrors[`${listName}_${index}_nombre`] = 'Nombre de actividad requerido.';
        if (!act.responsable?.trim()) newErrors[`${listName}_${index}_responsable`] = 'Responsable requerido.';
      });
    };
    if (actividadesPrevias.length > 0) validateActivityList(actividadesPrevias, 'Programación de Actividades Previas');
    if (actividadesDurante.length > 0) validateActivityList(actividadesDurante, 'Programación de Actividades Durante el Evento');
    if (actividadesPost.length > 0) validateActivityList(actividadesPost, 'Programación de Actividades Después del Evento');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const agregarAmbiente = () => setAmbientes(prev => [...prev, { key: `ambiente_${Date.now()}`, nombre: '', requisito: '', observaciones: '' }]);
  const eliminarAmbiente = (index) => setAmbientes(ambientes.filter((_, i) => i !== index));
  const actualizarAmbiente = (index, campo, valor) => {
    const nuevos = [...ambientes];
    nuevos[index][campo] = valor;
    setAmbientes(nuevos);
  };

  const agregarServicio = () => setServiciosContratados(prev => [...prev, { key: `servicio_${Date.now()}`, nombreServicio: '', caracteristica: '', fechaInicio: new Date(), observaciones: '', showDatePickerInicio: false }]);
  const eliminarServicio = (index) => setServiciosContratados(serviciosContratados.filter((_, i) => i !== index));
  const actualizarServicio = (index, campo, valor) => {
    const nuevos = [...serviciosContratados];
    nuevos[index][campo] = valor;
    setServiciosContratados(nuevos);
  };
  const handleServicioDateChange = (index, field, event, selectedDate) => {
    actualizarServicio(index, 'showDatePickerInicio', false);
    if (event.type === 'set' && selectedDate) actualizarServicio(index, field, selectedDate);
  };

  const cargarLayouts = async (token) => {
    const authTokenToUse = token || authToken;
    if (!authTokenToUse) return;
    setCargandoLayouts(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/layouts`, {
        headers: { 'Authorization': `Bearer ${authTokenToUse}` }
      });
      setLayoutsDisponibles(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los layouts disponibles.');
      setLayoutsDisponibles([]);
    } finally {
      setCargandoLayouts(false);
    }
  };

  useEffect(() => {
    const initializeAndFetch = async () => {
      const token = await getTokenAsync();
      setAuthToken(token);
      if (!token) { Alert.alert('Error', 'No autenticado'); router.back(); return; }
      await cargarLayouts(token);
      if (isEditing) {
        setIsLoadingEventos(true);
        try {
          const response = await axios.get(`${API_BASE_URL}/eventos/${idevento}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const evento = response.data;
          setNombreevento(evento.nombreevento || '');
          setLugarevento(evento.lugarevento || '');
          setResponsable(evento.responsable_evento || '');
          if (evento.fechaevento && evento.horaevento) {
            const fechaCompleta = new Date(`${evento.fechaevento}T${evento.horaevento}`);
            if (!isNaN(fechaCompleta.getTime())) setFechaHoraSeleccionada(fechaCompleta);
          }
          setIdtipoevento(evento.idtipoevento?.toString() || '');
          if (Array.isArray(evento.actividadesPrevias)) {
            setActividadesPrevias(evento.actividadesPrevias.map((act, i) => ({
              key: `act-prev-${i}-${Date.now()}`,
              nombreActividad: act.nombreActividad || '',
              responsable: act.responsable || '',
              fechaInicio: new Date(act.fechaInicio),
              fechaFin: new Date(act.fechaFin),
              showDatePickerInicio: false,
              showDatePickerFin: false,
            })));
          }
          if (Array.isArray(evento.actividadesDurante)) {
            setActividadesDurante(evento.actividadesDurante.map((act, i) => ({
              key: `act-durante-${i}-${Date.now()}`,
              nombreActividad: act.nombreActividad || '',
              responsable: act.responsable || '',
              fechaInicio: new Date(act.fechaInicio),
              fechaFin: new Date(act.fechaFin),
              showDatePickerInicio: false,
              showDatePickerFin: false,
            })));
          }
          if (Array.isArray(evento.actividadesPost)) {
            setActividadesPost(evento.actividadesPost.map((act, i) => ({
              key: `act-post-${i}-${Date.now()}`,
              nombreActividad: act.nombreActividad || '',
              responsable: act.responsable || '',
              fechaInicio: new Date(act.fechaInicio),
              fechaFin: new Date(act.fechaFin),
              showDatePickerInicio: false,
              showDatePickerFin: false,
            })));
          }
          if (Array.isArray(evento.serviciosContratados)) {
            setServiciosContratados(evento.serviciosContratados.map((serv, i) => ({
              key: `servicio-${i}-${Date.now()}`,
              nombreServicio: serv.nombreServicio || '',
              caracteristica: serv.caracteristica || '',
              fechaInicio: serv.fechaInicio ? new Date(serv.fechaInicio.includes('T') ? serv.fechaInicio : serv.fechaInicio + 'T00:00:00') : new Date(),
              observaciones: serv.observaciones || '',
              showDatePickerInicio: false,
            })));
          }
          if (Array.isArray(evento.ambientes)) {
            setAmbientes(evento.ambientes.map((amb, i) => ({
              key: `ambiente-${i}-${Date.now()}`,
              nombre: amb.nombre || '',
              requisito: amb.requisito || '',
              observaciones: amb.observaciones || '',
            })));
          }
          if (evento.idlayout) {
            const layoutEncontrado = layoutsDisponibles.find(l => l.idlayout === evento.idlayout);
            setLayoutSeleccionado(layoutEncontrado || null);
          }
          if (Array.isArray(evento.comite)) setComiteSeleccionado(evento.comite);
        } catch (error) {
          console.error("Error al cargar el evento:", error);
          Alert.alert("Error", "No se pudo cargar el evento.");
          router.back();
        } finally {
          setIsLoadingEventos(false);
        }
      }
    };
    initializeAndFetch();
  }, [idevento]);

  if (isEditing && idevento && isLoadingEventos) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando evento...</Text>
      </View>
    );
  }

  const handleCrearEvento = async () => {
    if (!validateForm()) {
      Alert.alert("Formulario Incompleto", "Por favor, revisa los campos marcados en rojo.");
      return;
    }
    if (!authToken) { Alert.alert("Error de Autenticación", "No estás autenticado."); return; }
    setIsLoading(true);
    try {
      if (!fechaHoraSeleccionada || isNaN(fechaHoraSeleccionada.getTime())) throw new Error('Fecha del evento inválida');
      const fasePayload = { nrofase: 2, ...(isEditing && idevento && { idevento: parseInt(idevento, 10) }) };
      const payload = {
        nombreevento: nombreevento.trim(),
        lugarevento: lugarevento.trim(),
        fechaevento: formatToISODate(fechaHoraSeleccionada),
        horaevento: formatToISOTime(fechaHoraSeleccionada),
        responsable: responsable.trim(),
        actividadesPrevias: actividadesPrevias.map(formatActivityForSubmit),
        actividadesDurante: actividadesDurante.map(formatActivityForSubmit),
        actividadesPost: actividadesPost.map(formatActivityForSubmit),
        serviciosContratados: serviciosContratados.map(formatServicioForSubmit),
        ambientes: ambientes.map(formatAmbienteForSubmit),
        idlayout: layoutSeleccionado ? layoutSeleccionado.idlayout : null,
        comite: comiteSeleccionado,
        nuevaFase: fasePayload,
      };
      let response;
      if (isEditing) {
        response = await axios.put(`${API_BASE_URL}/eventos/${idevento}`, payload, {
          headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        });
      } else {
        response = await axios.post(`${API_BASE_URL}/eventos`, payload, {
          headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        });
      }
      Alert.alert('Éxito', isEditing ? 'Evento actualizado correctamente.' : 'Evento creado correctamente.',
        [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      let errorMessage = 'Ocurrió un error al guardar el evento.';
      if (error.response) {
        const serverError = error.response.data;
        if (serverError.message) errorMessage = serverError.message;
        else if (serverError.error) errorMessage = serverError.error;
        else if (typeof serverError === 'string') errorMessage = serverError;
        if (errorMessage.includes('Transaction cannot be rolled back')) {
          errorMessage = 'Error de base de datos. Por favor, contacta al administrador del sistema.';
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      }
      Alert.alert('Error al guardar', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Stack.Screen options={{ title: isEditing ? 'Programar Evento' : 'Crear Nuevo Evento' }} />

        {/* ── Info Principal ── */}
        <View style={styles.card}>
          <View style={[styles.sectionHeader, { borderLeftColor: COLORS.primary }]}>
            <View style={[styles.sectionIconWrap, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Información Principal</Text>
              <Text style={styles.sectionSubtitle}>Datos generales del evento</Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <InfoItem icon="bookmark-outline" label="Nombre" value={nombreevento || 'No especificado'} accent />
            <InfoItem icon="location-outline" label="Lugar" value={lugarevento || 'No especificado'} />
            <InfoItem icon="calendar-outline" label="Fecha" value={formatToISODate(fechaHoraSeleccionada)} last />
          </View>
        </View>

        {/* ── Actividades ── */}
        <SeccionActividades
          titulo="Programación de Actividades Previas"
          actividades={actividadesPrevias}
          setActividades={setActividadesPrevias}
          handleActividadDateChange={handleActividadDateChange}
          errors={errors}
          fechaevento={fechaHoraSeleccionada}
        />
        <SeccionActividades
          titulo="Programación de Actividades Durante el Evento"
          actividades={actividadesDurante}
          setActividades={setActividadesDurante}
          handleActividadDateChange={handleActividadDateChange}
          errors={errors}
          fechaevento={fechaHoraSeleccionada}
        />
        <SeccionActividades
          titulo="Programación de Actividades Después del Evento"
          actividades={actividadesPost}
          setActividades={setActividadesPost}
          handleActividadDateChange={handleActividadDateChange}
          errors={errors}
          fechaevento={fechaHoraSeleccionada}
        />

        {/* ── Servicios ── */}
        <View style={styles.card}>
          <View style={[styles.sectionHeader, { borderLeftColor: '#8B5CF6' }]}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="build-outline" size={18} color="#8B5CF6" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Servicios Contratados</Text>
              <Text style={styles.sectionSubtitle}>{serviciosContratados.length} servicio{serviciosContratados.length !== 1 ? 's' : ''} registrado{serviciosContratados.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>

          {serviciosContratados.map((servicio, index) => (
            <View key={servicio.key} style={styles.subCard}>
              <View style={styles.subCardHeader}>
                <View style={[styles.actIndexBadge, { backgroundColor: '#EDE9FE' }]}>
                  <Text style={[styles.actIndexText, { color: '#8B5CF6' }]}>{index + 1}</Text>
                </View>
                <Text style={styles.subCardTitle}>Servicio #{index + 1}</Text>
                <TouchableOpacity onPress={() => eliminarServicio(index)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
              <FormField label="Nombre del Servicio" icon="build-outline" value={servicio.nombreServicio}
                onChangeText={(text) => actualizarServicio(index, 'nombreServicio', text)} placeholder="Ej: Catering, Sonido..." />
              <FormField label="Características" icon="list-outline" value={servicio.caracteristica}
                onChangeText={(text) => actualizarServicio(index, 'caracteristica', text)} placeholder="Descripción del servicio" />
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Fecha de Entrega</Text>
                <TouchableOpacity onPress={() => actualizarServicio(index, 'showDatePickerInicio', true)} style={styles.datePill}>
                  <Ionicons name="calendar-outline" size={15} color={COLORS.primary} />
                  <Text style={styles.datePillText}>
                    {servicio.fechaInicio instanceof Date && !isNaN(servicio.fechaInicio)
                      ? servicio.fechaInicio.toLocaleDateString('es-ES') : 'Seleccionar fecha'}
                  </Text>
                </TouchableOpacity>
                {servicio.showDatePickerInicio && (
                  <DateTimePicker
                    value={servicio.fechaInicio instanceof Date && !isNaN(servicio.fechaInicio) ? servicio.fechaInicio : new Date()}
                    mode="date" display="default"
                    onChange={(event, date) => handleServicioDateChange(index, 'fechaInicio', event, date)}
                  />
                )}
              </View>
              <FormField label="Observaciones" icon="document-text-outline" value={servicio.observaciones}
                onChangeText={(text) => actualizarServicio(index, 'observaciones', text)} placeholder="Notas adicionales" multiline />
            </View>
          ))}
          <TouchableOpacity onPress={agregarServicio} style={[styles.addBtn, { borderColor: '#8B5CF6' }]}>
            <Ionicons name="add-circle" size={20} color="#8B5CF6" />
            <Text style={[styles.addBtnText, { color: '#8B5CF6' }]}>Añadir Servicio</Text>
          </TouchableOpacity>
        </View>

        {/* ── Ambientes ── */}
        <View style={styles.card}>
          <View style={[styles.sectionHeader, { borderLeftColor: '#0EA5E9' }]}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#F0F9FF' }]}>
              <Ionicons name="business-outline" size={18} color="#0EA5E9" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Ambientes</Text>
              <Text style={styles.sectionSubtitle}>{ambientes.length} ambiente{ambientes.length !== 1 ? 's' : ''} registrado{ambientes.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>

          {ambientes.map((ambiente, index) => (
            <View key={ambiente.key} style={styles.subCard}>
              <View style={styles.subCardHeader}>
                <View style={[styles.actIndexBadge, { backgroundColor: '#E0F2FE' }]}>
                  <Text style={[styles.actIndexText, { color: '#0EA5E9' }]}>{index + 1}</Text>
                </View>
                <Text style={styles.subCardTitle}>Ambiente #{index + 1}</Text>
                <TouchableOpacity onPress={() => eliminarAmbiente(index)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
              <FormField label="Nombre del Ambiente" icon="business-outline" value={ambiente.nombre}
                onChangeText={(text) => actualizarAmbiente(index, 'nombre', text)} placeholder="Ej: Auditorio Principal" />
              <FormField label="Requisito" icon="checkmark-circle-outline" value={ambiente.requisito}
                onChangeText={(text) => actualizarAmbiente(index, 'requisito', text)} placeholder="Requisitos del ambiente" />
              <FormField label="Observaciones" icon="document-text-outline" value={ambiente.observaciones}
                onChangeText={(text) => actualizarAmbiente(index, 'observaciones', text)} placeholder="Notas adicionales" multiline />
            </View>
          ))}
          <TouchableOpacity onPress={agregarAmbiente} style={[styles.addBtn, { borderColor: '#0EA5E9' }]}>
            <Ionicons name="add-circle" size={20} color="#0EA5E9" />
            <Text style={[styles.addBtnText, { color: '#0EA5E9' }]}>Añadir Ambiente</Text>
          </TouchableOpacity>
        </View>

        {/* ── Layouts ── */}
        <View style={styles.card}>
          <View style={[styles.sectionHeader, { borderLeftColor: '#F59E0B' }]}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="images-outline" size={18} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Layout del Evento</Text>
              <Text style={styles.sectionSubtitle}>Selecciona la distribución del espacio</Text>
            </View>
          </View>

          {cargandoLayouts ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.emptyStateText}>Cargando layouts...</Text>
            </View>
          ) : layoutsDisponibles.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="image-outline" size={36} color={COLORS.textMuted} />
              <Text style={styles.emptyStateText}>No hay layouts disponibles aún</Text>
              <TouchableOpacity onPress={() => cargarLayouts(authToken)} style={styles.retryBtn}>
                <Ionicons name="reload-outline" size={16} color={COLORS.primary} />
                <Text style={styles.retryBtnText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.scrollHint}>← Desliza para ver más →</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {layoutsDisponibles.map((layout) => {
                    const imageUrl = layout.imagenUrl || `${API_BASE_URL}/uploads/${layout.url_imagen}`;
                    const isSelected = layoutSeleccionado?.idlayout === layout.idlayout;
                    return (
                      <TouchableOpacity
                        key={layout.idlayout}
                        style={[styles.layoutCard, isSelected && styles.layoutCardSelected]}
                        onPress={() => setLayoutSeleccionado(isSelected ? null : layout)}
                        activeOpacity={0.85}
                      >
                        <Image source={{ uri: imageUrl }} style={styles.layoutImg} resizeMode="cover" />
                        <Text style={styles.layoutName} numberOfLines={2}>{layout.nombre}</Text>
                        {isSelected && (
                          <View style={styles.layoutSelectedBadge}>
                            <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
                            <Text style={styles.layoutSelectedText}>Seleccionado</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </>
          )}
        </View>

        {/* ── Submit Button ── */}
        <TouchableOpacity
          style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
          onPress={handleCrearEvento}
          disabled={isLoading || !authToken}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name={isEditing ? "save-outline" : "add-circle-outline"} size={20} color="#fff" />
              <Text style={styles.submitBtnText}>{isEditing ? 'Guardar Cambios' : 'Crear Evento'}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── InfoItem helper ──────────────────────────────────────────────────────────
const InfoItem = ({ icon, label, value, accent, last }) => (
  <View style={[styles.infoItem, !last && styles.infoItemBorder]}>
    <View style={styles.infoItemLeft}>
      <Ionicons name={icon} size={15} color={accent ? COLORS.primary : COLORS.textMuted} />
      <Text style={styles.infoItemLabel}>{label}</Text>
    </View>
    <Text style={[styles.infoItemValue, accent && { color: COLORS.primary, fontWeight: '700' }]}>{value}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingTop: 20,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 8,
  },

  // ── Cards ──
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  subCardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderRadius: 2,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  // ── Activity index badge ──
  actIndexBadge: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // ── Info Grid ──
  infoGrid: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  infoItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoItemLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  infoItemValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    maxWidth: '55%',
    textAlign: 'right',
  },

  // ── Form Fields ──
  fieldWrap: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  inputRowError: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerLight,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
    paddingTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 4,
    marginLeft: 4,
  },

  // ── Date pills ──
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryMid,
  },
  datePillText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // ── Buttons ──
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnDisabled: {
    backgroundColor: '#F9BDA3',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginTop: 10,
  },
  retryBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Empty state ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  scrollHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
  },

  // ── Layouts ──
  layoutCard: {
    width: 200,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  layoutCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  layoutImg: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  layoutName: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  layoutSelectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  layoutSelectedText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default programacionEvento;