import { PublicLayout } from "@/components/public/public-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { theme } from "@/lib/theme";
import { adapter } from "@/lib/data";
import type { BusinessProfile, Service, Integration, OtherSystem, SupportTicket, Metric, KnowledgeArticle } from "@/lib/data";
import {
  Server,
  Plug,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Clock,
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

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-orange-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export default async function HomePage() {
  const [business, services, integrations, otherSystems, supportTickets, metrics, knowledgeArticles] = await Promise.all([
    adapter.getBusinessProfile(),
    adapter.listServices(),
    adapter.listIntegrations(),
    adapter.listOtherSystems(),
    adapter.listSupportTickets(),
    adapter.listMetrics(),
    adapter.listKnowledgeArticles(),
  ]);

  return (
    <PublicLayout business={business}>
      {/* Hero — Mission Control framing */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">Mission Control</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Run your business from one place.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              {business.description}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="#facets" className={cn(buttonVariants({ size: "lg" }))}>
                Explore Mission Control
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <a href="#contact" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                Get in Touch
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works strip */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { step: "01", title: "Intend", desc: "Set goals and priorities." },
              { step: "02", title: "Plan", desc: "Break work into projects and tasks." },
              { step: "03", title: "Produce", desc: "Execute with clear ownership." },
              { step: "04", title: "Serve", desc: "Support customers and measure outcomes." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-2xl font-bold text-muted-foreground/40">{item.step}</div>
                <h3 className="mt-1 text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Facet Grid — the six Mission Control facets */}
      <section id="facets" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Mission Control Facets</h2>
            <p className="mt-3 text-muted-foreground">
              Six areas that keep the business running — all visible from one dashboard.
            </p>
          </div>
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
        </div>
      </section>

      {/* Other Systems */}
      <section id="systems" className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Other Systems</h2>
            <p className="mt-3 text-muted-foreground">
              Adjacent systems the business runs alongside Mission Control.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {otherSystems.map((sys) => (
              <Card key={sys.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
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
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Integrations</h2>
            <p className="mt-3 text-muted-foreground">
              Tools and services wired into Mission Control.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {integrations.map((intg) => (
              <Card key={intg.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{intg.name}</CardTitle>
                    <Badge
                      variant={intg.status === "connected" ? "default" : intg.status === "error" ? "destructive" : "outline"}
                    >
                      {intg.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{intg.type}</p>
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
      </section>

      {/* Operations — link to projects/tasks (already shipped in I6) */}
      <section id="operations" className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Operations</h2>
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
                <a href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}>
                  View Projects
                  <ArrowRight className="ml-2 h-3 w-3" />
                </a>
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
                <a href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}>
                  View Tasks
                  <ArrowRight className="ml-2 h-3 w-3" />
                </a>
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
      </section>

      {/* Customer Support */}
      <section id="support" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Customer Support</h2>
            <p className="mt-3 text-muted-foreground">
              Inbox, tickets, and care loops — placeholder sample data.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Ticket</th>
                  <th className="pb-2 pr-4 font-medium">Subject</th>
                  <th className="pb-2 pr-4 font-medium">Customer</th>
                  <th className="pb-2 pr-4 font-medium">Channel</th>
                  <th className="pb-2 pr-4 font-medium">Priority</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {supportTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-border/50">
                    <td className="py-3 pr-4 font-mono text-xs">{ticket.id}</td>
                    <td className="py-3 pr-4">{ticket.subject}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{ticket.customer}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{ticket.channel}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={TICKET_PRIORITY_VARIANT[ticket.priority] ?? "outline"}>
                        {ticket.priority}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
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
      </section>

      {/* Metrics + Knowledge Articles */}
      <section id="metrics-knowledge" className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          {/* Metrics */}
          <div className="mb-16">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold tracking-tight">Metrics</h2>
              <p className="mt-3 text-muted-foreground">
                KPI snapshots and health indicators — placeholder sample data.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.map((metric) => (
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

          {/* Knowledge Articles */}
          <div>
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold tracking-tight">Knowledge Articles</h2>
              <p className="mt-3 text-muted-foreground">
                Handbook, process docs, and searchable knowledge — placeholder sample data.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {knowledgeArticles.map((article) => (
                <Card key={article.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
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
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">About {business.name}</h2>
            <div className="mt-6 space-y-4 text-left">
              <div>
                <h3 className="text-lg font-semibold">Our Purpose</h3>
                <p className="mt-2 text-muted-foreground">{business.purpose}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">What We Produce</h3>
                <p className="mt-2 text-muted-foreground">{business.production}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Get in Touch</h2>
            <p className="mt-3 text-muted-foreground">
              Questions about setting up Mission Control for your business? Reach out.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a href={`mailto:${business.contactEmail}`} className={cn(buttonVariants({ size: "lg" }))}>
                {business.contactEmail}
              </a>
              <span className="text-sm text-muted-foreground">
                {business.contactPhone}
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {business.address}
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
