# Auditoría de Consistencia API-Frontend

**Proyecto**: osticket-frontend  
**Fecha**: 2026-05-08  
**Alcance**: `src/api/`, `src/hooks/`, `src/pages/`, `src/components/tickets/`, `src/utils/`

---

## 1. Contrato API — Endpoints y expectativas

| # | Método | Endpoint | Parámetros | Qué espera el frontend | Archivo |
|---|--------|----------|------------|------------------------|---------|
| 1 | GET | `/tickets` | `queue, page, limit, status, dept_id, agent_id, priority, date_from, date_to, overdue` | `{ tickets: [], total: number, pages: number }` | `tickets.js:3` |
| 2 | GET | `/tickets/:id` | — | Objeto ticket con `subject, status, priority, number, id, contact, dept, thread, assignee, created, updated, source, email` | `tickets.js:29` |
| 3 | GET | `/tickets/search` | `query, limit` | (no consumido en ningún componente) | `tickets.js:33` |
| 4 | POST | `/tickets` | body: `data` (creación) | (hook existe pero sin UI) | `tickets.js:37` |
| 5 | POST | `/tickets/:id/reply` | body: `{ message, status? }` | — (mutación, invalida queries) | `tickets.js:44` |
| 6 | POST | `/tickets/:id/notes` | body: `{ note, title? }` | — (mutación, invalida queries) | `tickets.js:51` |
| 7 | POST | `/tickets/:id/assign` | body: `{ agent_id }` | — (mutación) | `tickets.js:58` |
| 8 | POST | `/tickets/:id/transfer` | body: `{ department_id }` | — (mutación) | `tickets.js:65` |
| 9 | POST | `/tickets/:id/status` | body: `{ status }` | — (mutación) | `tickets.js:72` |
| 10 | POST | `/tickets/:id/claim` | — | — (mutación) | `tickets.js:79` |
| 11 | POST | `/tickets/:id/merge` | body: `{ source_ids }` | — (mutación) | `tickets.js:85` |
| 12 | DELETE | `/tickets/:id` | — | — (mutación) | `tickets.js:92` |
| 13 | POST | `/tickets/bulk/status` | body: `{ ids, status }` | `{ success_count, fail_count }` o `{ ok, failed }` | `tickets.js:98` |
| 14 | POST | `/tickets/bulk/assign` | body: `{ ids, agent_id }` | `{ success_count, fail_count }` o `{ ok, failed }` | `tickets.js:105` |
| 15 | POST | `/tickets/bulk/delete` | body: `{ ids }` | `{ success_count, fail_count }` o `{ ok, failed }` | `tickets.js:112` |
| 16 | POST | `/tickets/bulk/transfer` | body: `{ ids, department_id }` | `{ success_count }` o `{ ok }` | `tickets.js:119` |
| 17 | GET | `/agents` | — | `{ agents: [...] }` o `[...]` (según componente) | `agents.js:3` |
| 18 | GET | `/departments` | — | `{ departments: [...] }` o `[...]` (según componente) | `departments.js:3` |
| 19 | GET | `/users/search` | `query` | (no consumido en componentes) | `users.js:3` |
| 20 | GET | `/users/:id` | — | (no consumido en componentes) | `users.js:7` |
| 21 | GET | `/stats` | — | `{ open, closedToday, overdue, assigned, unassigned, total }` | `stats.js:3` |

---

## 2. Inconsistencias Encontradas

### CRÍTICO — Formato de respuesta de `/agents` interpretado de dos formas distintas

**Archivos involucrados**: `TicketFilters.jsx:24`, `BulkActionsBar.jsx:126` vs `TicketActions.jsx:68`

- `TicketFilters` y `BulkActionsBar` asumen: `agentsData?.agents || agentsData || []`
  - Esperan `{ agents: [...] }` o array crudo `[...]`
- `TicketActions` (línea 68) asume: `agents.data?.map(...)`
  - Espera `{ data: [...] }`

Si la API retorna `{ agents: [...] }`, **los dropdowns de asignación en `TicketActions` (vista detalle) quedarán vacíos** mientras que los de `TicketFilters` y `BulkActionsBar` funcionarán correctamente. Si retorna `{ data: [...] }` ocurre lo inverso. Si retorna array crudo `[...]`, `TicketFilters` y `BulkActionsBar` funcionan pero `TicketActions` rompe (`agents.data` es `undefined`).

### CRÍTICO — Formato de respuesta de `/departments` interpretado de dos formas distintas

**Archivos involucrados**: `TicketFilters.jsx:25`, `BulkActionsBar.jsx:127` vs `TicketActions.jsx:162`

Mismo patrón que agents:
- `TicketFilters`/`BulkActionsBar`: `deptsData?.departments || deptsData || []`
- `TicketActions`: `departments.data?.map(...)`

**Impacto**: dropdowns de transferencia en detalle de ticket rotos si el formato no es `{ data: [...] }`.

### ALTO — Campos de ticket con nombres distintos entre lista y detalle

| Campo | Lista (`/tickets`) | Detalle (`/tickets/:id`) |
|-------|-------------------|--------------------------|
| Fecha creación | `t.created_at` | `ticket.created` |
| Departamento | `t.departments[0].name` | `ticket.dept.name` |
| Contacto | `t.contacts[0].first_name/last_name` | `ticket.contact.name` |
| Agente | `t.assignee.first_name/last_name` | `ticket.assignee.name` |

Esto **no es necesariamente un bug** — es común que el endpoint de lista retorne una vista resumida y el de detalle una vista expandida. Pero debe verificarse contra el backend real para confirmar que ambos shapes están implementados.

### ALTO — Bulk operations: respuesta con campos no garantizados

**Archivo**: `BulkActionsBar.jsx:147-148`

```js
const ok = data?.success_count ?? data?.ok ?? selectedIds.length
const fail = data?.fail_count ?? data?.failed ?? 0
```

Si la API no retorna ninguno de estos campos, el frontend muestra `"N ok, 0 errores"` donde N = selectedIds.length, **falseando éxito** sin haber verificado la respuesta real. Lo mismo aplica para `bulkAssign`, `bulkDelete`, y `bulkTransfer`.

### MEDIO — `bulkTransfer` y `bulkMerge` no están cableados desde `TicketsPage`

**Archivo**: `TicketsPage.jsx:58-66`

```js
const { selectedIds, toggleSelect, selectAll, clearSelection,
  bulkStatus, bulkAssign, bulkDelete,
  // ⚠️ bulkTransfer y bulkMerge NO se desestructuran
} = useBulkActions()
```

El hook `useBulkActions` retorna `bulkTransfer` y `bulkMerge`, pero `TicketsPage` no los extrae ni los pasa a `BulkActionsBar`. `BulkActionsBar` maneja props `undefined` con un toast "no disponible aún". Esto parece intencional (features no implementadas), pero la barra de acciones muestra botones que el usuario puede presionar y recibir un error.

### MEDIO — `TicketReply` envía `{ message }`; consistencia con backend desconocida

**Archivo**: `TicketReply.jsx:92`

```js
const data = { message: message.trim() }
if (newStatus) data.status = newStatus
```

El endpoint espera un body que el API client serializa. Los nombres `message` y `status` deben coincidir con lo que espera el backend REST (`/tickets/:id/reply`). El MCP osTicket usa `content` para `sendReply` y `message` para `reply_ticket`, lo cual es inconsistente incluso en el backend.

### MEDIO — `TicketNote` envía `{ note, title? }`

**Archivo**: `TicketNote.jsx:18-20`

```js
const data = { note: note.trim() }
if (title.trim()) data.title = title.trim()
```

Similar a reply: consistencia con backend sin verificar. MCP osTicket `add_note` usa `{note, title}` así que probablemente es correcto.

---

## 3. Estados de UI No Cubiertos

### Loading

| Componente | Loading | Implementación |
|-----------|---------|---------------|
| `TicketsPage` | ✅ | `TableRowSkeleton` (8 filas animadas) |
| `TicketDetailPage` | ✅ | `DetailSkeleton` propio con layout skeleton |
| `StatsPage` | ✅ | `CardSkeletonGrid` (5 cards) |
| `TicketThread` | ❌ | Sin skeleton propio; usa el del padre |
| `TicketReply` | ✅ | Spinner en botón durante envío |
| `TicketNote` | ✅ | Spinner en botón durante envío |
| `TicketActions` | ✅ | Botones individuales con "…" durante loading |
| `BulkActionsBar` modales | ⚠️ | `disabled` en botón confirmar, sin spinner explícito |
| `TicketFilters` | ❌ | Sin skeleton mientras cargan agents/departments |

### Empty

| Componente | Empty | Implementación |
|-----------|-------|---------------|
| `TicketsPage` | ✅ | `EmptyState` con icono, título y descripción |
| `TicketDetailPage` | ✅ | Mensaje "Ticket no encontrado" + link volver |
| `TicketThread` | ✅ | "No hay mensajes en este ticket" |
| `StatsPage` | ❌ | Si `stats` es `{}`, muestra "—" en todos los valores — no hay empty state explícito |
| `TicketFilters` dropdowns | ⚠️ | Si agents/departments vacío, muestra dropdown con solo "Todos" — comportamiento aceptable |

### Error

| Componente | Error | Implementación |
|-----------|-------|---------------|
| `TicketsPage` | ✅ | Mensaje de error con `error.message` |
| `TicketDetailPage` | ✅ | Panel rojo con mensaje + link volver |
| `StatsPage` | ✅ | Panel rojo con "Error al cargar estadísticas" |
| `TicketReply` | ✅ | Toast `err.message` |
| `TicketNote` | ✅ | Toast `err.message` |
| `TicketActions` (asignar/transferir/estado/claim/merge) | ✅ | Toast individual por acción |
| `BulkActionsBar` | ✅ | Toast en cada `onError` |
| `TicketFilters` | ❌ | Si `useAgents` o `useDepartments` falla, dropdowns quedan vacíos **sin toast ni indicador de error** |

---

## 4. Manejo de Errores

### Cobertura por endpoint

| Endpoint | Hook/Mutación | Error handler | Tipo |
|----------|--------------|---------------|------|
| `listTickets` | `useTickets` | ❌ Sin `onError` en hook; el componente maneja `isError` | UI inline |
| `getTicket` | `useTicket` | ❌ Sin `onError` en hook; el componente maneja `isError` | UI inline |
| `replyTicket` | `useReplyTicket` | ✅ `catch` en `TicketReply` con toast | Toast |
| `addNote` | `useAddNote` | ✅ `catch` en `TicketNote` con toast | Toast |
| `assignTicket` | `useAssignTicket` | ✅ `catch` en `TicketActions` con toast | Toast |
| `changeStatus` | `useChangeStatus` | ✅ `catch` en `TicketActions` con toast | Toast |
| `transferTicket` | `useTransferTicket` | ✅ `catch` en `TicketActions` con toast | Toast |
| `claimTicket` | `useClaimTicket` | ✅ `catch` en `TicketActions` con toast | Toast |
| `mergeTickets` | `useMergeTickets` | ✅ `catch` en `TicketActions` con toast | Toast |
| `bulk*` (4 ops) | `useBulkActions` | ✅ `onError` en cada mutación con toast | Toast |
| `listAgents` | `useAgents` | ❌ Sin manejo de error | Silencioso |
| `listDepartments` | `useDepartments` | ❌ Sin manejo de error | Silencioso |
| `getStats` | `useQuery` inline | ✅ Componente maneja `isError` | UI inline |
| `searchUsers` | `useSearchTickets` | ❌ No consumido en UI | N/A |

### Problemas detectados:

1. **`useAgents` y `useDepartments` sin manejo de error**: Si fallan, los dropdowns de filtros y acciones quedan vacíos sin ninguna notificación al usuario. El error es completamente silencioso.
2. **`useTickets` y `useTicket` sin `onError` en hook**: Aunque los componentes manejan `isError`, no hay toast. El error solo se muestra inline, lo cual es aceptable pero inconsistente con el resto de operaciones que sí usan toast.

---

## 5. Problemas de Tipos

### Fechas

- **Strings**: Todas las fechas vienen como strings de la API y se parsean con `new Date(dateStr)` en `formatDate`/`formatDateTime`.
- **Riesgo**: Si la API retorna formatos no ISO 8601 (ej: `"DD/MM/YYYY"` o `"YYYYMMDD"`), `new Date()` producirá `Invalid Date` y se mostrará "Invalid Date" en la UI.
- **Nombres inconsistentes**: `created_at` en lista, `created` en detalle, `updated` en detalle — ver sección 2.

### IDs

- **Numbers**: Los IDs de tickets se tratan como numbers en toda la app. `ticket.id`, `selectedIds.includes(t.id)`, `parseInt` implícito.
- **Riesgo**: Si la API retorna IDs como strings (común en algunas configuraciones de osTicket), `selectedIds.includes(stringId)` con `number` vs `string` fallará (comparación estricta).
- **TicketFilters** usa `d.id` y `a.id` en `<option value={d.id}>`. Si son numbers, OK. Si son strings, se serializan correctamente a la URL.

### Enums

- **Status**: `open`, `resolved`, `closed` definidos en `STATUS_MAP` y usados consistentemente en `StatusBadge`, `TicketFilters`, `TicketReply`, `BulkActionsBar`, `TicketActions`.
  - ✅ Consistente
- **Priority**: `1-4` definidos en `PRIORITY_MAP` como keys **numéricas**. `PriorityBadge` hace `Number(priority)` antes del lookup, lo cual es correcto.
  - ✅ Robusto
- **Thread type**: `M`, `R`, `N` definidos en `TicketThread.jsx` con fallback a `M`.
  - ✅ Robusto

### Agentes: `first_name`/`last_name` vs `name`

- `TicketFilters:122`: `{a.first_name} {a.last_name}` — campo compuesto
- `BulkActionsBar:344`: `{a.first_name} {a.last_name}` — campo compuesto
- `TicketActions:70`: `agent.name || agent.email || 'Agente #${agent.id}'` — campo simple `name`
- `TicketsPage:197`: `a.first_name/last_name` desde `ticket.assignee`

⚠️ **Inconsistencia**: `TicketActions` espera `agent.name` como campo simple, mientras que `TicketFilters` y `BulkActionsBar` esperan `first_name`/`last_name` separados. Si la API de agentes retorna `first_name`/`last_name`, `TicketActions` mostrará `"Agente #123"` como fallback.

---

## 6. Resumen de Severidad

### 🔴 CRÍTICO (2)

| # | Hallazgo | Impacto |
|---|----------|---------|
| C1 | `TicketActions.jsx` interpreta agents como `data.data[]`; `TicketFilters`/`BulkActionsBar` como `data.agents[]` o array crudo | **Dropdown de asignación roto en detalle de ticket** si el formato no coincide |
| C2 | `TicketActions.jsx` interpreta departments como `data.data[]`; `TicketFilters`/`BulkActionsBar` como `data.departments[]` o array crudo | **Dropdown de transferencia roto en detalle de ticket** si el formato no coincide |

### 🟠 ALTO (3)

| # | Hallazgo | Impacto |
|---|----------|---------|
| A1 | `TicketReply` envía `{ message }` al backend — el nombre del campo debe coincidir con el endpoint REST | **Respuestas no enviadas** si el backend espera `content` o `body` |
| A2 | Campos con nombres distintos entre lista y detalle (`created_at` vs `created`; `departments[0]` vs `dept`; `contacts[0]` vs `contact`) | **Renderizado roto** si el backend no implementa ambas formas |
| A3 | Bulk responses asumen `success_count`/`fail_count` o `ok`/`failed` con fallback a `selectedIds.length` | **Falso positivo** en toast de éxito si el backend usa otros campos |

### 🟡 MEDIO (5)

| # | Hallazgo | Impacto |
|---|----------|---------|
| M1 | `useAgents` y `useDepartments` sin manejo de error | **Fallo silencioso**: dropdowns vacíos sin notificación |
| M2 | `bulkTransfer` y `bulkMerge` no cableados desde `TicketsPage` a `BulkActionsBar` | **Botones en UI que muestran "no disponible"**, experiencia confusa |
| M3 | `TicketFilters` sin estado de carga para dropdowns de agentes/departamentos | Dropdowns se llenan asíncronamente sin feedback visual |
| M4 | `TicketNote` envía `{ note }` — nombre de campo debe verificarse contra backend | **Notas no guardadas** si el backend espera `body` o `content` |
| M5 | `TicketActions` espera `agent.name` pero `TicketFilters` usa `agent.first_name`/`agent.last_name` | **Nombre de agente ausente** en sidebar de detalle si el backend no retorna `name` |

### 🟢 BAJO (5)

| # | Hallazgo | Impacto |
|---|----------|---------|
| B1 | `useSearchTickets` definido pero no consumido por ningún componente | Código muerto |
| B2 | `useCreateTicket` definido pero sin formulario de creación en la UI | Código muerto |
| B3 | `searchUsers` y `getUser` definidos pero no usados en componentes | Código muerto |
| B4 | `formatDate`/`formatDateTime` pueden fallar con formatos de fecha no ISO | Muestra "Invalid Date" |
| B5 | API key en localStorage sin cifrado | Riesgo de seguridad en entornos compartidos |

---

## 7. Recomendaciones

1. **Unificar acceso a agents/departments**: Todos los componentes deben usar el mismo patrón de acceso (ej: `data?.agents || []`). Crear un helper o normalizar en el hook `useAgents`/`useDepartments`.

2. **Verificar contratos de API contra backend real**: Ejecutar una llamada real a cada endpoint y comparar la respuesta JSON con lo que espera el frontend. Los campos `success_count`/`fail_count` de bulk operations y `message`/`note` de reply/note deben ser confirmados.

3. **Agregar manejo de error a `useAgents` y `useDepartments`**: Incluir `onError` con toast en los hooks o en los componentes que los consumen.

4. **Cablear `bulkTransfer` y `bulkMerge`** o eliminar los botones de `BulkActionsBar` hasta que estén listos.

5. **Eliminar código muerto** o implementar las features pendientes (búsqueda, creación de tickets).

6. **Normalizar formato de respuesta en hooks**: En lugar de que cada componente haga `data?.agents || data || []`, hacer esa normalización una sola vez en `useAgents` retornando siempre `{ agents: [...] }`.

---

*Reporte generado por análisis estático del frontend. No se tuvo acceso al backend real para verificar las respuestas de la API REST.*
