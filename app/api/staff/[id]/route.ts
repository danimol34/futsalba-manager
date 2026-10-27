import { NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/supabase/admin";
import { STAFF_ASSIGNABLE_ROLES, StaffRole } from "@/types";

export const dynamic = "force-dynamic";

/**
 * PUT /api/staff/[id]
 * Actualiza la información administrativa o el rol de un miembro del personal.
 * Acceso restringido exclusivamente a SUPER_ADMIN.
 */
export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const targetUserId = params.id;

  const auth = await verifySuperAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { adminClient } = auth;

  try {
    const body = await request.json();
    const {
      fullName,
      position,
      responsibilities,
      phone,
      status,
      role,
    } = body;

    // Verificar que el empleado exista en staff_profiles
    const { data: currentStaff, error: fetchErr } = await adminClient
      .from("staff_profiles")
      .select("*")
      .eq("user_id", targetUserId)
      .single();

    if (fetchErr || !currentStaff) {
      return NextResponse.json(
        { error: "Miembro del personal no encontrado." },
        { status: 404 }
      );
    }

    // Proteger cuentas SUPER_ADMIN de ser alteradas desde este endpoint
    const { data: targetAdminRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", targetUserId)
      .eq("role", "SUPER_ADMIN");

    if (targetAdminRoles && targetAdminRoles.length > 0) {
      return NextResponse.json(
        {
          error:
            "Operación denegada: Las cuentas con rol SUPER_ADMIN están protegidas y no pueden modificarse desde este endpoint.",
        },
        { status: 403 }
      );
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (fullName !== undefined) {
      if (!fullName.trim()) {
        return NextResponse.json(
          { error: "El nombre completo no puede estar vacío." },
          { status: 400 }
        );
      }
      updates.full_name = fullName.trim();
    }

    if (position !== undefined) {
      if (!position.trim()) {
        return NextResponse.json(
          { error: "El cargo no puede estar vacío." },
          { status: 400 }
        );
      }
      updates.position = position.trim();
    }

    if (responsibilities !== undefined) {
      updates.responsibilities = responsibilities ? String(responsibilities).trim() : null;
    }

    if (phone !== undefined) {
      updates.phone = phone ? String(phone).trim() : null;
    }

    if (status !== undefined) {
      if (status !== "ACTIVO" && status !== "INACTIVO") {
        return NextResponse.json(
          { error: "El estado debe ser 'ACTIVO' o 'INACTIVO'." },
          { status: 400 }
        );
      }
      updates.status = status;
    }

    // 1. Actualizar staff_profiles
    const { data: updatedStaff, error: updateErr } = await adminClient
      .from("staff_profiles")
      .update(updates)
      .eq("user_id", targetUserId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json(
        { error: "Error al actualizar perfil de personal: " + updateErr.message },
        { status: 500 }
      );
    }

    // 2. Si se solicitó cambio de rol, actualizar en public.user_roles
    let finalRole = role;
    if (role) {
      const validRoles = STAFF_ASSIGNABLE_ROLES.map((r) => r.role);
      if (!validRoles.includes(role as StaffRole)) {
        return NextResponse.json(
          {
            error: `Rol no permitido. Debe ser uno de: ${validRoles.join(", ")}`,
          },
          { status: 400 }
        );
      }

      // Remover roles previos no-SUPER_ADMIN y 'PUBLICO'
      await adminClient
        .from("user_roles")
        .delete()
        .eq("user_id", targetUserId)
        .in("role", [...validRoles, "PUBLICO"]);

      // Insertar nuevo rol
      const { error: insertRoleErr } = await adminClient
        .from("user_roles")
        .insert({
          user_id: targetUserId,
          role: role as StaffRole,
        });

      if (insertRoleErr) {
        console.warn("Error al actualizar rol en user_roles:", insertRoleErr.message);
      }
    } else {
      // Consultar rol actual para devolverlo en la respuesta
      const { data: roleRow } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", targetUserId)
        .neq("role", "PUBLICO")
        .limit(1)
        .single();
      finalRole = roleRow?.role;
    }

    return NextResponse.json({
      success: true,
      message: "Personal actualizado con éxito.",
      staff: {
        ...updatedStaff,
        role: finalRole,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Error al actualizar información del personal." },
      { status: 500 }
    );
  }
}
