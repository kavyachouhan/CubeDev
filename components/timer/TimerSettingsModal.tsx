"use client";

import { Modal } from "@/components/ui/Modal";
import {
  TimerSettingsPanel,
  type TimerSettingsPanelProps,
} from "./TimerSettings";

interface TimerSettingsModalProps extends TimerSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TimerSettingsModal({
  isOpen,
  onClose,
  ...settingsProps
}: TimerSettingsModalProps) {
  return (
    <Modal open={isOpen} onClose={onClose} size="lg" mobile="sheet">
      <Modal.Header title="Timer Settings" closeLabel="Close timer settings" />
      <Modal.Body>
        <TimerSettingsPanel {...settingsProps} />
      </Modal.Body>
    </Modal>
  );
}
