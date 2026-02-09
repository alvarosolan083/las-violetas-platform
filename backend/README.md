# Condominio Las Violetas — Backend API

Backend (API) para la plataforma interna del **Condominio Las Violetas**, diseñada para gestionar la operación diaria del edificio (administración, comité, conserjería y residentes) y evolucionar hacia un reemplazo completo de plataformas comerciales (p. ej. ComunidadFeliz).

> Estado: **En desarrollo activo**  
> Alcance actual: **Backend (NestJS + Prisma + PostgreSQL + Redis)**

---

# 🎯 Objetivo

Construir una solución propia que permita:

- Trazabilidad y transparencia del condominio.
- Mejor control operativo mediante roles y membresías.
- Seguridad de nivel profesional.
- Base sólida para Web App + App móvil a futuro.

---

# 🧱 Stack Tecnológico

- **NestJS** (TypeScript)
- **Prisma ORM**
- **PostgreSQL**
- **Redis** (rate limiting, seguridad, performance)
- **JWT Access + Refresh** con rotación segura

---

# 🔐 Seguridad Implementada

- Login con **Access Token + Refresh Token**
- **Rotación segura** de Refresh Tokens (prevención de replay)
- **Revocación real** de sesión (logout invalidate)
- **Rate limiting por IP** usando Redis
- **CondoMemberGuard**: autorización basada en membresía por condominio

> Los detalles internos de seguridad no se documentan públicamente para evitar exposición innecesaria.

---

# 🧩 Módulos Principales

### 🔸 Autenticación
- Login
- Refresh
- Logout
- `/auth/me`

### 🔸 Condominios / Membresías
- Rol por condominio (ADMINISTRADOR, COMITE, COPROPIETARIO…)
- Protección automática de endpoints

### 🔸 Tickets
- Crear ticket por condominio
- Listado paginado con filtros:
  - `status`
  - `priority`
  - `search`
- Detalle con relaciones (`createdBy`, comentarios, adjuntos)

### 🔸 Comentarios de Ticket
- Sistema de conversación por ticket
- Auditoría por usuario
- Listado completo por ticket

---

# 🗂️ Modelos Prisma

La base de datos incluye:

- `User`
- `Condominium`
- `CondoMembership`
- `Unit`
- `Ticket`
- `TicketComment`
- `TicketAttachment`
- `Announcement`

Enums relevantes
- `Role`, `CondoRole`
- `TicketStatus`
- `TicketPriority`

---

# 🌱 Seed (Datos Iniciales)

El seed crea:

- Condominio `violetas-condo`
- Membresía ADMINISTRADOR para `admin@test.com`  
  (El usuario debe existir antes de ejecutar el seed)

Ejecutar:

```bash
pnpm db:seed