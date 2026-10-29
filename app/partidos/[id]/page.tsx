"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { publicSportsService } from "@/lib/services/publicSports";
import { TeamLogo } from "@/components/sports/TeamLogo";
import { StatusBadge } from "@/components/sports/StatusBadge";
import { MatchTimeline } from "@/components/match/MatchTimeline";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { formatTime } from "@/lib/utils";
import { Match, Team, MatchEvent, Player } from "@/types";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Share2,
  Tv,
  Radio,
  Trophy,
  Shield,
  Activity,
  Flame,
} from "lucide-react";

export default function PublicMatchPage() {
  const params = useParams();
  const matchId = params?.id as string;

  const {
    matches: storeMatches,
    teams: storeTeams,
    venues,
    matchdays,
    matchEvents: storeEvents,
    players: storePlayers,
  } = useFutsal();

  const [remoteMatch, setRemoteMatch] = useState<Match | null>(null);
  const [remoteEvents, setRemoteEvents] = useState<MatchEvent[]>([]);
  const [remoteTeams, setRemoteTeams] = useState<Team[]>([]);
  const [remotePlayers, setRemotePlayers] = useState<Player[]>([]);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (!matchId) return;
    let isMounted = true;
    Promise.all([
      publicSportsService.getPublicMatchById(matchId),
      publicSportsService.getPublicMatchEvents(matchId),
      publicSportsService.getPublicTeams(),
      publicSportsService.getPublicPlayers(),
    ]).then(([m, evs, ts, pls]) => {
      if (isMounted) {
        if (m) setRemoteMatch(m);
        if (evs && evs.length > 0) setRemoteEvents(evs);
        if (ts && ts.length > 0) setRemoteTeams(ts);
        if (pls && pls.length > 0) setRemotePlayers(pls);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [matchId]);

  const match = remoteMatch || storeMatches.find((m) => m.id === matchId) || null;
  const teams = remoteTeams.length > 0 ? remoteTeams : storeTeams;
  const matchEvents = remoteEvents.length > 0 ? remoteEvents : storeEvents;
  const players = remotePlayers.length > 0 ? remotePlayers : storePlayers;

  const homeTeam = teams.find((t) => t.id === match?.home_team_id);
  const awayTeam = teams.find((t) => t.id === match?.away_team_id);
  const venue = venues.find((v) => v.id === match?.venue_id);
  const matchday = matchdays.find((m) => m.id === match?.matchday_id);

  if (!match) {
    return (
      <div className="min-h-screen bg-[#060b14] text-white flex flex-col items-center justify-center p-6 space-y-4">
        <p className="text-slate-400 text-sm font-semibold">Partido no encontrado o no disponible en el fixture oficial.</p>
        <Link
          href="/partidos"
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors"
        >
          ← Volver a Partidos
        </Link>
      </div>
    );
  }

  const isLive = match.status === "EN_VIVO" || match.status === "DESCANSO";

  // Goals scored in this match
  const goals = matchEvents.filter(
    (e) =>
      e.match_id === match.id &&
      (e.event_type === "goal" || e.event_type === "penalty" || e.event_type === "double_penalty")
  );

  const homeGoals = goals.filter((g) => g.team_id === match.home_team_id);
  const awayGoals = goals.filter((g) => g.team_id === match.away_team_id);

  // Cards
  const cards = matchEvents.filter(
    (e) =>
      e.match_id === match.id &&
      (e.event_type === "yellow_card" || e.event_type === "red_card")
  );

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AuthGuard fallbackMessage="Verificando acceso al detalle del partido...">
      <div className="min-h-screen bg-[#060b14] text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-[#080f1d]/90 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-blue-400" />
          Volver a la portada
        </Link>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/tv/${match.id}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-blue-400 border border-slate-700 transition-colors"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Marcador TV</span>
          </Link>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            {copied ? "¡Enlace copiado!" : "Compartir"}
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-8">
        {/* Match Header Hero Card */}
        <div className="sports-card rounded-3xl p-6 md:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2 font-semibold">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>{matchday?.name} • Liga Regular FUTSALBA 2026</span>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge status={match.status} size="md" />
            </div>
          </div>

          {/* Teams & Score */}
          <div className="py-8 grid grid-cols-1 md:grid-cols-7 items-center gap-6">
            {/* Home */}
            <div className="md:col-span-3 flex flex-col items-center md:items-end text-center md:text-right">
              <TeamLogo
                name={homeTeam?.name || ""}
                logoUrl={homeTeam?.logo_url}
                primaryColor={homeTeam?.primary_color}
                size="xl"
                className="w-24 h-24 md:w-32 md:h-32 mb-3"
              />
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                {homeTeam?.name}
              </h2>
              <div className="text-xs text-slate-400 font-medium">{homeTeam?.city}</div>
              <div className="mt-2 text-xs font-bold text-slate-300">
                Faltas: {match.home_fouls} / 5
              </div>
            </div>

            {/* Score */}
            <div className="md:col-span-1 flex flex-col items-center justify-center">
              <div className="bg-[#030712] border-2 border-slate-700 rounded-3xl px-6 py-3 shadow-2xl flex items-center gap-3 font-scoreboard">
                <span className="text-4xl md:text-5xl font-black text-white">
                  {match.home_score}
                </span>
                <span className="text-2xl md:text-3xl font-black text-slate-600">:</span>
                <span className="text-4xl md:text-5xl font-black text-white">
                  {match.away_score}
                </span>
              </div>

              {isLive ? (
                <div className="mt-3 flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  {formatTime(match.match_clock_seconds)} • {String(match.period).replace("_", " ")}
                </div>

              ) : (
                <div className="mt-3 text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  {match.kickoff_time} hs
                </div>
              )}
            </div>

            {/* Away */}
            <div className="md:col-span-3 flex flex-col items-center md:items-start text-center md:text-left">
              <TeamLogo
                name={awayTeam?.name || ""}
                logoUrl={awayTeam?.logo_url}
                primaryColor={awayTeam?.primary_color}
                size="xl"
                className="w-24 h-24 md:w-32 md:h-32 mb-3"
              />
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                {awayTeam?.name}
              </h2>
              <div className="text-xs text-slate-400 font-medium">{awayTeam?.city}</div>
              <div className="mt-2 text-xs font-bold text-slate-300">
                Faltas: {match.away_fouls} / 5
              </div>
            </div>
          </div>

          {/* Goalscorers summary underneath score */}
          <div className="pt-6 border-t border-slate-800 grid grid-cols-2 gap-4 text-xs">
            {/* Home scorers */}
            <div className="text-right space-y-1">
              {homeGoals.map((g) => {
                const p = players.find((pl) => pl.id === g.player_id);
                return (
                  <div key={g.id} className="text-slate-300">
                    <span className="font-bold text-white">
                      {p?.first_name} {p?.last_name}
                    </span>{" "}
                    ({g.minute}&apos; ⚽)
                  </div>
                );
              })}
              {homeGoals.length === 0 && (
                <div className="text-slate-600 italic">Sin goles registrados</div>
              )}
            </div>

            {/* Away scorers */}
            <div className="text-left space-y-1">
              {awayGoals.map((g) => {
                const p = players.find((pl) => pl.id === g.player_id);
                return (
                  <div key={g.id} className="text-slate-300">
                    ⚽ ({g.minute}&apos;)
                    <span className="font-bold text-white ml-1">
                      {p?.first_name} {p?.last_name}
                    </span>
                  </div>
                );
              })}
              {awayGoals.length === 0 && (
                <div className="text-slate-600 italic">Sin goles registrados</div>
              )}
            </div>
          </div>

          {/* Location & Details footer */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>{venue?.name} - {venue?.address}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{match.match_date}</span>
            </div>
          </div>
        </div>

        {/* Detailed Timeline & Stats section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MatchTimeline matchId={match.id} allowDelete={false} />
          </div>

          {/* Match Quick Stats */}
          <div className="sports-card rounded-2xl p-5 border border-slate-800 space-y-4">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Estadísticas del Encuentro
            </h3>

            <div className="space-y-3 pt-2 text-xs">
              {/* Goals */}
              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>{match.home_score}</span>
                  <span className="text-slate-400">Goles</span>
                  <span>{match.away_score}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 flex overflow-hidden">
                  <div
                    className="bg-blue-500 h-full"
                    style={{
                      width: `${(match.home_score / (match.home_score + match.away_score || 1)) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-emerald-500 h-full"
                    style={{
                      width: `${(match.away_score / (match.home_score + match.away_score || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Fouls */}
              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>{match.home_fouls}</span>
                  <span className="text-slate-400">Faltas Acumuladas</span>
                  <span>{match.away_fouls}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 flex overflow-hidden">
                  <div
                    className="bg-blue-500 h-full"
                    style={{
                      width: `${(match.home_fouls / (match.home_fouls + match.away_fouls || 1)) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-emerald-500 h-full"
                    style={{
                      width: `${(match.away_fouls / (match.home_fouls + match.away_fouls || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Yellow Cards */}
              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>
                    {
                      cards.filter(
                        (c) => c.team_id === match.home_team_id && c.event_type === "yellow_card"
                      ).length
                    }
                  </span>
                  <span className="text-slate-400">Tarjetas Amarillas</span>
                  <span>
                    {
                      cards.filter(
                        (c) => c.team_id === match.away_team_id && c.event_type === "yellow_card"
                      ).length
                    }
                  </span>
                </div>
              </div>

              {/* Red Cards */}
              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>
                    {
                      cards.filter(
                        (c) => c.team_id === match.home_team_id && c.event_type === "red_card"
                      ).length
                    }
                  </span>
                  <span className="text-slate-400">Tarjetas Rojas</span>
                  <span>
                    {
                      cards.filter(
                        (c) => c.team_id === match.away_team_id && c.event_type === "red_card"
                      ).length
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </AuthGuard>
  );
}
