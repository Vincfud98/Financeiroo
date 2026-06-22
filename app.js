const tabs = [
  ["dashboard", "Dashboard Geral", "D"],
  ["transactions", "Controle Financeiro Geral", "+"],
  ["accounts", "Contas Bancarias", "$"],
  ["goals", "Metas Financeiras", "M"],
  ["planning", "Planejamento Mensal", "P"],
  ["debts", "Controle de Dividas", "!"],
  ["annual", "Resumo Anual", "12"],
];

const storageKey = "financa-pessoal-app-v1";
const financialCategories = [
  "Mercado",
  "Alimentação",
  "Transporte",
  "Entretenimento",
  "Lazer",
  "Dívidas",
  "Contas",
  "Saúde",
  "Cuidados Pessoais",
  "Pets",
  "Presentes",
  "Outros",
];
const categoryChartColors = {
  Mercado: "#00A86B",
  "Alimentação": "#FF8A00",
  Transporte: "#007BFF",
  Entretenimento: "#8E44FF",
  Lazer: "#00B8D9",
  "Dívidas": "#E63946",
  Contas: "#FFC400",
  "Saúde": "#00C853",
  "Cuidados Pessoais": "#FF4FA3",
  Pets: "#C76A1D",
  Presentes: "#C2185B",
  Outros: "#607D8B",
};
const paymentChartColors = {
  Pix: "#29B6F6",
  "Assaí": "#D4AF37",
  Nubank: "#8E44FF",
  "Débito": "#E63946",
  Inter: "#FF6D00",
  Outros: "#607D8B",
};
const fixedReserveGoalId = "fixed-reserve-goal";
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, "0");
let selectedMonthKey = `${year}-${month}`;

const sampleData = {
  accounts: [
    { id: crypto.randomUUID(), name: "Banco Principal", type: "Conta corrente", balance: 4280 },
    { id: crypto.randomUUID(), name: "Reserva", type: "Poupanca", balance: 9200 },
    { id: crypto.randomUUID(), name: "Investimentos", type: "Investimento", balance: 15600 },
  ],
  transactions: [
    { id: crypto.randomUUID(), date: `${year}-${month}-02`, type: "income", category: "Salario", description: "Recebimento mensal", account: "Banco Principal", payment: "Transferencia", amount: 7200 },
    { id: crypto.randomUUID(), date: `${year}-${month}-04`, type: "expense", category: "Moradia", description: "Aluguel", account: "Banco Principal", payment: "Pix", amount: 1850 },
    { id: crypto.randomUUID(), date: `${year}-${month}-07`, type: "expense", category: "Mercado", description: "Compras da semana", account: "Banco Principal", payment: "Credito", amount: 620 },
    { id: crypto.randomUUID(), date: `${year}-${month}-10`, type: "expense", category: "Transporte", description: "Combustivel e app", account: "Banco Principal", payment: "Debito", amount: 340 },
    { id: crypto.randomUUID(), date: `${year}-01-14`, type: "income", category: "Extra", description: "Projeto pontual", account: "Banco Principal", payment: "Transferencia", amount: 1600 },
    { id: crypto.randomUUID(), date: `${year}-02-11`, type: "expense", category: "Saude", description: "Consultas", account: "Banco Principal", payment: "Pix", amount: 480 },
  ],
  goals: [
    { id: crypto.randomUUID(), name: "Reserva de emergencia", target: 24000, saved: 14800, deadline: `${year}-12-31` },
    { id: crypto.randomUUID(), name: "Viagem", target: 8000, saved: 2600, deadline: `${year}-10-20` },
  ],
  goalMovements: [],
  wishlist: [],
  budgets: [
    { id: crypto.randomUUID(), category: "Moradia", planned: 2000 },
    { id: crypto.randomUUID(), category: "Mercado", planned: 1200 },
    { id: crypto.randomUUID(), category: "Transporte", planned: 650 },
    { id: crypto.randomUUID(), category: "Lazer", planned: 500 },
  ],
  debts: [
    { id: crypto.randomUUID(), name: "Cartao parcelado", creditor: "Banco Principal", total: 3600, paid: 2100, due: `${year}-${month}-18` },
    { id: crypto.randomUUID(), name: "Financiamento", creditor: "Instituicao financeira", total: 12000, paid: 3500, due: `${year}-11-05` },
  ],
  monthlyPlans: {
    [`${year}-${month}`]: {
      previousRemainder: 1800,
      viniciusSalary: 5200,
      carolSalary: 4200,
      bonus: 600,
      otherIncome: 350,
    },
  },
};

let data = loadData();
let activeTransactionMonth = `${year}-${month}`;
let selectedTransactionCategory = "all";
let selectedBankMonth = `${year}-${month}`;
let selectedPlanningMonth = `${year}-${month}`;
let selectedAnnualYear = year;
let wishlistCollapsed = localStorage.getItem("wishlist-collapsed") === "true";
let darkModeEnabled = localStorage.getItem("dark-mode") === "true";

function loadData() {
  const saved = localStorage.getItem(storageKey);
  const loaded = saved ? JSON.parse(saved) : structuredClone(sampleData);
  return normalizeLoadedData(loaded);
}

function normalizeLoadedData(loaded) {
  loaded ||= {};
  loaded.accounts ||= [];
  loaded.monthlyPlans ||= {};
  loaded.recurringStops ||= {};
  loaded.transactions ||= [];
  loaded.goals ||= [];
  loaded.goalMovements ||= [];
  ensureFixedReserveGoal(loaded);
  if (!loaded.reserveAnchor) {
    const anchorEntry = Object.entries(loaded.monthlyPlans)
      .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
      .find(([, plan]) => Number(plan.previousRemainder) !== 0);
    loaded.reserveAnchor = anchorEntry
      ? { month: anchorEntry[0], amount: Number(anchorEntry[1].previousRemainder) }
      : { month: `${year}-${month}`, amount: 0 };
  }
  loaded.wishlist ||= [];
  loaded.budgets ||= [];
  loaded.budgets.forEach((budget) => {
    budget.month ||= `${year}-${month}`;
  });
  loaded.debts ||= [];
  loaded.debts.forEach((debt) => {
    debt.installmentCount = Number(debt.installmentCount || Math.max(1, Math.ceil(debt.total / Math.max(debt.total - debt.paid, 1))));
    debt.currentInstallment = Number(
      debt.currentInstallment ||
      Math.min(debt.installmentCount, Math.round((Number(debt.paid || 0) / Number(debt.total || 1)) * debt.installmentCount))
    );
    debt.startDate ||= debt.due || localDateKey();
  });
  normalizeTransactions(loaded.transactions);
  migrateLegacyRecurringTransactions(loaded);
  ensureRecurringSeries(loaded);
  localStorage.setItem(storageKey, JSON.stringify(loaded));
  return loaded;
}

function ensureFixedReserveGoal(loaded) {
  const existingReserve = loaded.goals.find(
    (goal) => goal.id === fixedReserveGoalId || normalizeCategoryName(goal.name) === "reserva"
  );
  if (existingReserve) {
    const previousId = existingReserve.id;
    existingReserve.id = fixedReserveGoalId;
    existingReserve.name = "Reserva";
    existingReserve.target = null;
    existingReserve.deadline = "";
    existingReserve.fixed = true;
    existingReserve.saved = Number(existingReserve.saved || 0);
    loaded.goalMovements.forEach((movement) => {
      if (movement.goalId === previousId || normalizeCategoryName(movement.goalName) === "reserva") {
        movement.goalId = fixedReserveGoalId;
      }
    });
    return;
  }
  loaded.goals.unshift({
    id: fixedReserveGoalId,
    name: "Reserva",
    target: null,
    saved: 0,
    deadline: "",
    fixed: true,
  });
}

function normalizeTransactions(transactions) {
  transactions.forEach((item) => {
    item.payment ||= item.type === "income" ? "Pix" : "Nao informado";
    item.installment ||= "Nao";
    item.installmentCount = Number(item.installmentCount || 1);
    item.installmentCurrent = Number(item.installmentCurrent || 1);
    item.status ||= "paid";
    item.recurring ||= "Nao";
    item.recurringGroupId ||= item.recurring === "Sim" ? item.installmentGroupId || null : null;
  });
}

function migrateLegacyRecurringTransactions(loaded) {
  if (loaded.recurringSeriesVersion === 2) return;
  const recurringItems = loaded.transactions.filter(
    (item) => item.recurring === "Sim" && Number(item.installmentCount || 1) === 1
  );
  const groups = recurringItems.reduce((result, item) => {
    const groupId = item.recurringGroupId || crypto.randomUUID();
    item.recurringGroupId = groupId;
    result[groupId] ||= [];
    result[groupId].push(item);
    return result;
  }, {});

  Object.values(groups).forEach((items) => {
    const ordered = [...items].sort((a, b) => a.date.localeCompare(b.date));
    const first = ordered[0];
    const existingMonths = new Set(ordered.map((item) => item.date.slice(0, 7)));
    for (let index = 0; index < 12; index += 1) {
      const date = addMonthsToDate(first.date, index);
      if (existingMonths.has(date.slice(0, 7))) continue;
      loaded.transactions.push({
        ...first,
        id: crypto.randomUUID(),
        date,
        status: index === 0 ? first.status : "pending",
      });
    }
  });
  loaded.recurringSeriesVersion = 2;
  localStorage.setItem(storageKey, JSON.stringify(loaded));
}

function ensureRecurringSeries(loaded) {
  loaded.recurringStops ||= {};
  const recurringItems = loaded.transactions.filter((item) => item.recurring === "Sim");

  recurringItems.forEach((item) => {
    if (!item.recurringGroupId) item.recurringGroupId = crypto.randomUUID();
  });

  const groups = recurringItems.reduce((result, item) => {
    result[item.recurringGroupId] ||= [];
    result[item.recurringGroupId].push(item);
    return result;
  }, {});

  Object.entries(groups).forEach(([groupId, items]) => {
    const ordered = [...items].sort((a, b) => a.date.localeCompare(b.date));
    const first = ordered[0];
    const existingMonths = new Set(ordered.map((item) => item.date.slice(0, 7)));
    const stopMonth = loaded.recurringStops[groupId];

    for (let index = 0; index < 12; index += 1) {
      const date = addMonthsToDate(first.date, index);
      const monthKey = date.slice(0, 7);
      if (stopMonth && monthKey >= stopMonth) continue;
      if (existingMonths.has(monthKey)) continue;
      loaded.transactions.push({
        ...first,
        id: crypto.randomUUID(),
        date,
        status: index === 0 ? first.status : "pending",
        recurringGroupId: groupId,
      });
    }
  });
}

function saveData() {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dateBR(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function currentMonthRows() {
  return data.transactions.filter((item) => item.date.startsWith(`${year}-${month}`));
}

function selectedMonthRows() {
  return data.transactions.filter((item) => item.date.startsWith(selectedMonthKey));
}

function sum(rows, predicate = () => true) {
  return rows.filter(predicate).reduce((total, item) => total + Number(item.amount || 0), 0);
}

function accountBalance(accountName) {
  const account = data.accounts.find((item) => item.name === accountName);
  const initial = Number(account?.balance || 0);
  const movements = data.transactions
    .filter((item) => item.account === accountName)
    .reduce((total, item) => total + (item.type === "income" ? item.amount : -item.amount), 0);
  return initial + movements;
}

function normalizeBankName(value) {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (normalized === "assai") return "Assai";
  if (normalized === "inter") return "Inter";
  if (normalized === "nubank") return "Nubank";
  return null;
}

function normalizeCategoryName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function transactionMatchesBudgetCategory(transactionCategory, budgetCategory) {
  const transactionKey = normalizeCategoryName(transactionCategory);
  const budgetKey = normalizeCategoryName(budgetCategory);
  if (budgetKey === normalizeCategoryName("Outros")) {
    const officialKeys = financialCategories
      .filter((category) => category !== "Outros")
      .map(normalizeCategoryName);
    return transactionKey === budgetKey || !officialKeys.includes(transactionKey);
  }
  return transactionKey === budgetKey;
}

function getOfficialCategoryName(value) {
  const normalized = normalizeCategoryName(value);
  const match = financialCategories.find((category) => normalizeCategoryName(category) === normalized);
  return match || "Outros";
}

function getOfficialPaymentName(value) {
  const normalized = normalizeCategoryName(value);
  if (normalized === "pix") return "Pix";
  if (normalized === "assai" || normalized === "credito" || normalized === "credito assai") return "Assaí";
  if (normalized === "nubank") return "Nubank";
  if (normalized === "debito" || normalized.startsWith("debito ")) return "Débito";
  if (normalized === "inter") return "Inter";
  return "Outros";
}

function getBankSummary(bankName, monthKey) {
  const allRows = data.transactions.filter(
    (item) => normalizeBankName(item.payment) === bankName && item.date.startsWith(monthKey)
  );
  const paidRows = allRows.filter((item) => item.status === "paid");
  const income = sum(paidRows, (item) => item.type === "income");
  const expense = sum(allRows, (item) => item.type === "expense");
  const expenses = allRows
    .filter((item) => item.type === "expense")
    .sort((a, b) => b.date.localeCompare(a.date));
  return { rows: paidRows, expenses, income, expense, balance: Math.max(0, income - expense) };
}

function renderTabs() {
  const container = document.querySelector("#tabs");
  container.innerHTML = tabs
    .map(([id, label, icon]) => `<button class="tab-btn ${id === "dashboard" ? "is-active" : ""}" data-tab="${id}" data-icon="${icon}" type="button">${label}</button>`)
    .join("");
}

function switchTab(id) {
  document.querySelectorAll(".tab-btn").forEach((button) => button.classList.toggle("is-active", button.dataset.tab === id));
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("is-active", view.id === id));
  document.querySelector("#pageTitle").textContent = tabs.find((tab) => tab[0] === id)?.[1] || "Dashboard Geral";
}

function renderDashboard() {
  syncFixedReserveGoal();
  const rows = selectedMonthRows();
  const expenses = rows.filter((item) => item.type === "expense");
  const expense = sum(expenses);
  const plan = getMonthlyPlan();
  const plannedIncome = Number(plan.viniciusSalary) + Number(plan.carolSalary) + Number(plan.bonus) + Number(plan.otherIncome);
  const currentBalance = plannedIncome - expense;
  const reserveState = getReserveState(selectedMonthKey);
  const forecast = reserveState.forecast;
  const monthDate = new Date(`${selectedMonthKey}-01T12:00:00`);

  document.querySelector("#dashboardMonth").value = selectedMonthKey;
  document.querySelector("#summaryMonthLabel").textContent = monthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  document.querySelectorAll("[data-plan-field]").forEach((input) => {
    input.value = input.dataset.planField === "previousRemainder"
      ? reserveState.opening
      : plan[input.dataset.planField] || 0;
  });
  document.querySelector("#summaryReceived").textContent = money(plannedIncome);
  document.querySelector("#summarySpent").textContent = money(expense);
  document.querySelector("#summaryBalance").textContent = money(currentBalance);
  document.querySelector("#summaryBalance").className = currentBalance < 0 ? "negative" : "positive";
  document.querySelector("#summaryForecast").textContent = money(forecast);
  document.querySelector("#summaryForecast").className = forecast < 0 ? "negative" : "positive";

  renderFlowChart();
  renderExpensePie(expenses, "category", "#categoryPie", "#categoryLegend");
  renderExpensePie(expenses, "payment", "#paymentPie", "#paymentLegend");
  renderCategoryTable(expenses);
  renderDashboardGoals();
  renderDashboardAlerts(forecast, monthDate);
}

function monthKeyOffset(monthKey, offset) {
  const [monthYear, monthNumber] = monthKey.split("-").map(Number);
  const date = new Date(monthYear, monthNumber - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthFinancialState(monthKey) {
  const rows = data.transactions.filter((item) => item.date.startsWith(monthKey));
  const plan = data.monthlyPlans[monthKey] || {};
  const plannedIncome =
    Number(plan.viniciusSalary || 0) +
    Number(plan.carolSalary || 0) +
    Number(plan.bonus || 0) +
    Number(plan.otherIncome || 0);
  const actualIncome = sum(rows, (item) => item.type === "income");
  return {
    income: plannedIncome || actualIncome,
    expense: sum(rows, (item) => item.type === "expense"),
  };
}

function getReserveState(monthKey) {
  data.reserveAnchor ||= { month: monthKey, amount: 0 };
  const anchorMonth = data.reserveAnchor.month;
  const anchorAmount = Math.max(0, Number(data.reserveAnchor.amount || 0));

  if (monthKey < anchorMonth) {
    const state = getMonthFinancialState(monthKey);
    const forecast = state.income - state.expense;
    return { opening: 0, income: state.income, expense: state.expense, forecast, ending: Math.max(0, forecast) };
  }

  let cursor = anchorMonth;
  let opening = anchorAmount;
  while (cursor <= monthKey) {
    const state = getMonthFinancialState(cursor);
    const forecast = opening + state.income - state.expense;
    const ending = Math.max(0, forecast);
    if (cursor === monthKey) {
      return { opening, income: state.income, expense: state.expense, forecast, ending };
    }
    opening = ending;
    cursor = monthKeyOffset(cursor, 1);
  }
  return { opening: 0, income: 0, expense: 0, forecast: 0, ending: 0 };
}

function syncFixedReserveGoal() {
  const reserveGoal = data.goals.find((goal) => goal.id === fixedReserveGoalId);
  if (!reserveGoal) return;
  reserveGoal.saved = getReserveState(`${year}-${month}`).ending;
}

function renderFlowChart() {
  const selectedYear = Number(selectedMonthKey.slice(0, 4));
  const shortLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const monthly = shortLabels.map((shortLabel, index) => {
    const key = `${selectedYear}-${String(index + 1).padStart(2, "0")}`;
    const rows = data.transactions.filter((item) => item.date.startsWith(key));
    return {
      shortLabel,
      income: sum(rows, (item) => item.type === "income"),
      expense: sum(rows, (item) => item.type === "expense"),
      reserve: getReserveState(key).ending,
    };
  });
  const maxValue = Math.max(1, ...monthly.flatMap((item) => [item.income, item.expense, Math.max(0, item.reserve)]));
  document.querySelector("#flowChart").innerHTML = monthly.map((item) => `
    <div class="annual-bar-group" title="${item.shortLabel}: entradas ${money(item.income)}, saidas ${money(item.expense)}, reserva ${money(item.reserve)}">
      <div class="annual-bars">
        <span class="annual-bar" style="height:${Math.max(2, (item.income / maxValue) * 100)}%"></span>
        <span class="annual-bar expense" style="height:${Math.max(2, (item.expense / maxValue) * 100)}%"></span>
        <span class="annual-bar reserve" style="height:${Math.max(2, (Math.max(0, item.reserve) / maxValue) * 100)}%"></span>
      </div>
      <span>${item.shortLabel}</span>
    </div>`).join("");
}

function getMonthlyPlan() {
  data.monthlyPlans[selectedMonthKey] ||= {
    previousRemainder: 0,
    viniciusSalary: 0,
    carolSalary: 0,
    bonus: 0,
    otherIncome: 0,
  };
  return data.monthlyPlans[selectedMonthKey];
}

function calculatePreviousMonthRemainder() {
  const [selectedYear, selectedMonth] = selectedMonthKey.split("-").map(Number);
  const previous = new Date(selectedYear, selectedMonth - 2, 1);
  const key = `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}`;
  const rows = data.transactions.filter((item) => item.date.startsWith(key));
  return sum(rows, (item) => item.type === "income") - sum(rows, (item) => item.type === "expense");
}

function aggregateBy(rows, field) {
  return Object.entries(rows.reduce((groups, item) => {
    const key = item[field] || "Nao informado";
    groups[key] = (groups[key] || 0) + Number(item.amount || 0);
    return groups;
  }, {})).sort((a, b) => b[1] - a[1]);
}

function renderExpensePie(expenses, field, pieSelector, legendSelector) {
  const isCategory = field === "category";
  const palette = isCategory ? categoryChartColors : paymentChartColors;
  const normalizedExpenses = expenses.map((item) => ({
    ...item,
    chartGroup: isCategory ? getOfficialCategoryName(item.category) : getOfficialPaymentName(item.payment),
  }));
  const groups = aggregateBy(normalizedExpenses, "chartGroup");
  const total = sum(expenses);
  let cursor = 0;
  const slices = groups.map(([label, value]) => {
    const start = cursor;
    cursor += total ? (value / total) * 100 : 0;
    return `${palette[label] || palette.Outros} ${start}% ${cursor}%`;
  });
  const pie = document.querySelector(pieSelector);
  pie.style.background = groups.length ? `conic-gradient(${slices.join(",")})` : "var(--soft-gray)";
  pie.querySelector("span").textContent = money(total);
  document.querySelector(legendSelector).innerHTML = groups.length
    ? groups.map(([label, value]) => `
      <div class="pie-legend-row">
        <i style="background:${palette[label] || palette.Outros}"></i>
        <span>${label}</span>
        <strong>${Math.round((value / total) * 100)}%</strong>
      </div>`).join("")
    : '<div class="empty-state">Sem gastos no periodo.</div>';
}

function renderCategoryTable(expenses) {
  const normalizedExpenses = expenses.map((item) => ({
    ...item,
    officialCategory: getOfficialCategoryName(item.category),
  }));
  const groups = aggregateBy(normalizedExpenses, "officialCategory");
  const total = sum(expenses);
  document.querySelector("#categoryTableTotal").textContent = money(total);
  document.querySelector("#categoryTable").innerHTML = groups.length
    ? groups.map(([category, value]) => {
      const percentage = total ? (value / total) * 100 : 0;
      return `<tr>
        <td>${category}</td>
        <td>${money(value)}</td>
        <td>
          <div class="category-share">
            <div class="category-share-track"><span style="width:${percentage}%"></span></div>
            <strong>${percentage.toFixed(1)}%</strong>
          </div>
        </td>
      </tr>`;
    }).join("")
    : '<tr><td colspan="3"><div class="empty-state">Nenhum gasto registrado neste mes.</div></td></tr>';
}

function renderDashboardGoals() {
  document.querySelector("#dashboardGoals").innerHTML = data.goals.length
    ? data.goals.slice(0, 4).map((goal) => {
      const isReserve = goal.id === fixedReserveGoalId;
      const percentage = isReserve ? 0 : Math.min(100, Math.round((goal.saved / goal.target) * 100));
      return `<div class="dashboard-goal-item">
        <strong>${goal.name}</strong>
        <span>${isReserve ? "Fixa" : `${percentage}%`}</span>
        ${isReserve ? '<div class="reserve-goal-track"><span></span></div>' : `<div class="progress"><span style="width:${percentage}%"></span></div>`}
        <span>${isReserve ? money(goal.saved) : `${money(goal.saved)} de ${money(goal.target)}`}</span>
        <span>${isReserve ? "Sem meta de valor" : goal.deadline ? `ate ${dateBR(goal.deadline)}` : "Sem prazo definido"}</span>
      </div>`;
    }).join("")
    : '<div class="empty-state">Nenhuma meta cadastrada.</div>';
}

function renderDashboardAlerts(forecast, monthDate) {
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);
  const pendingDebts = data.debts.filter((debt) =>
    new Date(`${getDebtPayoffDate(debt)}T12:00:00`) <= monthEnd &&
    debt.currentInstallment < debt.installmentCount
  );
  const pendingTransactions = selectedMonthRows().filter((item) => item.type === "expense" && item.status === "pending");
  const incompleteGoals = data.goals.filter((goal) => Number(goal.target) > 0 && goal.saved < goal.target);
  const alerts = [];
  pendingTransactions.slice(0, 3).forEach((item) => alerts.push({
    title: "Conta pendente",
    detail: `${item.description}: ${money(item.amount)} vence em ${dateBR(item.date)}.`,
  }));
  pendingDebts.forEach((debt) => alerts.push({
    title: "Conta pendente",
    detail: `${debt.name}: ${money(debt.total - getDebtPaidAmount(debt))} em aberto.`,
  }));
  if (forecast < 0) {
    alerts.push({ title: "Saldo negativo previsto", detail: `O mes pode fechar em ${money(forecast)}.` });
  }
  incompleteGoals.slice(0, 2).forEach((goal) => alerts.push({
    title: "Meta nao atingida",
    detail: `${goal.name} esta em ${Math.round((goal.saved / goal.target) * 100)}%.`,
  }));
  document.querySelector("#alertCount").textContent = alerts.length;
  document.querySelector("#dashboardAlerts").innerHTML = alerts.length
    ? alerts.map((alert) => `
      <div class="dashboard-alert-item warn">
        <span class="alert-icon">!</span>
        <div><strong>${alert.title}</strong><span>${alert.detail}</span></div>
      </div>`).join("")
    : '<div class="empty-state">Tudo em ordem para este periodo.</div>';
}

function renderTransactions() {
  const rows = [...data.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const pending = rows.filter((item) => item.status === "pending").length;
  document.querySelector("#transactionTotal").textContent = `${rows.length} lancamentos - ${pending} pendentes`;
  const monthlyGroups = rows.reduce((groups, item) => {
    const key = item.date.slice(0, 7);
    groups[key] ||= [];
    groups[key].push(item);
    return groups;
  }, {});

  const container = document.querySelector("#transactionsTable");
  const transactionYears = [...new Set(rows.map((item) => Number(item.date.slice(0, 4))))].sort();
  if (!transactionYears.length) {
    container.innerHTML = '<div class="empty-state">Nenhum lancamento cadastrado.</div>';
    return;
  }
  transactionYears.forEach((transactionYear) => {
    for (let transactionMonth = 1; transactionMonth <= 12; transactionMonth += 1) {
      const key = `${transactionYear}-${String(transactionMonth).padStart(2, "0")}`;
      monthlyGroups[key] ||= [];
    }
  });
  const monthKeys = Object.keys(monthlyGroups).sort();
  if (!monthlyGroups[activeTransactionMonth]) {
    activeTransactionMonth = monthKeys.includes(`${year}-${month}`) ? `${year}-${month}` : monthKeys.at(-1);
  }
  container.innerHTML = `
    <div class="month-tabs-shell">
      <button class="month-tabs-arrow" type="button" data-month-scroll="-1" aria-label="Ver meses anteriores">&#8249;</button>
      <div class="month-tabs" id="transactionMonthTabs">
        ${monthKeys.map((monthKey) => renderTransactionMonthTab(monthKey, monthlyGroups[monthKey])).join("")}
      </div>
      <button class="month-tabs-arrow" type="button" data-month-scroll="1" aria-label="Ver proximos meses">&#8250;</button>
    </div>
    ${renderMonthlyTransactionTable(activeTransactionMonth, monthlyGroups[activeTransactionMonth])}`;
  requestAnimationFrame(() => {
    document.querySelector(`[data-transaction-month="${activeTransactionMonth}"]`)?.scrollIntoView({ behavior: "instant", block: "nearest", inline: "center" });
  });
}

function renderTransactionCategoryFilter() {
  const label = selectedTransactionCategory === "all"
    ? "Filtro"
    : `Filtro: ${selectedTransactionCategory}`;

  return `<label class="transaction-filter ${selectedTransactionCategory === "all" ? "" : "is-filtered"}">
    <span>${label}</span>
    <select id="transactionCategoryFilter" aria-label="Filtrar lancamentos por categoria">
      <option value="all">Todas as categorias</option>
      ${financialCategories.map((category) => `
        <option value="${category}" ${category === selectedTransactionCategory ? "selected" : ""}>${category}</option>
      `).join("")}
    </select>
  </label>`;
}

function renderTransactionMonthTab(monthKey, rows) {
  const date = new Date(`${monthKey}-01T12:00:00`);
  const monthName = date.toLocaleDateString("pt-BR", { month: "long" });
  const label = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)}/${String(date.getFullYear()).slice(-2)}`;
  const pending = rows.filter((item) => item.status === "pending").length;
  return `<button class="month-tab ${monthKey === activeTransactionMonth ? "is-active" : ""}" type="button" data-transaction-month="${monthKey}">
    <span>${label}</span>
    ${pending ? `<small>${pending}</small>` : ""}
  </button>`;
}

function renderMonthlyTransactionTable(monthKey, rows) {
  const visibleRows = selectedTransactionCategory === "all"
    ? rows
    : rows.filter((item) => transactionMatchesBudgetCategory(item.category, selectedTransactionCategory));
  const monthDate = new Date(`${monthKey}-01T12:00:00`);
  const monthLabel = monthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const income = sum(visibleRows, (item) => item.type === "income");
  const expense = sum(visibleRows, (item) => item.type === "expense");
  const pending = visibleRows.filter((item) => item.status === "pending").length;

  return `<section class="monthly-table-section">
    <div class="monthly-table-head">
      <div class="monthly-table-title">
        <strong>${monthLabel}</strong>
        <span>${visibleRows.length} ${visibleRows.length === 1 ? "lancamento" : "lancamentos"}</span>
      </div>
      <div class="monthly-table-totals">
        <span class="month-total income">Entradas: ${money(income)}</span>
        <span class="month-total expense">Saidas: ${money(expense)}</span>
        <span class="month-total pending">${pending} ${pending === 1 ? "pendente" : "pendentes"}</span>
        ${renderTransactionCategoryFilter()}
      </div>
    </div>
    <div class="table-wrap">
      <table class="finance-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Mes</th>
            <th>Ano</th>
            <th>Tipo</th>
            <th>Descricao</th>
            <th>Categoria</th>
            <th>Valor</th>
            <th>Forma de pagamento</th>
            <th>Parcelado</th>
            <th>Qtd. parcelas</th>
            <th>Parcela atual</th>
            <th>Status</th>
            <th>Recorrente</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${visibleRows.length
          ? visibleRows.map(renderTransactionRow).join("")
          : '<tr><td class="filtered-empty-state" colspan="14">Nenhum lancamento nesta categoria para o mes selecionado.</td></tr>'
        }</tbody>
      </table>
    </div>
  </section>`;
}

function renderTransactionRow(item) {
  const date = new Date(`${item.date}T12:00:00`);
  const monthName = date.toLocaleDateString("pt-BR", { month: "long" });
  return `<tr>
    <td>${dateBR(item.date)}</td>
    <td>${monthName}</td>
    <td>${date.getFullYear()}</td>
    <td>${item.type === "income" ? "Entrada" : "Saida"}</td>
    <td class="transaction-description" title="${item.description}">${item.description}</td>
    <td>${item.category}</td>
    <td class="${item.type === "income" ? "positive" : "negative"}">${money(item.amount)}</td>
    <td>${item.payment}</td>
    <td>${item.installment}</td>
    <td>${item.installmentCount}</td>
    <td class="installment-label">${item.installmentCurrent} de ${item.installmentCount}</td>
    <td>
      <select class="status-select ${item.status}" data-status-id="${item.id}" aria-label="Status de ${item.description}">
        <option value="paid" ${item.status === "paid" ? "selected" : ""}>Pago</option>
        <option value="pending" ${item.status === "pending" ? "selected" : ""}>Pendente</option>
      </select>
    </td>
    <td>${item.recurring}</td>
    <td>
      <button class="row-menu-button" data-row-menu="${item.id}" type="button" aria-label="Opcoes de ${item.description}" title="Mais opcoes">&#8942;</button>
    </td>
  </tr>`;
}

function addMonthsToDate(dateString, monthsToAdd) {
  const [dateYear, dateMonth, dateDay] = dateString.split("-").map(Number);
  const target = new Date(dateYear, dateMonth - 1 + monthsToAdd, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const safeDay = Math.min(dateDay, lastDay);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
}

function createTransactionInstallments(values) {
  if (values.recurring === "Sim") {
    const groupId = crypto.randomUUID();
    const category = values.category === "Outros" ? values.otherCategory.trim() : values.category;
    return Array.from({ length: 12 }, (_, index) => ({
      id: crypto.randomUUID(),
      installmentGroupId: null,
      recurringGroupId: groupId,
      date: addMonthsToDate(values.date, index),
      type: values.type,
      description: values.description,
      category,
      amount: Number(values.amount),
      payment: values.payment,
      installment: "Nao",
      installmentCount: 1,
      installmentCurrent: 1,
      status: index === 0 ? values.status : "pending",
      recurring: "Sim",
    }));
  }

  const count = values.installment === "Sim" ? Math.max(2, Number(values.installmentCount)) : 1;
  const totalCents = Math.round(Number(values.amount) * 100);
  const baseCents = Math.floor(totalCents / count);
  const remainingCents = totalCents - baseCents * count;
  const groupId = crypto.randomUUID();
  const category = values.category === "Outros" ? values.otherCategory.trim() : values.category;

  return Array.from({ length: count }, (_, index) => ({
    id: crypto.randomUUID(),
    installmentGroupId: groupId,
    recurringGroupId: null,
    date: addMonthsToDate(values.date, index),
    type: values.type,
    description: values.description,
    category,
    amount: (baseCents + (index < remainingCents ? 1 : 0)) / 100,
    payment: values.payment,
    installment: count > 1 ? "Sim" : "Nao",
    installmentCount: count,
    installmentCurrent: index + 1,
    status: index === 0 ? values.status : "pending",
    recurring: values.recurring,
  }));
}

function renderAccounts() {
  const banks = [
    { key: "Assai", label: "Assai" },
    { key: "Inter", label: "Inter" },
    { key: "Nubank", label: "Nubank" },
  ].map((bank) => ({ ...bank, ...getBankSummary(bank.key, selectedBankMonth) }));

  document.querySelector("#bankMonthFilter").value = selectedBankMonth;

  banks.forEach((bank) => {
    const card = document.querySelector(`[data-bank-card="${bank.key}"]`);
    card.querySelector("[data-bank-balance]").textContent = money(bank.expense);
    const details = document.querySelector(`[data-bank-details="${bank.key}"]`);
    details.querySelector("[data-bank-expense-count]").textContent = bank.expenses.length;
    details.querySelector("[data-bank-expense-list]").innerHTML = bank.expenses.length
      ? bank.expenses.map((item) => `
        <div class="bank-expense-item">
          <div>
            <strong>${item.description}</strong>
            <span>${dateBR(item.date)} - ${item.category}</span>
          </div>
          <div class="bank-expense-item-value">
            <strong>${money(item.amount)}</strong>
            <span class="${item.status === "paid" ? "paid" : "pending"}">${item.status === "paid" ? "Pago" : "Pendente"}</span>
          </div>
        </div>`).join("")
      : '<div class="empty-state">Nenhum gasto neste cartao.</div>';
  });

  const totalExpense = banks.reduce((total, bank) => total + bank.expense, 0);
  document.querySelector("#accountsTotal").textContent = money(totalExpense);
  document.querySelector("#accountsTotal").className = "negative";
}

function renderGoals() {
  syncFixedReserveGoal();
  const goalsWithTarget = data.goals.filter((goal) => Number(goal.target) > 0);
  const saved = goalsWithTarget.reduce((total, goal) => total + Number(goal.saved), 0);
  const target = goalsWithTarget.reduce((total, goal) => total + Number(goal.target), 0);
  document.querySelector("#goalsTotal").textContent = target ? `${Math.round((saved / target) * 100)}% completo` : "Sem metas";
  const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const previousMonthKey = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, "0")}`;

  document.querySelector("#goalList").innerHTML = data.goals.length
    ? data.goals.map((goal) => {
      const isReserve = goal.id === fixedReserveGoalId;
      const percentage = goal.target ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;
      const lastMonthDeposit = isReserve
        ? Math.max(0, getReserveState(previousMonthKey).ending - getReserveState(monthKeyOffset(previousMonthKey, -1)).ending)
        : data.goalMovements
          .filter((movement) =>
            movement.goalId === goal.id &&
            movement.operation === "add" &&
            movement.date.startsWith(previousMonthKey)
          )
          .reduce((total, movement) => total + Number(movement.amount), 0);
      return `<tr>
        <td><strong>${goal.name}</strong>${isReserve ? ' <span class="fixed-goal-badge">Fixa</span>' : ""}</td>
        <td>${isReserve ? "Sem valor alvo" : money(goal.target)}</td>
        <td class="positive">${money(goal.saved)}</td>
        <td>${money(lastMonthDeposit)}</td>
        <td><span class="goal-percentage">${isReserve ? "Acumulando" : `${percentage}%`}</span></td>
        <td class="goal-progress-cell">${isReserve ? '<div class="reserve-goal-track"><span></span></div>' : `<div class="progress"><span style="width:${percentage}%"></span></div>`}</td>
        <td>
          ${isReserve ? '<span class="fixed-goal-lock" title="Meta fixa">Fixa</span>' : `<button class="row-menu-button" data-goal-menu="${goal.id}" type="button" aria-label="Opcoes de ${goal.name}" title="Mais opcoes">&#8942;</button>`}
        </td>
      </tr>`;
    }).join("")
    : '<tr><td colspan="7"><div class="empty-state">Nenhuma meta cadastrada.</div></td></tr>';

  const select = document.querySelector("#goalMovementSelect");
  const currentSelection = select.value;
  select.innerHTML = [
    ...data.goals
      .filter((goal) => goal.id !== fixedReserveGoalId)
      .map((goal) => `<option value="${goal.id}">${goal.name}</option>`),
    '<option value="__new__">+ Criar nova meta</option>',
  ].join("");
  if ([...select.options].some((option) => option.value === currentSelection)) {
    select.value = currentSelection;
  }
  updateNewGoalFields();
  renderWishlist();
}

function updateNewGoalFields() {
  const select = document.querySelector("#goalMovementSelect");
  const fields = document.querySelector("#newGoalFields");
  const isNew = select.value === "__new__";
  fields.classList.toggle("is-hidden", !isNew);
  fields.querySelectorAll("input").forEach((input) => {
    input.required = isNew;
    if (!isNew) input.value = "";
  });
}

function renderWishlist() {
  document.querySelector("#wishlistCount").textContent = `${data.wishlist.length} ${data.wishlist.length === 1 ? "item" : "itens"}`;
  document.querySelector("#wishlistList").innerHTML = data.wishlist.length
    ? data.wishlist.map((item) => `
      <article class="wishlist-item">
        <div class="wishlist-image">
          ${item.photo
            ? `<img src="${item.photo}" alt="${item.objective}" onerror="this.remove();this.parentElement.textContent='${item.objective.charAt(0).toUpperCase()}'" />`
            : item.objective.charAt(0).toUpperCase()}
        </div>
        <div class="wishlist-body">
          <h3>${item.objective}</h3>
          <div class="wishlist-meta">
            <span>${item.responsible}</span>
            <strong>${item.value === null || item.value === "" || item.value === undefined ? "Valor nao informado" : money(item.value)}</strong>
          </div>
          <div class="wishlist-actions">
            ${item.link ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer">Abrir site</a>` : ""}
            <button type="button" data-edit-wishlist="${item.id}">Editar</button>
            <button class="remove-wishlist" type="button" data-remove-wishlist="${item.id}">Remover</button>
          </div>
        </div>
      </article>`).join("")
    : '<div class="empty-state">Sua wishlist esta vazia.</div>';
}

function applyWishlistState() {
  const panel = document.querySelector("#wishlistPanel");
  const layout = document.querySelector(".goals-layout");
  const button = document.querySelector("#wishlistCollapseButton");
  panel.classList.toggle("is-collapsed", wishlistCollapsed);
  layout.classList.toggle("wishlist-is-collapsed", wishlistCollapsed);
  button.textContent = wishlistCollapsed ? "<" : ">";
  button.setAttribute("aria-label", wishlistCollapsed ? "Maximizar wishlist" : "Minimizar wishlist");
  button.title = wishlistCollapsed ? "Maximizar wishlist" : "Minimizar wishlist";
}

function applyTheme() {
  document.body.classList.toggle("dark-mode", darkModeEnabled);
  const button = document.querySelector("#themeToggle");
  const icon = button.querySelector(".theme-icon");
  const label = document.querySelector("#themeLabel");
  button.setAttribute("aria-pressed", String(darkModeEnabled));
  icon.textContent = darkModeEnabled ? "\u2600" : "\u263e";
  label.textContent = darkModeEnabled ? "Modo claro" : "Modo escuro";
  button.title = darkModeEnabled ? "Ativar modo claro" : "Ativar modo escuro";
}

function renderBudget() {
  const monthRows = data.transactions.filter(
    (item) => item.type === "expense" && item.date.startsWith(selectedPlanningMonth)
  );
  const budgets = data.budgets.filter((item) => item.month === selectedPlanningMonth);
  const totalPlanned = budgets.reduce((total, item) => total + Number(item.planned), 0);
  const totalUsed = sum(monthRows);
  const totalDifference = totalPlanned - totalUsed;
  document.querySelector("#planningMonthFilter").value = selectedPlanningMonth;
  renderBudgetCategoryOptions();
  document.querySelector("#budgetPlannedTotal").textContent = money(totalPlanned);
  document.querySelector("#budgetRealizedTotal").textContent = money(totalUsed);
  document.querySelector("#budgetDifferenceTotal").textContent = money(totalDifference);
  document.querySelector("#budgetDifferenceTotal").className = totalDifference < 0 ? "negative" : "positive";
  document.querySelector("#budgetTable").innerHTML = budgets.length
    ? budgets.map((item) => {
      const used = sum(monthRows, (row) => transactionMatchesBudgetCategory(row.category, item.category));
      const difference = Number(item.planned) - used;
      const consumption = item.planned > 0 ? (used / item.planned) * 100 : used > 0 ? 101 : 0;
      const status = consumption > 100 ? "over" : consumption >= 80 ? "near" : "ok";
      const statusLabel = status === "over" ? "Acima do orcamento" : status === "near" ? "Proximo do limite" : "Dentro do orcamento";
      return `<tr class="${status === "over" ? "budget-row-over" : status === "near" ? "budget-row-near" : ""}">
        <td>${item.category}</td>
        <td>${money(item.planned)}</td>
        <td>${money(used)}</td>
        <td class="${difference < 0 ? "negative" : "positive"}">${money(difference)}</td>
        <td class="budget-consumption">
          <div class="budget-consumption-track">
            <span class="budget-status-${status}" style="width:${Math.min(100, consumption)}%"></span>
          </div>
          <small>${Math.round(consumption)}%</small>
        </td>
        <td><span class="status-pill ${status === "near" ? "near" : status === "over" ? "over" : ""}">${statusLabel}</span></td>
        <td>
          <button class="row-menu-button" data-budget-menu="${item.id}" type="button" aria-label="Opcoes de ${item.category}" title="Mais opcoes">&#8942;</button>
        </td>
      </tr>`;
    })
    .join("")
    : '<tr><td colspan="7"><div class="empty-state">Nenhum planejamento cadastrado para este mes.</div></td></tr>';
}

function getExistingTransactionCategories() {
  return [...financialCategories];
}

function fillCategorySelect(select, selectedValue = "") {
  const categories = getExistingTransactionCategories();
  select.innerHTML = categories.length
    ? categories.map((category) => `<option value="${category}">${category}</option>`).join("")
    : '<option value="" disabled selected>Nenhuma categoria cadastrada</option>';
  if (selectedValue && !categories.includes(selectedValue)) {
    select.add(new Option(selectedValue, selectedValue));
  }
  if (selectedValue) select.value = selectedValue;
}

function renderBudgetCategoryOptions() {
  const select = document.querySelector("#budgetCategorySelect");
  const currentValue = select.value;
  fillCategorySelect(select, currentValue);
  select.disabled = getExistingTransactionCategories().length === 0;
}

function renderDebts() {
  const open = data.debts.reduce((total, debt) => total + Math.max(Number(debt.total) - getDebtPaidAmount(debt), 0), 0);
  document.querySelector("#debtTotal").textContent = money(open);
  document.querySelector("#debtCards").innerHTML = data.debts.length
    ? data.debts.map((debt) => {
      const installmentValue = Number(debt.total) / Number(debt.installmentCount);
      const paidAmount = getDebtPaidAmount(debt);
      const percentage = Math.min(100, Math.round((debt.currentInstallment / debt.installmentCount) * 100));
      const payoffDate = getDebtPayoffDate(debt);
      return `<tr>
        <td><strong>${debt.name}</strong></td>
        <td>${debt.creditor}</td>
        <td>${money(debt.total)}</td>
        <td>${debt.installmentCount}</td>
        <td>
          <div class="debt-installment-progress">
            <strong>${debt.currentInstallment} de ${debt.installmentCount}</strong>
            <div class="progress"><span style="width:${percentage}%"></span></div>
            <small>${percentage}% quitado</small>
          </div>
        </td>
        <td>${money(installmentValue)}</td>
        <td class="positive">${money(paidAmount)}</td>
        <td>${dateBR(payoffDate)}</td>
      </tr>`;
    }).join("")
    : '<tr><td colspan="8"><div class="empty-state">Nenhuma divida cadastrada.</div></td></tr>';
}

function getDebtPaidAmount(debt) {
  const installmentValue = Number(debt.total) / Math.max(1, Number(debt.installmentCount));
  return Math.min(Number(debt.total), installmentValue * Number(debt.currentInstallment));
}

function getDebtPayoffDate(debt) {
  return addMonthsToDate(debt.startDate, Math.max(0, Number(debt.installmentCount) - 1));
}

function renderAnnual() {
  const labels = ["Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const shortLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const availableYears = [...new Set([
    year,
    ...data.transactions.map((item) => Number(item.date.slice(0, 4))),
  ])].filter(Boolean).sort((a, b) => b - a);
  if (!availableYears.includes(selectedAnnualYear)) selectedAnnualYear = availableYears[0];

  const yearSelect = document.querySelector("#annualYearFilter");
  yearSelect.innerHTML = availableYears.map((itemYear) => `<option value="${itemYear}">${itemYear}</option>`).join("");
  yearSelect.value = String(selectedAnnualYear);

  const monthly = labels.map((label, index) => {
    const key = `${selectedAnnualYear}-${String(index + 1).padStart(2, "0")}`;
    const rows = data.transactions.filter((item) => item.date.startsWith(key));
    const income = sum(rows, (item) => item.type === "income");
    const expense = sum(rows, (item) => item.type === "expense");
    return { label, shortLabel: shortLabels[index], income, expense, result: income - expense };
  });

  const totalIncome = monthly.reduce((total, item) => total + item.income, 0);
  const totalExpense = monthly.reduce((total, item) => total + item.expense, 0);
  const annualEligibleGoals = data.goals.filter((goal) => Number(goal.target) > 0);
  const reachedGoals = annualEligibleGoals.filter((goal) => Number(goal.saved) >= Number(goal.target)).length;

  document.querySelector("#annualYear").textContent = selectedAnnualYear;
  document.querySelector("#annualIncomeTotal").textContent = money(totalIncome);
  document.querySelector("#annualExpenseTotal").textContent = money(totalExpense);
  document.querySelector("#annualGoalsReached").textContent = reachedGoals;
  document.querySelector("#annualGoalsCaption").textContent = annualEligibleGoals.length
    ? `${reachedGoals} de ${annualEligibleGoals.length} metas concluidas`
    : "Nenhuma meta cadastrada";
  document.querySelector("#annualFinalBalance").textContent = money(totalIncome - totalExpense);
  document.querySelector("#annualFinalBalance").className = totalIncome - totalExpense < 0 ? "negative" : "positive";

  renderAnnualBarChart(monthly);
  renderAnnualLineChart(monthly);

  document.querySelector("#annualTable").innerHTML = monthly.map((item) => {
    const rate = item.income ? Math.round((item.result / item.income) * 100) : 0;
    return `<tr>
      <td>${item.label}</td>
      <td class="positive">${money(item.income)}</td>
      <td class="negative">${money(item.expense)}</td>
      <td class="${item.result >= 0 ? "positive" : "negative"}">${money(item.result)}</td>
      <td>${rate}%</td>
    </tr>`;
  }).join("");
}

function renderAnnualBarChart(monthly) {
  const maxValue = Math.max(1, ...monthly.flatMap((item) => [item.income, item.expense]));
  document.querySelector("#annualBarChart").innerHTML = monthly.map((item) => `
    <div class="annual-bar-group" title="${item.label}: entradas ${money(item.income)}, saidas ${money(item.expense)}">
      <div class="annual-bars">
        <span class="annual-bar" style="height:${Math.max(2, (item.income / maxValue) * 100)}%"></span>
        <span class="annual-bar expense" style="height:${Math.max(2, (item.expense / maxValue) * 100)}%"></span>
      </div>
      <span>${item.shortLabel}</span>
    </div>`).join("");
}

function renderAnnualLineChart(monthly) {
  let accumulated = 0;
  const values = monthly.map((item) => {
    accumulated += item.result;
    return accumulated;
  });
  const width = 640;
  const height = 250;
  const paddingX = 28;
  const paddingY = 24;
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const range = Math.max(1, maxValue - minValue);
  const points = values.map((value, index) => {
    const x = paddingX + (index * (width - paddingX * 2)) / 11;
    const y = paddingY + ((maxValue - value) / range) * (height - paddingY * 2);
    return { x, y, value, label: monthly[index].shortLabel };
  });
  const pointString = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints = `${paddingX},${height - paddingY} ${pointString} ${width - paddingX},${height - paddingY}`;
  const zeroY = paddingY + ((maxValue - 0) / range) * (height - paddingY * 2);

  document.querySelector("#annualLineChart").innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Evolucao do saldo acumulado">
      <line class="grid-line" x1="${paddingX}" y1="${paddingY}" x2="${paddingX}" y2="${height - paddingY}"></line>
      <line class="grid-line" x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}"></line>
      <line class="grid-line" x1="${paddingX}" y1="${zeroY}" x2="${width - paddingX}" y2="${zeroY}"></line>
      <polygon class="balance-area" points="${areaPoints}"></polygon>
      <polyline class="balance-line" points="${pointString}"></polyline>
      ${points.map((point) => `
        <circle class="balance-point" cx="${point.x}" cy="${point.y}" r="5">
          <title>${point.label}: ${money(point.value)}</title>
        </circle>
        <text x="${point.x}" y="${height - 5}" text-anchor="middle">${point.label}</text>
      `).join("")}
    </svg>`;
}

function renderAll() {
  renderAccounts();
  renderDashboard();
  renderTransactions();
  renderGoals();
  renderBudget();
  renderDebts();
  renderAnnual();
}

function bindForm(formId, collection, mapper) {
  document.querySelector(formId).addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    data[collection].push({ id: crypto.randomUUID(), ...mapper(values) });
    form.reset();
    saveData();
    renderAll();
  });
}

function closeRowActionMenu() {
  const menu = document.querySelector("#rowActionMenu");
  menu.hidden = true;
  menu.dataset.transactionId = "";
  document.querySelectorAll(".row-menu-button.is-active").forEach((button) => button.classList.remove("is-active"));
}

function closeGoalActionMenu() {
  const menu = document.querySelector("#goalActionMenu");
  menu.hidden = true;
  menu.dataset.goalId = "";
  document.querySelectorAll("[data-goal-menu].is-active").forEach((button) => button.classList.remove("is-active"));
}

function closeBudgetActionMenu() {
  const menu = document.querySelector("#budgetActionMenu");
  menu.hidden = true;
  menu.dataset.budgetId = "";
  document.querySelectorAll("[data-budget-menu].is-active").forEach((button) => button.classList.remove("is-active"));
}

function openBudgetActionMenu(button) {
  const menu = document.querySelector("#budgetActionMenu");
  const budget = data.budgets.find((item) => item.id === button.dataset.budgetMenu);
  if (!budget) return;
  closeBudgetActionMenu();
  button.classList.add("is-active");
  menu.dataset.budgetId = budget.id;
  menu.hidden = false;

  const rect = button.getBoundingClientRect();
  const menuWidth = 190;
  const menuHeight = menu.offsetHeight;
  const left = Math.min(window.innerWidth - menuWidth - 12, Math.max(12, rect.right - menuWidth));
  const top = rect.bottom + menuHeight + 8 > window.innerHeight ? rect.top - menuHeight - 6 : rect.bottom + 6;
  menu.style.left = `${left}px`;
  menu.style.top = `${Math.max(12, top)}px`;
}

function openEditBudget(budget) {
  const dialog = document.querySelector("#editBudgetDialog");
  const form = document.querySelector("#editBudgetForm");
  form.elements.id.value = budget.id;
  fillCategorySelect(form.elements.category, budget.category);
  form.elements.planned.value = budget.planned;
  dialog.showModal();
}

function openGoalActionMenu(button) {
  const menu = document.querySelector("#goalActionMenu");
  const goal = data.goals.find((item) => item.id === button.dataset.goalMenu);
  if (!goal) return;
  closeGoalActionMenu();
  button.classList.add("is-active");
  menu.dataset.goalId = goal.id;
  menu.hidden = false;

  const rect = button.getBoundingClientRect();
  const menuWidth = 190;
  const menuHeight = menu.offsetHeight;
  const left = Math.min(window.innerWidth - menuWidth - 12, Math.max(12, rect.right - menuWidth));
  const top = rect.bottom + menuHeight + 8 > window.innerHeight ? rect.top - menuHeight - 6 : rect.bottom + 6;
  menu.style.left = `${left}px`;
  menu.style.top = `${Math.max(12, top)}px`;
}

function openEditGoal(goal) {
  const dialog = document.querySelector("#editGoalDialog");
  const form = document.querySelector("#editGoalForm");
  form.elements.id.value = goal.id;
  form.elements.name.value = goal.name;
  form.elements.target.value = goal.target;
  dialog.showModal();
}

function openRowActionMenu(button) {
  const menu = document.querySelector("#rowActionMenu");
  const transaction = data.transactions.find((item) => item.id === button.dataset.rowMenu);
  if (!transaction) return;
  closeRowActionMenu();
  button.classList.add("is-active");
  menu.dataset.transactionId = transaction.id;
  menu.querySelector('[data-row-action="remove-recurring"]').disabled = transaction.recurring !== "Sim";
  menu.hidden = false;

  const rect = button.getBoundingClientRect();
  const menuWidth = 190;
  const menuHeight = menu.offsetHeight;
  const left = Math.min(window.innerWidth - menuWidth - 12, Math.max(12, rect.right - menuWidth));
  const top = rect.bottom + menuHeight + 8 > window.innerHeight ? rect.top - menuHeight - 6 : rect.bottom + 6;
  menu.style.left = `${left}px`;
  menu.style.top = `${Math.max(12, top)}px`;
}

function setEditSelectValue(select, value) {
  if (![...select.options].some((option) => option.value === value)) {
    select.add(new Option(value, value));
  }
  select.value = value;
}

function openEditTransaction(transaction) {
  const dialog = document.querySelector("#editTransactionDialog");
  const form = document.querySelector("#editTransactionForm");
  const isSeries = Boolean(transaction.recurringGroupId || (transaction.installmentGroupId && transaction.installmentCount > 1));
  dialog.classList.toggle("is-series", isSeries);
  form.elements.id.value = transaction.id;
  form.elements.date.value = transaction.date;
  form.elements.type.value = transaction.type;
  form.elements.description.value = transaction.description;
  form.elements.category.value = transaction.category;
  form.elements.amount.value = transaction.amount;
  setEditSelectValue(form.elements.payment, transaction.payment);
  form.elements.status.value = transaction.status;
  form.elements.recurring.value = transaction.recurring;
  dialog.showModal();
}

function getSeriesTransactions(transaction, scope) {
  if (scope === "single") return [transaction];
  const groupField = transaction.recurringGroupId ? "recurringGroupId" : "installmentGroupId";
  const groupId = transaction[groupField];
  if (!groupId) return [transaction];
  const series = data.transactions.filter((item) => item[groupField] === groupId);
  if (scope === "future") {
    return series.filter((item) => item.date >= transaction.date);
  }
  return series;
}

function monthDifference(fromDate, toDate) {
  const [fromYear, fromMonth] = fromDate.split("-").map(Number);
  const [toYear, toMonth] = toDate.split("-").map(Number);
  return (toYear - fromYear) * 12 + (toMonth - fromMonth);
}

function shiftSeriesDate(dateString, monthOffset, preferredDay) {
  const shiftedMonth = addMonthsToDate(dateString, monthOffset);
  const [dateYear, dateMonth] = shiftedMonth.split("-").map(Number);
  const lastDay = new Date(dateYear, dateMonth, 0).getDate();
  return `${dateYear}-${String(dateMonth).padStart(2, "0")}-${String(Math.min(preferredDay, lastDay)).padStart(2, "0")}`;
}

function applyTransactionEdits(sourceTransaction, targets, values) {
  const offset = monthDifference(sourceTransaction.date, values.date);
  const preferredDay = Number(values.date.slice(-2));
  targets.forEach((item) => {
    item.date = shiftSeriesDate(item.date, offset, preferredDay);
    item.type = values.type;
    item.description = values.description.trim();
    item.category = values.category.trim();
    item.amount = Number(values.amount);
    item.payment = values.payment;
    item.status = values.status;
    item.recurring = values.recurring;
  });
}

function removeRecurringFrom(transaction) {
  const startMonth = transaction.date.slice(0, 7);
  data.recurringStops ||= {};
  if (transaction.recurringGroupId) {
    data.recurringStops[transaction.recurringGroupId] = startMonth;
  }
  data.transactions = data.transactions.filter((item) => {
    if (item.date.slice(0, 7) < startMonth) return true;
    if (transaction.recurringGroupId) {
      return item.recurringGroupId !== transaction.recurringGroupId;
    }
    const sameRecurring =
      item.recurring === "Sim" &&
      item.description === transaction.description &&
      item.category === transaction.category &&
      item.payment === transaction.payment;
    return !sameRecurring;
  });
}

document.addEventListener("click", (event) => {
  const tabButton = event.target.closest("[data-tab]");
  const jumpButton = event.target.closest("[data-jump]");
  const removeButton = event.target.closest("[data-remove]");
  const monthButton = event.target.closest("[data-transaction-month]");
  const monthScrollButton = event.target.closest("[data-month-scroll]");
  const rowMenuButton = event.target.closest("[data-row-menu]");
  const rowActionButton = event.target.closest("[data-row-action]");
  const goalMenuButton = event.target.closest("[data-goal-menu]");
  const goalActionButton = event.target.closest("[data-goal-action]");
  const budgetMenuButton = event.target.closest("[data-budget-menu]");
  const budgetActionButton = event.target.closest("[data-budget-action]");
  if (tabButton) switchTab(tabButton.dataset.tab);
  if (jumpButton) switchTab(jumpButton.dataset.jump);
  if (rowMenuButton) {
    event.stopPropagation();
    openRowActionMenu(rowMenuButton);
    return;
  }
  if (goalMenuButton) {
    event.stopPropagation();
    closeRowActionMenu();
    openGoalActionMenu(goalMenuButton);
    return;
  }
  if (budgetMenuButton) {
    event.stopPropagation();
    closeRowActionMenu();
    closeGoalActionMenu();
    openBudgetActionMenu(budgetMenuButton);
    return;
  }
  if (budgetActionButton) {
    const menu = document.querySelector("#budgetActionMenu");
    const budget = data.budgets.find((item) => item.id === menu.dataset.budgetId);
    if (!budget) {
      closeBudgetActionMenu();
      return;
    }
    if (budgetActionButton.dataset.budgetAction === "edit") {
      openEditBudget(budget);
    } else if (budgetActionButton.dataset.budgetAction === "remove") {
      data.budgets = data.budgets.filter((item) => item.id !== budget.id);
      saveData();
      renderAll();
    }
    closeBudgetActionMenu();
    return;
  }
  if (goalActionButton) {
    const menu = document.querySelector("#goalActionMenu");
    const goal = data.goals.find((item) => item.id === menu.dataset.goalId);
    if (!goal) {
      closeGoalActionMenu();
      return;
    }
    if (goalActionButton.dataset.goalAction === "edit") {
      openEditGoal(goal);
    } else if (goalActionButton.dataset.goalAction === "remove") {
      data.goals = data.goals.filter((item) => item.id !== goal.id);
      data.goalMovements = data.goalMovements.filter((movement) => movement.goalId !== goal.id);
      saveData();
      renderAll();
    }
    closeGoalActionMenu();
    return;
  }
  if (rowActionButton) {
    const menu = document.querySelector("#rowActionMenu");
    const transaction = data.transactions.find((item) => item.id === menu.dataset.transactionId);
    if (!transaction) {
      closeRowActionMenu();
      return;
    }
    if (rowActionButton.dataset.rowAction === "edit") {
      openEditTransaction(transaction);
    } else if (rowActionButton.dataset.rowAction === "remove") {
      data.transactions = data.transactions.filter((item) => item.id !== transaction.id);
      saveData();
      renderAll();
    } else if (rowActionButton.dataset.rowAction === "remove-recurring" && transaction.recurring === "Sim") {
      removeRecurringFrom(transaction);
      saveData();
      renderAll();
    }
    closeRowActionMenu();
    return;
  }
  if (monthButton) {
    activeTransactionMonth = monthButton.dataset.transactionMonth;
    renderTransactions();
  }
  if (monthScrollButton) {
    const tabsContainer = document.querySelector("#transactionMonthTabs");
    tabsContainer?.scrollBy({ left: Number(monthScrollButton.dataset.monthScroll) * 360, behavior: "smooth" });
  }
  if (removeButton) {
    const collection = removeButton.dataset.remove;
    data[collection] = data[collection].filter((item) => item.id !== removeButton.dataset.id);
    saveData();
    renderAll();
  }
  if (!event.target.closest("#rowActionMenu")) closeRowActionMenu();
  if (!event.target.closest("#goalActionMenu")) closeGoalActionMenu();
  if (!event.target.closest("#budgetActionMenu")) closeBudgetActionMenu();
});

window.addEventListener("resize", () => {
  closeRowActionMenu();
  closeGoalActionMenu();
  closeBudgetActionMenu();
});

document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => document.querySelector("#editTransactionDialog").close());
});

document.querySelectorAll("[data-close-goal-dialog]").forEach((button) => {
  button.addEventListener("click", () => document.querySelector("#editGoalDialog").close());
});

document.querySelector("#editGoalForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget).entries());
  const goal = data.goals.find((item) => item.id === values.id);
  if (!goal) return;
  goal.name = values.name.trim();
  goal.target = Number(values.target);
  saveData();
  document.querySelector("#editGoalDialog").close();
  renderAll();
});

document.querySelectorAll("[data-close-budget-dialog]").forEach((button) => {
  button.addEventListener("click", () => document.querySelector("#editBudgetDialog").close());
});

document.querySelector("#editBudgetForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget).entries());
  const budget = data.budgets.find((item) => item.id === values.id);
  if (!budget) return;
  const duplicate = data.budgets.find((item) =>
    item.id !== budget.id &&
    item.month === budget.month &&
    item.category.toLowerCase() === values.category.toLowerCase()
  );
  if (duplicate) {
    duplicate.planned = Number(values.planned);
    data.budgets = data.budgets.filter((item) => item.id !== budget.id);
  } else {
    budget.category = values.category;
    budget.planned = Number(values.planned);
  }
  saveData();
  document.querySelector("#editBudgetDialog").close();
  renderAll();
});

document.querySelector("#editTransactionForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form).entries());
  const transaction = data.transactions.find((item) => item.id === values.id);
  if (!transaction) return;
  const scope = event.submitter?.dataset.editScope || "single";
  const wasRecurring = transaction.recurring === "Sim";
  const previousRecurringGroupId = transaction.recurringGroupId;
  const targets = getSeriesTransactions(transaction, scope);
  applyTransactionEdits(transaction, targets, values);

  if (values.recurring === "Sim" && !transaction.recurringGroupId) {
    const recurringGroupId = crypto.randomUUID();
    targets.forEach((item) => {
      item.recurringGroupId = recurringGroupId;
      item.recurring = "Sim";
    });
  }
  if (values.recurring === "Sim") {
    data.recurringStops ||= {};
    delete data.recurringStops[transaction.recurringGroupId];
    if (!wasRecurring || data.transactions.filter((item) => item.recurringGroupId === transaction.recurringGroupId).length < 12) {
      ensureRecurringSeries(data);
    }
  }
  if (values.recurring === "Nao" && wasRecurring) {
    data.recurringStops ||= {};
    const stopMonth = scope === "all"
      ? targets.map((item) => item.date.slice(0, 7)).sort()[0]
      : values.date.slice(0, 7);
    if (previousRecurringGroupId) data.recurringStops[previousRecurringGroupId] = stopMonth;
    targets.forEach((item) => {
      item.recurring = "Nao";
      item.recurringGroupId = null;
    });
  }
  activeTransactionMonth = values.date.slice(0, 7);
  saveData();
  document.querySelector("#editTransactionDialog").close();
  renderAll();
});

document.querySelector("#dashboardMonth").addEventListener("change", (event) => {
  selectedMonthKey = event.target.value || `${year}-${month}`;
  renderDashboard();
});

document.querySelector("#bankMonthFilter").addEventListener("change", (event) => {
  selectedBankMonth = event.target.value || `${year}-${month}`;
  renderAccounts();
});

document.querySelector("#planningMonthFilter").addEventListener("change", (event) => {
  selectedPlanningMonth = event.target.value || `${year}-${month}`;
  renderBudget();
});

document.querySelector("#annualYearFilter").addEventListener("change", (event) => {
  selectedAnnualYear = Number(event.target.value) || year;
  renderAnnual();
});

document.querySelector("#goalMovementSelect").addEventListener("change", updateNewGoalFields);

document.querySelector("#wishlistCollapseButton").addEventListener("click", () => {
  wishlistCollapsed = !wishlistCollapsed;
  localStorage.setItem("wishlist-collapsed", String(wishlistCollapsed));
  applyWishlistState();
});

document.querySelector("#themeToggle").addEventListener("click", () => {
  darkModeEnabled = !darkModeEnabled;
  localStorage.setItem("dark-mode", String(darkModeEnabled));
  applyTheme();
});

document.querySelector("#goalMovementForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form).entries());
  let goal;

  if (values.goalId === "__new__") {
    goal = {
      id: crypto.randomUUID(),
      name: values.newGoalName.trim(),
      target: Number(values.newGoalTarget),
      saved: 0,
      deadline: "",
    };
    data.goals.push(goal);
  } else {
    goal = data.goals.find((item) => item.id === values.goalId);
  }
  if (!goal) return;

  const requestedAmount = Number(values.amount);
  const actualAmount = values.operation === "remove"
    ? Math.min(requestedAmount, Number(goal.saved))
    : requestedAmount;
  goal.saved = values.operation === "add"
    ? Number(goal.saved) + actualAmount
    : Math.max(0, Number(goal.saved) - actualAmount);

  data.goalMovements.push({
    id: crypto.randomUUID(),
    goalId: goal.id,
    operation: values.operation,
    amount: actualAmount,
    person: values.person,
    date: values.date,
  });

  form.reset();
  document.querySelector("#goalMovementDate").value = localDateKey();
  saveData();
  renderAll();
});

document.querySelector("#wishlistForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form).entries());
  const existing = data.wishlist.find((item) => item.id === values.id);
  const wishlistItem = {
    id: values.id || crypto.randomUUID(),
    objective: values.objective.trim(),
    value: values.value ? Number(values.value) : null,
    responsible: values.responsible,
    link: values.link.trim(),
    photo: values.photo.trim() || existing?.photo || "",
  };
  if (existing) {
    Object.assign(existing, wishlistItem);
  } else {
    data.wishlist.push(wishlistItem);
  }
  form.reset();
  form.elements.id.value = "";
  form.closest("details").open = false;
  saveData();
  renderWishlist();
});

document.addEventListener("click", (event) => {
  const removeGoalButton = event.target.closest("[data-remove-goal]");
  const editWishlistButton = event.target.closest("[data-edit-wishlist]");
  const removeWishlistButton = event.target.closest("[data-remove-wishlist]");

  if (removeGoalButton) {
    const goalId = removeGoalButton.dataset.removeGoal;
    if (goalId === fixedReserveGoalId) return;
    data.goals = data.goals.filter((goal) => goal.id !== goalId);
    data.goalMovements = data.goalMovements.filter((movement) => movement.goalId !== goalId);
    saveData();
    renderAll();
  }

  if (editWishlistButton) {
    const item = data.wishlist.find((wishlistItem) => wishlistItem.id === editWishlistButton.dataset.editWishlist);
    if (!item) return;
    const form = document.querySelector("#wishlistForm");
    form.elements.id.value = item.id;
    form.elements.objective.value = item.objective;
    form.elements.value.value = item.value ?? "";
    form.elements.responsible.value = item.responsible;
    form.elements.link.value = item.link;
    form.elements.photo.value = item.photo;
    form.closest("details").open = true;
    form.elements.objective.focus();
  }

  if (removeWishlistButton) {
    data.wishlist = data.wishlist.filter((item) => item.id !== removeWishlistButton.dataset.removeWishlist);
    saveData();
    renderWishlist();
  }
});

document.querySelector("#financeSummary").addEventListener("change", (event) => {
  const input = event.target.closest("[data-plan-field]");
  if (!input) return;
  const plan = getMonthlyPlan();
  if (input.dataset.planField === "previousRemainder") {
    data.reserveAnchor = {
      month: selectedMonthKey,
      amount: Math.max(0, Number(input.value || 0)),
    };
    plan.previousRemainder = data.reserveAnchor.amount;
  } else {
    plan[input.dataset.planField] = Number(input.value || 0);
  }
  syncFixedReserveGoal();
  saveData();
  renderAll();
});

function updateCategoryField() {
  const categorySelect = document.querySelector("#transactionCategory");
  const field = document.querySelector("#otherCategoryField");
  const input = document.querySelector("#otherCategoryInput");
  const isOther = categorySelect.value === "Outros";
  field.classList.toggle("is-hidden", !isOther);
  input.required = isOther;
  if (!isOther) input.value = "";
}

function updateInstallmentFields() {
  const form = document.querySelector("#transactionForm");
  const installment = document.querySelector("#installmentSelect").value === "Sim";
  const recurring = document.querySelector("#recurringSelect").value === "Sim";
  const installmentSelect = document.querySelector("#installmentSelect");
  const countInput = document.querySelector("#installmentCount");
  const amount = Number(form.elements.amount.value || 0);
  const count = installment ? Math.max(2, Number(countInput.value || 2)) : 1;
  if (recurring) installmentSelect.value = "Nao";
  installmentSelect.disabled = recurring;
  countInput.disabled = recurring || !installment;
  const preview = document.querySelector("#installmentPreview");
  preview.textContent = recurring
    ? `O valor de ${money(amount)} sera repetido mensalmente por 12 meses.`
    : installment
    ? `${count} parcelas de aproximadamente ${money(amount / count)} serao criadas nos meses seguintes.`
    : "Um unico lancamento sera criado.";
}

document.querySelector("#transactionCategory").addEventListener("change", updateCategoryField);
document.querySelector("#installmentSelect").addEventListener("change", updateInstallmentFields);
document.querySelector("#installmentCount").addEventListener("input", updateInstallmentFields);
document.querySelector("#recurringSelect").addEventListener("change", updateInstallmentFields);
document.querySelector("#transactionForm").elements.amount.addEventListener("input", updateInstallmentFields);

document.addEventListener("change", (event) => {
  if (event.target.matches("#transactionCategoryFilter")) {
    selectedTransactionCategory = event.target.value;
    renderTransactions();
    return;
  }
  const statusSelect = event.target.closest("[data-status-id]");
  if (!statusSelect) return;
  const transaction = data.transactions.find((item) => item.id === statusSelect.dataset.statusId);
  if (!transaction) return;
  transaction.status = statusSelect.value;
  saveData();
  renderAll();
});

document.querySelector("#transactionForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form).entries());
  if (values.category === "Outros" && !values.otherCategory?.trim()) {
    document.querySelector("#otherCategoryInput").focus();
    return;
  }
  const installments = createTransactionInstallments(values);
  data.transactions.push(...installments);
  activeTransactionMonth = installments[0].date.slice(0, 7);
  form.reset();
  document.querySelector("#installmentCount").value = 2;
  updateCategoryField();
  updateInstallmentFields();
  saveData();
  renderAll();
});

document.querySelector("#budgetForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form).entries());
  if (!values.category) return;
  const existing = data.budgets.find((item) =>
    item.month === selectedPlanningMonth &&
    item.category.toLowerCase() === values.category.toLowerCase()
  );
  if (existing) {
    existing.planned = Number(values.planned);
  } else {
    data.budgets.push({
      id: crypto.randomUUID(),
      category: values.category,
      planned: Number(values.planned),
      month: selectedPlanningMonth,
    });
  }
  form.reset();
  saveData();
  renderAll();
});

document.querySelector("#debtForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form).entries());
  const installmentCount = Math.max(1, Number(values.installmentCount));
  const currentInstallment = Math.min(installmentCount, Math.max(0, Number(values.currentInstallment)));
  data.debts.push({
    id: crypto.randomUUID(),
    name: values.name.trim(),
    creditor: values.creditor.trim(),
    total: Number(values.total),
    installmentCount,
    currentInstallment,
    startDate: values.startDate,
  });
  form.reset();
  saveData();
  renderAll();
});

renderTabs();
updateCategoryField();
updateInstallmentFields();
document.querySelector("#goalMovementDate").value = localDateKey();
renderAll();
applyWishlistState();
applyTheme();
switchTab("dashboard");
