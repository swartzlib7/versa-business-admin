"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileField } from "@/components/ui/file-field";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { theme } from "@/lib/theme";

type ComponentSection = {
  id: string;
  title: string;
  description: string;
  components: ComponentDemo[];
};

type ComponentDemo = {
  name: string;
  description: string;
  example: React.ReactNode;
  code: string;
};

const componentSections: ComponentSection[] = [
  {
    id: "buttons",
    title: "Buttons",
    description: "Interactive button components with various styles and sizes",
    components: [
      {
        name: "Primary Button",
        description: "Default button with brand color",
        example: <Button>Primary Button</Button>,
        code: '<Button>Primary Button</Button>',
      },
      {
        name: "Secondary Button",
        description: "Secondary style button",
        example: <Button variant="secondary">Secondary</Button>,
        code: '<Button variant="secondary">Secondary</Button>',
      },
      {
        name: "Outline Button",
        description: "Button with outline style",
        example: <Button variant="outline">Outline</Button>,
        code: '<Button variant="outline">Outline</Button>',
      },
      {
        name: "Ghost Button",
        description: "Minimal button style",
        example: <Button variant="ghost">Ghost</Button>,
        code: '<Button variant="ghost">Ghost</Button>',
      },
      {
        name: "Destructive Button",
        description: "Button for destructive actions",
        example: <Button variant="destructive">Delete</Button>,
        code: '<Button variant="destructive">Delete</Button>',
      },
      {
        name: "Small Button",
        description: "Compact button size",
        example: <Button size="sm">Small</Button>,
        code: '<Button size="sm">Small</Button>',
      },
      {
        name: "Large Button",
        description: "Larger button size",
        example: <Button size="lg">Large</Button>,
        code: '<Button size="lg">Large</Button>',
      },
    ],
  },
  {
    id: "inputs",
    title: "Inputs",
    description: "Form input components for data entry",
    components: [
      {
        name: "Text Input",
        description: "Standard text input field",
        example: <Input placeholder="Enter text..." />,
        code: '<Input placeholder="Enter text..." />',
      },
      {
        name: "Disabled Input",
        description: "Input field in disabled state",
        example: <Input placeholder="Disabled" disabled />,
        code: '<Input placeholder="Disabled" disabled />',
      },
      {
        name: "Input with Value",
        description: "Input with pre-filled value",
        example: <Input defaultValue="Pre-filled value" />,
        code: '<Input defaultValue="Pre-filled value" />',
      },
      {
        name: "File Field",
        description:
          "Do not use the native file input chrome. Pair Choose file (outline) with muted filename text and a ghost Remove action.",
        example: (
          <FileField
            filename="logo.png"
            onFile={() => undefined}
            onRemove={() => undefined}
          />
        ),
        code: `<FileField
  filename="logo.png"
  chooseLabel="Choose file"
  emptyLabel="No file chosen"
  removeLabel="Remove logo"
  onFile={(file) => ...}
  onRemove={() => ...}
/>`,
      },
    ],
  },
  {
    id: "badges",
    title: "Badges",
    description: "Small status indicators and labels",
    components: [
      {
        name: "Default Badge",
        description: "Standard badge component",
        example: <Badge>Default</Badge>,
        code: '<Badge>Default</Badge>',
      },
      {
        name: "Secondary Badge",
        description: "Secondary style badge",
        example: <Badge variant="secondary">Secondary</Badge>,
        code: '<Badge variant="secondary">Secondary</Badge>',
      },
      {
        name: "Outline Badge",
        description: "Badge with outline style",
        example: <Badge variant="outline">Outline</Badge>,
        code: '<Badge variant="outline">Outline</Badge>',
      },
      {
        name: "Destructive Badge",
        description: "Badge for error or warning states",
        example: <Badge variant="destructive">Error</Badge>,
        code: '<Badge variant="destructive">Error</Badge>',
      },
    ],
  },
  {
    id: "cards",
    title: "Cards",
    description: "Container components for grouping content",
    components: [
      {
        name: "Basic Card",
        description: "Simple card with header and content",
        example: (
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description text</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card content goes here.</p>
            </CardContent>
          </Card>
        ),
        code: `<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here.</p>
  </CardContent>
</Card>`,
      },
      {
        name: "Card with Footer",
        description: "Card with action buttons in footer",
        example: (
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Card with Footer</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Content with action buttons below.</p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button size="sm">Action</Button>
              <Button size="sm" variant="outline">Cancel</Button>
            </CardFooter>
          </Card>
        ),
        code: `<Card>
  <CardHeader>
    <CardTitle>Card with Footer</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Content with action buttons below.</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
    <Button variant="outline">Cancel</Button>
  </CardFooter>
</Card>`,
      },
    ],
  },
  {
    id: "separators",
    title: "Separators",
    description: "Visual dividers for content sections",
    components: [
      {
        name: "Horizontal Separator",
        description: "Default horizontal divider",
        example: (
          <div className="w-full max-w-sm space-y-2">
            <p>Content above</p>
            <Separator />
            <p>Content below</p>
          </div>
        ),
        code: `<div>
  <p>Content above</p>
  <Separator />
  <p>Content below</p>
</div>`,
      },
    ],
  },
];

export const GALLERY_SECTIONS = componentSections.map((s) => ({
  id: s.id,
  label: s.title,
  description: s.description,
}));

export function ComponentGallery({
  sectionId,
  hideSectionHeading = false,
}: {
  sectionId?: string;
  hideSectionHeading?: boolean;
}) {
  const [internalSection, setInternalSection] = useState(componentSections[0].id);
  const [showCode, setShowCode] = useState<Record<string, boolean>>({});
  const activeSection = sectionId ?? internalSection;

  const currentSection = componentSections.find((s) => s.id === activeSection);

  const toggleCode = (componentName: string) => {
    setShowCode((prev) => ({
      ...prev,
      [componentName]: !prev[componentName],
    }));
  };

  return (
    <div className="space-y-6">
      {!sectionId && (
      <div className="flex flex-wrap gap-2">
        {componentSections.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? "default" : "outline"}
            size="sm"
            onClick={() => setInternalSection(section.id)}
          >
            {section.title}
          </Button>
        ))}
      </div>
      )}

      {/* Current Section */}
      {currentSection && (
        <div className="space-y-4">
          {!hideSectionHeading ? (
          <div>
            <h2 className="text-2xl font-bold">{currentSection.title}</h2>
            <p className="text-muted-foreground">{currentSection.description}</p>
          </div>
          ) : null}

          {!hideSectionHeading ? <Separator /> : null}

          {/* Component Demos */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentSection.components.map((component) => (
              <Card key={component.name}>
                <CardHeader>
                  <CardTitle className="text-lg">{component.name}</CardTitle>
                  <CardDescription>{component.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Live Example */}
                  <div className="flex min-h-[100px] items-center justify-center rounded-lg border border-border bg-muted/30 p-4">
                    {component.example}
                  </div>

                  {/* Code Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCode(component.name)}
                    className="w-full"
                  >
                    {showCode[component.name] ? "Hide Code" : "Show Code"}
                  </Button>

                  {/* Code Display */}
                  {showCode[component.name] && (
                    <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
                      <code>{component.code}</code>
                    </pre>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!sectionId && (
      <>
      {/* Design Tokens Section */}
      <Separator className="my-8" />
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Design Tokens</h2>
        <p className="text-muted-foreground">Theme colors and styling tokens</p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Brand Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded border border-border"
                  style={{ backgroundColor: theme.colors.brand }}
                />
                <div>
                  <p className="text-sm font-medium">Brand Primary</p>
                  <p className="text-xs text-muted-foreground">{theme.colors.brand}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded border border-border"
                  style={{ backgroundColor: theme.colors.brandForeground }}
                />
                <div>
                  <p className="text-sm font-medium">Brand Foreground</p>
                  <p className="text-xs text-muted-foreground">{theme.colors.brandForeground}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded border border-border"
                  style={{ backgroundColor: theme.colors.statusActive }}
                />
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">{theme.colors.statusActive}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded border border-border"
                  style={{ backgroundColor: theme.colors.statusIdle }}
                />
                <div>
                  <p className="text-sm font-medium">Idle</p>
                  <p className="text-xs text-muted-foreground">{theme.colors.statusIdle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded border border-border"
                  style={{ backgroundColor: theme.colors.statusError }}
                />
                <div>
                  <p className="text-sm font-medium">Error</p>
                  <p className="text-xs text-muted-foreground">{theme.colors.statusError}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Typography</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Font Family</p>
                <p className="text-sm font-medium">System UI</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Base Size</p>
                <p className="text-sm font-medium">16px</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Line Height</p>
                <p className="text-sm font-medium">1.5</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tech Stack Section */}
      <Separator className="my-8" />
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Tech Stack</h2>
        <p className="text-muted-foreground">Framework and library reference</p>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Frontend Framework</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Next.js</span>
                <Badge variant="secondary">14.x</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">React</span>
                <Badge variant="secondary">18.x</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">TypeScript</span>
                <Badge variant="secondary">5.x</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">UI Libraries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">shadcn/ui</span>
                <Badge variant="secondary">Latest</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tailwind CSS</span>
                <Badge variant="secondary">3.x</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Radix UI</span>
                <Badge variant="secondary">Latest</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
