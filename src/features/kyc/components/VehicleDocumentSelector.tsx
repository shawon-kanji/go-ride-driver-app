import { Select } from '../../../components/Select';
import type { Vehicle } from '../../../api/types';

interface VehicleDocumentSelectorProps {
  vehicles: Vehicle[];
  value: string;
  onChange: (vehicleId: string) => void;
}

export function VehicleDocumentSelector({ vehicles, value, onChange }: VehicleDocumentSelectorProps) {
  return (
    <Select
      label="Vehicle"
      value={value}
      options={vehicles.map((v) => ({ label: `${v.plate_number} · ${v.model_name}`, value: v.id }))}
      onChange={onChange}
    />
  );
}
