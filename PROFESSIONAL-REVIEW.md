# Informe de Revisión Profesional: osTicket Frontend

## SECCIÓN A - ANÁLISIS DE UI PROFESIONAL

Tras una revisión exhaustiva de los componentes visuales en `src/components/`, `src/pages/` y `src/stores/`, se han identificado las siguientes áreas de mejora para alcanzar un estándar *production-grade*:

### 1. Estados de UI (Loading, Empty, Error, Success, Idle)
- **Loading**: Bien implementado en general mediante skeletons (`DetailSkeleton`, `TableRowSkeleton`, `CardSkeletonGrid`).
- **Empty**: Se utiliza el componente `EmptyState` correctamente en la tabla de tickets (`TicketsPage`). Sin embargo, en `TicketDetailPage` (hilo de mensajes), si no hay mensajes se muestra un texto plano ("No hay mensajes en este ticket") en lugar del componente estandarizado `EmptyState`.
- **Error**: Los estados de error se manejan adecuadamente mostrando mensajes informativos, pero los diseños de error varían (ej. `TicketsPage` usa un ícono centrado, mientras `TicketDetailPage` usa una caja roja). Falta consistencia.
- **Success**: Cubierto correctamente mediante notificaciones de `react-hot-toast`.
- **Idle/Disabled**: Los botones de acción (ej. en `TicketActions`) se deshabilitan correctamente durante la carga o cuando no hay selección, lo cual es una excelente práctica.

### 2. Transiciones y Animaciones
- **Transiciones entre páginas**: **Ausentes**. La navegación con React Router es abrupta. Se recomienda implementar transiciones suaves (ej. fade-in) usando bibliotecas como `framer-motion` o CSS transitions en el `Outlet`.
- **Skeletons animados**: Implementados correctamente con `animate-pulse`.
- **Modales y Dropdowns**: El `ConfirmModal` aparece de forma abrupta. Faltan animaciones de entrada/salida (escala y opacidad). Los dropdowns nativos (`<select>`) no permiten animaciones ni personalización avanzada.

### 3. Jerarquía Visual
- **Espaciado y Escala**: Uso consistente de la escala de Tailwind (`p-4`, `gap-2`, `text-sm`, `text-lg`).
- **Colores Semánticos**: Buen uso en badges (`StatusBadge`, `PriorityBadge`).
- **Inconsistencia de Marca**: Hay una mezcla de colores principales. El logo y el avatar usan `indigo-600`, pero los botones principales en `TicketActions` y `LoginPage` usan `blue-600`. Se debe unificar el color primario de la marca.

### 4. Accesibilidad (a11y)
- **Labels y ARIA**: Faltan etiquetas `<label>` o `aria-label` en inputs clave, como el buscador global en `TopBar` y los checkboxes de selección múltiple en `TicketsPage`.
- **Focus States**: Bien implementados (`focus:ring-2 focus:ring-blue-500`).
- **Roles ARIA**: El modal personalizado (`ConfirmModal`) carece de atributos esenciales como `role="dialog"`, `aria-modal="true"` y `aria-labelledby`.

### 5. Edge Cases
- **Textos largos**: Bien manejados con `line-clamp-1` y `truncate` en títulos y asuntos.
- **Datos faltantes**: Se manejan con fallbacks adecuados (ej. `—` para agentes no asignados).
- **API Falla**: Cubierto con estados de error robustos.

### 6. Consistencia entre páginas
- **Fondos y Contenedores**: Inconsistencia en los colores de fondo en modo oscuro. `TicketsPage` usa `dark:bg-gray-900` para la tabla, mientras que `StatsPage` usa `dark:bg-slate-900`. Se mezclan las paletas `gray` y `slate` en toda la aplicación.

### 7. Marca/Personalidad
- La interfaz es limpia pero genérica. El logo es un simple cuadrado con texto. Falta una identidad visual más fuerte y única que diferencie el producto.

---

## SECCIÓN B - ANÁLISIS DE CÓDIGO ANTIPROFESIONAL

Revisión de todos los archivos `.js` y `.jsx` en `src/`.

### 1. Uso de `prompt()` nativo
- **Archivo:Línea**: `src/components/tickets/TicketReply.jsx:72`
- **Severidad**: CRÍTICO
- **Qué cambiar**: Reemplazar `prompt()` por un modal personalizado de React.
- **Por qué**: Las funciones nativas como `prompt()` bloquean el hilo principal (main thread), ofrecen una mala experiencia de usuario y no se pueden estilizar.
- **Código sugerido**:
  ```jsx
  // Usar un estado para controlar un modal
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  // ...
  {linkModalOpen && <CustomPromptModal onSubmit={handleLinkSubmit} />}
  ```

### 2. Hardcodeos (Magic Strings y Numbers)
- **Archivo:Línea**: `src/components/layout/Sidebar.jsx:117`
- **Severidad**: MEDIO
- **Qué cambiar**: Extraer el valor `100` del `setTimeout` a una constante.
- **Por qué**: Los "magic numbers" dificultan la comprensión del propósito del retraso.
- **Código sugerido**:
  ```jsx
  const FOCUS_DELAY_MS = 100;
  setTimeout(() => { ... }, FOCUS_DELAY_MS);
  ```

- **Archivo:Línea**: `src/api/client.js:4`, `src/stores/auth.jsx:6`, `src/pages/LoginPage.jsx:29`
- **Severidad**: MEDIO
- **Qué cambiar**: Extraer la key `'osticket_api_key'` a una constante.
- **Por qué**: Evita errores tipográficos y centraliza la configuración del almacenamiento local.
- **Código sugerido**:
  ```jsx
  // En utils/constants.js
  export const STORAGE_API_KEY = 'osticket_api_key';
  ```

### 3. `useCallback` faltantes que causan re-renders
- **Archivo:Línea**: `src/components/tickets/TicketFilters.jsx:26` y `:42`
- **Severidad**: BAJO
- **Qué cambiar**: Envolver `setParam` y `clearFilters` en `useCallback`.
- **Por qué**: Estas funciones se recrean en cada render. Aunque actualmente se pasan a elementos nativos, es una mala práctica que puede causar re-renders innecesarios si se refactoriza a componentes puros.
- **Código sugerido**:
  ```jsx
  const setParam = useCallback((key, value) => {
    // ...
  }, [setSearchParams]);
  ```

### 4. Inline styles vs Tailwind
- **Archivo:Línea**: `src/components/tickets/BulkActionsBar.jsx:39`
- **Severidad**: BAJO
- **Qué cambiar**: Usar `classList` con clases de Tailwind en lugar de mutar `style.overflow`.
- **Por qué**: Para mantener la consistencia del styling utilizando exclusivamente el sistema de Tailwind CSS.
- **Código sugerido**:
  ```jsx
  if (open) {
    document.body.classList.add('overflow-hidden');
  } else {
    document.body.classList.remove('overflow-hidden');
  }
  ```

### 5. Código duplicado entre componentes
- **Archivo:Línea**: `src/components/common/PriorityBadge.jsx:11` y `src/components/common/StatusBadge.jsx:11`
- **Severidad**: ALTO
- **Qué cambiar**: Extraer el objeto `baseClasses` a un archivo compartido.
- **Por qué**: Violación directa del principio DRY. Ambos componentes definen exactamente el mismo diccionario de clases de colores. Si se desea cambiar el tono de un color, habrá que hacerlo en múltiples lugares.
- **Código sugerido**:
  ```jsx
  // En utils/constants.js
  export const BADGE_COLORS = {
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30...',
    // ...
  };
  ```

### 6. Prop drilling excesivo
- **Archivo:Línea**: `src/pages/TicketsPage.jsx:338` y `src/components/tickets/BulkActionsBar.jsx:114`
- **Severidad**: MEDIO
- **Qué cambiar**: Pasar el objeto completo retornado por `useBulkActions` en lugar de desestructurar y pasar 7 props individuales.
- **Por qué**: Pasar tantas props relacionadas con la misma entidad ensucia la firma del componente y hace que sea frágil ante cambios en el hook.
- **Código sugerido**:
  ```jsx
  // En TicketsPage.jsx
  const bulkActions = useBulkActions();
  <BulkActionsBar actions={bulkActions} />
  ```

### 7. Dependencias faltantes en `useEffect`
- **Archivo:Línea**: `src/stores/auth.jsx:21`
- **Severidad**: MEDIO
- **Qué cambiar**: Agregar `apiKey` al arreglo de dependencias del `useEffect`.
- **Por qué**: El linter de React (exhaustive-deps) advertiría sobre esto. El efecto lee el estado `apiKey` pero no lo declara en sus dependencias, lo que puede llevar a cierres (closures) obsoletos.
- **Código sugerido**:
  ```jsx
  useEffect(() => {
    // ...
  }, [apiKey]);
  ```