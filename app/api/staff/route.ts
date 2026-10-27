import { NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/supabase/admin";
import { STAFF_ASSIGNABLE_ROLES, StaffRole } from "@/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/staff
 * Lista todo el personal administrativo de la liga con sus perfiles y roles.
 * Acceso restringido exclusivamente a SUPER_ADMIN.
 */
export async function GET(request: Request) {
  const auth = await verifySuperAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { adminClient } = auth;

  try {
    // 1. Obtener perfiles de staff
    const { data: staffList, error: staffError } = await adminClient
      .from("staff_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (staffError) {
      return NextResponse.json(
        { error: "Error al consultar staff_profiles: " + staffError.message },
        { status: 500 }
      );
    }

    if (!staffList || staffList.length === 0) {
      return NextResponse.json({ staff: [] });
    }

    // 2. Obtener los roles de cada usuario desde public.user_roles
    const userIds = staffList.map((s) => s.user_id);
    const { data: rolesData, error: rolesError } = await adminClient
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    if (rolesError) {
      console.warn("Advertencia al consultar user_roles para staff:", rolesError.message);
    }

    // Mapear cada perfil con su rol asignado
    const staffWithRoles = staffList.map((staff) => {
      const userRoleEntry = rolesData?.find(
        (r) => r.user_id === staff.user_id && r.role !== "PUBLICO"
      );
      return {
        ...staff,
        role: userRoleEntry ? userRoleEntry.role : "PUBLICO",
      };
    });

    return NextResponse.json({ staff: staffWithRoles });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Error interno al obtener personal." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/staff
 * Invita a un nuevo miembro del personal de la liga y le asigna su rol administrativo.
 * Acceso restringido exclusivamente a SUPER_ADMIN.
 */
export async function POST(request: Request) {
  const auth = await verifySuperAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { adminClient } = auth;

  try {
    const body = await request.json();
    const {
      fullName,
      email,
      position,
      role,
      responsibilities = null,
      phone = null,
      status = "ACTIVO",
    } = body;

    // Validaciones estrictas
    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json(
        { error: "El nombre completo es obligatorio." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Debe proporcionar un correo electrónico válido." },
        { status: 400 }
      );
    }

    if (!position || typeof position !== "string" || !position.trim()) {
      return NextResponse.json(
        { error: "El cargo del personal es obligatorio." },
        { status: 400 }
      );
    }

    // Validar que el rol sea uno de los roles administrativos permitidos (NO SUPER_ADMIN ni PUBLICO)
    const validRoles = STAFF_ASSIGNABLE_ROLES.map((r) => r.role);
    if (!validRoles.includes(role as StaffRole)) {
      return NextResponse.json(
        {
          error: `Rol no válido. Los roles disponibles para personal son: ${validRoles.join(
            ", "
          )}. No se permite crear SUPER_ADMIN desde la interfaz.`,
        },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanFullName = fullName.trim();
    const cleanPosition = position.trim();
    const cleanStatus = status === "INACTIVO" ? "INACTIVO" : "ACTIVO";

    // 1. Invitar al usuario a través de Supabase Auth Admin
    // Envía el correo oficial para que el usuario establezca su contraseña
    let targetUserId: string | null = null;
    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(cleanEmail, {
        data: {
          full_name: cleanFullName,
        },
      });

    if (inviteError) {
      // Si el usuario ya existe en auth.users, buscamos su ID para no duplicar
      const isAlreadyRegistered =
        inviteError.message.toLowerCase().includes("already registered") ||
        inviteError.message.toLowerCase().includes("already been registered") ||
        inviteError.status === 422;

      if (isAlreadyRegistered) {
        const { data: listData } = await adminClient.auth.admin.listUsers();
        const existingUser = listData?.users.find(
          (u) => u.email?.toLowerCase() === cleanEmail
        );

        if (existingUser) {
          targetUserId = existingUser.id;
        } else {
          return NextResponse.json(
            { error: `Error al invitar al usuario: ${inviteError.message}` },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: `Error al enviar invitación: ${inviteError.message}` },
          { status: 400 }
        );
      }
    } else {
      targetUserId = inviteData.user.id;
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "No se pudo determinar el ID de usuario para la invitación." },
        { status: 500 }
      );
    }

    // 2. Almacenar información administrativa en public.staff_profiles
    const { data: savedProfile, error: profileError } = await adminClient
      .from("staff_profiles")
      .upsert(
        {
          user_id: targetUserId,
          full_name: cleanFullName,
          email: cleanEmail,
          position: cleanPosition,
          responsibilities: responsibilities ? String(responsibilities).trim() : null,
          phone: phone ? String(phone).trim() : null,
          status: cleanStatus,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: "Error al guardar perfil de personal: " + profileError.message },
        { status: 500 }
      );
    }

    // 3. Asignar el rol administrativo en public.user_roles y retirar 'PUBLICO'
    // Retirar 'PUBLICO'
    await adminClient
      .from("user_roles")
      .delete()
      .eq("user_id", targetUserId)
      .eq("role", "PUBLICO");

    // Asignar rol administrativo
    const { error: roleAssignError } = await adminClient
      .from("user_roles")
      .upsert(
        {
          user_id: targetUserId,
          role: role as StaffRole,
        },
        { onConflict: "user_id,role" }
      );

    if (roleAssignError) {
      console.error("Error al asignar rol en user_roles:", roleAssignError.message);
      return NextResponse.json(
        {
          error:
            "Perfil guardado, pero ocurrió un error al asignar el rol: " +
            roleAssignError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Personal ${cleanFullName} registrado con éxito. Se ha enviado una invitación a ${cleanEmail}.`,
      staff: {
        ...savedProfile,
        role,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Error al procesar la invitación de personal." },
      { status: 500 }
    );
  }
}
