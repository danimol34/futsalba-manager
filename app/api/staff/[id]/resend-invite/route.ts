import { NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/staff/[id]/resend-invite
 * Reenvía el correo oficial de invitación de Supabase Auth para que el empleado
 * establezca o restablezca su contraseña.
 * Acceso restringido exclusivamente a SUPER_ADMIN.
 */
export async function POST(
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
    // 1. Obtener datos del empleado desde staff_profiles
    const { data: staff, error: fetchErr } = await adminClient
      .from("staff_profiles")
      .select("full_name, email")
      .eq("user_id", targetUserId)
      .single();

    if (fetchErr || !staff) {
      return NextResponse.json(
        { error: "Miembro del personal no encontrado." },
        { status: 404 }
      );
    }

    // 2. Reenviar invitación por correo mediante Supabase Auth Admin
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      staff.email,
      {
        data: {
          full_name: staff.full_name,
        },
      }
    );

    if (inviteError) {
      // Si el usuario ya había activado la cuenta o no admite nueva invitación directa,
      // generamos un correo de recuperación / establecimiento de contraseña
      const { error: resetError } = await adminClient.auth.resetPasswordForEmail(
        staff.email
      );

      if (resetError) {
        return NextResponse.json(
          {
            error:
              "No se pudo enviar el correo de acceso: " +
              (inviteError.message || resetError.message),
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Se ha enviado un correo de acceso/restablecimiento de contraseña a ${staff.email}.`,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Invitación oficial reenviada con éxito a ${staff.email}.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Error al reenviar invitación de personal." },
      { status: 500 }
    );
  }
}
