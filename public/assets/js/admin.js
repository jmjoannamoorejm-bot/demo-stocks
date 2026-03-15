(function () {
  const root = document.querySelector('[data-admin-panel]');
  if (!root) return;

  const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });

  const authForm = document.querySelector('[data-admin-auth]');
  const adminMessage = document.querySelector('[data-admin-message]');
  const adminContent = document.querySelector('[data-admin-content]');

  const walletForm = document.querySelector('[data-wallet-form]');
  const walletMessage = document.querySelector('[data-wallet-message]');

  const systemForm = document.querySelector('[data-system-form]');
  const systemMessage = document.querySelector('[data-system-message]');

  const notificationsBody = document.querySelector('[data-notifications-body]');
  const kycBody = document.querySelector('[data-kyc-body]');
  const depositsBody = document.querySelector('[data-deposits-body]');
  const paymentsBody = document.querySelector('[data-payments-body]');
  const usersBody = document.querySelector('[data-users-body]');

  const statUsers = document.querySelector('[data-stat="users"]');
  const statSessions = document.querySelector('[data-stat="sessions"]');
  const statKyc = document.querySelector('[data-stat="kyc"]');
  const statDeposits = document.querySelector('[data-stat="deposits"]');
  const statWalletPayments = document.querySelector('[data-stat="wallet_payments"]');
  const statTotalBalance = document.querySelector('[data-stat="total_balance"]');

  const adminAuth = {
    token: '',
    legacyKey: '',
  };

  function setMessage(el, text, type) {
    if (!el) return;
    el.textContent = text || '';
    el.className = `form-message ${type || ''}`.trim();
  }

  function setAdminContentVisible(visible) {
    if (!adminContent) return;
    adminContent.hidden = !visible;
  }

  function toDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
  }

  function statusPillClass(status) {
    const value = String(status || '').toLowerCase();
    if (value.includes('approved') || value.includes('verified') || value.includes('completed')) {
      return 'approved';
    }
    if (value.includes('rejected')) {
      return 'rejected';
    }
    if (value.includes('pending')) {
      return 'pending_review';
    }
    if (value.includes('processing')) {
      return 'processing';
    }
    if (value.includes('locked')) {
      return 'locked';
    }
    return 'completed';
  }

  async function adminJson(url, options = {}) {
    if (!adminAuth.token && !adminAuth.legacyKey) {
      throw new Error('Admin authentication required.');
    }

    const authHeaders = {};
    if (adminAuth.token) {
      authHeaders['x-admin-token'] = adminAuth.token;
    } else if (adminAuth.legacyKey) {
      authHeaders['x-admin-key'] = adminAuth.legacyKey;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...authHeaders,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Admin request failed.');
    }

    return data;
  }

  function renderStats(siteStats) {
    const stats = siteStats || {};
    statUsers.textContent = String(stats.totalUsers || 0);
    statSessions.textContent = String(stats.activeSessions || 0);
    statKyc.textContent = String(stats.pendingKyc || 0);
    statDeposits.textContent = String(stats.pendingDeposits || 0);
    statWalletPayments.textContent = String(stats.pendingWalletPayments || 0);
    statTotalBalance.textContent = money.format(Number(stats.totalBalance || 0));
  }

  function renderNotifications(notifications) {
    if (!Array.isArray(notifications) || !notifications.length) {
      notificationsBody.innerHTML = '<tr><td colspan="3">No notifications.</td></tr>';
      return;
    }

    notificationsBody.innerHTML = notifications
      .map(
        (item) => `<tr>
          <td>${item.type || '-'}</td>
          <td><span class="pill ${statusPillClass(item.status)}">${String(item.status || '').replace(/_/g, ' ')}</span></td>
          <td>${toDate(item.createdAt)}</td>
        </tr>`,
      )
      .join('');
  }

  function renderKycRequests(items) {
    if (!Array.isArray(items) || !items.length) {
      kycBody.innerHTML = '<tr><td colspan="5">No pending KYC reviews.</td></tr>';
      return;
    }

    kycBody.innerHTML = items
      .map((item) => {
        const profile = item.kycProfile || null;
        const details = profile
          ? [
              profile.legalName,
              profile.idType ? profile.idType.replace(/_/g, ' ') : '',
              profile.idNumberMasked || '',
              profile.country || '',
              profile.passportScanFileName ? `ID: ${profile.passportScanFileName}` : '',
              profile.selfiePhotoFileName ? `Selfie: ${profile.selfiePhotoFileName}` : '',
              profile.proofOfAddressFileName ? `Proof: ${profile.proofOfAddressFileName}` : '',
            ]
              .filter(Boolean)
              .join(' | ')
          : item.reason || '-';

        return `<tr>
          <td>${item.name || item.userId}</td>
          <td>${item.email || '-'}</td>
          <td>${toDate(item.requestedAt)}</td>
          <td>${details}</td>
          <td>
            <button class="btn light" data-kyc-action="approved" data-user-id="${item.userId}">Approve</button>
            <button class="btn light" data-kyc-action="rejected" data-user-id="${item.userId}">Reject</button>
          </td>
        </tr>`;
      })
      .join('');
  }

  function renderDeposits(items) {
    if (!Array.isArray(items) || !items.length) {
      depositsBody.innerHTML = '<tr><td colspan="7">No pending deposits.</td></tr>';
      return;
    }

    depositsBody.innerHTML = items
      .map(
        (item) => `<tr>
          <td>${item.id}</td>
          <td>${item.userId}</td>
          <td>${money.format(Number(item.amount || 0))}</td>
          <td>${item.method || '-'}</td>
          <td>${item.network || '-'}</td>
          <td>${item.txReference || '-'}</td>
          <td>
            <button class="btn light" data-deposit-action="approved" data-deposit-id="${item.id}">Approve</button>
            <button class="btn light" data-deposit-action="rejected" data-deposit-id="${item.id}">Reject</button>
          </td>
        </tr>`,
      )
      .join('');
  }

  function renderPayments(items) {
    if (!Array.isArray(items) || !items.length) {
      paymentsBody.innerHTML = '<tr><td colspan="7">No wallet payment requests.</td></tr>';
      return;
    }

    paymentsBody.innerHTML = items
      .map((item) => {
        const pending = String(item.status || '').toLowerCase() === 'pending_verification';
        return `<tr>
          <td>${item.id}</td>
          <td>${item.userId}</td>
          <td>${money.format(Number(item.amount || 0))}</td>
          <td>${item.asset || '-'}</td>
          <td>${item.network || '-'}</td>
          <td><span class="pill ${statusPillClass(item.status)}">${String(item.status || '').replace(/_/g, ' ')}</span></td>
          <td>
            <button class="btn light" data-pay-action="verified" data-payment-id="${item.id}" ${pending ? '' : 'disabled'}>Mark Verified</button>
            <button class="btn light" data-pay-action="rejected" data-payment-id="${item.id}" ${pending ? '' : 'disabled'}>Reject</button>
          </td>
        </tr>`;
      })
      .join('');
  }

  function renderUsers(items) {
    if (!Array.isArray(items) || !items.length) {
      usersBody.innerHTML = '<tr><td colspan="5">No users available.</td></tr>';
      return;
    }

    usersBody.innerHTML = items
      .map(
        (item) => `<tr>
          <td>${item.name || item.id}</td>
          <td>${item.email || '-'}</td>
          <td>${money.format(Number(item.balance || 0))}</td>
          <td>
            <span class="pill ${statusPillClass(item.kycStatus)}">${String(item.kycStatus || '-').replace(/_/g, ' ')}</span>
            <div style="margin-top: 6px; font-size: 0.82rem; color: #5a6c82;">
              Email: ${item.emailVerified ? 'verified' : 'pending'}
            </div>
          </td>
          <td>
            <button class="btn light" data-user-balance="${item.id}">Adjust Balance</button>
          </td>
        </tr>`,
      )
      .join('');
  }

  function applyWalletConfig(config) {
    const enabledNetworks = Array.isArray(config.enabledNetworks) ? config.enabledNetworks : [];
    const fallbackDefault = enabledNetworks[0] || '';

    walletForm.querySelector('[name="assetSymbol"]').value = config.assetSymbol || 'USDT';
    walletForm.querySelector('[name="walletAddress"]').value = config.walletAddress || '';
    walletForm.querySelector('[name="defaultNetwork"]').value = config.defaultNetwork || fallbackDefault;
    walletForm.querySelector('[name="enabledNetworks"]').value = enabledNetworks.join(', ');
    walletForm.querySelector('[name="walletPaymentsEnabled"]').value = config.walletPaymentsEnabled ? 'on' : 'off';
  }

  function applySystemSettings(settings) {
    const system = settings || {};

    systemForm.querySelector('[name="depositsEnabled"]').value = system.depositsEnabled ? 'on' : 'off';
    systemForm.querySelector('[name="investmentsEnabled"]').value = system.investmentsEnabled ? 'on' : 'off';
    systemForm.querySelector('[name="withdrawalsEnabled"]').value = system.withdrawalsEnabled ? 'on' : 'off';
    systemForm.querySelector('[name="walletPaymentsEnabled"]').value = system.walletPaymentsEnabled ? 'on' : 'off';
  }

  async function loadOverview() {
    const data = await adminJson('/api/admin/overview');

    renderStats(data.siteStats || {});
    applyWalletConfig(data.config || {});
    applySystemSettings(data.systemSettings || {});

    renderNotifications(data.notifications || []);
    renderKycRequests(data.kycRequests || []);
    renderDeposits(data.depositRequests || []);
    renderPayments(data.paymentRequests || []);
    renderUsers(data.users || []);
    setAdminContentVisible(true);
  }

  setAdminContentVisible(false);

  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage(adminMessage, '');

    const username = String(authForm.querySelector('[name="username"]').value || '').trim();
    const password = String(authForm.querySelector('[name="password"]').value || '');
    const adminKey = String(authForm.querySelector('[name="adminKey"]').value || '').trim();

    try {
      const loginResponse = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, adminKey }),
      });

      const loginData = await loginResponse.json();
      if (!loginResponse.ok) {
        throw new Error(loginData.error || 'Unable to authenticate admin.');
      }

      adminAuth.token = String(loginData.token || '').trim();
      adminAuth.legacyKey = adminAuth.token ? '' : adminKey;

      await loadOverview();
      setMessage(adminMessage, loginData.message || 'Admin authenticated.', 'success');
    } catch (error) {
      setAdminContentVisible(false);
      setMessage(adminMessage, error.message, 'error');
    }
  });

  walletForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage(walletMessage, '');

    const payload = {
      assetSymbol: String(walletForm.querySelector('[name="assetSymbol"]').value || '').trim(),
      walletAddress: String(walletForm.querySelector('[name="walletAddress"]').value || '').trim(),
      defaultNetwork: String(walletForm.querySelector('[name="defaultNetwork"]').value || '').trim(),
      enabledNetworks: String(walletForm.querySelector('[name="enabledNetworks"]').value || '').trim(),
      walletPaymentsEnabled: walletForm.querySelector('[name="walletPaymentsEnabled"]').value === 'on',
    };

    if (!payload.defaultNetwork && payload.enabledNetworks) {
      payload.defaultNetwork = String(payload.enabledNetworks.split(',')[0] || '').trim();
    }

    try {
      await adminJson('/api/admin/wallet-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setMessage(walletMessage, 'Wallet settings updated.', 'success');
      await loadOverview();
    } catch (error) {
      setMessage(walletMessage, error.message, 'error');
    }
  });

  systemForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage(systemMessage, '');

    const payload = {
      depositsEnabled: systemForm.querySelector('[name="depositsEnabled"]').value === 'on',
      investmentsEnabled: systemForm.querySelector('[name="investmentsEnabled"]').value === 'on',
      withdrawalsEnabled: systemForm.querySelector('[name="withdrawalsEnabled"]').value === 'on',
      walletPaymentsEnabled: systemForm.querySelector('[name="walletPaymentsEnabled"]').value === 'on',
    };

    try {
      await adminJson('/api/admin/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setMessage(systemMessage, 'System settings updated.', 'success');
      await loadOverview();
    } catch (error) {
      setMessage(systemMessage, error.message, 'error');
    }
  });

  kycBody.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const decision = target.getAttribute('data-kyc-action');
    const userId = target.getAttribute('data-user-id');
    if (!decision || !userId) return;

    const reason = window.prompt('Optional review note:') || '';

    try {
      await adminJson('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, decision, reason }),
      });
      setMessage(adminMessage, `KYC review ${decision}.`, 'success');
      await loadOverview();
    } catch (error) {
      setMessage(adminMessage, error.message, 'error');
    }
  });

  depositsBody.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const decision = target.getAttribute('data-deposit-action');
    const depositId = target.getAttribute('data-deposit-id');
    if (!decision || !depositId) return;

    const note = window.prompt('Optional deposit note:') || '';

    try {
      await adminJson('/api/admin/deposits/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositId, decision, note }),
      });
      setMessage(adminMessage, `Deposit ${decision}.`, 'success');
      await loadOverview();
    } catch (error) {
      setMessage(adminMessage, error.message, 'error');
    }
  });

  paymentsBody.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const decision = target.getAttribute('data-pay-action');
    const paymentId = target.getAttribute('data-payment-id');
    if (!decision || !paymentId) return;

    const note = window.prompt('Optional payment note:') || '';

    try {
      await adminJson('/api/admin/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, decision, note }),
      });
      setMessage(adminMessage, `Payment ${decision}.`, 'success');
      await loadOverview();
    } catch (error) {
      setMessage(adminMessage, error.message, 'error');
    }
  });

  usersBody.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const userId = target.getAttribute('data-user-balance');
    if (!userId) return;

    const mode = String(window.prompt('Balance action: set, credit, or debit', 'credit') || '')
      .trim()
      .toLowerCase();

    if (!['set', 'credit', 'debit'].includes(mode)) {
      setMessage(adminMessage, 'Invalid balance action.', 'error');
      return;
    }

    const amountInput = window.prompt('Enter amount (USD):', '0');
    if (amountInput === null) return;

    const amount = Number(amountInput);
    if (!Number.isFinite(amount) || amount < 0) {
      setMessage(adminMessage, 'Amount must be a valid non-negative number.', 'error');
      return;
    }

    try {
      await adminJson('/api/admin/users/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, mode, amount }),
      });
      setMessage(adminMessage, 'User balance updated.', 'success');
      await loadOverview();
    } catch (error) {
      setMessage(adminMessage, error.message, 'error');
    }
  });
})();
