(function () {
  const root = document.querySelector('[data-dashboard]');
  if (!root) return;

  const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });

  const kpiBalance = document.querySelector('[data-kpi="balance"]');
  const kpiActive = document.querySelector('[data-kpi="active"]');
  const kpiCompleted = document.querySelector('[data-kpi="completed"]');
  const kpiWithdrawals = document.querySelector('[data-kpi="withdrawals"]');

  const emailBadge = document.querySelector('[data-email-badge]');
  const emailNote = document.querySelector('[data-email-note]');
  const emailRequestForm = document.querySelector('[data-email-request-form]');
  const emailRequestButton = document.querySelector('[data-email-request-button]');
  const emailConfirmForm = document.querySelector('[data-email-confirm-form]');
  const emailConfirmButton = document.querySelector('[data-email-confirm-button]');
  const emailCodeInput = document.querySelector('#emailCode');
  const emailMessage = document.querySelector('[data-email-message]');

  const planSelect = document.querySelector('[name="planId"]');
  const investAmountInput = document.querySelector('#investmentAmount');
  const investForm = document.querySelector('[data-invest-form]');
  const investMessage = document.querySelector('[data-invest-message]');

  const withdrawalForm = document.querySelector('[data-withdraw-form]');
  const withdrawalMessage = document.querySelector('[data-withdraw-message]');
  const withdrawButton = document.querySelector('[data-withdraw-button]');
  const withdrawInput = document.querySelector('#withdrawAmount');
  const withdrawIndicator = document.querySelector('[data-withdraw-indicator]');

  const depositForm = document.querySelector('[data-deposit-form]');
  const depositMessage = document.querySelector('[data-deposit-message]');
  const depositButton = document.querySelector('[data-deposit-button]');
  const depositAmountInput = document.querySelector('#depositAmount');
  const depositNetworkSelect = document.querySelector('[data-deposit-network]');
  const depositTxRefInput = document.querySelector('#depositTxRef');
  const depositWalletAddress = document.querySelector('[data-deposit-wallet-address]');
  const copyDepositWalletButton = document.querySelector('[data-copy-deposit-wallet]');
  const depositAssetLabels = document.querySelectorAll('[data-deposit-asset]');
  const depositsBody = document.querySelector('[data-deposits-body]');

  const reviewForm = document.querySelector('[data-review-form]');
  const reviewMessage = document.querySelector('[data-review-message]');
  const reviewButton = document.querySelector('[data-review-button]');

  const lockBadge = document.querySelector('[data-lock-badge]');
  const lockReason = document.querySelector('[data-lock-reason]');
  const lockProgress = document.querySelector('[data-lock-progress]');
  const lockProgressLabel = document.querySelector('[data-lock-progress-label]');

  const withdrawalsBody = document.querySelector('[data-withdrawals-body]');
  const userName = document.querySelector('[data-user-name]');
  const logoutButton = document.querySelector('[data-logout]');

  const state = {
    user: {
      emailVerification: {
        verified: false,
        codeExpiresAt: null,
      },
    },
    withdrawalAccess: {
      status: 'locked',
      reason: 'KYC review required before withdrawals.',
      requestedAt: null,
      reviewedAt: null,
    },
    walletConfig: {
      assetSymbol: 'USDT',
      walletAddress: '',
      defaultNetwork: 'TRC20',
      enabledNetworks: ['ERC20', 'TRC20', 'BEP20'],
      walletPaymentsEnabled: true,
    },
    systemSettings: {
      depositsEnabled: true,
      investmentsEnabled: true,
      withdrawalsEnabled: true,
      walletPaymentsEnabled: true,
    },
  };

  function normalizeMoney(value) {
    return Math.round(value * 100) / 100;
  }

  function setMessage(el, text, type) {
    if (!el) return;
    el.textContent = text || '';
    el.className = `form-message ${type || ''}`.trim();
  }

  function getAccessDisplay(status) {
    if (status === 'approved') {
      return { label: 'Approved', badgeClass: 'approved', progress: 100 };
    }
    if (status === 'pending_review') {
      return { label: 'Pending Review', badgeClass: 'pending_review', progress: 65 };
    }
    if (status === 'rejected') {
      return { label: 'Rejected', badgeClass: 'rejected', progress: 35 };
    }
    return { label: 'Locked', badgeClass: 'locked', progress: 15 };
  }

  function renderPlans(plans) {
    if (!plans.length) {
      planSelect.innerHTML = '<option value="">No plans available</option>';
      return;
    }

    planSelect.innerHTML = plans
      .map(
        (plan) =>
          `<option value="${plan.id}">${plan.name} (${money.format(plan.min)} - ${money.format(plan.max)}, ${plan.durationHours}h)</option>`,
      )
      .join('');
  }

  function renderEmailVerification(emailVerification) {
    const info = emailVerification || {};
    const verified = Boolean(info.verified);

    emailBadge.className = `pill ${verified ? 'approved' : 'pending_review'}`;
    emailBadge.textContent = verified ? 'Verified' : 'Pending';

    if (verified) {
      emailNote.textContent = `Email verified${info.verifiedAt ? ` on ${new Date(info.verifiedAt).toLocaleString()}` : ''}.`;
      emailRequestButton.disabled = true;
      emailConfirmButton.disabled = true;
      emailCodeInput.disabled = true;
      emailCodeInput.value = '';
    } else {
      emailRequestButton.disabled = false;
      emailConfirmButton.disabled = false;
      emailCodeInput.disabled = false;

      if (info.codeExpiresAt) {
        emailNote.textContent = `Verification code active until ${new Date(info.codeExpiresAt).toLocaleString()}.`;
      } else {
        emailNote.textContent = 'Email verification is recommended for stronger account security.';
      }
    }
  }

  function renderWithdrawalAccess(withdrawalAccess) {
    state.withdrawalAccess = withdrawalAccess;

    const display = getAccessDisplay(withdrawalAccess.status);
    lockBadge.className = `pill ${display.badgeClass}`;
    lockBadge.textContent = display.label;

    withdrawIndicator.className = `pill ${display.badgeClass}`;
    withdrawIndicator.textContent = display.label;

    lockReason.textContent = withdrawalAccess.reason || 'KYC review required before withdrawals.';
    lockProgress.style.width = `${display.progress}%`;
    lockProgressLabel.textContent = `${display.progress}% complete`;

    if (withdrawalAccess.status === 'pending_review') {
      reviewButton.disabled = true;
      reviewButton.textContent = 'Review Pending';
    } else if (withdrawalAccess.status === 'approved') {
      reviewButton.disabled = true;
      reviewButton.textContent = 'Review Approved';
    } else {
      reviewButton.disabled = false;
      reviewButton.textContent = 'Request KYC Review';
    }
  }

  function renderWalletConfig(config, systemSettings) {
    state.walletConfig = {
      ...state.walletConfig,
      ...(config || {}),
    };
    state.systemSettings = systemSettings || state.systemSettings;

    const networks = Array.isArray(state.walletConfig.enabledNetworks) && state.walletConfig.enabledNetworks.length
      ? state.walletConfig.enabledNetworks
      : [state.walletConfig.defaultNetwork || 'TRC20'];

    depositNetworkSelect.innerHTML = '';
    networks.forEach((network) => {
      const option = document.createElement('option');
      option.value = network;
      option.textContent = network;
      depositNetworkSelect.appendChild(option);
    });

    if (state.walletConfig.defaultNetwork && networks.includes(state.walletConfig.defaultNetwork)) {
      depositNetworkSelect.value = state.walletConfig.defaultNetwork;
    }

    depositWalletAddress.textContent = String(state.walletConfig.walletAddress || '').trim() || '(not configured)';

    const assetSymbol = String(state.walletConfig.assetSymbol || 'USDT').trim() || 'USDT';
    depositAssetLabels.forEach((node) => {
      node.textContent = assetSymbol;
    });
  }

  function renderDeposits(deposits) {
    if (!deposits.length) {
      depositsBody.innerHTML = '<tr><td colspan="6">No deposits yet.</td></tr>';
      return;
    }

    depositsBody.innerHTML = deposits
      .map((item) => {
        const statusClass =
          item.status === 'approved' ? 'approved' : item.status === 'rejected' ? 'rejected' : 'pending_review';
        return `<tr>
          <td>${money.format(Number(item.amount || 0))}</td>
          <td>${item.method || '-'}</td>
          <td>${item.network || '-'}</td>
          <td>${item.txReference || '-'}</td>
          <td><span class="pill ${statusClass}">${String(item.status || 'pending').replace(/_/g, ' ')}</span></td>
          <td>${new Date(item.createdAt).toLocaleString()}</td>
        </tr>`;
      })
      .join('');
  }

  function renderWithdrawals(withdrawals) {
    if (!withdrawals.length) {
      withdrawalsBody.innerHTML = '<tr><td colspan="6">No withdrawals yet.</td></tr>';
      return;
    }

    withdrawalsBody.innerHTML = withdrawals
      .map((item) => {
        const fee = Number.isFinite(item.fee) ? item.fee : Number(item.holdAmount || 0);
        const netAmount = Number.isFinite(item.netAmount)
          ? item.netAmount
          : normalizeMoney(Number(item.amount || 0) - Number(fee || 0));

        const statusClass = item.status === 'processing' ? 'processing' : 'completed';

        return `<tr>
          <td>${money.format(Number(item.amount || 0))}</td>
          <td>${money.format(Number(fee || 0))}</td>
          <td>${money.format(Number(netAmount || 0))}</td>
          <td><span class="pill ${statusClass}">${String(item.status || 'processing').replace(/_/g, ' ')}</span></td>
          <td>${new Date(item.createdAt).toLocaleDateString()}</td>
          <td>${new Date(item.createdAt).toLocaleTimeString()}</td>
        </tr>`;
      })
      .join('');
  }

  function applyActionLocks() {
    const walletConfigured = String(state.walletConfig.walletAddress || '').trim().length > 0;

    const depositsEnabled = Boolean(state.systemSettings.depositsEnabled);
    const investmentsEnabled = Boolean(state.systemSettings.investmentsEnabled);
    const withdrawalsEnabled = Boolean(state.systemSettings.withdrawalsEnabled);

    setMessage(investMessage, '');
    setMessage(depositMessage, '');
    setMessage(withdrawalMessage, '');

    const canInvest = investmentsEnabled;
    investForm.querySelector('button[type="submit"]').disabled = !canInvest;
    investAmountInput.disabled = !canInvest;

    const canDeposit = depositsEnabled && walletConfigured;
    depositButton.disabled = !canDeposit;
    depositAmountInput.disabled = !canDeposit;
    depositNetworkSelect.disabled = !canDeposit;
    depositTxRefInput.disabled = !canDeposit;

    const withdrawUnlocked = state.withdrawalAccess.status === 'approved';
    const canWithdraw = withdrawalsEnabled && withdrawUnlocked;
    withdrawButton.disabled = !canWithdraw;
    withdrawInput.disabled = !canWithdraw;

    if (!walletConfigured) {
      setMessage(depositMessage, 'Deposit wallet is not configured by admin.', 'error');
    }

    if (!depositsEnabled) {
      setMessage(depositMessage, 'Deposits are temporarily disabled.', 'error');
    }

    if (!investmentsEnabled) {
      setMessage(investMessage, 'Investments are temporarily disabled.', 'error');
    }

    if (!withdrawalsEnabled) {
      setMessage(withdrawalMessage, 'Withdrawals are temporarily disabled.', 'error');
    }
  }

  async function getJson(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.error || 'Request failed');
      error.status = response.status;
      throw error;
    }
    return data;
  }

  async function loadDashboard() {
    const [meData, plansData, investmentData, withdrawalData, accessData, walletConfigData, depositData] =
      await Promise.all([
        getJson('/api/me'),
        getJson('/api/plans'),
        getJson('/api/investments'),
        getJson('/api/withdrawals'),
        getJson('/api/withdrawal-access'),
        getJson('/api/wallet/config'),
        getJson('/api/deposits'),
      ]);

    state.user = meData.user;

    userName.textContent = meData.user.name;
    renderPlans(plansData.plans || []);
    renderEmailVerification(meData.user.emailVerification || {});
    renderWithdrawalAccess(accessData.withdrawalAccess);
    renderWalletConfig(walletConfigData.config, walletConfigData.systemSettings);
    renderWithdrawals(withdrawalData.withdrawals || []);
    renderDeposits(depositData.deposits || []);

    const activeCount = (investmentData.investments || []).filter((inv) => inv.status === 'active').length;
    const completedCount = (investmentData.investments || []).filter((inv) => inv.status === 'completed').length;
    const totalWithdrawalAmount = (withdrawalData.withdrawals || []).reduce(
      (sum, wd) => sum + Number(wd.amount || 0),
      0,
    );

    kpiBalance.textContent = money.format(Number(meData.user.balance || 0));
    kpiActive.textContent = String(activeCount);
    kpiCompleted.textContent = String(completedCount);
    kpiWithdrawals.textContent = money.format(totalWithdrawalAmount);

    applyActionLocks();
  }

  emailRequestForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage(emailMessage, '');

    try {
      const data = await getJson('/api/email-verification/request', { method: 'POST' });
      setMessage(emailMessage, data.message || 'Verification code sent.', 'success');
      await loadDashboard();
    } catch (error) {
      setMessage(emailMessage, error.message, 'error');
    }
  });

  emailConfirmForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage(emailMessage, '');

    const code = String(emailCodeInput.value || '').trim();

    try {
      const data = await getJson('/api/email-verification/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      setMessage(emailMessage, data.message || 'Email verified.', 'success');
      emailConfirmForm.reset();
      await loadDashboard();
    } catch (error) {
      setMessage(emailMessage, error.message, 'error');
    }
  });

  investForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage(investMessage, '');

    const planId = planSelect.value;
    const amount = Number(investAmountInput.value);

    try {
      await getJson('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, amount }),
      });

      setMessage(investMessage, 'Investment started successfully.', 'success');
      investAmountInput.value = '';
      await loadDashboard();
    } catch (error) {
      setMessage(investMessage, error.message, 'error');
    }
  });

  reviewForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage(reviewMessage, '');

    const formData = new FormData(reviewForm);
    const passportFile = reviewForm.querySelector('[name="passportScanFile"]').files[0];
    const selfieFile = reviewForm.querySelector('[name="selfiePhotoFile"]').files[0];
    const proofFile = reviewForm.querySelector('[name="proofOfAddressFile"]').files[0];

    if (!passportFile || !selfieFile || !proofFile) {
      setMessage(reviewMessage, 'Please attach passport/ID scan, selfie photo, and proof of address files.', 'error');
      return;
    }

    const payload = {
      legalName: String(formData.get('legalName') || '').trim(),
      dateOfBirth: String(formData.get('dateOfBirth') || '').trim(),
      country: String(formData.get('country') || '').trim(),
      idType: String(formData.get('idType') || '').trim(),
      idNumber: String(formData.get('idNumber') || '').trim(),
      addressLine1: String(formData.get('addressLine1') || '').trim(),
      city: String(formData.get('city') || '').trim(),
      stateOrProvince: String(formData.get('stateOrProvince') || '').trim(),
      postalCode: String(formData.get('postalCode') || '').trim(),
      passportScanFileName: passportFile.name,
      passportScanFileType: passportFile.type,
      passportScanFileSize: passportFile.size,
      selfiePhotoFileName: selfieFile.name,
      selfiePhotoFileType: selfieFile.type,
      selfiePhotoFileSize: selfieFile.size,
      proofOfAddressFileName: proofFile.name,
      proofOfAddressFileType: proofFile.type,
      proofOfAddressFileSize: proofFile.size,
      note: String(formData.get('note') || '').trim(),
    };

    try {
      const data = await getJson('/api/withdrawal-access/request-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setMessage(reviewMessage, data.message || 'KYC review requested.', 'success');
      await loadDashboard();
    } catch (error) {
      setMessage(reviewMessage, error.message, 'error');
    }
  });

  depositForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage(depositMessage, '');

    const payload = {
      amount: Number(depositForm.querySelector('[name="amount"]').value),
      network: String(depositForm.querySelector('[name="network"]').value || '').trim(),
      txReference: String(depositForm.querySelector('[name="txReference"]').value || '').trim(),
    };

    try {
      const data = await getJson('/api/deposits/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setMessage(depositMessage, data.message || 'Deposit request submitted.', 'success');
      depositForm.reset();
      depositNetworkSelect.value = state.walletConfig.defaultNetwork;
      await loadDashboard();
    } catch (error) {
      setMessage(depositMessage, error.message, 'error');
    }
  });

  withdrawalForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage(withdrawalMessage, '');

    if (state.withdrawalAccess.status !== 'approved') {
      setMessage(withdrawalMessage, 'Withdrawals are locked until KYC is approved.', 'error');
      return;
    }

    const amount = Number(withdrawalForm.querySelector('[name="amount"]').value);

    try {
      await getJson('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      setMessage(withdrawalMessage, 'Withdrawal request submitted.', 'success');
      withdrawalForm.reset();
      await loadDashboard();
    } catch (error) {
      setMessage(withdrawalMessage, error.message, 'error');
    }
  });

  copyDepositWalletButton.addEventListener('click', async () => {
    const text = String(depositWalletAddress.textContent || '').trim();
    if (!text || text === '(not configured)') {
      setMessage(depositMessage, 'Wallet address is not configured.', 'error');
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setMessage(depositMessage, 'Wallet address copied.', 'success');
      } else {
        setMessage(depositMessage, 'Clipboard API not available in this browser.', 'error');
      }
    } catch {
      setMessage(depositMessage, 'Unable to copy wallet address.', 'error');
    }
  });

  logoutButton.addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/appaccount/login';
  });

  loadDashboard().catch((error) => {
    if (error.status === 401) {
      window.location.href = '/appaccount/login';
      return;
    }

    setMessage(investMessage, error.message || 'Failed to load dashboard.', 'error');
  });
})();
