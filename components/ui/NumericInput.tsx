"use client";

import React, { forwardRef, useCallback } from "react";

export interface NumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
  allowNegative?: boolean;
  allowDecimal?: boolean;
}

/**
 * Componente reutilizable de entrada numérica para FUTSALBA.
 * - Elimina spinners/flechas nativas en todos los navegadores.
 * - Desactiva cambios accidentales con la rueda del ratón sin bloquear el scroll de la página.
 * - Permite copiar/pegar (Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A) y borrar (Backspace/Delete) sin bloqueos ni saltos a 0.
 * - Bloquea caracteres inválidos ('e', 'E', '+', y '-', '.', ',' cuando no corresponden).
 */
export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  (
    {
      value,
      onChange,
      onValueChange,
      allowNegative = false,
      allowDecimal = false,
      onKeyDown,
      onWheel,
      onPaste,
      className = "",
      inputMode,
      pattern,
      ...rest
    },
    ref
  ) => {
    const handleWheel = useCallback(
      (e: React.WheelEvent<HTMLInputElement>) => {
        // Al quitar el foco cuando se gira la rueda sobre el input,
        // el navegador no incrementa/decrementa el número y la página hace scroll normalmente.
        if (document.activeElement === e.currentTarget) {
          e.currentTarget.blur();
        }
        onWheel?.(e);
      },
      [onWheel]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Permitir siempre combinaciones con Ctrl, Cmd o Alt (Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z)
        if (e.ctrlKey || e.metaKey || e.altKey) {
          onKeyDown?.(e);
          return;
        }

        // Evitar que las flechas arriba/abajo cambien accidentalmente el valor como un spinner
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          onKeyDown?.(e);
          return;
        }

        const blockedKeys = ["e", "E", "+"];
        if (!allowNegative) {
          blockedKeys.push("-");
        }
        if (!allowDecimal) {
          blockedKeys.push(".", ",");
        }

        if (blockedKeys.includes(e.key)) {
          e.preventDefault();
          return;
        }

        onKeyDown?.(e);
      },
      [allowNegative, allowDecimal, onKeyDown]
    );

    const handlePaste = useCallback(
      (e: React.ClipboardEvent<HTMLInputElement>) => {
        const rawPaste = e.clipboardData?.getData("text");
        if (typeof rawPaste === "string") {
          const trimmed = rawPaste.trim();
          const validRegex = allowNegative
            ? allowDecimal
              ? /^[+-]?\d+([.,]\d+)?$/
              : /^[+-]?\d+$/
            : allowDecimal
            ? /^\+?\d+([.,]\d+)?$/
            : /^\+?\d+$/;

          // Si el texto pegado es inválido (ej. letras), impedir pegado inválido
          if (!validRegex.test(trimmed)) {
            e.preventDefault();
            return;
          }

          // Si tenía espacios alrededor o signo '+', limpiar y aplicar de inmediato
          const normalized = trimmed.replace(/^\+/, "").replace(",", ".");
          if (normalized !== rawPaste) {
            e.preventDefault();
            onValueChange?.(normalized);
            if (onChange) {
              const syntheticEvent = {
                ...e,
                target: { ...e.currentTarget, value: normalized },
                currentTarget: { ...e.currentTarget, value: normalized },
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              onChange(syntheticEvent);
            }
            return;
          }
        }
        onPaste?.(e);
      },
      [allowNegative, allowDecimal, onPaste, onValueChange, onChange]
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e);
        onValueChange?.(e.target.value);
      },
      [onChange, onValueChange]
    );

    const resolvedInputMode = inputMode || (allowDecimal ? "decimal" : "numeric");
    const resolvedPattern =
      pattern ||
      (allowNegative
        ? allowDecimal
          ? "-?[0-9]*[.,]?[0-9]*"
          : "-?[0-9]*"
        : allowDecimal
        ? "[0-9]*[.,]?[0-9]*"
        : "[0-9]*");

    return (
      <input
        ref={ref}
        type="number"
        inputMode={resolvedInputMode}
        pattern={resolvedPattern}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        onPaste={handlePaste}
        className={`no-spinners ${className}`}
        {...rest}
      />
    );
  }
);

NumericInput.displayName = "NumericInput";
