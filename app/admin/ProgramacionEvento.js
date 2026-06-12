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

// --- Configuración de API y Tokens ---
let determinedApiBaseUrl;
if (Platform.OS === 'android') {
  determinedApiBaseUrl = 'http://192.168.0.167:3001/api';
} else if (Platform.OS === 'ios') {
  determinedApiBaseUrl = 'http://192.168.0.167:3001/api';
} else {
  determinedApiBaseUrl = 'http://192.168.0.167:3001/api';
}
const API_BASE_URL = determinedApiBaseUrl;
const TOKEN_KEY = 'adminAuthToken';

const getTokenAsync = async () => {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(TOKEN_KEY); } catch (e) { console.error("Error al acceder a localStorage en web:", e); return null; }
  } else {
    try { return await SecureStore.getItemAsync(TOKEN_KEY); } catch (e) { console.error("Error al obtener token de SecureStore en nativo:", e); return null; }
  }
};

// --- Configuración de calendario ---
LocaleConfig.locales['es'] = {
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthNamesShort: ['Ene.','Feb.','Mar.','Abr.','May.','Jun.','Jul.','Ago.','Sep.','Oct.','Nov.','Dic.'],
  dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  dayNamesShort: ['Dom.','Lun.','Mar.','Mié.','Jue.','Vie.','Sáb.'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

// --- Componente de actividades ---
const SeccionActividades = ({ titulo, actividades, setActividades, handleActividadDateChange, errors }) => {
  const agregarActividad = () => {
    setActividades(prev => [...prev, {
      key: `act-${titulo.replace(/\s/g, '')}-${Date.now()}`,
      nombreActividad: '',
      responsable: '',
      fechaInicio: new Date(),
      fechaFin: new Date(),
      showDatePickerInicio: false,
      showDatePickerFin: false,
    }]);
  };
  const eliminarActividad = (index) => {
    setActividades(prev => prev.filter((_, i) => i !== index));
  };
  return (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>{titulo}</Text>
      {actividades.map((actividad, index) => (
        <View key={actividad.key} style={styles.actividadPreviaItemContainer}>
          <View style={styles.actividadItemHeader}>
            <Text style={styles.actividadPreviaTitle}>Actividad #{index + 1}</Text>
            <TouchableOpacity onPress={() => eliminarActividad(index)} style={styles.deleteButton}>
              <Ionicons name="trash-bin-outline" size={22} color="#c0392b" />
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>Actividad</Text>
          <View style={styles.inputGroup}>
            <Ionicons name="archive-outline" size={20} style={styles.inputIcon}/>
            <TextInput 
              style={styles.input} 
              value={actividad.nombreActividad} 
              onChangeText={(text) => {
                setActividades(prev => {
                  const newState = [...prev];
                  newState[index] = { ...newState[index], nombreActividad: text };
                  return newState;
                });
              }} 
              placeholder="Nombre de la Actividad" 
              placeholderTextColor="#aaa" 
            />
          </View>
          {errors[`${titulo}_${index}_nombre`] && <Text style={styles.errorText}>{errors[`${titulo}_${index}_nombre`]}</Text>}
          
          <Text style={styles.label}>Responsable</Text>
          <View style={styles.inputGroup}>
            <Ionicons name="person-outline" size={20} style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              value={actividad.responsable} 
              onChangeText={(text) => {
                setActividades(prev => {
                  const newState = [...prev];
                  newState[index] = { ...newState[index], responsable: text };
                  return newState;
                });
              }} 
              placeholder="Nombre del responsable" 
              placeholderTextColor="#aaa" 
            />
          </View>
          {errors[`${titulo}_${index}_responsable`] && <Text style={styles.errorText}>{errors[`${titulo}_${index}_responsable`]}</Text>}
          
          <Text style={styles.label}>Fecha Inicio Actividad</Text>
          <TouchableOpacity 
            onPress={() => {
              setActividades(prev => {
                const newState = [...prev];
                newState[index] = { ...newState[index], showDatePickerInicio: true };
                return newState;
              });
            }} 
            style={styles.datePickerButton}
          >
            <Ionicons name="calendar-outline" size={20} color="#e95a0c" style={styles.inputIcon} />
            <Text style={styles.datePickerText}>{actividad.fechaInicio.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {actividad.showDatePickerInicio && (
            <DateTimePicker 
              value={actividad.fechaInicio} 
              mode="date" 
              display="default" 
              onChange={(event, date) => handleActividadDateChange(index, 'fechaInicio', event, date, setActividades)} 
            />
          )}
          
          <Text style={styles.label}>Fecha Fin Actividad</Text>
          <TouchableOpacity 
            onPress={() => {
              setActividades(prev => {
                const newState = [...prev];
                newState[index] = { ...newState[index], showDatePickerFin: true };
                return newState;
              });
            }} 
            style={styles.datePickerButton}
          >
            <Ionicons name="calendar-outline" size={20} color="#e95a0c" style={styles.inputIcon} />
            <Text style={styles.datePickerText}>{actividad.fechaFin.toLocaleDateString()}</Text>
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
      ))}
      <TouchableOpacity onPress={agregarActividad} style={styles.addButton}>
        <Ionicons name="add-circle" size={26} color="#e95a0c" />
        <Text style={styles.addButtonText}>Añadir Actividad</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- Componente principal ---
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

  // Estados generales
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

  // Formateo de fechas
  const formatToISODate = (date) => {
    if (!(date instanceof Date) || isNaN(date.valueOf())) return new Date().toISOString().split('T')[0];
    return date.toISOString().split('T')[0];
  };
  const formatToISOTime = (date) => {
    if (!(date instanceof Date) || isNaN(date.valueOf())) return new Date().toTimeString().split(' ')[0].substring(0, 5);
    return date.toTimeString().split(' ')[0].substring(0, 5);
  };

  const formatActivityForSubmit = (actividad) => ({
    nombreActividad: actividad.nombreActividad,
    responsable: actividad.responsable,
    fechaInicio: actividad.fechaInicio.toISOString().split('T')[0],
    fechaFin: actividad.fechaFin.toISOString().split('T')[0],
  });



  // Manejo de fechas y validación
  const handleActividadDateChange = (index, field, event, selectedDate, setActividades) => {
    const pickerFlag = field === 'fechaInicio' ? 'showDatePickerInicio' : 'showDatePickerFin';
    setActividades(prev => {
      const newState = [...prev];
      if (newState[index]) newState[index] = { ...newState[index], [pickerFlag]: false };
      return newState;
    });
    if (event.type === 'set' && selectedDate) {
      setActividades(prev => {
        const newState = [...prev];
        if (newState[index]) {
          newState[index] = { ...newState[index], [field]: selectedDate };
          if (field === 'fechaInicio' && newState[index].fechaFin < selectedDate) {
            newState[index].fechaFin = selectedDate;
          }
        }
        return newState;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!nombreevento.trim()) newErrors.nombreevento = 'El nombre del evento es requerido.';

    const validateActivityList = (list, listName) => {
    list.forEach((act, index) => {
      if (!act.nombreActividad?.trim()) {
        newErrors[`${listName}_${index}_nombre`] = 'Nombre de actividad requerido.';
      }
      if (!act.responsable?.trim()) {
        newErrors[`${listName}_${index}_responsable`] = 'Responsable requerido.';
      }
    });
  };
     if (actividadesPrevias.length > 0) {
    validateActivityList(actividadesPrevias, 'Programación de Actividades Previas');
  }
  if (actividadesDurante.length > 0) {
    validateActivityList(actividadesDurante, 'Programación de Actividades Durante el Evento');
  }
  if (actividadesPost.length > 0) {
    validateActivityList(actividadesPost, 'Programación de Actividades Después del Evento');
  }

  console.log('📊 Errores encontrados:', Object.keys(newErrors).length);
  console.log('📋 Detalles de errores:', newErrors);

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
  };

  // Funciones de servicios y ambientes
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
    if (event.type === 'set' && selectedDate) {
      actualizarServicio(index, field, selectedDate);
    }
  };

 
const cargarLayouts = async (token) => {
  const authTokenToUse = token || authToken;
  
  if (!authTokenToUse) {
    console.log('No hay token para cargar layouts');
    return;
  }

  console.log('Iniciando carga de layouts...');
  setCargandoLayouts(true);
  
  try {
    const response = await axios.get(`${API_BASE_URL}/layouts`, {
      headers: { 'Authorization': `Bearer ${authTokenToUse}` }
    });
    
    console.log('Respuesta de layouts:', response.data);
    console.log('Cantidad de layouts:', response.data?.length || 0);
    
    if (response.data && Array.isArray(response.data)) {
      setLayoutsDisponibles(response.data);
      console.log('Layouts guardados en estado:', response.data.length);
    } else {
      console.error('Formato de respuesta incorrecto:', response.data);
      setLayoutsDisponibles([]);
    }
    
  } catch (error) {
    console.error('Error al cargar layouts:', error.response?.data || error.message);
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

  if (!token) {
    Alert.alert('Error', 'No autenticado');
    router.back();
    return;
  }

  await cargarLayouts(token);

 if (isEditing) {
  setIsLoadingEventos(true);
  try {
    const response = await axios.get(`${API_BASE_URL}/eventos/${idevento}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const evento = response.data;

    // Asignar datos principales
    setNombreevento(evento.nombreevento || '');
    setLugarevento(evento.lugarevento || '');
    setResponsable(evento.responsable_evento || '');

    // Fecha y hora
    if (evento.fechaevento && evento.horaevento) {
      const fechaCompleta = new Date(`${evento.fechaevento}T${evento.horaevento}`);
      if (!isNaN(fechaCompleta.getTime())) {
        setFechaHoraSeleccionada(fechaCompleta);
      }
    }

    // Tipo de evento
    setIdtipoevento(evento.idtipoevento?.toString() || '');

    // Actividades
    if (evento.actividadesPrevias && Array.isArray(evento.actividadesPrevias)) {
      setActividadesPrevias(evento.actividadesPrevias.map((act, index) => ({
        key: `act-prev-${index}-${Date.now()}`,
        nombreActividad: act.nombreActividad || '',
        responsable: act.responsable || '',
        fechaInicio: new Date(act.fechaInicio),
        fechaFin: new Date(act.fechaFin),
        showDatePickerInicio: false,
        showDatePickerFin: false,
      })));
    }

    if (evento.actividadesDurante && Array.isArray(evento.actividadesDurante)) {
      setActividadesDurante(evento.actividadesDurante.map((act, index) => ({
        key: `act-durante-${index}-${Date.now()}`,
        nombreActividad: act.nombreActividad || '',
        responsable: act.responsable || '',
        fechaInicio: new Date(act.fechaInicio),
        fechaFin: new Date(act.fechaFin),
        showDatePickerInicio: false,
        showDatePickerFin: false,
      })));
    }

    if (evento.actividadesPost && Array.isArray(evento.actividadesPost)) {
      setActividadesPost(evento.actividadesPost.map((act, index) => ({
        key: `act-post-${index}-${Date.now()}`,
        nombreActividad: act.nombreActividad || '',
        responsable: act.responsable || '',
        fechaInicio: new Date(act.fechaInicio),
        fechaFin: new Date(act.fechaFin),
        showDatePickerInicio: false,
        showDatePickerFin: false,
      })));
    }

    // Servicios
    if (evento.serviciosContratados && Array.isArray(evento.serviciosContratados)) {
      setServiciosContratados(evento.serviciosContratados.map((serv, index) => ({
        key: `servicio-${index}-${Date.now()}`,
        nombreServicio: serv.nombreServicio || '',
        caracteristica: serv.caracteristica || '',
        fechaInicio: new Date(serv.fechaInicio),
        observaciones: serv.observaciones || '',
        showDatePickerInicio: false,
      })));
    }

    // Ambientes
    if (evento.ambientes && Array.isArray(evento.ambientes)) {
      setAmbientes(evento.ambientes.map((amb, index) => ({
        key: `ambiente-${index}-${Date.now()}`,
        nombre: amb.nombre || '',
        requisito: amb.requisito || '',
        observaciones: amb.observaciones || '',
      })));
    }

    // Layout
    if (evento.idlayout) {
      const layoutEncontrado = layoutsDisponibles.find(l => l.idlayout === evento.idlayout);
      setLayoutSeleccionado(layoutEncontrado || null);
    }

    // Comité (si lo tienes)
    if (evento.comite && Array.isArray(evento.comite)) {
      setComiteSeleccionado(evento.comite); // Asegúrate de tener este estado definido
    }

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

  if (isEditing && isLoadingEventos) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e95a0c" />
        <Text style={{ marginTop: 10, color: '#555' }}>Cargando evento...</Text>
      </View>
    );
  }
const handleCrearEvento = async () => {
   console.log('=== INICIO handleCrearEvento ===');
  console.log('isEditing:', isEditing);
  console.log('idevento:', idevento);
  
  // Validación del formulario
  const validationResult = validateForm();
  console.log('Resultado de validación:', validationResult);
  console.log('Errores:', errors);
  
  if (!validationResult) {
    console.log(' Validación falló');
    Alert.alert("Formulario Incompleto", "Por favor, revisa los campos marcados en rojo.");
    return;
  }
  if (!validateForm()) {
    Alert.alert("Formulario Incompleto", "Por favor, revisa los campos marcados en rojo.");
    return;
  }
  if (!authToken) {
    Alert.alert("Error de Autenticación", "No estás autenticado.");
    return;
  }
 console.log('✅ Validaciones pasadas, preparando payload...');

  setIsLoading(true);
   const fasePayload = {
    nrofase: 2,
    ...(isEditing && idevento && { idevento: parseInt(idevento, 10) })
  };
  const payload = {
    nombreevento: nombreevento.trim(),
    lugarevento: lugarevento.trim(),
    fechaevento: formatToISODate(fechaHoraSeleccionada),
    horaevento: formatToISOTime(fechaHoraSeleccionada),
    responsable: responsable.trim(),
    actividadesPrevias: actividadesPrevias.map(formatActivityForSubmit),
    actividadesDurante: actividadesDurante.map(formatActivityForSubmit),
    actividadesPost: actividadesPost.map(formatActivityForSubmit),
    serviciosContratados,
    ambientes,
    idlayout: layoutSeleccionado ? layoutSeleccionado.idlayout : null,
    comite: comiteSeleccionado,
    nuevaFase:fasePayload
    
  };
console.log('📦 Payload completo:', JSON.stringify(payload, null, 2));
  console.log('Layout seleccionado:', layoutSeleccionado);
  console.log('ID Layout en payload:', payload.idlayout);

  try {
    let response;
    if (isEditing) {
       console.log(`🔄 Actualizando evento: PUT ${API_BASE_URL}/eventos/${idevento}`);
      
      response = await axios.put(`${API_BASE_URL}/eventos/${idevento}`, payload, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
       console.log('✅ Respuesta del servidor (UPDATE):', response.data);
      Alert.alert('Éxito', 'Evento actualizado correctamente.');
    } else {
      response = await axios.post(`${API_BASE_URL}/eventos`, payload, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      Alert.alert('Éxito', 'Evento creado correctamente.');
    }
    router.back();
  } catch (error) {
    console.error("Error al guardar evento:", error.response?.data || error.message);
    const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Ocurrió un error al conectar con el servidor.';
    Alert.alert('Error', errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.keyboardAvoidingContainer}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContentContainer} 
        keyboardShouldPersistTaps="handled"
      >
        <Stack.Screen options={{ title: isEditing ? 'Programar Evento' : 'Crear Nuevo Evento' }} />

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Información Principal</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre del Evento</Text>
            <Text style={styles.infoValue}>{nombreevento || 'No especificado'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lugar del Evento</Text>
            <Text style={styles.infoValue}>{lugarevento || 'No especificado'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha</Text>
            <Text style={styles.infoValue}>
              {formatToISODate(fechaHoraSeleccionada)} 
            </Text>
          </View>
          
        </View>

        <SeccionActividades
          titulo="Programación de Actividades Previas"
          actividades={actividadesPrevias}
          setActividades={setActividadesPrevias}
          handleActividadDateChange={handleActividadDateChange}
          errors={errors}
        />
        <SeccionActividades
          titulo="Programación de Actividades Durante el Evento"
          actividades={actividadesDurante}
          setActividades={setActividadesDurante}
          handleActividadDateChange={handleActividadDateChange}
          errors={errors}
        />
        <SeccionActividades
          titulo="Programación de Actividades Después del Evento"
          actividades={actividadesPost}
          setActividades={setActividadesPost}
          handleActividadDateChange={handleActividadDateChange}
          errors={errors}
        />

        {/* Servicios */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Servicios</Text>
          {serviciosContratados.map((servicio, index) => (
            <View key={servicio.key} style={styles.servicioItemContainer}>
              <View style={styles.servicioItemHeader}>
                <Text style={styles.sectionTitle}>Servicio #{index + 1}</Text>
                <TouchableOpacity onPress={() => eliminarServicio(index)} style={styles.deleteButton}>
                  <Ionicons name="trash-bin-outline" size={22} color="#c0392b" />
                </TouchableOpacity>
              </View>
              <Text style={styles.label}>Servicio</Text>
              <View style={styles.inputGroup}>
                <Ionicons name="build-outline" size={20} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  value={servicio.nombreServicio} 
                  onChangeText={(text) => actualizarServicio(index, 'nombreServicio', text)} 
                  placeholder="Nombre Servicio" 
                  placeholderTextColor="#aaa"
                />
              </View>
              <Text style={styles.label}>Caracteristicas</Text>
              <View style={styles.inputGroup}>
                <Ionicons name="list-outline" size={20} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  value={servicio.caracteristica} 
                  onChangeText={(text) => actualizarServicio(index, 'caracteristica', text)} 
                  placeholder="Caracteristica" 
                  placeholderTextColor="#aaa"
                />
              </View>
              <Text style={styles.label}>Fecha Entrega</Text>
              <TouchableOpacity onPress={() => actualizarServicio(index, 'showDatePickerInicio', true)} style={styles.datePickerButton}>
                <Ionicons name="calendar-outline" size={20} color="#e95a0c" style={styles.inputIcon} />
                <Text style={styles.datePickerText}>{servicio.fechaInicio.toLocaleDateString()}</Text>
              </TouchableOpacity>
              {servicio.showDatePickerInicio && (
                <DateTimePicker 
                  value={servicio.fechaInicio} 
                  mode="date" 
                  display="default" 
                  onChange={(event, date) => handleServicioDateChange(index, 'fechaInicio', event, date)}
                />
              )}
              <Text style={styles.label}>Observaciones</Text>
              <View style={styles.inputGroup}>
                <Ionicons name="document-text-outline" size={20} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  value={servicio.observaciones} 
                  onChangeText={(text) => actualizarServicio(index, 'observaciones', text)} 
                  placeholder="Observaciones" 
                  placeholderTextColor="#aaa"
                />
              </View>
            </View>
          ))}
          <TouchableOpacity onPress={agregarServicio} style={styles.addButton}>
            <Ionicons name="add-circle" size={26} color="#e95a0c" />
            <Text style={styles.addButtonText}>Añadir Servicio</Text>
          </TouchableOpacity>
        </View>

        {/* Ambientes */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Ambiente</Text>
          {ambientes.map((ambiente, index) => (
            <View key={ambiente.key} style={styles.ambienteItemContainer}>
              <View style={styles.ambienteItemHeader}>
                <Text style={styles.sectionTitle}>Ambiente #{index + 1}</Text>
                <TouchableOpacity onPress={() => eliminarAmbiente(index)} style={styles.deleteButton}>
                  <Ionicons name="trash-bin-outline" size={22} color="#c0392b" />
                </TouchableOpacity>
              </View>
              <Text style={styles.label}>Ambiente</Text>
              <View style={styles.inputGroup}>
                <Ionicons name="business-outline" size={20} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  value={ambiente.nombre} 
                  onChangeText={(text) => actualizarAmbiente(index, 'nombre', text)} 
                  placeholder="Nombre Ambiente" 
                  placeholderTextColor="#aaa"
                />
              </View>
              <Text style={styles.label}>Requisito</Text>
              <View style={styles.inputGroup}>
                <Ionicons name="list-outline" size={20} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  value={ambiente.requisito} 
                  onChangeText={(text) => actualizarAmbiente(index, 'requisito', text)} 
                  placeholder="Requisito" 
                  placeholderTextColor="#aaa"
                />
              </View>
              <Text style={styles.label}>Observaciones</Text>
              <View style={styles.inputGroup}>
                <Ionicons name="document-text-outline" size={20} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  value={ambiente.observaciones} 
                  onChangeText={(text) => actualizarAmbiente(index, 'observaciones', text)} 
                  placeholder="Observaciones" 
                  placeholderTextColor="#aaa"
                />
              </View>
            </View>
          ))}
          <TouchableOpacity onPress={agregarAmbiente} style={styles.addButton}>
            <Ionicons name="add-circle" size={26} color="#e95a0c" />
            <Text style={styles.addButtonText}>Añadir Ambiente</Text>
          </TouchableOpacity>
        </View>

        {/* === GALERÍA DE LAYOUTS SUBIDOS === */}
          <View style={styles.formSection}>
  <Text style={styles.sectionTitle}>Layouts Disponibles</Text>

  {cargandoLayouts ? (
    <View style={styles.centered}>
      <ActivityIndicator size="small" color="#e95a0c" />
      <Text style={{ marginTop: 8, color: '#666' }}>Cargando layouts...</Text>
    </View>
  ) : layoutsDisponibles.length === 0 ? (
    <View>
      <Text style={{ color: '#777', fontStyle: 'italic', textAlign: 'center', marginVertical: 20 }}>
        No hay layouts subidos aún.
      </Text>
      <TouchableOpacity 
        onPress={() => cargarLayouts(authToken)} 
        style={styles.retryButton}
      >
        <Ionicons name="reload" size={20} color="#e95a0c" />
        <Text style={styles.retryButtonText}>Reintentar carga</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.layoutsGrid}>
        {layoutsDisponibles.map((layout) => {
  const imageUrl = layout.imagenUrl || `${API_BASE_URL.replace('/api', '')}/uploads/${layout.url_imagen}`;
  const isSelected = layoutSeleccionado?.idlayout === layout.idlayout;

  return (
    <View key={layout.idlayout} style={[styles.layoutItem, isSelected && styles.layoutItemSelected]}>
      <TouchableOpacity 
        onPress={() => setLayoutSeleccionado(layout)} // ← SELECCIONA EL LAYOUT
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.layoutImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <Text style={styles.layoutName} numberOfLines={2}>
        {layout.nombre}
      </Text>
    </View>
  );
})}
      </View>
    </ScrollView>
  )}
</View>


        {/* Botón de guardar */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleCrearEvento}
          disabled={isLoading || !authToken}
        >
          <Text style={styles.buttonText}>
            {isEditing ? 'Guardar Cambios' : 'Crear Evento'}
            </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}



// --- ESTILOS (sin cambios) ---
const styles = StyleSheet.create({
  retryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 15, borderWidth: 1, borderColor: '#e95a0c', borderRadius: 8, alignSelf: 'center', marginTop: 10, },
  retryButtonText: { marginLeft: 8, color: '#e95a0c', fontSize: 16, fontWeight: '500', },
  layoutsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', },
  keyboardAvoidingContainer: { flex: 1, backgroundColor: '#F4F7F9' },
  scrollView: { flex: 1 },
  scrollContentContainer: { padding: 20, paddingBottom: 60 },
  formSection: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  label: { fontSize: 14, color: '#555', marginBottom: 8, fontWeight: '500' },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, marginBottom: 15 },
  inputIcon: { paddingHorizontal: 12, color: '#888' },
  input: { flex: 1, paddingVertical: Platform.OS === 'ios' ? 14 : 10, paddingRight: 15, fontSize: 16, color: '#333' },
  inputError: { borderColor: '#D32F2F' },
  errorText: { color: '#D32F2F', fontSize: 12, marginBottom: 10, marginLeft: 5, marginTop: -10 },
  datePickerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingVertical: Platform.OS === 'ios' ? 14 : 12, marginBottom: 15, paddingLeft: 0 },
  datePickerText: { fontSize: 16, color: '#333', flex:1, marginLeft: 5 },
  button: { backgroundColor: '#e95a0c', paddingVertical: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10, flexDirection: 'row', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.23, shadowRadius: 2.62, elevation: 4 },
  buttonDisabled: { backgroundColor: '#f9bda3' },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  pickerContainer: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, marginBottom: 15, },
  picker: { height: Platform.OS === 'ios' ? undefined : 50, width: '100%', color: '#333', },
  pickerItemPlaceholder: { color: '#aaa', },
  pickerItem: { color: '#333', },
  imagePickerButton: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 20, minHeight: 180, },
  imagePreview: { width: '100%', height: 180, borderRadius: 8, resizeMode: 'contain', },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20, },
  imagePlaceholderText: { marginTop: 10, color: '#888', fontSize: 14, },
  actividadPreviaItemContainer: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 15, marginBottom: 15, backgroundColor: '#fdfdfd' },
  actividadItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', },
  actividadPreviaTitle: { fontSize: 16, fontWeight: '600', color: '#333', },
  deleteButton: { padding: 6, },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: '#e6ffee', borderRadius: 8, borderWidth: 1, borderColor: '#27ae60', marginTop: 10, },
  addButtonText: { marginLeft: 8, color: '#27ae60', fontSize: 16, fontWeight: '500', },
  ambienteItemContainer: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 15, marginBottom: 15, backgroundColor: '#fdfdfd' },
  ambienteItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', },
  servicioItemContainer: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 15, marginBottom: 15, backgroundColor: '#fdfdfd' },
  servicioItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', },
  calendarContainer:{borderWidth:1,borderColor:'#e0e0e0', borderRadius:8, marginBottom:15,overflow:'hidden'  },
  eventListContainer: { marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee', },
  eventListHeader: { fontSize: 16, fontWeight: '600', color: '#444', marginBottom: 10, },
  eventListItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 8, },
  eventTypeIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 12, },
  eventListTime: { fontSize: 15, fontWeight: '500', color: '#333', width: 60, },
  eventListName: { fontSize: 15, color: '#555', flex: 1, },
  emptyListText: { textAlign: 'center', color: '#777', paddingVertical: 20, fontStyle: 'italic', },
    centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
    infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  layoutItemSelected: {
  borderColor: '#e95a0c',
  borderWidth: 2,
  borderRadius: 10,
  backgroundColor: '#fffaf5',
},
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
  },
  infoValue: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1.2,
    flexWrap: 'wrap',
  },  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
  },
  infoValue: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1.2,
    flexWrap: 'wrap',
  },
 layoutsGrid: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  layoutItem: {
    width: 150,
    marginRight: 15,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  layoutImage: {
    width: 130,
    height: 130,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#eee',
  },
  layoutName: {
    marginTop: 8,
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
    width: '100%',
  },
centered: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingVertical: 20,
},
});

export default programacionEvento;