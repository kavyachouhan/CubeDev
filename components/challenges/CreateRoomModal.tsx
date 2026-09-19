"use client";

import { useState } from "react";
import { Check, Clock12, Clock5, Copy } from "lucide-react";
import { scrambleGenerator } from "@/components/timer/ScrambleGenerator";
import { useUser } from "@/components/UserProvider";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CardIcon } from "@/components/ui/Card";
import { EventIcon } from "@/components/ui/EventIcon";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { SelectMenu } from "@/components/ui/Menu";
import { Modal } from "@/components/ui/Modal";
import { OptionTiles } from "@/components/ui/OptionTiles";
import { SwitchRow } from "@/components/ui/Switch";
import { useToast } from "@/components/ui/Toast";

interface CreateRoomModalProps {
  onClose: () => void;
}

const EVENTS = [
  { id: "333", name: "3x3" },
  { id: "222", name: "2x2" },
  { id: "444", name: "4x4" },
  { id: "555", name: "5x5" },
  { id: "666", name: "6x6" },
  { id: "777", name: "7x7" },
  { id: "333oh", name: "3x3 OH" },
  { id: "333bf", name: "3x3 BLD" },
  { id: "pyram", name: "Pyraminx" },
  { id: "minx", name: "Megaminx" },
  { id: "skewb", name: "Skewb" },
  { id: "sq1", name: "Square-1" },
  { id: "clock", name: "Clock" },
];

const eventIcon = (id: string) => `/cube-icons/${id}.svg`;

export default function CreateRoomModal({ onClose }: CreateRoomModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    event: "333",
    format: "ao5" as "ao5" | "ao12",
    description: "",
    isPublic: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomCreated, setRoomCreated] = useState<{ roomId: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { user } = useUser();
  const router = useRouter();
  const toast = useToast();
  const createRoom = useMutation(api.challengeRooms.createRoom);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.convexId) return;

    setIsGenerating(true);
    setError(null);

    try {
      const scrambleCount = formData.format === "ao5" ? 5 : 12;
      const scrambles: string[] = [];
      for (let i = 0; i < scrambleCount; i++) {
        scrambles.push(await scrambleGenerator.generateScramble(formData.event));
      }

      const result = await createRoom({
        userId: user.convexId,
        name: formData.name,
        event: formData.event,
        format: formData.format,
        scrambles,
        description: formData.description,
        isPublic: formData.isPublic,
      });

      setRoomCreated({ roomId: result.roomId });
    } catch (caught) {
      console.error("Failed to create room:", caught);
      setError("Couldn't create the room. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyRoomLink = async () => {
    if (!roomCreated) return;
    const link = `${window.location.origin}/cube-lab/challenges/room/${roomCreated.roomId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Room link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  const goToRoom = () => {
    if (!roomCreated) return;
    router.push(`/cube-lab/challenges/room/${roomCreated.roomId}`);
    onClose();
  };

  if (roomCreated) {
    return (
      <Modal open onClose={onClose} size="md" mobile="sheet">
        <Modal.Header title="Room Created" />
        <Modal.Body className="space-y-5 text-center">
          <CardIcon tone="success" className="mx-auto w-14 h-14 [&_svg]:w-7 [&_svg]:h-7">
            <Check />
          </CardIcon>
          <p className="type-body">
            Your challenge room is ready. Share the room code or link with others.
          </p>
          <div className="rounded-(--radius-panel) border border-(--border) bg-(--surface-elevated) p-4">
            <p className="type-overline mb-1">Room code</p>
            <p className="type-time text-2xl font-bold text-(--primary) tracking-wider">
              {roomCreated.roomId}
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={copyRoomLink}
            iconLeft={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? "Copied" : "Copy room link"}
          </Button>
          <Button onClick={goToRoom} data-autofocus>
            Go to room
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} size="xl" mobile="sheet" closeOnBackdrop={false}>
      <Modal.Header
        title="Create Challenge Room"
        description="Set up a new challenge room to compete with others."
      />
      <form onSubmit={handleSubmit} className="contents">
        <Modal.Body className="space-y-5">
          {error && <Alert tone="error">{error}</Alert>}

          <Field label="Room Name" required>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter room name…"
              maxLength={100}
              required
              data-autofocus
            />
          </Field>

          <Field label="Event">
            <SelectMenu
              label="Event"
              searchable
              value={formData.event}
              onChange={(event) => setFormData({ ...formData, event })}
              options={EVENTS.map((event) => ({
                value: event.id,
                label: event.name,
                icon: <EventIcon eventId={event.id} size="sm" src={eventIcon(event.id)} alt={event.name} />,
              }))}
            />
          </Field>

          <OptionTiles
            legend="Format"
            value={formData.format}
            onChange={(format) => setFormData({ ...formData, format })}
            columns="grid-cols-1 sm:grid-cols-2"
            options={[
              { value: "ao5", label: "Average of 5", icon: <Clock5 />, description: "5 scrambles" },
              { value: "ao12", label: "Average of 12", icon: <Clock12 />, description: "12 scrambles" },
            ]}
          />

          <Field label="Description" hint="Optional">
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add a description for your room…"
              maxLength={500}
            />
          </Field>

          <SwitchRow
            label="Public Room"
            description="Allow room to appear in public listings"
            checked={formData.isPublic}
            onChange={(isPublic) => setFormData({ ...formData, isPublic })}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!formData.name}
            loading={isGenerating}
            loadingText="Generating scrambles…"
          >
            Create Room
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
