"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Match, MatchEventType } from "@/types";
import { useFutsal } from "@/lib/store/futsalStore";
import { TeamLogo } from "../sports/TeamLogo";
import { PlayerAvatar } from "../sports/PlayerAvatar";
import { NumericInput } from "../ui/NumericInput";
import { X, Check } from "lucide-react";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  eventType: MatchEventType | null;
  currentMinute: number;
}

export const EventModal = React.memo(function EventModal({
  isOpen,
  onClose,
  match,
  eventType,
  currentMinute,
}: EventModalProps) {
  const { teams, players, addMatchEvent } = useFutsal();

  const homeTeam = useMemo(
    () => teams.find((t) => t.id === match.home_team_id),
    [teams, match.home_team_id]
  );
  const awayTeam = useMemo(
    () => teams.find((t) => t.id === match.away_team_id),
    [teams, match.away_team_id]
  );

  const [selectedTeamId, setSelectedTeamId] = useState<string>(match.home_team_id);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [secondaryPlayerId, setSecondaryPlayerId] = useState<string>("");
  const [minute, setMinute] = useState<string>(String(currentMinute || 1));
  const [second, setSecond] = useState<string>("0");
  const [notes, setNotes] = useState<string>("");
  const [step, setStep] = useState<"form" | "confirm">("form");

  useEffect(() => {
    if (isOpen) {
      setSelectedTeamId(match.home_team_id);
      setSelectedPlayerId("");
      setSecondaryPlayerId("");
      setMinute(String(currentMinute || 1));
      setSecond("0");
      setNotes("");
      setStep("form");
    }
  }, [isOpen, match.home_team_id, currentMinute]);

  const currentTeamPlayers = useMemo(
    () => players.filter((p) => p.team_id === selectedTeamId),
    [players, selectedTeamId]
  );

  if (!isOpen || !eventType) return null;

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);
  const secondaryPlayer = players.find((p) => p.id === secondaryPlayerId);
  const activeTeam = teams.find((t) => t.id === selectedTeamId);

  const parsedMinute = Math.max(1, parseInt(minute, 10) || 1);
  const parsedSecond = Math.min(59, Math.max(0, parseInt(second, 10) || 0));

  const eventLabels: Record<MatchEventType, { label: string; icon: string; color: string }> = {
    goal: { label: "GOL", icon: "⚽", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
    assist: { label: "ASISTENCIA", icon: "👟", color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
    yellow_card: { label: "TARJETA AMARILLA", icon: "🟨", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
    red_card: { label: "TARJETA ROJA (EXPULSIÓN)", icon: "🟥", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
    foul: { label: "FALTA ACUMULADA", icon: "⚠️", color: "text-orange-400 bg-orange-500/10 border-orange-500/30" },
    penalty: { label: "PENALTI (6m)", icon: "🎯", color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
    double_penalty: { label: "DOBLE PENALTI (10m)", icon: "⚡", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" },
    substitution: { label: "CAMBIO / SUSTITUCIÓN", icon: "🔄", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
    timeout: { label: "TIEMPO MUERTO", icon: "⏱️", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" },
    injury: { label: "ASISTENCIA MÉDICA / LESIÓN", icon: "🩹", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
    note: { label: "NOTA DE INCIDENCIA", icon: "📝", color: "text-slate-400 bg-slate-500/10 border-slate-500/30" },
  };

  const currentEventConfig = eventLabels[eventType];

  const handleNextToConfirm = () => {
    // Basic validation
    if (eventType !== "timeout" && eventType !== "note" && !selectedPlayerId && currentTeamPlayers.length > 0) {
      // Default to first player if none selected
      setSelectedPlayerId(currentTeamPlayers[0].id);
    }
    setStep("confirm");
  };

  const handleFinalSubmit = () => {
    addMatchEvent({
      match_id: match.id,
      team_id: selectedTeamId,
      player_id: selectedPlayerId || undefined,
      secondary_player_id: secondaryPlayerId || undefined,
      event_type: eventType,
      period: match.period,
      minute: parsedMinute,
      second: parsedSecond,
      notes,
    });

    onClose();
    setStep("form");
    setNotes("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-[#0a1222] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{currentEventConfig.icon}</span>
            <div>
              <div className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                REGISTRAR EVENTO
              </div>
              <div className="text-base font-black text-white">{currentEventConfig.label}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === "form" ? (
          <div className="p-6 space-y-5">
            {/* Step 1: Select Team */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                1. SELECCIONAR EQUIPO
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTeamId(match.home_team_id);
                    setSelectedPlayerId("");
                  }}
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                    selectedTeamId === match.home_team_id
                      ? "bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <TeamLogo
                    name={homeTeam?.name || ""}
                    logoUrl={homeTeam?.logo_url}
                    size="sm"
                  />
                  <div className="text-left">
                    <div className="font-bold text-xs">{homeTeam?.name}</div>
                    <div className="text-[10px] text-slate-400">Local</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedTeamId(match.away_team_id);
                    setSelectedPlayerId("");
                  }}
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                    selectedTeamId === match.away_team_id
                      ? "bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <TeamLogo
                    name={awayTeam?.name || ""}
                    logoUrl={awayTeam?.logo_url}
                    size="sm"
                  />
                  <div className="text-left">
                    <div className="font-bold text-xs">{awayTeam?.name}</div>
                    <div className="text-[10px] text-slate-400">Visitante</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 2: Select Player (If applies) */}
            {eventType !== "timeout" && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  {eventType === "substitution"
                    ? "2. JUGADOR QUE ENTRA"
                    : "2. JUGADOR PROTAGONISTA"}
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {currentTeamPlayers.map((p) => {
                    const isSelected = selectedPlayerId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPlayerId(p.id)}
                        className={`p-2 rounded-xl border flex items-center gap-2 text-left transition-all ${
                          isSelected
                            ? "bg-blue-600 border-blue-400 text-white font-bold"
                            : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <PlayerAvatar player={p} size="sm" showNumber={true} />
                        <div className="truncate">
                          <div className="text-xs truncate font-semibold">
                            {p.first_name} {p.last_name}
                          </div>
                          <div className="text-[10px] text-slate-400">{p.position}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Secondary player: Assist or Substitution Exit */}
            {(eventType === "goal" || eventType === "substitution") && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  {eventType === "goal"
                    ? "ASISTENCIA (OPCIONAL)"
                    : "JUGADOR QUE SALE DE CAMPO"}
                </label>
                <select
                  value={secondaryPlayerId}
                  onChange={(e) => setSecondaryPlayerId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Ninguno / Sin asistencia --</option>
                  {currentTeamPlayers
                    .filter((p) => p.id !== selectedPlayerId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.jersey_number} - {p.first_name} {p.last_name} ({p.position})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Minute & Second */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  MINUTO
                </label>
                <NumericInput
                  min={1}
                  max={60}
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-center text-sm font-bold focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  SEGUNDO
                </label>
                <NumericInput
                  min={0}
                  max={59}
                  value={second}
                  onChange={(e) => setSecond(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-center text-sm font-bold focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Observation Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                OBSERVACIONES (OPCIONAL)
              </label>
              <input
                type="text"
                placeholder="Ej: Tiro libre directo, falta reiterada, gol de penal..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleNextToConfirm}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-500/20"
              >
                Continuar a Confirmación
              </button>
            </div>
          </div>
        ) : (
          /* Confirmation Step (Requirement 46) */
          <div className="p-6 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto text-3xl">
              {currentEventConfig.icon}
            </div>

            <div>
              <h3 className="text-lg font-black text-white">
                ¿Confirmar registro de {currentEventConfig.label}?
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Se actualizará automáticamente el marcador, cronología y estadísticas.
              </p>
            </div>

            {/* Summary card */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Equipo:</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <TeamLogo name={activeTeam?.name || ""} size="sm" className="w-4 h-4 text-[8px]" />
                  {activeTeam?.name}
                </span>
              </div>

              {selectedPlayer && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Jugador:</span>
                  <span className="font-bold text-emerald-400">
                    #{selectedPlayer.jersey_number} {selectedPlayer.first_name}{" "}
                    {selectedPlayer.last_name}
                  </span>
                </div>
              )}

              {secondaryPlayer && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {eventType === "goal" ? "Asistencia:" : "Sale:"}
                  </span>
                  <span className="font-semibold text-blue-400">
                    #{secondaryPlayer.jersey_number} {secondaryPlayer.first_name}{" "}
                    {secondaryPlayer.last_name}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Tiempo:</span>
                <span className="font-mono font-bold text-white">
                  Minuto {parsedMinute}:{parsedSecond.toString().padStart(2, "0")}
                </span>
              </div>

              {notes && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Detalles:</span>
                  <span className="italic text-slate-300 truncate max-w-[200px]">{notes}</span>
                </div>
              )}
            </div>

            {/* Confirm buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                MODIFICAR
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs tracking-wider transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                CONFIRMAR REGISTRO
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
