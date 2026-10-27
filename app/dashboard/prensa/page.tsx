"use client";

import React, { useState } from "react";
import { useFutsal } from "@/lib/store/futsalStore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Newspaper, Copy, Check, Share2, Flame, Trophy, Calendar } from "lucide-react";

export default function PressRoomPage() {
  const { matches, teams, standings, players } = useFutsal();

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Featured finished or live match for instant press release
  const liveOrLatestMatch = matches.find((m) => m.id === "match-301") || matches[0];
  const home = teams.find((t) => t.id === liveOrLatestMatch?.home_team_id);
  const away = teams.find((t) => t.id === liveOrLatestMatch?.away_team_id);

  // Scorers of this match
  const matchScorersText = `Juan Pérez ⚽⚽\nCarlos Ruiz ⚽\nMiguel Torres ⚽`;

  const copyToClipboard = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Preformatted text templates ready for social media & bulletins
  const matchResultBulletin = `🏆 RESULTADO FINAL - LIGA FUTSALBA 2026
-----------------------------------------
🔥 ${home?.name} ${liveOrLatestMatch?.home_score} - ${liveOrLatestMatch?.away_score} ${away?.name}

⚽ GOLEADORES:
${matchScorersText}

📍 Cancha: Polideportivo Central
📊 Sigue todas las estadísticas y tablas en vivo por https://futsalba.org
#Futsal #FUTSALBA #FutsalArgentina #PasionPorElFutsal`;

  const standingsBulletin = `📊 TABLA DE POSICIONES - LIGA FUTSALBA 2026
-----------------------------------------
${standings
  .map((s, i) => `${i + 1}. ${s.team_name} | PJ: ${s.played} | PTS: ${s.points} | DG: ${s.goal_difference > 0 ? "+" + s.goal_difference : s.goal_difference}`)
  .join("\n")}

#Futsal #TablaDePosiciones #FUTSALBA`;

  const topScorersBulletin = `⚽ TABLA DE GOLEADORES - LIGA FUTSALBA 2026
-----------------------------------------
${players
  .filter((p) => (p.goals ?? 0) > 0)
  .sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))
  .slice(0, 5)
  .map((p, i) => `${i + 1}️⃣ ${p.first_name} ${p.last_name} (${teams.find((t) => t.id === p.team_id)?.short_name}): ${p.goals ?? 0} goles`)
  .join("\n")}


#Goleadores #Pichichi #FUTSALBA`;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Newspaper className="w-6 h-6 text-pink-400" />
              SALA DE PRENSA Y COMUNICACIÓN OFICIAL
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Gacetillas automáticas, plantillas preformateadas para redes sociales (X, Instagram, WhatsApp) y comunicados.
            </p>
          </div>
        </div>

        {/* Press cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Resultado de Partido para Redes */}
          <div className="sports-card rounded-3xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4" />
                  REPORTE DE PARTIDO
                </span>
                <span className="text-[10px] text-slate-400">Post oficial</span>
              </div>

              <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                {matchResultBulletin}
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(matchResultBulletin, "match-result")}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                copiedId === "match-result"
                  ? "bg-emerald-600 text-white"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
              }`}
            >
              {copiedId === "match-result" ? (
                <>
                  <Check className="w-4 h-4" />
                  ¡TEXTO COPIADO AL PORTAPAPELES!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  COPIAR TEXTO
                </>
              )}
            </button>
          </div>

          {/* Card 2: Clasificación Lista para Publicar */}
          <div className="sports-card rounded-3xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-black uppercase text-blue-400 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" />
                  TABLA DE POSICIONES
                </span>
                <span className="text-[10px] text-slate-400">Post oficial</span>
              </div>

              <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                {standingsBulletin}
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(standingsBulletin, "standings")}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                copiedId === "standings"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
              }`}
            >
              {copiedId === "standings" ? (
                <>
                  <Check className="w-4 h-4" />
                  ¡TEXTO COPIADO!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  COPIAR TEXTO
                </>
              )}
            </button>
          </div>

          {/* Card 3: Goleadores Lista para Publicar */}
          <div className="sports-card rounded-3xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4" />
                  TABLA DE GOLEADORES
                </span>
                <span className="text-[10px] text-slate-400">Post oficial</span>
              </div>

              <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                {topScorersBulletin}
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(topScorersBulletin, "scorers")}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                copiedId === "scorers"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
              }`}
            >
              {copiedId === "scorers" ? (
                <>
                  <Check className="w-4 h-4" />
                  ¡TEXTO COPIADO!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  COPIAR TEXTO
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
