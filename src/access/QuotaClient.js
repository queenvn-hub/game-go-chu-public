const API_OPTIONS = { credentials: 'same-origin', cache: 'no-store' };

function isLocalOwnerPreview() {
  const config = globalThis.ORBIT_TYPE_BETA_CONFIG;
  const location = globalThis.location;
  return Boolean(config?.ownerMode && location
    && (location.protocol === 'file:' || ['localhost', '127.0.0.1'].includes(location.hostname)));
}

function isPublicMode() {
  return globalThis.ORBIT_TYPE_BETA_CONFIG?.publicMode === true;
}

let accountRequest;
let quotaStatusRequest;

export async function loadAccessAccount() {
  if (isPublicMode()) {
    globalThis.ORBIT_TYPE_ACCOUNT = null;
    return null;
  }
  if (isLocalOwnerPreview()) {
    const account = { owner: true, approved: true, kind: 'owner', localPreview: true };
    globalThis.ORBIT_TYPE_ACCOUNT = account;
    return account;
  }
  if (!accountRequest) {
    accountRequest = fetch('/api/account', API_OPTIONS).then(async response => {
      if (!response.ok) throw new Error('account-unavailable');
      const payload = await response.json();
      const account = payload?.account && typeof payload.account === 'object' ? payload.account : null;
      globalThis.ORBIT_TYPE_ACCOUNT = account;
      return account;
    }).catch(() => {
      globalThis.ORBIT_TYPE_ACCOUNT = null;
      return null;
    });
  }
  return accountRequest;
}

export async function consumeQuota({ scope, key, language, screen = 1, step = 1, maxSteps = 1, count = true, sessionToken = null } = {}) {
  if (isPublicMode()) return { allowed: true, unlimited: true, sessionToken: null };
  if (isLocalOwnerPreview()) return { allowed: true, unlimited: true, sessionToken: null };
  try {
    const response = await fetch('/api/quota/consume', {
      ...API_OPTIONS,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope, key, language, screen, step, maxSteps, count, sessionToken })
    });
    const payload = await response.json();
    if (!response.ok) return { allowed: false, errorKey: payload?.errorKey || 'quotaUnavailable' };
    if (payload?.allowed === true && !payload.continued) quotaStatusRequest = null;
    return { ...payload, allowed: payload?.allowed === true };
  } catch {
    return { allowed: false, errorKey: 'quotaUnavailable' };
  }
}

export async function getQuotaStatus() {
  if (isPublicMode()) return { allowed: true, unlimited: true, arcade: {}, course: {} };
  if (isLocalOwnerPreview()) return {allowed: true, unlimited: true, arcade: {}, course: {}};
  if (!quotaStatusRequest) {
    quotaStatusRequest = fetch('/api/quota/status', API_OPTIONS).then(async response => {
      const payload = await response.json();
      if (!response.ok) return {allowed: false, errorKey: payload?.errorKey || 'quotaUnavailable'};
      return payload?.allowed === true ? payload : {allowed: false, errorKey: 'quotaUnavailable'};
    }).catch(() => ({allowed: false, errorKey: 'quotaUnavailable'}));
  }
  const status = await quotaStatusRequest;
  if (!status.allowed) quotaStatusRequest = null;
  return status;
}
