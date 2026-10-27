/**
 * Friendly Supabase & PostgreSQL Error Handler
 * Translates technical database codes (e.g. 42501, 23505, 23503) into human-friendly Spanish messages.
 * Never leaks raw technical PostgreSQL stack traces to end users.
 */

export interface FormattedError {
  title: string;
  message: string;
  isRlsError: boolean;
  code?: string;
}

export function formatSupabaseError(error: any): FormattedError {
  if (!error) {
    return {
      title: "Error inesperado",
      message: "Ocurrió un error inesperado. Intenta de nuevo.",
      isRlsError: false,
    };
  }

  const code = error.code || "";
  const details = error.details || "";
  const rawMsg = error.message || "";

  // 1. RLS Policy Violation (PostgreSQL 42501)
  if (code === "42501" || rawMsg.includes("row-level security") || rawMsg.includes("violates row-level security")) {
    return {
      title: "Permiso denegado (RLS)",
      message: "No tienes permisos para realizar esta acción. Verifica las políticas RLS en Supabase.",
      isRlsError: true,
      code: "42501",
    };
  }

  // 2. Unique Constraint Violation (PostgreSQL 23505)
  if (code === "23505" || rawMsg.includes("unique constraint") || rawMsg.includes("duplicate key")) {
    // Check if it's the player team + jersey number constraint
    if (
      details.includes("jersey_number") ||
      rawMsg.includes("jersey_number") ||
      rawMsg.includes("players_team_id_jersey_number_key")
    ) {
      return {
        title: "Dorsal duplicado",
        message: "El dorsal seleccionado ya está utilizado por otro jugador de este equipo.",
        isRlsError: false,
        code: "23505",
      };
    }

    // Check if it's team name constraint
    if (details.includes("teams_name_key") || rawMsg.includes("teams_name_key")) {
      return {
        title: "Nombre duplicado",
        message: "Ya existe un equipo registrado con este nombre.",
        isRlsError: false,
        code: "23505",
      };
    }

    // Check if it's document number constraint
    if (details.includes("document_number") || rawMsg.includes("document_number")) {
      return {
        title: "Documento duplicado",
        message: "Ya existe un jugador registrado con este número de documento.",
        isRlsError: false,
        code: "23505",
      };
    }

    return {
      title: "Registro duplicado",
      message: "Ya existe un registro con estos datos únicos.",
      isRlsError: false,
      code: "23505",
    };
  }

  // 3. Foreign Key Constraint Violation (PostgreSQL 23503)
  if (code === "23503" || rawMsg.includes("foreign key")) {
    return {
      title: "Referencia no encontrada",
      message: "El elemento seleccionado (equipo, temporada, competición, etc.) no existe o fue eliminado.",
      isRlsError: false,
      code: "23503",
    };
  }

  // 4. Check Constraint Violation (PostgreSQL 23514)
  if (code === "23514" || rawMsg.includes("check constraint")) {
    return {
      title: "Datos inválidos",
      message: "Uno o más valores no cumplen con las reglas requeridas.",
      isRlsError: false,
      code: "23514",
    };
  }

  // 5. Network / Fetch error
  if (rawMsg.includes("Failed to fetch") || rawMsg.includes("NetworkError")) {
    return {
      title: "Error de conexión",
      message: "No se pudo conectar con el servidor de Supabase. Revisa tu conexión a internet.",
      isRlsError: false,
    };
  }

  // Fallback generic friendly message
  return {
    title: "Error al guardar",
    message: rawMsg || "No se pudo completar la operación en la base de datos.",
    isRlsError: false,
    code,
  };
}
