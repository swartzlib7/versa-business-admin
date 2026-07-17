import { PublicLayout } from "@/components/public/public-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { theme } from "@/lib/theme";
import { adapter } from "@/lib/data";
import type { BusinessProfile, Service, Product, StaffMember } from "@/lib/data";
import {
  Bot,
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Cpu,
  Lightbulb,
  FolderKanban,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

// Icon map for service icons (avoids dynamic component lookup)
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Bot,
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Cpu,
  Lightbulb,
  FolderKanban,
};

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  beta: "Beta",
  "coming-soon": "Coming Soon",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  available: "default",
  beta: "secondary",
  "coming-soon": "outline",
};

export default async function HomePage() {
  const [business, services, products, staff] = await Promise.all([
    adapter.getBusinessProfile(),
    adapter.listServices(),
    adapter.listProducts(),
    adapter.listStaff(),
  ]);

  return (
    <PublicLayout business={business}>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {business.name}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              {business.slogan}
            </p>
            <p className="mt-4 text-base text-muted-foreground">
              {business.description}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="#services" className={cn(buttonVariants({ size: "lg" }))}>
                Explore Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <a href="#contact" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                Get in Touch
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">How We Help You Produce</h2>
            <p className="mt-3 text-muted-foreground">
              Practical ways to move from intention to finished work — alone or with a small team.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const Icon = ICON_MAP[service.icon] ?? Lightbulb;
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

      {/* Products Section */}
      <section id="products" className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">What You Can Adopt</h2>
            <p className="mt-3 text-muted-foreground">
              Things you can adopt, customize, and ship under your own name.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {products.map((product) => (
              <Card key={product.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <Badge variant={STATUS_VARIANTS[product.status] ?? "outline"}>
                      {STATUS_LABELS[product.status] ?? product.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {product.tagline}
                  </p>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {product.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {product.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Staff Section */}
      <section id="staff" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">The Team</h2>
            <p className="mt-3 text-muted-foreground">
              People who make the work real — and agents that extend their reach.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {staff.map((member) => (
              <Card key={member.id}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold"
                      style={{
                        backgroundColor:
                          member.type === "agent"
                            ? theme.colors.brand + "20"
                            : "oklch(0.97 0 0)",
                        color:
                          member.type === "agent"
                            ? theme.colors.brand
                            : "oklch(0.3 0 0)",
                      }}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{member.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {member.department}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="border-b border-border bg-muted/30">
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

      {/* Contact Section */}
      <section id="contact">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Get in Touch</h2>
            <p className="mt-3 text-muted-foreground">
              Building something of your own? Reach out — makers, founders, and producers welcome.
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