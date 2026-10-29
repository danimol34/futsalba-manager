"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useFutsal } from "@/lib/store/futsalStore";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { INITIAL_NEWS, NewsItem } from "@/app/noticias/page";
import {
  Flame,
  ArrowRight,
  LogIn,
  Users,
  Smartphone,
  Calendar,
  Shield,
  Award,
  Activity,
  Tv,
  CheckCircle2,
  X,
  Sparkles,
  MapPin,
  ChevronRight,
  Info,
  Clock,
  Download,
} from "lucide-react";

interface TeamMember {
  id: string;
  role: string;
  name: string;
  title: string;
  description: string;
  tag: string;
}

const PUBLIC_STAFF: TeamMember[] = [
  {
    id: "staff-1",
    role: "Presidencia",
    name: "Presidencia Institucional",
    title: "Presidente de la Liga FUTSALBA",
    description:
      "Conducción general, representación legal y articulación estratégica con organismos federativos nacionales e internacionales.",
    tag: "Alta Dirección",
  },
  {
    id: "staff-2",
    role: "Directiva",
    name: "Comisión Directiva y Secretaría",
    title: "Secretaría General y Relaciones Institucionales",
    description:
      "Gestión administrativa, reglamentaria y vínculo permanente con los delegados de los clubes participantes.",
    tag: "Gobernanza",
  },
  {
    id: "staff-3",
    role: "Mesa Técnica",
    name: "Coordinación de Mesa y Cronometraje",
    title: "Mesa Técnica y Jueces Oficiales",
    description:
      "Responsables del control de actas digitales, sincronización del reloj en vivo, cómputo de faltas acumuladas y tiempos muertos.",
    tag: "Operaciones de Partido",
  },
  {
    id: "staff-4",
    role: "Prensa",
    name: "Departamento de Comunicaciones",
    title: "Prensa y Cobertura Audiovisual",
    description:
      "Generación de contenidos informativos, boletines de prensa, entrevistas, redes sociales y transmisión de eventos.",
    tag: "Medios",
  },
  {
    id: "staff-5",
    role: "Logística",
    name: "Comisión de Sedes e Infraestructura",
    title: "Logística y Seguridad de Sedes",
    description:
      "Supervisión del estado de las canchas, superficies de parquet flotante, graderías y protocolos de seguridad sanitaria.",
    tag: "Infraestructura",
  },
  {
    id: "staff-6",
    role: "Disciplina",
    name: "Tribunal de Penas y Cumplimiento",
    title: "Comisión Disciplinaria",
    description:
      "Aplicación del código de faltas, sanciones disciplinarias y garantía del juego limpio en todos los encuentros.",
    tag: "Justicia Deportiva",
  },
];

interface GalleryItem {
  id: string;
  category: "EQUIPOS" | "CANCHAS" | "PREMIACIONES" | "JORNADAS";
  title: string;
  caption: string;
  aspect: string;
  gradient: string;
  iconName: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "gal-1",
    category: "CANCHAS",
    title: "Superficie de Parquet Flotante",
    caption: "Microestadio Central habilitado con piso reglamentario de alta absorción de impacto.",
    aspect: "col-span-1 md:col-span-2",
    gradient: "from-blue-900/60 via-slate-900/80 to-[#050914]",
    iconName: "Arena",
  },
  {
    id: "gal-2",
    category: "EQUIPOS",
    title: "Desfile Oficial de Clubes",
    caption: "Plantillas de los 12 clubes afiliados en la ceremonia inaugural de temporada.",
    aspect: "col-span-1",
    gradient: "from-indigo-900/60 via-slate-900/80 to-[#050914]",
    iconName: "Clubes",
  },
  {
    id: "gal-3",
    category: "JORNADAS",
    title: "Intensidad y Técnica en Vivo",
    caption: "Acciones vibrantes del torneo regular seguidas por miles de aficionados.",
    aspect: "col-span-1",
    gradient: "from-cyan-900/60 via-slate-900/80 to-[#050914]",
    iconName: "Acción",
  },
  {
    id: "gal-4",
    category: "PREMIACIONES",
    title: "Trofeo Oficial FUTSALBA",
    caption: "La máxima presea dorada que se disputará en la Gran Final del Torneo 2026.",
    aspect: "col-span-1 md:col-span-2",
    gradient: "from-amber-900/50 via-slate-900/80 to-[#050914]",
    iconName: "Copa",
  },
  {
    id: "gal-5",
    category: "JORNADAS",
    title: "Mesa Técnica en Operación",
    caption: "Sincronización digital de actas y marcadores con tecnología Supabase.",
    aspect: "col-span-1",
    gradient: "from-blue-950 via-slate-900/90 to-[#050914]",
    iconName: "Tecnología",
  },
  {
    id: "gal-6",
    category: "CANCHAS",
    title: "Iluminación Profesional LED",
    caption: "Estándares lumínicos para transmisiones de alta definición.",
    aspect: "col-span-1",
    gradient: "from-emerald-950/60 via-slate-900/90 to-[#050914]",
    iconName: "Estadio",
  },
];

export default function HomePage() {
  const { isAuthenticated } = useFutsal();
  const [activeArticle, setActiveArticle] = useState<NewsItem | null>(null);
  const [galleryFilter, setGalleryFilter] = useState<string>("TODOS");

  const filteredGallery = GALLERY_ITEMS.filter((item) => {
    if (galleryFilter === "TODOS") return true;
    return item.category === galleryFilter;
  });

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Official Public Navigation Header with responsive mobile drawer */}
      <PublicHeader currentPath="/" />

      {/* 1. HERO INSTITUCIONAL */}
      <section className="relative overflow-hidden py-16 md:py-28 px-4 md:px-8 bg-gradient-to-b from-[#0a1226] via-[#060b14] to-[#050914] border-b border-slate-800">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[750px] h-[450px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-5xl mx-auto space-y-8 relative z-10 text-center">
          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase leading-[1.08]">
              LA PASIÓN DEL FUTSAL <br className="hidden sm:inline" /> EN TIEMPO REAL
            </h1>

            <p className="text-sm md:text-base text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
              Portal institucional de la Liga Oficial de Fútbol Sala FUTSALBA. Organización, transparencia deportiva, desarrollo de talento y cobertura de nuestras competencias de élite.
            </p>
          </div>

          {/* Call to Actions (Hero CTAs) */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            {isAuthenticated ? (
              <Link
                href="/mi-cuenta"
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black tracking-wider uppercase shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                MI CUENTA
              </Link>
            ) : (
              <Link
                href="/login"
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black tracking-wider uppercase shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                INICIAR SESIÓN
              </Link>
            )}

            <a
              href="#app"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              APP FUTSALBA — PRÓXIMAMENTE
            </a>
          </div>

          {/* Quick Pillars Overview */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto text-left text-xs">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-blue-400">Torneo Oficial</span>
              <p className="font-bold text-white text-sm">12 Clubes</p>
              <p className="text-[11px] text-slate-400">Competición regular y play-offs</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400">Homologación</span>
              <p className="font-bold text-white text-sm">Regla FIFA</p>
              <p className="text-[11px] text-slate-400">Colegio arbitral oficial</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-cyan-400">Tecnología</span>
              <p className="font-bold text-white text-sm">Mesa Digital</p>
              <p className="text-[11px] text-slate-400">Cronometraje en vivo</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-400">Sede Central</span>
              <p className="font-bold text-white text-sm">Parquet Flotante</p>
              <p className="text-[11px] text-slate-400">Capacidad para 3,500 personas</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECCIÓN: ACTUALIDAD FUTSALBA */}
      <section id="actualidad" className="scroll-mt-20 max-w-6xl w-full mx-auto px-4 md:px-8 py-16 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-1.5">
              <Tv className="w-3.5 h-3.5" />
              Sala de Prensa Oficial
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
              ACTUALIDAD FUTSALBA
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Noticias oficiales, inauguraciones, jornadas, reuniones directivas y resoluciones.
            </p>
          </div>

          <Link
            href="/noticias"
            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 self-start sm:self-auto transition-colors"
          >
            Ver todos los comunicados <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Editorial Big Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {INITIAL_NEWS.slice(0, 3).map((news) => (
            <div
              key={news.id}
              className="sports-card rounded-3xl p-6 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all duration-300"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    {news.category}
                  </span>
                  <span className="text-[10px] text-slate-500">{news.date}</span>
                </div>

                <h3 className="font-bold text-white text-base leading-snug">
                  {news.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {news.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">{news.author}</span>
                <button
                  onClick={() => setActiveArticle(news)}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  LEER MÁS
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. SECCIÓN: CONOCE FUTSALBA */}
      <section id="conoce-futsalba" className="scroll-mt-20 bg-[#060b14] border-y border-slate-800 py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
              Institución y Propósito
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight">
              CONOCE FUTSALBA
            </h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              La entidad rectora del fútbol sala oficial, nacida para jerarquizar el deporte, profesionalizar la gestión de clubes y garantizar competencias transparentes y de alto rendimiento.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Institutional Presentation */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed">
                <p>
                  FUTSALBA coordina de manera integral el calendario competitivo de fútbol sala profesional, nucleando a los principales clubes de la disciplina bajo un marco normativo unificado.
                </p>
                <p className="text-slate-400">
                  Nuestra organización trabaja sobre tres pilares fundamentales: infraestructura moderna en microestadios homologados, capacitación continua del cuerpo arbitral y digitalización en tiempo real para que aficionados, delegados y prensa sigan cada instante del torneo con máxima certeza.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    Propósito y Valores
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Fomentar el juego limpio, la disciplina deportiva y el desarrollo de nuevos talentos juveniles.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Estructura Federativa
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Comisión técnica, colegio de jueces y tribunal disciplinario bajo reglamento oficial.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Espacio Elegante del Presidente de la Liga */}
            <div className="lg:col-span-5">
              <div className="sports-card rounded-3xl p-6 md:p-8 border border-blue-500/30 shadow-2xl relative overflow-hidden space-y-5">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center gap-4">
                  {/* Espacio preparado para fotografía oficial del Presidente */}
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-blue-600/30 shrink-0 border-2 border-blue-400/30">
                    <Shield className="w-10 h-10 text-white" />
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
                      Presidencia Oficial
                    </span>
                    <h3 className="text-base md:text-lg font-bold text-white mt-1">
                      Presidencia de la Liga FUTSALBA
                    </h3>
                    <p className="text-xs text-slate-400">
                      Representación Oficial de la Liga
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-xs text-slate-300 leading-relaxed italic space-y-2">
                  <p>
                    &ldquo;FUTSALBA representa el esfuerzo conjunto de clubes, jugadores y dirigentes por dignificar el fútbol sala. Nuestro compromiso es garantizar un torneo ejemplar, competitivo y abierto a toda la comunidad deportiva.&rdquo;
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Asociación Oficial de Fútbol Sala</span>
                  <span className="font-semibold text-slate-400">Gestión 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN: NUESTRO EQUIPO */}
      <section id="nuestro-equipo" className="scroll-mt-20 max-w-6xl w-full mx-auto px-4 md:px-8 py-16 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
            Cuerpo Organizativo
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
            NUESTRO EQUIPO
          </h2>
          <p className="text-xs text-slate-400">
            El personal directivo, técnico y logístico responsable de la organización de la Liga.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PUBLIC_STAFF.map((member) => (
            <div
              key={member.id}
              className="sports-card rounded-3xl p-6 border border-slate-800 space-y-3.5 hover:border-blue-500/40 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded bg-blue-600/15 text-blue-400 border border-blue-500/25">
                  {member.tag}
                </span>

                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                  {member.role.charAt(0)}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-white text-base">
                  {member.name}
                </h3>
                <p className="text-xs text-blue-400 font-semibold mt-0.5">
                  {member.title}
                </p>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {member.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. SECCIÓN: GALERÍA FUTSALBA */}
      <section id="galeria" className="scroll-mt-20 bg-[#060b14] border-t border-slate-800 py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                Archivo Visual Oficial
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                GALERÍA FUTSALBA
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Postales de equipos, canchas, jornadas, premiaciones y la emoción en la cancha.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
              {["TODOS", "CANCHAS", "EQUIPOS", "JORNADAS", "PREMIACIONES"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setGalleryFilter(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    galleryFilter === cat
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Gallery Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                className={`sports-card rounded-3xl p-6 border border-slate-800/90 relative overflow-hidden min-h-[220px] flex flex-col justify-end bg-gradient-to-t ${item.gradient} hover:border-blue-500/50 transition-all duration-300 group`}
              >
                <div className="absolute top-4 left-4">
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-slate-300 border border-slate-700">
                    {item.category}
                  </span>
                </div>

                <div className="space-y-1 relative z-10">
                  <h3 className="font-bold text-white text-base group-hover:text-blue-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. SECCIÓN: APP FUTSALBA (Promocional) */}
      <section id="app" className="scroll-mt-20 py-20 px-4 md:px-8 bg-gradient-to-b from-[#050914] via-[#071024] to-[#050914] border-t border-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-blue-600/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/10 mb-2">
            <Smartphone className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-2xl mx-auto">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
              Próximo Lanzamiento Oficial
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
              LLEVA FUTSALBA CONTIGO
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Consulta partidos, clasificación, estadísticas y toda la actualidad de la Liga desde tu dispositivo móvil.
            </p>
          </div>

          {/* Botón Promocional Seguro (Sin enlace roto) */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 text-slate-200 text-xs font-black tracking-wider uppercase shadow-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              PRÓXIMAMENTE PARA ANDROID
            </div>
          </div>

          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
            Estamos optimizando la versión APK para brindarte alertas de goles, faltas en directo y el minuto a minuto en la palma de tu mano.
          </p>
        </div>
      </section>

      {/* Article Modal (para leer noticias completas de ACTUALIDAD) */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="sports-card rounded-3xl max-w-2xl w-full p-6 md:p-8 border border-slate-700 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setActiveArticle(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
                {activeArticle.category}
              </span>
              <h3 className="text-xl md:text-2xl font-black text-white leading-tight">
                {activeArticle.title}
              </h3>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>{activeArticle.date}</span>
                <span>•</span>
                <span>{activeArticle.author}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs md:text-sm text-slate-300 leading-relaxed space-y-3">
              <p className="font-semibold text-slate-200">{activeArticle.summary}</p>
              <p className="text-slate-400">{activeArticle.content}</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveArticle(null)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#03060d] py-12 px-4 md:px-8 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-sm">
              F
            </div>
            <div>
              <div className="font-bold text-white">FUTSALBA MANAGER</div>
              <div className="text-[10px] text-slate-500">
                © 2026 Asociación Oficial de Fútbol Sala. Todos los derechos reservados.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs">
            <Link href="/#actualidad" className="hover:text-blue-400 transition-colors">
              Actualidad
            </Link>
            <Link href="/#conoce-futsalba" className="hover:text-blue-400 transition-colors">
              Conoce FUTSALBA
            </Link>
            <Link href="/#nuestro-equipo" className="hover:text-blue-400 transition-colors">
              Nuestro Equipo
            </Link>
            <Link href="/#galeria" className="hover:text-blue-400 transition-colors">
              Galería
            </Link>
            <Link href="/#app" className="hover:text-blue-400 transition-colors">
              App
            </Link>
            {isAuthenticated ? (
              <Link href="/mi-cuenta" className="hover:text-blue-400 transition-colors font-bold">
                Mi Cuenta
              </Link>
            ) : (
              <Link href="/login" className="hover:text-blue-400 transition-colors font-bold">
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
