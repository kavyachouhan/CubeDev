"use client";

import { Field } from "@/components/ui/Field";
import { SelectMenu } from "@/components/ui/Menu";

interface Option {
  value: string;
  label: string;
}

interface FeedbackDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

/** Single-select for survey questions, built on the shared SelectMenu. */
export default function FeedbackDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option…",
  label,
}: FeedbackDropdownProps) {
  const menu = (
    <SelectMenu
      label={label ?? placeholder}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );

  return label ? <Field label={label}>{menu}</Field> : menu;
}
