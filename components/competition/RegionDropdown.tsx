"use client";

import { MapPin } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { SelectMenu } from "@/components/ui/Menu";

interface Region {
  code: string;
  name: string;
}

interface RegionDropdownProps {
  regions: Region[];
  selectedRegion: string;
  onRegionChange: (code: string) => void;
  label?: string;
}

/** Region filter for competition lists; searchable because the list is long. */
export default function RegionDropdown({
  regions,
  selectedRegion,
  onRegionChange,
  label = "Region",
}: RegionDropdownProps) {
  return (
    <Field label={label}>
      <SelectMenu
        label={label}
        value={selectedRegion}
        onChange={onRegionChange}
        searchable
        searchPlaceholder="Search regions…"
        placeholder="All regions"
        options={regions.map((region) => ({
          value: region.code,
          label: region.name,
          icon: <MapPin />,
        }))}
      />
    </Field>
  );
}
