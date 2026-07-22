'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  FieldLabel,
  InputText,
  StatusBadge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@sesamehr/react-design-system'

/**
 * Living showcase of @sesamehr/react-design-system running inside this app.
 *
 * The components arrive pre-styled from the package; the "design system
 * bridge" block in globals.css re-points their tokens at the Cowork palette,
 * which is why everything below renders navy/teal instead of the DS's stock
 * indigo. Use this page to eyeball new components before reaching for them
 * in real screens.
 */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  )
}

export default function DesignSystemPage() {
  const t = useTranslations('designSystem')
  const [name, setName] = useState('')

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <Section title="Button">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="success">Success</Button>
        <Button variant="link">Link</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button disabled>Disabled</Button>
      </Section>

      <Section title="Badge / StatusBadge">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <StatusBadge status="active" />
        <StatusBadge status="paused" />
        <StatusBadge status="draft" />
        <StatusBadge status="completed" />
      </Section>

      <Section title="Alert">
        <div className="w-full space-y-3">
          <Alert variant="info">
            <AlertTitle>{t('alertTitle')}</AlertTitle>
            <AlertDescription>{t('alertDescription')}</AlertDescription>
          </Alert>
          <Alert variant="success" dismissible>
            <AlertTitle>{t('alertTitle')}</AlertTitle>
            <AlertDescription>{t('alertDescription')}</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <AlertTitle>{t('alertTitle')}</AlertTitle>
            <AlertDescription>{t('alertDescription')}</AlertDescription>
          </Alert>
        </div>
      </Section>

      <Section title="Forms">
        <div className="w-full max-w-sm space-y-1.5">
          <FieldLabel htmlFor="ds-name">{t('inputLabel')}</FieldLabel>
          <InputText
            id="ds-name"
            placeholder={t('inputPlaceholder')}
            field={name}
            onFieldChange={setName}
          />
        </div>
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="one" className="w-full">
          <TabsList>
            <TabsTrigger value="one">{t('tabOne')}</TabsTrigger>
            <TabsTrigger value="two">{t('tabTwo')}</TabsTrigger>
          </TabsList>
          <TabsContent value="one" className="pt-3 text-sm text-muted-foreground">
            {t('tabOneContent')}
          </TabsContent>
          <TabsContent value="two" className="pt-3 text-sm text-muted-foreground">
            {t('tabTwoContent')}
          </TabsContent>
        </Tabs>
      </Section>
    </div>
  )
}
