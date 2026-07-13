export function validateExceptions(value, now = new Date()) {
  if (!value || value.schemaVersion !== 1 || !Array.isArray(value.exceptions)) {
    throw new Error('invalid dependency exception document');
  }
  return value.exceptions.map((exception) => {
    if (
      !exception ||
      typeof exception.package !== 'string' ||
      typeof exception.advisory !== 'string' ||
      typeof exception.rationale !== 'string' ||
      typeof exception.owner !== 'string' ||
      typeof exception.expiresAt !== 'string'
    ) {
      throw new Error('invalid dependency vulnerability exception');
    }
    const expiry = new Date(exception.expiresAt);
    if (Number.isNaN(expiry.getTime())) throw new Error(`invalid expiry for ${exception.package}`);
    if (expiry <= now) throw new Error(`expired dependency exception for ${exception.package}`);
    if (expiry.getTime() - now.getTime() > 90 * 24 * 60 * 60 * 1000) {
      throw new Error(`dependency exception exceeds 90 days for ${exception.package}`);
    }
    return exception;
  });
}

export function advisoryIdentifiers(vulnerability) {
  const values = Array.isArray(vulnerability.via) ? vulnerability.via : [];
  return values.flatMap((entry) => {
    if (typeof entry === 'string') return [entry];
    if (!entry || typeof entry !== 'object') return [];
    return [entry.url, entry.source && String(entry.source), entry.name].filter(Boolean);
  });
}

export function isVulnerabilityExcepted(name, vulnerability, exceptions) {
  const identifiers = advisoryIdentifiers(vulnerability);
  return exceptions.some(
    (exception) =>
      exception.package === name &&
      (exception.advisory === '*' || identifiers.includes(exception.advisory)),
  );
}
