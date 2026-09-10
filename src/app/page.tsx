import { PublicLayout } from "@/components/public/public-layout";
import { PublicMaintenance } from "@/components/public/public-maintenance";
import { PublicSection } from "@/components/public/public-section";
import { PublicStatsGrid } from "@/components/public/public-stats-grid";
import { getPublicSiteSettings } from "@/lib/fixtures/site-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { theme } from "@/lib/theme";
import { adapter } from "@/lib/data";
import {
  LOGO_BASE_PX,
  logoPx,
  logoSurfaceFilter,
  resolveLogoSurfaces,
  resolveConstellationVariant,
  resolveSkyEffects,
  SKY_DENSITY_DEFAULT,
} from "@/lib/brand-display";
import {
  enabledCycleSteps,
  listPublicIntegrations,
  listPublicKnowledge,
  listPublicOperations,
  listPublicStats,
  normalizePublicContent,
} from "@/lib/public/site-content";
import {
  nextPublicSectionId,
  resolvePublicMenu,
  homepageVisibleSectionIds,
} from "@/lib/nav";
import {
  Server,
  Plug,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Server,
  Plug,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  BookOpen,
};

const TICKET_STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  open: "default",
  in_progress: "secondary",
  resolved: "outline",
};

const TICKET_PRIORITY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  urgent: "destructive",
  high: "default",
  normal: "secondary",
  low: "outline",
};

const SYSTEM_STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  connected: "default",
  standalone: "secondary",
  planned: "outline",
};

function SampleMark() {
  return (
    <Badge variant="outline" className="ml-2 align-middle text-[10px] uppercase tracking-wide">
      Sample
    </Badge>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-orange-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function EmptyLive({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/70 bg-background/40 px-6 py-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const site = await getPublicSiteSettings();
  const pub = normalizePublicContent(site);
  const cycle = enabledCycleSteps(site);
  const demo = site.demo_mode !== false;
  const showLogin = site.public_login_enabled !== false;
  const publicMenu = resolvePublicMenu({
    enabled: site.public_menu_enabled,
    order: site.public_menu_order,
  });
  const sectionIds = homepageVisibleSectionIds({
    demo,
    enabled: publicMenu.enabled,
    order: publicMenu.order,
  });
  const sectionOn = (id: string) => sectionIds.includes(id);
  const nextOf = (id: string) => nextPublicSectionId(id, sectionIds);
  const firstSection = sectionIds[0];

  const [businessProfile, services, otherSystems, supportTickets, demoIntegrations, demoMetrics, demoKnowledge, liveIntegrations] =
    await Promise.all([
      adapter.getBusinessProfile(),
      demo ? adapter.listServices() : Promise.resolve([]),
      demo ? adapter.listOtherSystems() : Promise.resolve([]),
      demo ? adapter.listSupportTickets() : Promise.resolve([]),
      demo ? adapter.listIntegrations() : Promise.resolve([]),
      demo ? adapter.listMetrics() : Promise.resolve([]),
      demo ? adapter.listKnowledgeArticles() : Promise.resolve([]),
      demo ? Promise.resolve([]) : listPublicIntegrations(),
    ]);

  const liveKnowledge = demo ? [] : listPublicKnowledge();
  const liveOperations = demo
    ? { projects: [], tasks: [], activeProjects: 0, openTasks: 0 }
    : listPublicOperations();
  const liveStats = demo ? [] : listPublicStats();
  const homeLogo = resolveLogoSurfaces(site as unknown as Record<string, unknown>).home;

  const business = {
    ...businessProfile,
    contactEmail: pub.contact_email,
    contactPhone: pub.contact_phone,
    address: pub.contact_address,
  };

  if (site.maintenance_mode === true) {
    return <PublicMaintenance brandName={site.brand_name} />;
  }

  return (
    <PublicLayout
      business={business}
      demo={demo}
      constellationVariant={resolveConstellationVariant(site.constellation_variant)}
      constellationDensity={site.constellation_density ?? SKY_DENSITY_DEFAULT}
      constellationZoom={site.constellation_zoom ?? 1}
      constellationEffects={resolveSkyEffects(site.constellation_effects)}
    >
      <PublicSection
        id="top"
        nextId={firstSection}
        className="bg-transparent"
      >
        <div className="mx-auto flex w-full max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
            {site.brand_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- uploaded/data URL logos
              <img
                src={site.brand_logo_url}
                alt={site.brand_name}
                className="mb-6 h-auto w-[var(--logo-m)] object-contain sm:w-[var(--logo-d)]"
                style={{
                  ["--logo-m" as string]: `${logoPx(LOGO_BASE_PX.homeMobile, homeLogo.scale)}px`,
                  ["--logo-d" as string]: `${logoPx(LOGO_BASE_PX.homeDesktop, homeLogo.scale)}px`,
                  opacity: homeLogo.opacity,
                  filter: logoSurfaceFilter(homeLogo),
                }}
              />
            ) : (
              <div
                className="mb-6 flex h-24 w-24 items-center justify-center rounded-md text-2xl font-bold text-white"
                style={{ backgroundColor: site.brand_color }}
              >
                {site.brand_name.slice(0, 2).toUpperCase() || "VA"}
              </div>
            )}
            <h1 className="whitespace-nowrap text-[clamp(1.35rem,4.2vw,3.25rem)] font-bold tracking-tight">
              {pub.hero_headline}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              {pub.hero_subhead}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {firstSection ? (
              <a
                href={`#${firstSection}`}
                className={cn(buttonVariants({ size: "lg" }))}
              >
                {demo ? "Explore Versa - Business Admin" : "See operations"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              ) : null}
              {sectionOn("contact") ? (
              <a href="#contact" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                Get in Touch
              </a>
              ) : null}
            </div>
            {cycle.length > 0 ? (
              <div className="mt-12 w-full">
                <div className="flex flex-nowrap gap-2 sm:gap-4">
                  {cycle.map((item, index) => (
                    <div key={`${item.title}-${item.number}-${index}`} className="min-w-0 flex-1 text-center">
                      {item.numberEnabled ? (
                        <div className="text-lg font-bold text-muted-foreground/40 sm:text-2xl">
                          {item.number || String(index + 1).padStart(2, "0")}
                        </div>
                      ) : null}
                      {item.titleEnabled ? (
                        <h3 className="mt-1 truncate text-xs font-semibold sm:text-sm">{item.title}</h3>
                      ) : null}
                      {item.descEnabled ? (
                        <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground sm:text-xs">{item.desc}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </PublicSection>

      <PublicSection id="facets" nextId={nextOf("facets")} hidden={!sectionOn("facets")} className="bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Facets
              {demo ? <SampleMark /> : null}
            </h2>
            <p className="mt-3 text-muted-foreground">
              Six areas that keep the business running — all visible from one dashboard.
            </p>
          </div>
          {demo && services.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => {
                const Icon = ICON_MAP[service.icon] ?? LayoutDashboard;
                return (
                  <Card key={service.id} className="flex flex-col">
                    <CardHeader>
                      <div
                        className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: theme.colors.brand + "20",
                          color: theme.colors.brand,
                        }}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        {service.description}
                      </p>
                      <ul className="mt-4 space-y-2">
                        {service.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyLive message="No facets published yet." />
          )}
        </div>
      </PublicSection>

      <PublicSection id="systems" nextId={nextOf("systems")} hidden={!sectionOn("systems")} className="bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              System Landscape
              {demo ? <SampleMark /> : null}
            </h2>
            <p className="mt-3 text-muted-foreground">
              Adjacent systems the business runs alongside Versa - Business Admin.
            </p>
          </div>
          {demo && otherSystems.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {otherSystems.map((sys) => (
                <Card key={sys.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{sys.name}</CardTitle>
                      <Badge variant={SYSTEM_STATUS_VARIANT[sys.status] ?? "outline"}>
                        {sys.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{sys.category}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{sys.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyLive message="No systems published yet." />
          )}
        </div>
      </PublicSection>

      {demo ? (
        <>
          <PublicSection id="integrations" nextId={nextOf("integrations")} hidden={!sectionOn("integrations")} className="bg-transparent">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
              <div className="mb-12 text-center">
                <h2 className="text-3xl font-bold tracking-tight">
                  Integrations
                  <SampleMark />
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Tools and services wired into Versa - Business Admin.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {demoIntegrations.map((intg) => (
                  <Card key={intg.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">{intg.name}</CardTitle>
                        <Badge
                          variant={
                            intg.status === "connected"
                              ? "default"
                              : intg.status === "error"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {intg.status}
                        </Badge>
                      </div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {intg.type}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{intg.description}</p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Last sync: {new Date(intg.lastSync).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </PublicSection>

          <PublicSection id="operations" nextId={nextOf("operations")} hidden={!sectionOn("operations")} className="bg-transparent">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
              <div className="mb-12 text-center">
                <h2 className="text-3xl font-bold tracking-tight">
                  Operations
                  <SampleMark />
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Day-to-day run of the business — projects, tasks, and workflows.
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <div
                      className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg"
                      style={{ backgroundColor: theme.colors.brand + "20", color: theme.colors.brand }}
                    >
                      <LayoutDashboard className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Track active and completed projects with owners, priorities, and deadlines.
                    </p>
                    {showLogin ? (
                    <a href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}>
                      View Projects
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </a>
                    ) : null}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <div
                      className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg"
                      style={{ backgroundColor: theme.colors.brand + "20", color: theme.colors.brand }}
                    >
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Assign and track tasks across projects with status, priority, and due dates.
                    </p>
                    {showLogin ? (
                    <a href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}>
                      View Tasks
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </a>
                    ) : null}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <div
                      className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg"
                      style={{ backgroundColor: theme.colors.brand + "20", color: theme.colors.brand }}
                    >
                      <Server className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">Workflows</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Standard operating procedures and handoff patterns for consistent delivery.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </PublicSection>

          <PublicSection id="support" nextId={nextOf("support")} hidden={!sectionOn("support")} className="bg-transparent">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
              <div className="mb-12 text-center">
                <h2 className="text-3xl font-bold tracking-tight">
                  Customer Support
                  <SampleMark />
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Inbox, tickets, and care loops.
                </p>
              </div>
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Ticket</th>
                      <th className="px-4 py-3 font-medium">Subject</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Channel</th>
                      <th className="px-4 py-3 font-medium">Priority</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supportTickets.map((ticket) => (
                      <tr key={ticket.id} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3 font-mono text-xs">{ticket.id}</td>
                        <td className="px-4 py-3">{ticket.subject}</td>
                        <td className="px-4 py-3 text-muted-foreground">{ticket.customer}</td>
                        <td className="px-4 py-3 text-muted-foreground">{ticket.channel}</td>
                        <td className="px-4 py-3">
                          <Badge variant={TICKET_PRIORITY_VARIANT[ticket.priority] ?? "outline"}>
                            {ticket.priority}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={TICKET_STATUS_VARIANT[ticket.status] ?? "outline"}>
                            {ticket.status.replace("_", " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </PublicSection>

          <PublicSection id="metrics" nextId={nextOf("metrics")} hidden={!sectionOn("metrics")} className="bg-transparent">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold tracking-tight">
                  Metrics
                  <SampleMark />
                </h2>
                <p className="mt-3 text-muted-foreground">
                  KPI snapshots and health indicators.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {demoMetrics.map((metric) => (
                  <Card key={metric.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
                        <TrendIcon trend={metric.trend} />
                      </div>
                      <div className="mt-2 text-3xl font-bold">{metric.value}</div>
                      <p className="mt-1 text-xs text-muted-foreground">{metric.trendValue}</p>
                      <Badge variant="outline" className="mt-3 text-xs">{metric.category}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </PublicSection>

          <PublicSection id="knowledge" nextId={nextOf("knowledge")} hidden={!sectionOn("knowledge")} className="bg-transparent">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold tracking-tight">
                  Knowledge
                  <SampleMark />
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Handbook, process docs, and searchable knowledge.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {demoKnowledge.map((article) => (
                  <Card key={article.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">{article.title}</CardTitle>
                        <Badge variant="secondary" className="text-xs">{article.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{article.summary}</p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Updated: {new Date(article.updatedAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </PublicSection>

          <PublicSection id="about" nextId={nextOf("about")} hidden={!sectionOn("about")} className="bg-transparent">
            <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-bold tracking-tight">
                  About {business.name}
                  <SampleMark />
                </h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Our Purpose</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">{business.purpose}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">What We Produce</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">{business.production}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </PublicSection>
        </>
      ) : (
        <>
          <PublicSection id="integrations" nextId={nextOf("integrations")} hidden={!sectionOn("integrations")} className="bg-transparent">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
              <div className="mb-12 text-center">
                <h2 className="text-3xl font-bold tracking-tight">Integrations</h2>
                <p className="mt-3 text-muted-foreground">
                  Vendor integrations attached to Collaboration organizations.
                </p>
              </div>
              {liveIntegrations.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {liveIntegrations.map((intg) => (
                    <Card key={intg.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-base">{intg.name}</CardTitle>
                          <Badge
                            variant={
                              intg.status === "connected"
                                ? "default"
                                : intg.status === "error"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {intg.status}
                          </Badge>
                        </div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {intg.kind}
                          {intg.vendor ? ` · ${intg.vendor}` : ""}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{intg.notes || "—"}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyLive message="No vendor integrations published yet." />
              )}
            </div>
          </PublicSection>

          <PublicSection id="operations" nextId={nextOf("operations")} hidden={!sectionOn("operations")} className="bg-transparent">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
              <div className="mb-12 text-center">
                <h2 className="text-3xl font-bold tracking-tight">Operations</h2>
                <p className="mt-3 text-muted-foreground">
                  Projects and tasks from Executive.
                </p>
              </div>
              <div className="mb-8 grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Active projects</p>
                    <p className="mt-2 text-3xl font-bold">{liveOperations.activeProjects}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Open tasks</p>
                    <p className="mt-2 text-3xl font-bold">{liveOperations.openTasks}</p>
                  </CardContent>
                </Card>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {liveOperations.projects.length ? (
                      <ul className="space-y-2 text-sm">
                        {liveOperations.projects.slice(0, 6).map((project) => (
                          <li key={project.id} className="flex items-center justify-between gap-3">
                            <span>{project.name}</span>
                            <Badge variant="outline">{project.status}</Badge>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No projects yet.</p>
                    )}
                    {showLogin ? (
                    <a href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}>
                      View Projects
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </a>
                    ) : null}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {liveOperations.tasks.length ? (
                      <ul className="space-y-2 text-sm">
                        {liveOperations.tasks.slice(0, 6).map((task) => (
                          <li key={task.id} className="flex items-center justify-between gap-3">
                            <span>{task.name}</span>
                            <Badge variant="outline">{task.status}</Badge>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No tasks yet.</p>
                    )}
                    {showLogin ? (
                    <a href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}>
                      View Tasks
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </a>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            </div>
          </PublicSection>

          <PublicSection id="metrics" nextId={nextOf("metrics")} hidden={!sectionOn("metrics")} className="bg-transparent">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold tracking-tight">Metrics</h2>
                <p className="mt-3 text-muted-foreground">
                  Stats — card plus graph, filterable by time scale.
                </p>
              </div>
              {liveStats.length ? (
                <PublicStatsGrid stats={liveStats} />
              ) : (
                <EmptyLive message="No stats published yet." />
              )}
            </div>
          </PublicSection>

          <PublicSection id="knowledge" nextId={nextOf("knowledge")} hidden={!sectionOn("knowledge")} className="bg-transparent">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold tracking-tight">Knowledge</h2>
                <p className="mt-3 text-muted-foreground">
                  Environment knowledge records.
                </p>
              </div>
              {liveKnowledge.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {liveKnowledge.map((article) => (
                    <Card key={article.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-base">{article.title}</CardTitle>
                          <Badge variant="secondary" className="text-xs">{article.kind}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{article.summary || "—"}</p>
                        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Updated: {new Date(article.updatedAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyLive message="No knowledge records published yet." />
              )}
            </div>
          </PublicSection>
        </>
      )}

      <PublicSection id="contact" hidden={!sectionOn("contact")} className="border-b-0 bg-transparent">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Get in Touch</h2>
            <p className="mt-3 text-muted-foreground">
              Questions about setting up Versa - Business Admin for your business? Reach out.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a href={`mailto:${pub.contact_email}`} className={cn(buttonVariants({ size: "lg" }))}>
                {pub.contact_email}
              </a>
              <span className="text-sm text-muted-foreground">
                {pub.contact_phone}
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {pub.contact_address}
            </p>
          </div>
        </div>
      </PublicSection>
    </PublicLayout>
  );
}
