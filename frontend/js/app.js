/**
 * ExpenseFlow — Frontend Application
 * Connects to Spring Boot REST API on http://localhost:8080
 */

const API_BASE = 'https://expense-tracker-api-production-9500.up.railway.app/api';

// ============================================================
// STATE
// ============================================================
let state = {
    currentMonth:          new Date().getMonth() + 1,
    currentYear:           new Date().getFullYear(),
    expenses:              [],
    budgets:               [],
    allExpenses:           [],
    lastDonutData:         {},
    lastBarData:           [],
    lastAnalyticsExpenses: [],
};

const CATEGORIES = {
    'Food & Dining':    { color: '#f06292', icon: '🍽️' },
    'Bills & Utilities':{ color: '#7c6af7', icon: '⚡' },
    'Transport':        { color: '#4fc3f7', icon: '🚌' },
    'Entertainment':    { color: '#ffb74d', icon: '🎬' },
    'Healthcare':       { color: '#3ecf8e', icon: '💊' },
    'Shopping':         { color: '#f48fb1', icon: '🛍️' },
    'Education':        { color: '#ce93d8', icon: '📚' },
    'Other':            { color: '#90a4ae', icon: '◎'  },
};

const PAYMENT_LABELS = {
    CASH: 'Cash', CREDIT_CARD: 'Credit Card', DEBIT_CARD: 'Debit Card',
    UPI: 'UPI', NET_BANKING: 'Net Banking', OTHER: 'Other',
};

// ============================================================
// UTILITIES
// ============================================================
function debounce(fn, delay) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

// ============================================================
// API HELPERS
// ============================================================
async function apiFetch(path, method = 'GET', body = null) {
    const opts = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);

    try {
        const res = await fetch(API_BASE + path, opts);
        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || `HTTP ${res.status}`);
        }
        if (res.status === 204) return null;
        return await res.json();
    } catch (e) {
        console.error('API Error:', e);
        throw e;
    }
}

// ============================================================
// FORMATTING
// ============================================================
const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const monthName = (m, y) => new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

// ============================================================
// TOAST
// ============================================================
function showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3500);
}

// ============================================================
// NAVIGATION
// ============================================================
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.add('active');

    const navLink = document.querySelector(`[data-page="${page}"]`);
    if (navLink) navLink.classList.add('active');

    if (page === 'expenses')  loadExpensesPage();
    if (page === 'budget')    loadBudgetPage();
    if (page === 'analytics') loadAnalytics();

    // Close sidebar on mobile after navigation
    closeSidebar();
}

// ============================================================
// DASHBOARD
// ============================================================
async function loadDashboard() {
    try {
        const stats  = await apiFetch(`/expenses/stats/${state.currentYear}/${state.currentMonth}`);
        const recent = await apiFetch(`/expenses/month/${state.currentYear}/${state.currentMonth}`);

        state.expenses = recent;

        document.getElementById('dashSubtitle').textContent     = monthName(state.currentMonth, state.currentYear);
        document.getElementById('monthlyTotal').textContent      = fmt(stats.monthlyTotal || 0);
        document.getElementById('avgExpense').textContent        = fmt(stats.averageExpense || 0);
        document.getElementById('transactionCount').textContent  = `${stats.totalTransactions || 0} transactions`;

        // Top Category
        const catBreakdown = stats.categoryBreakdown || {};
        const topCat = Object.entries(catBreakdown).sort((a,b) => b[1]-a[1])[0];
        if (topCat) {
            document.getElementById('topCategory').textContent    = topCat[0];
            document.getElementById('topCategoryAmt').textContent = fmt(topCat[1]) + ' spent';
        }

        await updateBudgetHealth();

        renderDonutChart(catBreakdown);
        renderBarChart(stats.monthlyTrend || []);
        renderRecentExpenses(recent.slice(0, 6));

    } catch(e) {
        showToast('Could not connect to API. Is the server running?', 'error');
    }
}

async function updateBudgetHealth() {
    try {
        const status = await apiFetch(`/budgets/status/${state.currentYear}/${state.currentMonth}`);
        if (!status.length) {
            document.getElementById('budgetHealth').textContent    = '—';
            document.getElementById('budgetHealthSub').textContent = 'No budgets set';
            return;
        }
        const exceeded = status.filter(b => b.exceeded).length;
        const healthEl = document.getElementById('budgetHealth');
        const subEl    = document.getElementById('budgetHealthSub');
        if (exceeded === 0) {
            healthEl.textContent = '✓ On Track';
            healthEl.style.color = '#3ecf8e';
            subEl.textContent    = `All ${status.length} budgets in limit`;
        } else {
            healthEl.textContent = `${exceeded} Exceeded`;
            healthEl.style.color = '#f05656';
            subEl.textContent    = `of ${status.length} budgets`;
        }
    } catch(e) { /* silent */ }
}

// ============================================================
// DONUT CHART — responsive, pure Canvas
// ============================================================
function renderDonutChart(categoryData) {
    state.lastDonutData = categoryData;

    const canvas  = document.getElementById('donutChart');
    const wrapper = canvas.parentElement;
    // Clamp to 220 max but fill the container on small screens
    const size    = Math.min(wrapper.clientWidth || 220, 220);
    canvas.width  = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    const cx  = size / 2;
    const cy  = size / 2;
    const R   = Math.floor(size * 0.386); // outer radius ≈85 at 220px
    const r   = Math.floor(size * 0.236); // inner radius ≈52 at 220px

    const entries = Object.entries(categoryData);
    const total   = entries.reduce((s,[,v]) => s + Number(v), 0);

    ctx.clearRect(0, 0, size, size);
    document.getElementById('donutTotal').textContent = fmt(total);

    if (!entries.length) {
        ctx.fillStyle = '#2a2a38';
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = '#111118';
        ctx.fill();
        return;
    }

    let startAngle = -Math.PI / 2;
    const colors = entries.map(([cat]) => (CATEGORIES[cat] || { color: '#90a4ae' }).color);

    entries.forEach(([, val], i) => {
        const slice = (Number(val) / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, startAngle, startAngle + slice);
        ctx.closePath();
        ctx.fillStyle = colors[i];
        ctx.fill();
        startAngle += slice;
    });

    // Donut hole
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#111118';
    ctx.fill();

    // Legend
    const legend = document.getElementById('donutLegend');
    legend.innerHTML = entries.map(([cat, val], i) => `
        <div class="legend-item">
            <div class="legend-dot-label">
                <div class="legend-dot" style="background:${colors[i]}"></div>
                <span class="legend-label">${cat}</span>
            </div>
            <span class="legend-value">${fmt(val)}</span>
        </div>
    `).join('');
}

// ============================================================
// BAR CHART — responsive, pure Canvas
// ============================================================
function renderBarChart(monthlyTrend) {
    state.lastBarData = monthlyTrend;

    const canvas = document.getElementById('barChart');
    if (!canvas) return;

    const wrapper  = canvas.parentElement;
    canvas.width   = wrapper.clientWidth || 500;
    canvas.height  = 200;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const data = monthlyTrend.slice(0, 6).reverse();
    if (!data.length) return;

    const maxVal = Math.max(...data.map(d => Number(d.total)));
    const padL   = 50, padR = 16, padT = 16, padB = 50;
    const chartW = canvas.width  - padL - padR;
    const chartH = canvas.height - padT - padB;
    const barW   = Math.min((chartW / data.length) * 0.55, 60);
    const gap    = chartW / data.length;

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // Y-axis gridlines
    ctx.strokeStyle = '#2a2a38';
    ctx.lineWidth   = 1;
    [0, 0.25, 0.5, 0.75, 1].forEach(frac => {
        const y = padT + chartH - chartH * frac;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + chartW, y);
        ctx.stroke();

        const val = maxVal * frac;
        ctx.fillStyle  = '#5a5a72';
        ctx.font       = '10px DM Sans';
        ctx.textAlign  = 'right';
        ctx.fillText(val >= 1000 ? `₹${(val/1000).toFixed(0)}k` : `₹${val.toFixed(0)}`, padL - 6, y + 3);
    });

    // Bars
    data.forEach((d, i) => {
        const barH = maxVal > 0 ? (Number(d.total) / maxVal) * chartH : 0;
        const x    = padL + gap * i + (gap - barW) / 2;
        const y    = padT + chartH - barH;

        const grad = ctx.createLinearGradient(x, y, x, padT + chartH);
        grad.addColorStop(0, '#7c6af7');
        grad.addColorStop(1, 'rgba(124,106,247,0.2)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
        else ctx.rect(x, y, barW, barH);
        ctx.fill();

        const label = `${MONTHS[Number(d.month) - 1]} ${String(d.year).slice(2)}`;
        ctx.fillStyle = '#5a5a72';
        ctx.font      = '10px DM Sans';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + barW / 2, padT + chartH + 18);
    });
}

// ============================================================
// RECENT EXPENSES
// ============================================================
function renderRecentExpenses(list) {
    const container = document.getElementById('recentExpenses');
    if (!list.length) {
        container.innerHTML = '<div class="empty-state">No expenses this month</div>';
        return;
    }
    container.innerHTML = list.map(exp => {
        const cat = CATEGORIES[exp.category] || { color: '#90a4ae', icon: '◎' };
        return `
        <div class="expense-item">
            <div class="expense-cat-icon" style="background:${cat.color}22">
                ${cat.icon}
            </div>
            <div class="expense-info">
                <div class="expense-title">${exp.title}</div>
                <div class="expense-meta">${exp.category} · ${fmtDate(exp.date)}</div>
            </div>
            <div class="expense-amount">-${fmt(exp.amount)}</div>
        </div>`;
    }).join('');
}

// ============================================================
// EXPENSES PAGE
// ============================================================
async function loadExpensesPage() {
    try {
        const data = await apiFetch(`/expenses/month/${state.currentYear}/${state.currentMonth}`);
        state.allExpenses = data;
        renderExpenseTable(data);
    } catch(e) {
        showToast('Failed to load expenses', 'error');
    }
}

function renderExpenseTable(list) {
    const tbody     = document.getElementById('expenseTableBody');
    const catFilter = document.getElementById('filterCategory').value;
    const payFilter = document.getElementById('filterPayment').value;

    let filtered = list;
    if (catFilter) filtered = filtered.filter(e => e.category === catFilter);
    if (payFilter) filtered = filtered.filter(e => e.paymentMethod === payFilter);

    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No expenses found</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(exp => {
        const cat = CATEGORIES[exp.category] || { color: '#90a4ae', icon: '◎' };
        return `
        <tr>
            <td>${fmtDate(exp.date)}</td>
            <td>
                <div style="font-weight:500;color:var(--text-primary)">${exp.title}</div>
                ${exp.description ? `<div style="font-size:0.75rem;color:var(--text-muted)">${exp.description}</div>` : ''}
            </td>
            <td>
                <span class="cat-badge" style="background:${cat.color}22;color:${cat.color}">
                    ${cat.icon} ${exp.category}
                </span>
            </td>
            <td><span class="pay-badge">${PAYMENT_LABELS[exp.paymentMethod] || exp.paymentMethod}</span></td>
            <td class="amount-cell">-${fmt(exp.amount)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit"   onclick="editExpense(${exp.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteExpense(${exp.id})">Delete</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

// ============================================================
// BUDGET PAGE
// ============================================================
async function loadBudgetPage() {
    try {
        const status = await apiFetch(`/budgets/status/${state.currentYear}/${state.currentMonth}`);
        const grid   = document.getElementById('budgetGrid');

        if (!status.length) {
            grid.innerHTML = `<div class="empty-state">
                No budgets set for ${monthName(state.currentMonth, state.currentYear)}.
                <br>Click "Set Budget" to add one.
            </div>`;
            return;
        }

        grid.innerHTML = status.map(b => {
            const cat   = CATEGORIES[b.category] || { color: '#90a4ae', icon: '◎' };
            const pct   = Math.min(Number(b.percentage), 100).toFixed(0);
            const color = b.exceeded ? '#f05656' : Number(pct) > 80 ? '#f0a429' : '#3ecf8e';
            return `
            <div class="budget-card ${b.exceeded ? 'exceeded' : ''}">
                <div class="budget-card-header">
                    <div class="budget-cat">
                        <span>${cat.icon}</span>
                        <span>${b.category}</span>
                    </div>
                    <button class="budget-delete" onclick="deleteBudget(${b.id})">✕</button>
                </div>
                <div class="budget-amounts">
                    <span class="budget-spent">Spent: ${fmt(b.spent)}</span>
                    <span class="budget-remaining">Limit: ${fmt(b.limit)}</span>
                </div>
                <div class="budget-bar-track">
                    <div class="budget-bar-fill" style="width:${pct}%;background:${color}"></div>
                </div>
                <div class="budget-pct" style="color:${color}">
                    ${b.exceeded ? '⚠ Exceeded by ' + fmt(Math.abs(b.remaining)) : pct + '% used · ' + fmt(b.remaining) + ' remaining'}
                </div>
            </div>`;
        }).join('');
    } catch(e) {
        showToast('Failed to load budgets', 'error');
    }
}

// ============================================================
// ANALYTICS PAGE
// ============================================================
async function loadAnalytics() {
    try {
        const allExpenses = await apiFetch('/expenses');
        state.lastAnalyticsExpenses = allExpenses;
        renderAllTimeCategoryChart(allExpenses);
        renderPaymentMethodChart(allExpenses);
    } catch(e) {
        showToast('Failed to load analytics', 'error');
    }
}

function renderAllTimeCategoryChart(expenses) {
    const canvas = document.getElementById('allTimeCategoryChart');
    if (!canvas) return;

    const catTotals = {};
    expenses.forEach(e => {
        catTotals[e.category] = (catTotals[e.category] || 0) + Number(e.amount);
    });

    drawHorizontalBarChart(canvas, catTotals, 280);
}

function renderPaymentMethodChart(expenses) {
    const canvas = document.getElementById('paymentMethodChart');
    if (!canvas) return;

    const pmTotals = {};
    expenses.forEach(e => {
        const label = PAYMENT_LABELS[e.paymentMethod] || e.paymentMethod;
        pmTotals[label] = (pmTotals[label] || 0) + Number(e.amount);
    });

    drawHorizontalBarChart(canvas, pmTotals, 220);
}

function drawHorizontalBarChart(canvas, data, height) {
    const entries = Object.entries(data).sort((a,b) => b[1]-a[1]);
    if (!entries.length) return;

    canvas.height = height;
    canvas.width  = canvas.parentElement.clientWidth || 400;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padL   = 130, padR = 20, padT = 10, padB = 10;
    const chartW = canvas.width  - padL - padR;
    const chartH = canvas.height - padT - padB;
    const barH   = Math.min(chartH / entries.length * 0.6, 24);
    const gap    = chartH / entries.length;
    const maxVal = Math.max(...entries.map(([,v]) => v));

    const PALETTE = ['#7c6af7','#f06292','#4fc3f7','#ffb74d','#3ecf8e','#f48fb1','#ce93d8','#90a4ae'];

    entries.forEach(([label, val], i) => {
        const barW = maxVal > 0 ? (val / maxVal) * chartW : 0;
        const y    = padT + gap * i + (gap - barH) / 2;

        ctx.fillStyle = PALETTE[i % PALETTE.length] + '99';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(padL, y, barW, barH, 4);
        else ctx.rect(padL, y, barW, barH);
        ctx.fill();

        ctx.fillStyle = '#9090a8';
        ctx.font      = '11px DM Sans';
        ctx.textAlign = 'right';
        ctx.fillText(label, padL - 8, y + barH / 2 + 4);

        ctx.fillStyle = '#f0f0f8';
        ctx.font      = 'bold 11px DM Sans';
        ctx.textAlign = 'left';
        ctx.fillText(fmt(val), padL + barW + 6, y + barH / 2 + 4);
    });
}

// ============================================================
// ADD / EDIT EXPENSE
// ============================================================
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Expense';
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseId').value = '';
    document.getElementById('expDate').value   = new Date().toISOString().split('T')[0];
    document.getElementById('expenseModal').classList.add('open');
}

async function editExpense(id) {
    try {
        const exp = await apiFetch(`/expenses/${id}`);
        document.getElementById('modalTitle').textContent    = 'Edit Expense';
        document.getElementById('expenseId').value          = exp.id;
        document.getElementById('expTitle').value           = exp.title;
        document.getElementById('expAmount').value          = exp.amount;
        document.getElementById('expCategory').value        = exp.category;
        document.getElementById('expDate').value            = exp.date;
        document.getElementById('expPayment').value         = exp.paymentMethod;
        document.getElementById('expDescription').value     = exp.description || '';
        document.getElementById('expenseModal').classList.add('open');
    } catch(e) {
        showToast('Failed to load expense', 'error');
    }
}

async function saveExpense(e) {
    e.preventDefault();
    const id = document.getElementById('expenseId').value;

    const payload = {
        title:         document.getElementById('expTitle').value.trim(),
        amount:        parseFloat(document.getElementById('expAmount').value),
        category:      document.getElementById('expCategory').value,
        date:          document.getElementById('expDate').value,
        paymentMethod: document.getElementById('expPayment').value,
        description:   document.getElementById('expDescription').value.trim(),
    };

    const btn       = document.getElementById('saveExpenseBtn');
    btn.textContent = 'Saving...';
    btn.disabled    = true;

    try {
        if (id) {
            await apiFetch(`/expenses/${id}`, 'PUT', payload);
            showToast('Expense updated!', 'success');
        } else {
            await apiFetch('/expenses', 'POST', payload);
            showToast('Expense added!', 'success');
        }
        document.getElementById('expenseModal').classList.remove('open');
        loadDashboard();
        if (document.getElementById('page-expenses').classList.contains('active')) {
            loadExpensesPage();
        }
    } catch(e) {
        showToast('Failed to save expense', 'error');
    } finally {
        btn.textContent = 'Save Expense';
        btn.disabled    = false;
    }
}

async function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;
    try {
        await apiFetch(`/expenses/${id}`, 'DELETE');
        showToast('Expense deleted', 'info');
        loadDashboard();
        if (document.getElementById('page-expenses').classList.contains('active')) {
            loadExpensesPage();
        }
    } catch(e) {
        showToast('Failed to delete expense', 'error');
    }
}

// ============================================================
// BUDGET
// ============================================================
async function saveBudget(e) {
    e.preventDefault();
    const payload = {
        category:     document.getElementById('budgetCategory').value,
        monthlyLimit: parseFloat(document.getElementById('budgetLimit').value),
        month:        state.currentMonth,
        year:         state.currentYear,
    };
    try {
        await apiFetch('/budgets', 'POST', payload);
        showToast('Budget saved!', 'success');
        document.getElementById('budgetModal').classList.remove('open');
        loadBudgetPage();
        loadDashboard();
    } catch(e) {
        showToast('Failed to save budget', 'error');
    }
}

async function deleteBudget(id) {
    if (!confirm('Delete this budget?')) return;
    try {
        await apiFetch(`/budgets/${id}`, 'DELETE');
        showToast('Budget removed', 'info');
        loadBudgetPage();
    } catch(e) {
        showToast('Failed to delete budget', 'error');
    }
}

// ============================================================
// SEARCH
// ============================================================
let searchTimeout;
document.getElementById('globalSearch').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const q = e.target.value.trim();
    if (!q) { loadExpensesPage(); return; }
    searchTimeout = setTimeout(async () => {
        try {
            const results = await apiFetch(`/expenses/search?q=${encodeURIComponent(q)}`);
            state.allExpenses = results;
            if (!document.getElementById('page-expenses').classList.contains('active')) {
                navigateTo('expenses');
            }
            renderExpenseTable(results);
        } catch(e) { showToast('Search failed', 'error'); }
    }, 350);
});

// ============================================================
// MONTH NAVIGATION
// ============================================================
document.getElementById('prevMonth').addEventListener('click', () => {
    state.currentMonth--;
    if (state.currentMonth < 1) { state.currentMonth = 12; state.currentYear--; }
    updateMonthLabel();
    refreshCurrentPage();
});

document.getElementById('nextMonth').addEventListener('click', () => {
    state.currentMonth++;
    if (state.currentMonth > 12) { state.currentMonth = 1; state.currentYear++; }
    updateMonthLabel();
    refreshCurrentPage();
});

function updateMonthLabel() {
    document.getElementById('currentMonthLabel').textContent =
        monthName(state.currentMonth, state.currentYear);
}

function refreshCurrentPage() {
    const active = document.querySelector('.page.active');
    if (!active) return;
    const page = active.id.replace('page-', '');
    if (page === 'dashboard') loadDashboard();
    else if (page === 'expenses') loadExpensesPage();
    else if (page === 'budget')   loadBudgetPage();
}

// ============================================================
// SIDEBAR HELPERS
// ============================================================
function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('overlay').classList.add('show');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('show');
}

document.getElementById('menuBtn').addEventListener('click', openSidebar);
document.getElementById('sidebarToggle').addEventListener('click', closeSidebar);
document.getElementById('overlay').addEventListener('click', closeSidebar);

// ============================================================
// TOUCH SWIPE — open/close sidebar with swipe gesture
// ============================================================
let _swipeX = 0, _swipeY = 0, _swipeT = 0;

document.addEventListener('touchstart', (e) => {
    _swipeX = e.touches[0].clientX;
    _swipeY = e.touches[0].clientY;
    _swipeT = Date.now();
}, { passive: true });

document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - _swipeX;
    const dy = e.changedTouches[0].clientY - _swipeY;
    const dt = Date.now() - _swipeT;

    // Only count fast, mostly-horizontal swipes
    if (dt > 350 || Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx) * 0.8) return;

    const sidebar = document.getElementById('sidebar');

    if (dx > 50 && _swipeX < 40) {
        // Swipe right from left edge → open sidebar
        openSidebar();
    } else if (dx < -50 && sidebar.classList.contains('open')) {
        // Swipe left while sidebar is open → close it
        closeSidebar();
    }
}, { passive: true });

// ============================================================
// MODAL EVENTS
// ============================================================
document.getElementById('openAddModal').addEventListener('click', openAddModal);
document.getElementById('closeExpenseModal').addEventListener('click', () =>
    document.getElementById('expenseModal').classList.remove('open'));
document.getElementById('cancelExpense').addEventListener('click', () =>
    document.getElementById('expenseModal').classList.remove('open'));
document.getElementById('expenseForm').addEventListener('submit', saveExpense);

document.getElementById('openBudgetModal').addEventListener('click', () =>
    document.getElementById('budgetModal').classList.add('open'));
document.getElementById('closeBudgetModal').addEventListener('click', () =>
    document.getElementById('budgetModal').classList.remove('open'));
document.getElementById('cancelBudget').addEventListener('click', () =>
    document.getElementById('budgetModal').classList.remove('open'));
document.getElementById('budgetForm').addEventListener('submit', saveBudget);

// Close modal on backdrop click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.classList.remove('open');
    });
});

// ============================================================
// NAVIGATION LISTENERS
// ============================================================
document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(el.dataset.page);
    });
});

document.getElementById('filterCategory').addEventListener('change', () => renderExpenseTable(state.allExpenses));
document.getElementById('filterPayment').addEventListener('change',  () => renderExpenseTable(state.allExpenses));

// ============================================================
// RESPONSIVE CHART RESIZE — ResizeObserver redraws charts
// without making extra API calls
// ============================================================
const handleChartResize = debounce(() => {
    const activePage = document.querySelector('.page.active')?.id?.replace('page-', '');
    if (activePage === 'dashboard') {
        renderDonutChart(state.lastDonutData);
        renderBarChart(state.lastBarData);
    } else if (activePage === 'analytics' && state.lastAnalyticsExpenses.length) {
        renderAllTimeCategoryChart(state.lastAnalyticsExpenses);
        renderPaymentMethodChart(state.lastAnalyticsExpenses);
    }
}, 200);

if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(handleChartResize);
    ro.observe(document.querySelector('.main-content'));
} else {
    window.addEventListener('resize', handleChartResize);
}

// ============================================================
// PWA — Install prompt
// ============================================================
let _installPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _installPrompt = e;
});

window.addEventListener('appinstalled', () => {
    _installPrompt = null;
    showToast('ExpenseFlow installed!', 'success');
});

window.installPWA = async function () {
    if (!_installPrompt) {
        showToast('App is already installed or not yet installable.', 'info');
        return;
    }
    _installPrompt.prompt();
    await _installPrompt.userChoice;
    _installPrompt = null;
};

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    updateMonthLabel();
    loadDashboard();

    // Register Service Worker for PWA / offline support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW registered, scope:', reg.scope))
            .catch(err => console.warn('SW registration failed:', err));
    }
});
