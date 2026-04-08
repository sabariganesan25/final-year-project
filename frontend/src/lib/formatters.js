export function formatTimestamp(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatLongTimestamp(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function severityTone(severity) {
  const tones = {
    critical: "critical",
    high: "warning",
    medium: "default",
    low: "success",
  };
  return tones[(severity ?? "").toLowerCase()] ?? "default";
}

export function statusTone(status) {
  const tones = {
    open: "critical",
    investigating: "warning",
    mitigating: "accent",
    resolved: "success",
    closed: "muted",
  };
  return tones[(status ?? "").toLowerCase()] ?? "muted";
}

export function titleCase(value) {
  return (value ?? "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
