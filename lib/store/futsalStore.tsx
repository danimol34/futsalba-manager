"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Team,
  Player,
  Season,
  Competition,
  Match,
  MatchEvent,
  Venue,
  Referee,
  Matchday,
  Standing,
  StandingAdjustment,
  Sanction,
  LogisticsTask,
  LeagueSettings,
  NotificationItem,
  UserRole,
  MatchStatus,
  MatchPeriod,
  PlayerPosition,
} from "@/types";
import {
  initialSeason,
  initialCompetitions,
  initialVenues,
  initialReferees,
  initialTeams,
  initialPlayers,
  initialMatchdays,
  initialMatches,
  initialMatchEvents,
  initialLogisticsTasks,
  initialSanctions,
  initialStandingsAdjustments,
  initialLeagueSettings,
  initialNotifications,
} from "@/lib/data/initialData";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  teamsService,
  playersService,
  matchesService,
  seasonsService,
  competitionsService,
  matchdaysService,
  venuesService,
  standingsAdjustmentsService,
} from "@/lib/services";
import { isUUID } from "@/lib/utils/validators";
import { publicSportsService } from "@/lib/services/publicSports";
import {
  TeamInsert,
  TeamUpdate,
  PlayerInsert,
  PlayerUpdate,
  MatchInsert,
  MatchUpdate,
  SeasonInsert,
  SeasonUpdate,
  CompetitionInsert,
  CompetitionUpdate,
  MatchdayInsert,
  MatchdayUpdate,
  VenueInsert,
  VenueUpdate,
  settingsService,
} from "@/lib/services";
import { liveMatchService } from "@/lib/services/liveMatch";

interface FutsalContextType {
  // Auth & Roles
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  userRoles: UserRole[];
  user: any | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  retryAuth: () => void;
  login: (email: string, passwordOrRole?: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  logout: () => Promise<void>;

  // Remote Sync State
  isLoadingRemote: boolean;
  isSupabaseActive: boolean;
  refetchAll: () => Promise<void>;
  refetchTeams: () => Promise<void>;
  refetchPlayers: () => Promise<void>;
  refetchMatches: () => Promise<void>;
  refetchSeasons: () => Promise<void>;
  refetchCompetitions: () => Promise<void>;
  refetchMatchdays: () => Promise<void>;
  refetchVenues: () => Promise<void>;

  // Data Collections (Supabase as source of truth)
  teams: Team[];
  players: Player[];
  seasons: Season[];
  competitions: Competition[];
  venues: Venue[];
  referees: Referee[];
  matchdays: Matchday[];
  matches: Match[];
  matchEvents: MatchEvent[];
  logisticsTasks: LogisticsTask[];
  standings: Standing[];
  sanctions: Sanction[];
  leagueSettings: LeagueSettings;
  notifications: NotificationItem[];

  // Team Mutations (Supabase synced)
  addTeam: (team: Omit<Team, "id" | "created_at">) => Promise<Team>;
  updateTeam: (id: string, updates: Partial<Team>) => Promise<Team>;
  deleteTeam: (id: string) => Promise<void>;

  // Player Mutations (Supabase synced)
  addPlayer: (player: PlayerInsert) => Promise<Player>;
  updatePlayer: (id: string, updates: PlayerUpdate) => Promise<Player>;
  deletePlayer: (id: string) => Promise<void>;

  // Match Mutations (Supabase synced)
  addMatch: (match: MatchInsert) => Promise<Match>;
  updateMatch: (id: string, updates: MatchUpdate) => Promise<Match>;
  deleteMatch: (id: string) => Promise<void>;
  startMatch: (id: string) => Promise<Match>;
  cancelMatch: (id: string, reason?: string) => Promise<Match>;

  // Seasons, Competitions, Matchdays & Venues
  createSeason: (season: SeasonInsert) => Promise<Season>;
  updateSeason: (id: string, updates: SeasonUpdate) => Promise<Season>;
  createCompetition: (competition: CompetitionInsert) => Promise<Competition>;
  updateCompetition: (id: string, updates: CompetitionUpdate) => Promise<Competition>;
  createMatchday: (matchday: MatchdayInsert) => Promise<Matchday>;
  updateMatchday: (id: string, updates: MatchdayUpdate) => Promise<Matchday>;
  createVenue: (venue: VenueInsert) => Promise<Venue>;
  updateVenue: (id: string, updates: VenueUpdate) => Promise<Venue>;
  deleteVenue: (id: string) => Promise<void>;

  // Live Match Desk & Timer Controls
  addMatchEvent: (event: Omit<MatchEvent, "id" | "created_at">) => Promise<void>;
  deleteMatchEvent: (eventId: string) => Promise<void>;
  updateMatchClock: (matchId: string, seconds: number, isRunning: boolean) => void;
  adjustFouls: (matchId: string, team: "home" | "away", delta: number) => void;
  adjustTimeouts: (matchId: string, team: "home" | "away", delta: number) => void;
  changeMatchPeriod: (matchId: string, period: MatchPeriod) => void;
  changeMatchStatus: (matchId: string, status: MatchStatus) => void;

  // Logistics, Sanctions & League Settings
  toggleLogisticsTask: (taskId: string) => void;
  updateLogisticsTask: (taskId: string, data: Partial<LogisticsTask>) => void;
  updateSanctionStatus: (sanctionId: string, status: Sanction["status"]) => void;
  updateLeagueSettings: (settings: Partial<LeagueSettings>) => Promise<LeagueSettings>;
  refetchLeagueSettings?: () => Promise<void>;
  markNotificationAsRead: (id: string) => void;
  resetToDemoData: () => void;

  // Standings Points Adjustments (Manual RBAC)
  standingsAdjustments: StandingAdjustment[];
  addStandingAdjustment: (adj: Omit<StandingAdjustment, "id" | "created_at">) => Promise<void>;
  revertStandingAdjustment: (original: StandingAdjustment, reason: string) => Promise<void>;
  deleteStandingAdjustment: (id: string) => Promise<void>;
  refetchStandingsAdjustments: () => Promise<void>;
}

const ROLE_PRIORITY: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  PRESIDENTE: 90,
  ADMINISTRADOR: 80,
  MESA_TECNICA: 70,
  ARBITRO: 60,
  DIRECTOR_TECNICO: 50,
  LOGISTICA: 40,
  PRENSA: 30,
  PUBLICO: 10,
};

function getHighestRole(roles: UserRole[]): UserRole {
  if (!roles || roles.length === 0) return "PUBLICO";
  return [...roles].sort(
    (a, b) => (ROLE_PRIORITY[b] || 0) - (ROLE_PRIORITY[a] || 0)
  )[0];
}

async function fetchUserRolesFromDB(userId: string): Promise<UserRole[]> {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout fetching roles")), 5000)
    );

    const { data, error } = (await Promise.race([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      timeoutPromise,
    ])) as any;

    if (error) {
      console.warn("Notice: could not fetch user_roles:", error.message);
      return [];
    }

    if (data && data.length > 0) {
      const fetchedRoles = data.map((item: any) => item.role as UserRole);
      if (process.env.NODE_ENV === "development") {
        console.log(`[Auth Role Check] UID: ${userId} -> Roles found in DB:`, fetchedRoles);
      }
      return fetchedRoles;
    }
  } catch (e) {
    console.warn("Notice: exception fetching user_roles:", e);
  }
  if (process.env.NODE_ENV === "development") {
    console.log(`[Auth Role Check] UID: ${userId} -> No roles found in DB, defaulting to []`);
  }
  return [];
}

const FutsalContext = createContext<FutsalContextType | null>(null);

export function FutsalProvider({ children }: { children: React.ReactNode }) {
  const [currentUserRole, setCurrentUserRoleState] = useState<UserRole>("PUBLICO");
  const [userRoles, setUserRoles] = useState<UserRole[]>(["PUBLICO"]);
  const userRolesRef = useRef<UserRole[]>(["PUBLICO"]);
  const [user, setUser] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoadingRemote, setIsLoadingRemote] = useState<boolean>(isSupabaseConfigured);

  const setCurrentUserRole = useCallback((role: UserRole) => {
    const isDevelopment = process.env.NODE_ENV === "development";
    // En producción NUNCA se permite cambiar a un rol no asignado en user_roles
    if (!isDevelopment && !userRolesRef.current.includes(role)) {
      console.warn(`[Security RBAC] Intento denegado de asumir rol no autorizado: ${role}. Roles asignados:`, userRolesRef.current);
      return;
    }
    setCurrentUserRoleState(role);
  }, []);

  const [authRetryCount, setAuthRetryCount] = useState(0);

  const retryAuth = useCallback(() => {
    setIsAuthLoading(true);
    setAuthError(null);
    setAuthRetryCount((c) => c + 1);
  }, []);

  // Verificar sesión activa de Supabase Auth al iniciar y suscribirse a cambios de estado
  useEffect(() => {
    let isMounted = true;

    async function initAuthAndSession() {
      if (!isSupabaseConfigured) {
        setIsAuthLoading(false);
        return;
      }

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("[Auth State - Error] Supabase getSession error:", error);
          setAuthError(error.message);
        }

        if (session?.user && isMounted) {
          setUser(session.user);
          setIsAuthenticated(true);
          const roles = await fetchUserRolesFromDB(session.user.id);
          if (isMounted) {
            const finalRoles = roles.length > 0 ? roles : (["PUBLICO"] as UserRole[]);
            const highestRole = getHighestRole(finalRoles);
            userRolesRef.current = finalRoles;
            setUserRoles(finalRoles);
            setCurrentUserRoleState(highestRole);
            if (process.env.NODE_ENV === "development") {
              console.log(`[RBAC Auth Diagnostic] (Init) User: ${session.user.email} | UID: ${session.user.id} | Roles from DB: [${finalRoles.join(", ")}] | Highest Role: ${highestRole} | isAuthLoading: false`);
            }
          }
        } else if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
          userRolesRef.current = ["PUBLICO"];
          setUserRoles(["PUBLICO"] as UserRole[]);
          setCurrentUserRoleState("PUBLICO");
        }
      } catch (err: any) {
        console.error("[Auth State - Error] Session init exception:", err?.message || err);
        setAuthError(err?.message || "Ocurrió un error al cargar los datos del usuario.");
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
          console.log(`[Auth State - Finally] isAuthLoading -> false`);
        }
      }
    }

    initAuthAndSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setIsAuthLoading(true);
        setUser(session.user);
        setIsAuthenticated(true);
        const roles = await fetchUserRolesFromDB(session.user.id);
        const finalRoles = roles.length > 0 ? roles : (["PUBLICO"] as UserRole[]);
        const highestRole = getHighestRole(finalRoles);
        userRolesRef.current = finalRoles;
        setUserRoles(finalRoles);
        setCurrentUserRoleState(highestRole);
        if (process.env.NODE_ENV === "development") {
          console.log(`[RBAC Auth Diagnostic] (Change: ${event}) User: ${session.user.email} | UID: ${session.user.id} | Highest Role: ${highestRole} | Roles: [${finalRoles.join(", ")}]`);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        userRolesRef.current = ["PUBLICO"];
        setUserRoles(["PUBLICO"] as UserRole[]);
        setCurrentUserRoleState("PUBLICO");
      }
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [authRetryCount]);

  // Demo mode check: Only active in dev when NEXT_PUBLIC_ENABLE_DEMO_DATA === "true"
  const isDemoMode =
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === "true";

  // Entities
  const [seasons, setSeasons] = useState<Season[]>(isDemoMode ? [initialSeason] : []);
  const [competitions, setCompetitions] = useState<Competition[]>(isDemoMode ? initialCompetitions : []);
  const [venues, setVenues] = useState<Venue[]>(isDemoMode ? initialVenues : []);
  const [referees, setReferees] = useState<Referee[]>(isDemoMode ? initialReferees : []);
  const [teams, setTeams] = useState<Team[]>(isDemoMode ? initialTeams : []);
  const [players, setPlayers] = useState<Player[]>(isDemoMode ? initialPlayers : []);
  const [matchdays, setMatchdays] = useState<Matchday[]>(isDemoMode ? initialMatchdays : []);
  const [matches, setMatches] = useState<Match[]>(isDemoMode ? initialMatches : []);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>(isDemoMode ? initialMatchEvents : []);
  const [logisticsTasks, setLogisticsTasks] = useState<LogisticsTask[]>(isDemoMode ? initialLogisticsTasks : []);
  const [sanctions, setSanctions] = useState<Sanction[]>(isDemoMode ? initialSanctions : []);
  const [standingsAdjustments, setStandingsAdjustments] = useState<StandingAdjustment[]>(
    isDemoMode ? initialStandingsAdjustments : []
  );
  const [leagueSettings, setLeagueSettings] = useState<LeagueSettings>(initialLeagueSettings);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Refetch helper methods
  const refetchTeams = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const isSportsAdmin = userRoles.some((r) =>
        ["SUPER_ADMIN", "PRESIDENTE", "ADMINISTRADOR"].includes(r)
      );
      // PRENSA, PUBLICO y roles de consulta usan la vista segura public_teams
      const data = isSportsAdmin
        ? await teamsService.getTeams()
        : await publicSportsService.getPublicTeams();
      setTeams(data);
    } catch (e) {
      try {
        const fallback = await publicSportsService.getPublicTeams();
        setTeams(fallback);
      } catch (inner) {
        console.warn("Notice: could not refetch teams from Supabase:", inner);
      }
    }
  }, [userRoles]);

  const refetchPlayers = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const canReadSensitive = userRoles.some((r) =>
        ["SUPER_ADMIN", "PRESIDENTE", "ADMINISTRADOR", "MESA_TECNICA"].includes(r)
      );
      // PRENSA, PUBLICO y roles sin permiso sobre DNI usan public_players
      const data = canReadSensitive
        ? await playersService.getPlayers()
        : await publicSportsService.getPublicPlayers();
      setPlayers(data);
    } catch (e) {
      try {
        const fallback = await publicSportsService.getPublicPlayers();
        setPlayers(fallback);
      } catch (inner) {
        console.warn("Notice: could not refetch players from Supabase:", inner);
      }
    }
  }, [userRoles]);

  const refetchMatches = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const canManage = userRoles.some((r) =>
        ["SUPER_ADMIN", "PRESIDENTE", "ADMINISTRADOR", "MESA_TECNICA"].includes(r)
      );
      // PRENSA y otros roles usan public_matches sin notas de mesa
      const data = canManage
        ? await matchesService.getMatches()
        : await publicSportsService.getPublicMatches();
      setMatches(data);
    } catch (e) {
      try {
        const fallback = await publicSportsService.getPublicMatches();
        setMatches(fallback);
      } catch (inner) {
        console.warn("Notice: could not refetch matches from Supabase:", inner);
      }
    }
  }, [userRoles]);

  const refetchStandingsAdjustments = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const isPrensa = userRoles.includes("PRENSA") && !userRoles.some((r) =>
        ["SUPER_ADMIN", "PRESIDENTE", "ADMINISTRADOR", "MESA_TECNICA"].includes(r)
      );
      const data = await standingsAdjustmentsService.getAdjustments(isPrensa);
      setStandingsAdjustments(data);
    } catch (e) {
      console.warn("Notice: could not refetch standings adjustments:", e);
    }
  }, [userRoles]);

  const refetchSeasons = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const data = await seasonsService.getSeasons();
      setSeasons(data);
    } catch (e) {
      console.warn("Notice: could not refetch seasons from Supabase:", e);
    }
  }, []);

  const refetchCompetitions = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const data = await competitionsService.getCompetitions();
      setCompetitions(data);
    } catch (e) {
      console.warn("Notice: could not refetch competitions from Supabase:", e);
    }
  }, []);

  const refetchMatchdays = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const data = await matchdaysService.getMatchdays();
      setMatchdays(data);
    } catch (e) {
      console.warn("Notice: could not refetch matchdays from Supabase:", e);
    }
  }, []);

  const refetchVenues = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const data = await venuesService.getVenues();
      setVenues(data);
    } catch (e) {
      console.warn("Notice: could not refetch venues from Supabase:", e);
    }
  }, []);

  const refetchLeagueSettings = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const data = await settingsService.getLeagueSettings();
      if (data) {
        setLeagueSettings(data);
      }
    } catch (e) {
      console.warn("Notice: could not refetch league_settings from Supabase:", e);
    }
  }, []);

  const refetchAll = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setIsLoadingRemote(true);
    try {
      await Promise.allSettled([
        refetchTeams(),
        refetchPlayers(),
        refetchMatches(),
        refetchSeasons(),
        refetchCompetitions(),
        refetchMatchdays(),
        refetchVenues(),
        refetchLeagueSettings(),
        refetchStandingsAdjustments(),
      ]);
    } finally {
      setIsLoadingRemote(false);
    }
  }, [
    refetchTeams,
    refetchPlayers,
    refetchMatches,
    refetchSeasons,
    refetchCompetitions,
    refetchMatchdays,
    refetchVenues,
    refetchLeagueSettings,
    refetchStandingsAdjustments,
  ]);

  // Initial load from Supabase on mount (Supabase is source of truth)
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoadingRemote(false);
      return;
    }

    let isMounted = true;
    async function initSupabaseData() {
      setIsLoadingRemote(true);
      try {
        const isStaff = userRoles.some((r) => r !== "PUBLICO");
        const [
          teamsRes,
          playersRes,
          matchesRes,
          seasonsRes,
          competitionsRes,
          matchdaysRes,
          venuesRes,
          settingsRes,
        ] = await Promise.allSettled([
          isStaff ? teamsService.getTeams() : publicSportsService.getPublicTeams(),
          isStaff ? playersService.getPlayers() : publicSportsService.getPublicPlayers(),
          isStaff ? matchesService.getMatches() : publicSportsService.getPublicMatches(),
          seasonsService.getSeasons(),
          competitionsService.getCompetitions(),
          matchdaysService.getMatchdays(),
          venuesService.getVenues(),
          settingsService.getLeagueSettings(),
        ]);

        if (!isMounted) return;

        // Populate with live database contents
        if (teamsRes.status === "fulfilled") {
          setTeams(teamsRes.value);
        }
        if (playersRes.status === "fulfilled") {
          setPlayers(playersRes.value);
        }
        if (matchesRes.status === "fulfilled") {
          setMatches(matchesRes.value);
        }
        let loadedSeasons = seasons;
        if (seasonsRes.status === "fulfilled" && seasonsRes.value.length > 0) {
          loadedSeasons = seasonsRes.value;
          setSeasons(loadedSeasons);
        }
        if (competitionsRes.status === "fulfilled") {
          setCompetitions(competitionsRes.value);
        }
        if (matchdaysRes.status === "fulfilled") {
          setMatchdays(matchdaysRes.value);
        }
        if (venuesRes.status === "fulfilled") {
          setVenues(venuesRes.value);
        }
        if (settingsRes.status === "fulfilled" && settingsRes.value) {
          const loadedSettings = { ...settingsRes.value };
          // Si no tiene active_season_id con UUID válido, vincular a la temporada activa real cargada desde Supabase
          if (!isUUID(loadedSettings.active_season_id)) {
            const activeSeason =
              loadedSeasons.find((s) => s.status === "ACTIVA" && isUUID(s.id)) ||
              loadedSeasons.find((s) => isUUID(s.id));
            if (activeSeason) {
              loadedSettings.active_season_id = activeSeason.id;
            }
          }
          setLeagueSettings(loadedSettings);
        }
      } catch (err) {
        console.warn("Notice: Initial sync error from Supabase:", err);
      } finally {
        if (isMounted) setIsLoadingRemote(false);
      }
    }

    initSupabaseData();

    return () => {
      isMounted = false;
    };
  }, [userRoles]);

  // Supabase Realtime channel for live updates
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel("futsalba-sync-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        () => {
          refetchTeams();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        () => {
          refetchPlayers();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => {
          refetchMatches();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_events" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newEv = payload.new as MatchEvent;
            setMatchEvents((prev) => [...prev, newEv]);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "seasons" },
        () => {
          refetchSeasons();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "competitions" },
        () => {
          refetchCompetitions();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "venues" },
        () => {
          refetchVenues();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    refetchTeams,
    refetchPlayers,
    refetchMatches,
    refetchSeasons,
    refetchCompetitions,
    refetchVenues,
  ]);

  // Live match clock runner (1 second interval)
  useEffect(() => {
    const interval = setInterval(() => {
      setMatches((prev) => {
        let changed = false;
        const next = prev.map((m) => {
          if (
            m.is_clock_running &&
            m.status === "EN_VIVO" &&
            m.match_clock_seconds > 0
          ) {
            changed = true;
            return {
              ...m,
              match_clock_seconds: m.match_clock_seconds - 1,
            };
          }
          return m;
        });
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Standings dynamically computed from matches & teams
  const standings = useMemo<Standing[]>(() => {
    const standingsMap = new Map<string, Standing>();

    teams.forEach((team) => {
      standingsMap.set(team.id, {
        team_id: team.id,
        team_name: team.name,
        team_short: team.short_name,
        logo_url: team.logo_url,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        match_points: 0,
        points_adjustment: 0,
        points: 0,
        form: [],
      });
    });

    matches.forEach((match) => {
      if (match.status === "FINALIZADO" || match.status === "EN_VIVO") {
        const home = standingsMap.get(match.home_team_id);
        const away = standingsMap.get(match.away_team_id);

        if (home && away) {
          home.played += 1;
          away.played += 1;
          home.goals_for += match.home_score;
          home.goals_against += match.away_score;
          away.goals_for += match.away_score;
          away.goals_against += match.home_score;

          if (match.home_score > match.away_score) {
            home.won += 1;
            home.match_points = (home.match_points || 0) + (leagueSettings.points_for_win ?? 3);
            away.lost += 1;
            away.match_points = (away.match_points || 0) + (leagueSettings.points_for_loss ?? 0);
            home.form?.unshift("W");
            away.form?.unshift("L");
          } else if (match.home_score === match.away_score) {
            home.drawn += 1;
            home.match_points = (home.match_points || 0) + (leagueSettings.points_for_draw ?? 1);
            away.drawn += 1;
            away.match_points = (away.match_points || 0) + (leagueSettings.points_for_draw ?? 1);
            home.form?.unshift("D");
            away.form?.unshift("D");
          } else {
            away.won += 1;
            away.match_points = (away.match_points || 0) + (leagueSettings.points_for_win ?? 3);
            home.lost += 1;
            home.match_points = (home.match_points || 0) + (leagueSettings.points_for_loss ?? 0);
            away.form?.unshift("W");
            home.form?.unshift("L");
          }

          home.goal_difference = home.goals_for - home.goals_against;
          away.goal_difference = away.goals_for - away.goals_against;
        }
      }
    });

    // Aplicar ajustes administrativos reglamentarios
    // Verificar que los ajustes pertenezcan a la temporada activa y no se mezclen entre distintas temporadas
    const activeSeasonId = isUUID(leagueSettings.active_season_id)
      ? leagueSettings.active_season_id
      : null;

    standingsAdjustments.forEach((adj) => {
      // Si el ajuste tiene season_id y hay temporada activa, no mezclar ajustes de otras temporadas
      if (adj.season_id && activeSeasonId && adj.season_id !== activeSeasonId) {
        return;
      }
      const entry = standingsMap.get(adj.team_id);
      if (entry) {
        entry.points_adjustment = (entry.points_adjustment || 0) + adj.points_delta;
      }
    });

    // Puntos oficiales = puntos obtenidos en partidos + suma de ajustes
    standingsMap.forEach((entry) => {
      entry.points = (entry.match_points || 0) + (entry.points_adjustment || 0);
    });

    const result = Array.from(standingsMap.values());
    result.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goal_difference !== a.goal_difference)
        return b.goal_difference - a.goal_difference;
      return b.goals_for - a.goals_for;
    });

    return result;
  }, [teams, matches, leagueSettings, standingsAdjustments]);

  // Auth methods: Real Supabase Auth signInWithPassword
  const login = async (
    email: string,
    passwordOrRole?: string
  ): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
    if (!isSupabaseConfigured) {
      setIsAuthenticated(true);
      if (
        passwordOrRole &&
        [
          "SUPER_ADMIN",
          "PRESIDENTE",
          "ADMINISTRADOR",
          "MESA_TECNICA",
          "ARBITRO",
          "DIRECTOR_TECNICO",
          "LOGISTICA",
          "PRENSA",
          "PUBLICO",
        ].includes(passwordOrRole)
      ) {
        setCurrentUserRole(passwordOrRole as UserRole);
        return { success: true, role: passwordOrRole as UserRole };
      }
      return { success: true, role: "PUBLICO" };
    }

    if (!passwordOrRole) {
      return { success: false, error: "Por favor introduce tu contraseña." };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: passwordOrRole,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      let assignedRole: UserRole = "PUBLICO";

      if (data?.session?.user) {
        setUser(data.session.user);
        setIsAuthenticated(true);
        const roles = await fetchUserRolesFromDB(data.session.user.id);
        const finalRoles = roles.length > 0 ? roles : (["PUBLICO"] as UserRole[]);
        const highestRole = getHighestRole(finalRoles);
        userRolesRef.current = finalRoles;
        setUserRoles(finalRoles);
        setCurrentUserRoleState(highestRole);
        assignedRole = highestRole;
        if (process.env.NODE_ENV === "development") {
          console.log(`[RBAC Auth Diagnostic] (Login) User ID: ${data.session.user.id} | Email: ${data.session.user.email} | Roles found: [${finalRoles.join(", ")}] | Highest role assigned: ${highestRole}`);
        }
      }

      return { success: true, role: assignedRole };
    } catch (e: any) {
      return { success: false, error: e?.message || "Error al iniciar sesión." };
    }
  };

  const logout = async (): Promise<void> => {
    userRolesRef.current = ["PUBLICO"];
    setUserRoles(["PUBLICO"] as UserRole[]);
    setCurrentUserRoleState("PUBLICO");
    setUser(null);
    setIsAuthenticated(false);
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn("Notice: Error signing out:", e);
      }
    }
  };

  // TEAM MUTATIONS (Supabase source of truth)
  const addTeam = async (teamData: Omit<Team, "id" | "created_at">): Promise<Team> => {
    if (isSupabaseConfigured) {
      const created = await teamsService.createTeam(teamData);
      setTeams((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
      return created;
    }
    const localTeam: Team = {
      ...teamData,
      id: `team-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setTeams((prev) => [localTeam, ...prev]);
    return localTeam;
  };

  const updateTeam = async (id: string, updates: Partial<Team>): Promise<Team> => {
    if (isSupabaseConfigured) {
      const updated = await teamsService.updateTeam(id, updates);
      setTeams((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    }
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    const found = teams.find((t) => t.id === id);
    return { ...(found || {}), ...updates } as Team;
  };

  const deleteTeam = async (id: string): Promise<void> => {
    if (isSupabaseConfigured) {
      await teamsService.deleteTeam(id);
    }
    setTeams((prev) => prev.filter((t) => t.id !== id));
  };

  // PLAYER MUTATIONS (Supabase source of truth)
  const addPlayer = async (playerData: PlayerInsert): Promise<Player> => {
    if (isSupabaseConfigured) {
      const created = await playersService.createPlayer(playerData);
      setPlayers((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
      return created;
    }
    const localPlayer: Player = {
      ...playerData,
      id: `player-${Date.now()}`,
      matches_played: 0,
      goals: 0,
      assists: 0,
      yellow_cards: 0,
      red_cards: 0,
      created_at: new Date().toISOString(),
    };
    setPlayers((prev) => [localPlayer, ...prev]);
    return localPlayer;
  };

  const updatePlayer = async (id: string, updates: PlayerUpdate): Promise<Player> => {
    if (isSupabaseConfigured) {
      const updated = await playersService.updatePlayer(id, updates);
      setPlayers((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    }
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    const found = players.find((p) => p.id === id);
    return { ...(found || {}), ...updates } as Player;
  };

  const deletePlayer = async (id: string): Promise<void> => {
    if (isSupabaseConfigured) {
      await playersService.deletePlayer(id);
    }
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  // MATCH MUTATIONS (Supabase source of truth)
  const addMatch = async (matchData: MatchInsert): Promise<Match> => {
    if (isSupabaseConfigured) {
      const created = await matchesService.createMatch(matchData);
      setMatches((prev) => [created, ...prev.filter((m) => m.id !== created.id)]);
      return created;
    }
    const localMatch: Match = {
      id: `match-${Date.now()}`,
      home_team_id: matchData.home_team_id,
      away_team_id: matchData.away_team_id,
      match_date: matchData.match_date,
      kickoff_time: matchData.kickoff_time || "19:00:00",
      status: "PROGRAMADO",
      home_score: 0,
      away_score: 0,
      home_fouls: 0,
      away_fouls: 0,
      home_timeouts: 0,
      away_timeouts: 0,
      period: 1,
      match_clock_seconds: 1200,
      created_at: new Date().toISOString(),
    };
    setMatches((prev) => [localMatch, ...prev]);
    return localMatch;
  };

  const updateMatch = async (id: string, updates: MatchUpdate): Promise<Match> => {
    if (isSupabaseConfigured) {
      const updated = await matchesService.updateMatch(id, updates);
      setMatches((prev) => prev.map((m) => (m.id === id ? updated : m)));
      return updated;
    }
    setMatches((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates, updated_at: new Date().toISOString() } : m))
    );
    const found = matches.find((m) => m.id === id);
    return { ...(found || {}), ...updates } as Match;
  };

  const deleteMatch = async (id: string): Promise<void> => {
    if (isSupabaseConfigured) {
      await matchesService.deleteMatch(id);
    }
    setMatches((prev) => prev.filter((m) => m.id !== id));
  };

  const startMatch = async (id: string): Promise<Match> => {
    return updateMatch(id, {
      status: "EN_VIVO",
      is_clock_running: true,
      period: 1,
    });
  };

  const cancelMatch = async (id: string, reason?: string): Promise<Match> => {
    return updateMatch(id, {
      status: "CANCELADO",
      is_clock_running: false,
      notes: reason ? `Cancelado: ${reason}` : "Partido cancelado",
    });
  };

  // SEASONS, COMPETITIONS, MATCHDAYS & VENUES
  const createSeason = async (seasonData: SeasonInsert): Promise<Season> => {
    if (isSupabaseConfigured) {
      const created = await seasonsService.createSeason(seasonData);
      setSeasons((prev) => [created, ...prev]);
      return created;
    }
    const local: Season = {
      id: `season-${Date.now()}`,
      name: seasonData.name,
      start_date: seasonData.start_date || undefined,
      end_date: seasonData.end_date || undefined,
      status: seasonData.status || "BORRADOR",
    };
    setSeasons((prev) => [local, ...prev]);
    return local;
  };

  const updateSeason = async (id: string, updates: SeasonUpdate): Promise<Season> => {
    if (isSupabaseConfigured) {
      const updated = await seasonsService.updateSeason(id, updates);
      setSeasons((prev) => prev.map((s) => (s.id === id ? updated : s)));
      return updated;
    }
    setSeasons((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    const found = seasons.find((s) => s.id === id);
    return { ...(found || {}), ...updates } as Season;
  };

  const createCompetition = async (compData: CompetitionInsert): Promise<Competition> => {
    if (isSupabaseConfigured) {
      const created = await competitionsService.createCompetition(compData);
      setCompetitions((prev) => [created, ...prev]);
      return created;
    }
    const local: Competition = {
      id: `comp-${Date.now()}`,
      season_id: compData.season_id || undefined,
      name: compData.name,
      competition_type: compData.competition_type || "LIGA",
      format: compData.format || "TODOS_CONTRA_TODOS",
      number_of_teams: compData.number_of_teams || 8,
      status: compData.status ?? true,
    };
    setCompetitions((prev) => [local, ...prev]);
    return local;
  };

  const updateCompetition = async (id: string, updates: CompetitionUpdate): Promise<Competition> => {
    if (isSupabaseConfigured) {
      const updated = await competitionsService.updateCompetition(id, updates);
      setCompetitions((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return updated;
    }
    setCompetitions((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    const found = competitions.find((c) => c.id === id);
    return { ...(found || {}), ...updates } as Competition;
  };

  const createMatchday = async (mdData: MatchdayInsert): Promise<Matchday> => {
    if (isSupabaseConfigured) {
      const created = await matchdaysService.createMatchday(mdData);
      setMatchdays((prev) => [created, ...prev]);
      return created;
    }
    const local: Matchday = {
      id: `md-${Date.now()}`,
      competition_id: mdData.competition_id,
      name: mdData.name,
      matchday_number: mdData.matchday_number || 1,
      start_date: mdData.start_date || undefined,
      end_date: mdData.end_date || undefined,
    };
    setMatchdays((prev) => [local, ...prev]);
    return local;
  };

  const updateMatchday = async (id: string, updates: MatchdayUpdate): Promise<Matchday> => {
    if (isSupabaseConfigured) {
      const updated = await matchdaysService.updateMatchday(id, updates);
      setMatchdays((prev) => prev.map((m) => (m.id === id ? updated : m)));
      return updated;
    }
    setMatchdays((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    const found = matchdays.find((m) => m.id === id);
    return { ...(found || {}), ...updates } as Matchday;
  };

  const createVenue = async (venueData: VenueInsert): Promise<Venue> => {
    if (isSupabaseConfigured) {
      const created = await venuesService.createVenue(venueData);
      setVenues((prev) => [created, ...prev]);
      return created;
    }
    const local: Venue = {
      id: `venue-${Date.now()}`,
      name: venueData.name,
      address: venueData.address || undefined,
      capacity: venueData.capacity || 0,
      surface_type: venueData.surface_type || "PARQUET",
      status: venueData.status ?? true,
    };
    setVenues((prev) => [local, ...prev]);
    return local;
  };

  const updateVenue = async (id: string, updates: VenueUpdate): Promise<Venue> => {
    if (isSupabaseConfigured) {
      const updated = await venuesService.updateVenue(id, updates);
      setVenues((prev) => prev.map((v) => (v.id === id ? updated : v)));
      return updated;
    }
    setVenues((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
    const found = venues.find((v) => v.id === id);
    return { ...(found || {}), ...updates } as Venue;
  };

  const deleteVenue = async (id: string): Promise<void> => {
    if (isSupabaseConfigured) {
      await venuesService.deleteVenue(id);
    }
    setVenues((prev) => prev.filter((v) => v.id !== id));
  };

  // LIVE MATCH EVENTS
  const addMatchEvent = useCallback(
    async (eventData: Omit<MatchEvent, "id" | "created_at">) => {
      if (isSupabaseConfigured) {
        try {
          const result = await liveMatchService.registerEvent({
            match_id: eventData.match_id,
            team_id: eventData.team_id || "",
            player_id: eventData.player_id,
            secondary_player_id: eventData.secondary_player_id,
            event_type: eventData.event_type,
            period: eventData.period || 1,
            minute: eventData.minute || 0,
            second: eventData.second || 0,
            notes: eventData.notes,
            client_event_id: crypto.randomUUID(),
          });
          
          if (result && result.success) {
            if (result.event) {
              setMatchEvents((prev) => [...prev.filter(e => e.id !== result.event.id), result.event]);
            }
            setMatches((prev) => prev.map((m) => (m.id === eventData.match_id ? { 
              ...m, 
              home_score: result.home_score,
              away_score: result.away_score,
              home_fouls: result.home_fouls,
              away_fouls: result.away_fouls,
              status: result.status,
              period: result.period,
              home_timeouts: result.home_timeouts,
              away_timeouts: result.away_timeouts
            } : m)));
          }
        } catch (err) {
          console.warn("Supabase match event RPC error:", err);
        }
      } else {
        // Fallback local
        const newEvent: MatchEvent = {
          ...eventData,
          id: `ev-${Date.now()}`,
          created_at: new Date().toISOString(),
        };
        setMatchEvents((prev) => [...prev, newEvent]);
      }
    },
    []
  );

  const deleteMatchEvent = async (eventId: string) => {
    if (isSupabaseConfigured) {
      try {
        const result = await liveMatchService.deleteEvent(eventId);
        setMatchEvents((prev) => prev.filter((e) => e.id !== eventId));
        if (result && result.success) {
          // No tenemos el id del match directamente aquí en el eventId, pero asumimos que actualizará el correcto vía filter
          // O podemos hacerlo genérico:
          setMatches((prev) => prev.map((m) => {
            // Como delete_event no devuelve match_id, podemos buscar el match que tenía el evento.
            // Para simplicidad, actualizamos todos los que correspondan (en la práctica solo hay 1)
            const ev = matchEvents.find(e => e.id === eventId);
            if (ev && m.id === ev.match_id) {
               return { 
                ...m, 
                home_score: result.home_score,
                away_score: result.away_score,
                home_fouls: result.home_fouls,
                away_fouls: result.away_fouls,
                status: result.status,
                period: result.period,
                home_timeouts: result.home_timeouts,
                away_timeouts: result.away_timeouts
              };
            }
            return m;
          }));
        }
      } catch (err) {
        console.warn("Supabase match event delete RPC error:", err);
      }
    } else {
      setMatchEvents((prev) => prev.filter((e) => e.id !== eventId));
    }
  };

  const updateMatchClock = async (matchId: string, seconds: number, isRunning: boolean) => {
    // Update local optimistic state first for quick UI feel
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, match_clock_seconds: seconds, is_clock_running: isRunning }
          : m
      )
    );
    if (isSupabaseConfigured) {
      try {
        const result = await liveMatchService.updateClock(matchId, isRunning ? 'RUNNING' : 'PAUSED', seconds);
        if (result && result.success) {
           // We could update exactly with result.clock_last_started_at etc.
        }
      } catch (e) {}
    }
  };

  const adjustFouls = (matchId: string, team: "home" | "away", delta: number) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        const current = team === "home" ? m.home_fouls : m.away_fouls;
        const nextVal = Math.max(0, current + delta);
        const updates = team === "home" ? { home_fouls: nextVal } : { away_fouls: nextVal };

        if (isSupabaseConfigured) {
          supabase.from("matches").update(updates).eq("id", matchId).then(() => {}, () => {});
        }
        return { ...m, ...updates };
      })
    );
  };

  const adjustTimeouts = (matchId: string, team: "home" | "away", delta: number) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        const current = team === "home" ? m.home_timeouts : m.away_timeouts;
        const nextVal = Math.max(0, current + delta);
        const updates = team === "home" ? { home_timeouts: nextVal } : { away_timeouts: nextVal };

        if (isSupabaseConfigured) {
          supabase.from("matches").update(updates).eq("id", matchId).then(() => {}, () => {});
        }
        return { ...m, ...updates };
      })
    );
  };

  const changeMatchPeriod = async (matchId: string, period: MatchPeriod) => {
    let seconds = 1200;
    if (period === "DESCANSO") seconds = 600;
    if (period === "PRORROGA_1" || period === "PRORROGA_2") seconds = 300;

    // Optimistic
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        return {
          ...m,
          period,
          match_clock_seconds: seconds,
          is_clock_running: false,
          home_fouls: period === "SEGUNDO_TIEMPO" ? 0 : m.home_fouls,
          away_fouls: period === "SEGUNDO_TIEMPO" ? 0 : m.away_fouls,
        };
      })
    );

    if (isSupabaseConfigured) {
       try {
         const periodNum = period === "SEGUNDO_TIEMPO" ? 2 : 1;
         await liveMatchService.changeMatchStatus(matchId, period === "DESCANSO" ? "DESCANSO" : "EN_VIVO", periodNum);
         await liveMatchService.updateClock(matchId, 'PAUSED', seconds);
       } catch (e) {}
    }
  };

  const changeMatchStatus = async (matchId: string, status: MatchStatus) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, status, is_clock_running: false } : m))
    );
    if (isSupabaseConfigured) {
       try {
         const result = await liveMatchService.changeMatchStatus(matchId, status);
         if (result && result.success) {
            setMatches((prev) => prev.map(m => m.id === matchId ? { 
              ...m, 
              status: result.status, 
              period: result.period,
              home_fouls: result.home_fouls,
              away_fouls: result.away_fouls
            } : m));
         }
       } catch (e) {}
    }
  };

  // LOGISTICS, SANCTIONS, SETTINGS
  const toggleLogisticsTask = (taskId: string) => {
    setLogisticsTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const updateLogisticsTask = (taskId: string, data: Partial<LogisticsTask>) => {
    setLogisticsTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...data } : t))
    );
  };

  const updateSanctionStatus = (sanctionId: string, status: Sanction["status"]) => {
    setSanctions((prev) =>
      prev.map((s) => (s.id === sanctionId ? { ...s, status } : s))
    );
  };

  const updateLeagueSettings = async (settings: Partial<LeagueSettings>): Promise<LeagueSettings> => {
    if (isSupabaseConfigured) {
      const updated = await settingsService.updateLeagueSettings(settings);
      setLeagueSettings(updated);
      return updated;
    }
    const local = { ...leagueSettings, ...settings };
    setLeagueSettings(local);
    return local;
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const resetToDemoData = () => {
    setTeams(initialTeams);
    setPlayers(initialPlayers);
    setMatches(initialMatches);
    setMatchdays(initialMatchdays);
    setVenues(initialVenues);
    setSeasons([initialSeason]);
    setCompetitions(initialCompetitions);
    setStandingsAdjustments(initialStandingsAdjustments);
    setLeagueSettings(initialLeagueSettings);
  };

  const addStandingAdjustment = async (
    adj: Omit<StandingAdjustment, "id" | "created_at">
  ) => {
    if (isSupabaseConfigured) {
      if (!isUUID(adj.team_id)) {
        throw new Error("El equipo seleccionado debe tener un identificador UUID válido.");
      }
      if (!isUUID(adj.season_id)) {
        throw new Error("Debes seleccionar una temporada válida con UUID real antes de registrar el ajuste.");
      }
      if (!isUUID(adj.competition_id)) {
        throw new Error("Debes seleccionar una competición válida con UUID real antes de registrar el ajuste.");
      }

      await standingsAdjustmentsService.createAdjustment({
        team_id: adj.team_id,
        competition_id: adj.competition_id,
        season_id: adj.season_id,
        points_delta: adj.points_delta,
        reason: adj.reason,
        created_by: isUUID(user?.id) ? user.id : null,
      });
      await refetchStandingsAdjustments();
    } else {
      const team = teams.find((t) => t.id === adj.team_id);
      const newAdj: StandingAdjustment = {
        id: `adj-${Date.now()}`,
        team_id: adj.team_id,
        team_name: team?.name || adj.team_name,
        competition_id: adj.competition_id,
        season_id: adj.season_id,
        points_delta: adj.points_delta,
        reason: adj.reason,
        created_by: user?.id || "admin-local",
        created_by_name: user?.email || "Administrador",
        created_by_email: user?.email || "admin@futsalba.org",
        created_at: new Date().toISOString(),
      };
      setStandingsAdjustments((prev) => [newAdj, ...prev]);
    }
  };

  const revertStandingAdjustment = async (
    original: StandingAdjustment,
    reason: string
  ) => {
    if (isSupabaseConfigured) {
      if (!isUUID(original.team_id)) {
        throw new Error("El equipo del ajuste original no tiene un identificador UUID válido.");
      }
      await standingsAdjustmentsService.revertAdjustment(
        original,
        reason,
        isUUID(user?.id) ? user.id : null
      );
      await refetchStandingsAdjustments();
    } else {
      const inversePoints = -original.points_delta;
      const team = teams.find((t) => t.id === original.team_id);
      const newAdj: StandingAdjustment = {
        id: `adj-${Date.now()}`,
        team_id: original.team_id,
        team_name: team?.name || original.team_name,
        competition_id: original.competition_id,
        season_id: original.season_id,
        points_delta: inversePoints,
        reason: `Reversión: ${reason.trim()} (Ajuste ref: ${original.points_delta > 0 ? `+${original.points_delta}` : original.points_delta} pts)`,
        created_by: user?.id || "admin-local",
        created_by_name: user?.email || "Administrador",
        created_by_email: user?.email || "admin@futsalba.org",
        reverses_adjustment_id: original.id,
        created_at: new Date().toISOString(),
      };
      setStandingsAdjustments((prev) => [newAdj, ...prev]);
    }
  };

  const deleteStandingAdjustment = async (id: string) => {
    // Nota de auditoría: delete no debe usarse en producción (usar revertStandingAdjustment)
    setStandingsAdjustments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <FutsalContext.Provider
      value={{
        currentUserRole,
        setCurrentUserRole,
        userRoles,
        user,
        isAuthenticated,
        isAuthLoading,
        authError,
        retryAuth,
        login,
        logout,

        isLoadingRemote,
        isSupabaseActive: isSupabaseConfigured,
        refetchAll,
        refetchTeams,
        refetchPlayers,
        refetchMatches,
        refetchSeasons,
        refetchCompetitions,
        refetchMatchdays,
        refetchVenues,
        refetchLeagueSettings,

        teams,
        players,
        seasons,
        competitions,
        venues,
        referees,
        matchdays,
        matches,
        matchEvents,
        logisticsTasks,
        standings,
        standingsAdjustments,
        sanctions,
        leagueSettings,
        notifications,

        addTeam,
        updateTeam,
        deleteTeam,

        addPlayer,
        updatePlayer,
        deletePlayer,

        addMatch,
        updateMatch,
        deleteMatch,
        startMatch,
        cancelMatch,

        createSeason,
        updateSeason,
        createCompetition,
        updateCompetition,
        createMatchday,
        updateMatchday,
        createVenue,
        updateVenue,
        deleteVenue,

        addMatchEvent,
        deleteMatchEvent,
        updateMatchClock,
        adjustFouls,
        adjustTimeouts,
        changeMatchPeriod,
        changeMatchStatus,

        toggleLogisticsTask,
        updateLogisticsTask,
        updateSanctionStatus,
        updateLeagueSettings,
        markNotificationAsRead,
        resetToDemoData,

        addStandingAdjustment,
        revertStandingAdjustment,
        deleteStandingAdjustment,
        refetchStandingsAdjustments,
      }}
    >
      {children}
    </FutsalContext.Provider>
  );
}

export function useFutsal() {
  const context = useContext(FutsalContext);
  if (!context) {
    throw new Error("useFutsal must be used within a FutsalProvider");
  }
  return context;
}
