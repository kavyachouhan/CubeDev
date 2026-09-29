"use client";

import { useState } from "react";
import {
  Check,
  Clock,
  Download,
  Flame,
  Play,
  Settings,
  Target,
  Trash2,
  Trophy,
} from "lucide-react";
import {
  Alert,
  BackLink,
  Badge,
  BottomSheet,
  Breadcrumbs,
  Button,
  Card,
  CardHeader,
  CardIcon,
  Checkbox,
  CollapsibleCard,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  Input,
  LoadingState,
  Menu,
  Modal,
  OptionTiles,
  PageHeader,
  Pagination,
  Popover,
  SearchInput,
  SegmentedControl,
  Select,
  SelectMenu,
  Skeleton,
  SkeletonText,
  Slider,
  Spinner,
  StatTile,
  CalloutCard,
  Stepper,
  Switch,
  SwitchRow,
  Table,
  Tabs,
  Textarea,
  TimeValue,
  Tooltip,
  useCollapsed,
  useToast,
  ProgressBar,
  ProgressLabel,
  DateTimePicker,
} from "@/components/ui";
import { ThemeControls } from "./ThemeControls";

/**
 * Every primitive in every state, on one page. It needs no auth and no data,
 * so it is where you check a change against both themes, all five color
 * schemes and the accessibility toggles before touching a feature screen.
 */
export default function DesignSystemGallery() {
  return (
    <div className="min-h-screen bg-(--background) text-(--text-primary)">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        <header className="space-y-2">
          <h1 className="type-page-title">CubeDev design system</h1>
          <p className="type-body">
            Primitives from <code>components/ui</code>. Switch theme, scheme and
            accessibility settings below; everything on this page should follow.
          </p>
        </header>

        <ThemeControls />

        <Section title="Buttons">
          <Row>
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="subtle">Subtle</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="success">Success</Button>
            <Button variant="warning">Warning</Button>
          </Row>
          <Row>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </Row>
          <Row>
            <Button iconLeft={<Play className="w-4 h-4" />}>Icon left</Button>
            <Button iconRight={<Download className="w-4 h-4" />}>
              Icon right
            </Button>
            <Button loading loadingText="Saving…">
              Save
            </Button>
            <Button disabled>Disabled</Button>
          </Row>
          <Row>
            <IconButton aria-label="Settings" icon={<Settings />} />
            <IconButton
              aria-label="Settings"
              variant="subtle"
              icon={<Settings />}
            />
            <IconButton
              aria-label="Delete"
              variant="danger"
              icon={<Trash2 />}
            />
            <IconButton aria-label="Settings" size="sm" icon={<Settings />} />
            <IconButton aria-label="Settings" size="lg" icon={<Settings />} />
          </Row>
        </Section>

        <Section title="Form controls">
          <FormShowcase />
        </Section>

        <Section title="Selection">
          <SelectionShowcase />
        </Section>

        <Section title="Cards and metrics">
          <CardShowcase />
        </Section>

        <Section title="Badges and times">
          <Row>
            <Badge>Neutral</Badge>
            <Badge tone="primary">Primary</Badge>
            <Badge tone="accent">Accent</Badge>
            <Badge tone="success">Success</Badge>
            <Badge tone="warning">Warning</Badge>
            <Badge tone="danger">Danger</Badge>
            <Badge tone="info">Info</Badge>
          </Row>
          <Row>
            <Badge variant="solid" tone="primary">
              Solid
            </Badge>
            <Badge shape="pill" icon={<Check />}>
              With icon
            </Badge>
            <Badge size="sm">Small</Badge>
          </Row>
          <Row>
            <TimeValue>12.34</TimeValue>
            <TimeValue penalty="+2">14.34+</TimeValue>
            <TimeValue penalty="DNF">DNF</TimeValue>
            <TimeValue best>9.87</TimeValue>
            <TimeValue muted>(15.02)</TimeValue>
          </Row>
        </Section>

        <Section title="Feedback">
          <Alert title="Info">Something worth knowing.</Alert>
          <Alert tone="success" title="Saved">
            Your changes were saved.
          </Alert>
          <Alert tone="warning" title="Careful">
            This session has unsynced solves.
          </Alert>
          <Alert tone="error" title="Couldn't load">
            Check your connection and try again.
          </Alert>
          <Row>
            <Spinner size="xs" />
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
            <Spinner size="xl" />
          </Row>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card variant="static">
              <LoadingState label="Loading solves…" />
            </Card>
            <Card variant="static">
              <EmptyState
                icon={<Trophy />}
                title="No solves yet"
                description="Your times will appear here."
                action={<Button size="sm">Start timing</Button>}
              />
            </Card>
            <Card variant="static">
              <ErrorState onRetry={() => {}} />
            </Card>
            <Card variant="static">
              <div className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <SkeletonText lines={3} />
              </div>
            </Card>
          </div>
          <ToastShowcase />
        </Section>

        <Section title="Overlays">
          <OverlayShowcase />
        </Section>

        <Section title="Navigation">
          <NavigationShowcase />
        </Section>

        <Section title="Table">
          <Table.Scroll>
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.HeaderCell>Event</Table.HeaderCell>
                  <Table.HeaderCell>Single</Table.HeaderCell>
                  <Table.HeaderCell>Average</Table.HeaderCell>
                  <Table.HeaderCell align="right">Solves</Table.HeaderCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {[
                  {
                    event: "3x3",
                    single: "9.87",
                    average: "12.34",
                    solves: 1420,
                  },
                  {
                    event: "2x2",
                    single: "2.11",
                    average: "3.05",
                    solves: 310,
                  },
                  {
                    event: "4x4",
                    single: "41.22",
                    average: "48.90",
                    solves: 96,
                  },
                ].map((row) => (
                  <Table.Row key={row.event}>
                    <Table.Cell className="text-(--text-primary) font-medium">
                      {row.event}
                    </Table.Cell>
                    <Table.Cell>
                      <TimeValue>{row.single}</TimeValue>
                    </Table.Cell>
                    <Table.Cell>
                      <TimeValue>{row.average}</TimeValue>
                    </Table.Cell>
                    <Table.Cell align="right">{row.solves}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </Table.Scroll>
        </Section>

        <Section title="Typography">
          <p className="type-display">Display</p>
          <p className="type-page-title">Page title</p>
          <p className="type-section-title">Section title</p>
          <p className="type-card-title">Card title</p>
          <p className="type-label">Label</p>
          <p className="type-body">
            Body copy. The quick brown fox jumps over the lazy dog.
          </p>
          <p className="type-caption">Caption</p>
          <p className="type-overline">Overline</p>
          <p className="type-time text-2xl">12.34</p>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="type-section-title border-b border-(--border) pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

function FormShowcase() {
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [slider, setSlider] = useState(40);
  const [checked, setChecked] = useState(true);
  const [on, setOn] = useState(true);
  const [date, setDate] = useState<number | null>(Date.now());
  const [time, setTime] = useState<number | null>(null);
  const [moment, setMoment] = useState<number | null>(null);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Label" hint="A hint under the field">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Placeholder"
        />
      </Field>
      <Field label="Required" required error="This field is required">
        <Input placeholder="With an error" />
      </Field>
      <Field label="Select">
        <Select defaultValue="333">
          <option value="333">3x3</option>
          <option value="222">2x2</option>
        </Select>
      </Field>
      <Field label="Search">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search…"
          aria-label="Search"
        />
      </Field>
      <Field label="Date" hint="Replaces the native browser picker">
        <DateTimePicker mode="date" value={date} onChange={setDate} />
      </Field>
      <Field label="Time">
        <DateTimePicker mode="time" value={time} onChange={setTime} />
      </Field>
      <Field label="Date and time" className="sm:col-span-2">
        <DateTimePicker mode="datetime" value={moment} onChange={setMoment} />
      </Field>
      <Field label="Textarea" className="sm:col-span-2">
        <Textarea rows={3} placeholder="Notes…" />
      </Field>
      <Field label="Disabled">
        <Input disabled placeholder="Disabled" />
      </Field>
      <Field label="Slider">
        <Slider value={slider} onChange={setSlider} min={0} max={100} />
      </Field>
      <div className="space-y-3">
        <Checkbox
          label="Checkbox"
          description="With a description"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <div className="flex items-center gap-3">
          <Switch checked={on} onChange={setOn} aria-label="Switch" />
          <span className="type-label">Switch</span>
        </div>
      </div>
      <SwitchRow
        className="sm:col-span-2"
        icon={<Clock />}
        label="Inspection"
        description="15 second WCA inspection before the timer starts"
        checked={on}
        onChange={setOn}
      />
    </div>
  );
}

function SelectionShowcase() {
  const [segment, setSegment] = useState<"none" | "+2" | "DNF">("none");
  const [tab, setTab] = useState<"overview" | "solves" | "charts">("overview");
  const [event, setEvent] = useState("333");
  const [tile, setTile] = useState("cfop");
  const [page, setPage] = useState(3);
  const [step, setStep] = useState(2);

  return (
    <div className="space-y-6">
      <SegmentedControl<"none" | "+2" | "DNF">
        value={segment}
        onChange={setSegment}
        aria-label="Penalty"
        options={[
          { value: "none", label: "OK" },
          { value: "+2", label: "+2", tone: "warning" },
          { value: "DNF", label: "DNF", tone: "error" },
        ]}
      />
      <Tabs
        value={tab}
        onChange={setTab}
        aria-label="Example tabs"
        items={[
          { value: "overview", label: "Overview", icon: <Target /> },
          { value: "solves", label: "Solves", icon: <Clock /> },
          { value: "charts", label: "Charts", icon: <Flame />, badge: "3" },
        ]}
      />
      <div className="max-w-xs">
        <SelectMenu
          label="Event"
          value={event}
          onChange={setEvent}
          searchable
          options={[
            { value: "333", label: "3x3" },
            { value: "222", label: "2x2" },
            { value: "444", label: "4x4", description: "Reduction" },
            { value: "minx", label: "Megaminx", disabled: true },
          ]}
        />
      </div>
      <OptionTiles
        legend="Method"
        value={tile}
        onChange={setTile}
        options={[
          { value: "cfop", label: "CFOP", description: "Cross, F2L, OLL, PLL" },
          { value: "roux", label: "Roux", description: "Blocks and M slice" },
        ]}
      />
      <Stepper
        steps={[
          { id: 1, title: "Level", icon: <Target /> },
          { id: 2, title: "Goal", icon: <Trophy /> },
          { id: 3, title: "Schedule", icon: <Clock /> },
        ]}
        current={step}
        onStepClick={setStep}
      />
      <Pagination page={page} totalPages={12} onChange={setPage} />
    </div>
  );
}

function CardShowcase() {
  const collapsible = useCollapsed(undefined, true);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader title="Default" />
          <p className="type-body">Hover to see the primary border.</p>
        </Card>
        <Card variant="nested">
          <CardHeader title="Nested" />
          <p className="type-body">Sits inside another card.</p>
        </Card>
        <Card variant="static">
          <CardHeader title="Static" />
          <p className="type-body">No hover treatment.</p>
        </Card>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <StatTile label="Best" value="9.87" tone="success" />
        <StatTile
          label="Average"
          value="12.34"
          trend={{ direction: "down", label: "4%", good: true }}
        />
        <StatTile label="Solves" value="1,420" mono={false} icon={<Clock />} />
        <StatTile
          label="Streak"
          value="12 days"
          mono={false}
          tone="warning"
          hint="Personal best"
        />
      </div>
      <Row>
        <CardIcon>
          <Trophy />
        </CardIcon>
        <CardIcon tone="success">
          <Check />
        </CardIcon>
        <CardIcon tone="warning">
          <Flame />
        </CardIcon>
        <CardIcon tone="neutral">
          <Settings />
        </CardIcon>
      </Row>
      <CalloutCard
        icon={<Flame />}
        title="You have 3 reviews due"
        description="Keep your learning momentum going with spaced repetition"
        action={
          <Button className="w-full sm:w-auto" iconLeft={<Play />}>
            Start SRS Review
          </Button>
        }
      />
      <CalloutCard
        tone="warning"
        title="Your streak is at risk"
        description="A standing prompt, outlined in its tone with a heavier left rule."
        adornment={<IconButton aria-label="Dismiss" size="sm" icon={<Check />} />}
      />
      <Card variant="static">
        <CardHeader title="Progress" description="Determinate fill with an optional expectation marker" />
        <div className="space-y-4">
          <div>
            <ProgressLabel value="62%">Goal progress</ProgressLabel>
            <ProgressBar
              label="Goal progress"
              value={62}
              marker={{ value: 45, label: "Expected: 45%" }}
            />
          </div>
          <div>
            <ProgressLabel value="3 / 5">Solves completed</ProgressLabel>
            <ProgressBar
              label="Solves completed"
              tone="success"
              size="sm"
              value={3}
              max={5}
              valueText="3 of 5 solves"
            />
          </div>
        </div>
      </Card>
      <CollapsibleCard
        title="Collapsible card"
        open={collapsible.open}
        onOpenChange={collapsible.onOpenChange}
        actions={
          <IconButton aria-label="Settings" size="sm" icon={<Settings />} />
        }
      >
        <p className="type-body">
          The body animates its measured height, and collapses instantly under
          reduced motion.
        </p>
      </CollapsibleCard>
    </div>
  );
}

function ToastShowcase() {
  const toast = useToast();
  return (
    <Row>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => toast.success("Saved")}
      >
        Success toast
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() =>
          toast.error("Couldn't save", { description: "Try again." })
        }
      >
        Error toast
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => toast.info("Heads up")}
      >
        Info toast
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => toast.warning("Careful")}
      >
        Warning toast
      </Button>
    </Row>
  );
}

function OverlayShowcase() {
  const [dialog, setDialog] = useState<
    "dialog" | "sheet" | "fullscreen" | null
  >(null);
  const [sheet, setSheet] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <>
      <Row>
        <Button variant="secondary" onClick={() => setDialog("dialog")}>
          Modal (dialog)
        </Button>
        <Button variant="secondary" onClick={() => setDialog("sheet")}>
          Modal (sheet on mobile)
        </Button>
        <Button variant="secondary" onClick={() => setDialog("fullscreen")}>
          Modal (fullscreen on mobile)
        </Button>
        <Button variant="secondary" onClick={() => setSheet(true)}>
          Bottom sheet
        </Button>
        <Button variant="danger" onClick={() => setConfirm(true)}>
          Confirm delete
        </Button>
        <Tooltip content="Tooltips show on hover and focus">
          <Button variant="subtle">Tooltip</Button>
        </Tooltip>
        <Menu
          title="Actions"
          trigger={(props) => (
            <Button {...props} variant="subtle">
              Menu
            </Button>
          )}
          items={[
            { label: "Edit", icon: <Settings />, onSelect: () => {} },
            { label: "Download", icon: <Download />, onSelect: () => {} },
            { type: "separator" },
            {
              label: "Delete",
              icon: <Trash2 />,
              tone: "danger",
              onSelect: () => {},
            },
          ]}
        />
        <Popover
          title="Details"
          trigger={(props) => (
            <Button {...props} variant="subtle">
              Popover
            </Button>
          )}
        >
          <p className="type-body">Anchored content that isn&apos;t a menu.</p>
        </Popover>
      </Row>

      <Modal
        open={dialog !== null}
        onClose={() => setDialog(null)}
        size="md"
        mobile={dialog ?? "dialog"}
      >
        <Modal.Header
          icon={<Target />}
          title="Modal title"
          description="Header, scrolling body, pinned footer."
        />
        <Modal.Body className="space-y-3">
          <p className="type-body">
            Escape closes the top-most layer, focus is trapped inside, and the
            page behind cannot scroll.
          </p>
          <Field label="A field inside a dialog">
            <Input placeholder="Type here" />
          </Field>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDialog(null)}>
            Cancel
          </Button>
          <Button onClick={() => setDialog(null)}>Save</Button>
        </Modal.Footer>
      </Modal>

      <BottomSheet
        isOpen={sheet}
        onClose={() => setSheet(false)}
        title="Bottom sheet"
      >
        <p className="type-body">Swipe down or press Escape to close.</p>
      </BottomSheet>

      <ConfirmDialog
        isOpen={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => setConfirm(false)}
        title="Delete session?"
        description="This removes every solve in the session."
        warning="This cannot be undone."
        confirmLabel="Delete session"
      />
    </>
  );
}

function NavigationShowcase() {
  return (
    <div className="space-y-6 border border-(--border) rounded-(--radius-card) p-4">
      <Breadcrumbs
        items={[
          { label: "Cube Lab", href: "/cube-lab/timer" },
          { label: "Algorithm trainer", href: "/cube-lab/algorithm-trainer" },
          { label: "OLL 21" },
        ]}
      />
      <PageHeader
        title="Page header"
        description="Title, description and actions, with a back link on mobile."
        back={{ href: "/cube-lab/timer", label: "Timer" }}
        actions={<Button size="sm">Action</Button>}
      />
      <BackLink href="/cube-lab/timer">Back to timer</BackLink>
    </div>
  );
}
