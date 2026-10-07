"use client";

import { useId, useState } from "react";
import { Palette, Timer } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Tabs, tabPanelProps } from "@/components/ui/Tabs";
import TimerCustomization from "@/components/settings/TimerCustomization";
import {
  TimerSettingsPanel,
  type TimerSettingsPanelProps,
} from "./TimerSettings";

type SettingsTab = "timer" | "appearance";

interface TimerSettingsModalProps extends TimerSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Every timer setting, where the timer is.
 *
 * Behaviour (mode, inspection, splits…) and appearance (layout, font, display
 * mode) used to be split between this dialog and the settings page; both now
 * live here so a change can be judged against the timer it changes.
 */
export default function TimerSettingsModal({
  isOpen,
  onClose,
  ...settingsProps
}: TimerSettingsModalProps) {
  const [tab, setTab] = useState<SettingsTab>("timer");
  const tabsId = useId();

  return (
    <Modal open={isOpen} onClose={onClose} size="lg" mobile="sheet">
      <Modal.Header title="Timer Settings" closeLabel="Close timer settings" />
      <Modal.Body>
        <Tabs
          id={tabsId}
          value={tab}
          onChange={setTab}
          aria-label="Timer settings sections"
          fullWidth
          className="mb-5"
          items={[
            { value: "timer", label: "Timer", icon: <Timer /> },
            { value: "appearance", label: "Appearance", icon: <Palette /> },
          ]}
        />
        <div {...tabPanelProps(tabsId, tab)} className="outline-none">
          {tab === "timer" ? (
            <TimerSettingsPanel {...settingsProps} />
          ) : (
            <TimerCustomization />
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
}
