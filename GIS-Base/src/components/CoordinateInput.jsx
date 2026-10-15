import { useState } from 'react';
import { FormField } from './FormField.jsx';

export function CoordinateInput({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  format = 'dd',
  className = '',
  error,
}) {
  const [localValue, setLocalValue] = useState(value);

  const handleChange = (event) => {
    const newValue = event.target.value;
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  const formatLabels = {
    dd: 'الدرجات العشرية (DD)',
    dms: 'الدرجات والدقائق والثواني (DMS)',
    utm: 'نظام UTM',
    mgrs: 'نظام MGRS',
  };

  return (
    <FormField label={label} required={required} error={error} className={className}>
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder || `أدخل الإحداثيات بتنسيق ${formatLabels[format]} `}
        dir="ltr"
        autoComplete="off"
        spellCheck={false}
      />
    </FormField>
  );
}

export function CoordinatePairInput({
  label,
  longitude,
  latitude,
  onLongitudeChange,
  onLatitudeChange,
  required = false,
  className = '',
  error,
}) {
  return (
    <FormField label={label} required={required} error={error} className={className}>
      <div className="coordinate-fields">
        <input
          type="text"
          value={longitude}
          onChange={(e) => onLongitudeChange(e.target.value)}
          placeholder="خط الطول (Longitude)"
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
        />
        <input
          type="text"
          value={latitude}
          onChange={(e) => onLatitudeChange(e.target.value)}
          placeholder="خط العرض (Latitude)"
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </FormField>
  );
}