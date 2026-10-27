import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase Admin client initialization.
 * Utiliza SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY exclusivamente en el servidor.
 * NUNCA se expone en el cliente ni en variables públicas (NEXT_PUBLIC_).
 */
export function getSupabaseAdmin() {
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseAdmin solo puede invocarse en el entorno del servidor.");
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";

  const secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";

  if (!supabaseUrl || !secretKey) {
    throw new Error(
      "Faltan las variables de entorno de servidor SUPABASE_URL o SUPABASE_SECRET_KEY."
    );
  }

  return createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Verifica que la petición provenga de un usuario autenticado con sesión válida
 * y con rol SUPER_ADMIN registrado en public.user_roles.
 */
export async function verifySuperAdmin(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return {
      authorized: false as const,
      status: 401,
      error: "No se proporcionó token de autenticación (Authorization header requerido).",
    };
  }

  let adminClient;
  try {
    adminClient = getSupabaseAdmin();
  } catch (err: any) {
    return {
      authorized: false as const,
      status: 500,
      error: err?.message || "Error al inicializar cliente de administración.",
    };
  }

  // 1. Validar el token JWT con Supabase Auth
  const { data: userData, error: userError } = await adminClient.auth.getUser(token);

  if (userError || !userData?.user) {
    return {
      authorized: false as const,
      status: 401,
      error: "Sesión inválida, revocada o expirada.",
    };
  }

  const user = userData.user;

  // 2. Comprobar que en public.user_roles tenga asignado 'SUPER_ADMIN'
  const { data: roles, error: rolesError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "SUPER_ADMIN");

  if (rolesError) {
    return {
      authorized: false as const,
      status: 500,
      error: "Error al verificar roles en la base de datos: " + rolesError.message,
    };
  }

  const isSuperAdmin = Boolean(roles && roles.length > 0);

  if (!isSuperAdmin) {
    return {
      authorized: false as const,
      status: 403,
      error: "Acceso denegado: Se requiere rol SUPER_ADMIN para gestionar el personal de la liga.",
    };
  }

  return {
    authorized: true as const,
    user,
    adminClient,
  };
}
