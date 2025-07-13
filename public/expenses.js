document.addEventListener('DOMContentLoaded', () => {
  // --- Configuration ---
  const API_BASE_URL = 'http://localhost:3000/api/v1';

  // --- DOM Elements ---
  const expensesTableBody = document.getElementById('expenses-table-body');
  const addExpenseForm = document.getElementById('add-expense-form');
  const logoutButton = document.getElementById('logout-button');
  const loadingSpinner = document.getElementById('loading-spinner');
  const totalSumEuroEl = document.getElementById('total-sum-eur');
  const totalSumRonEl = document.getElementById('total-sum-ron');
  const totalAmountEurEl = document.getElementById('total-amount-eur');
  const totalAmountRonEl = document.getElementById('total-amount-ron');

  // Edit Modal Elements
  const editModal = document.getElementById('edit-modal');
  const editForm = document.getElementById('edit-expense-form');
  const cancelEditButton = document.getElementById('cancel-edit');

  // Filter Elements
  const searchDescriptionInput = document.getElementById('search-description');
  const searchCategorySelect = document.getElementById('search-category');

  // --- Initial Check ---
  if (!localStorage.getItem('accessToken')) {
    window.location.href = 'index.html';
    return;
  }

  // --- API Service with Token Refresh ---
  const api = {
    async call(endpoint, options = {}) {
      let accessToken = localStorage.getItem('accessToken');

      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      };

      let response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

      if (response.status === 401) {
        // Unauthorized - Token might be expired
        console.log('Access token expired. Attempting to refresh...');
        const newTokens = await this.refreshToken();
        if (newTokens) {
          localStorage.setItem('accessToken', newTokens.accessToken);
          localStorage.setItem('refreshToken', newTokens.refreshToken);

          // Retry the original request with the new token
          headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
          response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
        } else {
          // Refresh failed, log out user
          logout();
          return; // Stop execution
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API call to ${endpoint} failed`);
      }

      // For DELETE requests which might not have a body
      if (response.status === 200 && options.method === 'DELETE') {
        return { success: true };
      }

      return response.json();
    },

    async refreshToken() {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return null;

      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) throw new Error('Refresh token failed');

        const result = await response.json();
        return result.data; // Assuming tokens are in result.data
      } catch (error) {
        console.error('Could not refresh token:', error);
        return null;
      }
    },
  };

  // --- Main Functions ---

  /**
   * Fetches all expenses and renders them in the table.
   */
  // TODO: edit this
  async function loadExpenses() {
    showLoading(true);
    try {
      const result = await api.call('/expenses');

      const expensesByEuro = result.expenses.filter((expense) => expense.currency === 'EUR');
      const expensesByEuroSum = expensesByEuro.reduce((acc, expense) => acc + expense.amount, 0);

      const expensesByRon = result.expenses.filter((expense) => expense.currency === 'RON');
      const expensesByRonSum = expensesByRon.reduce((acc, expense) => acc + expense.amount, 0);

      renderExpenses(result.expenses);
      updateSummary(expensesByEuroSum, expensesByEuro.length, expensesByRonSum, expensesByRon.length);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      alert(error.message); // Simple error feedback
    } finally {
      showLoading(false);
    }
  }

  /**
   * Fetches all unique categories and populates the filter dropdown.
   */
  async function loadCategories() {
    try {
      const categories = await api.call('/expenses/categories');
      searchCategorySelect.innerHTML = '<option value="">All Categories</option>'; // Reset
      categories.forEach((category) => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        searchCategorySelect.appendChild(option);
      });
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }

  /**
   * Renders an array of expense objects into the table.
   * @param {Array<Object>} expenses - The array of expenses.
   */
  function renderExpenses(expenses) {
    expensesTableBody.innerHTML = '';
    if (!expenses || expenses.length === 0) {
      expensesTableBody.innerHTML =
        '<tr><td colspan="6" class="text-center p-8 text-gray-500">No expenses found.</td></tr>';
      return;
    }

    expenses.forEach((expense) => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50';
      row.innerHTML = `
              <td class="p-4">${expense.id}</td>
              <td class="p-4">${new Date(expense.date).toLocaleDateString()}</td>
              <td class="p-4">${expense.description}</td>
              <td class="p-4"><span class="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">${expense.category}</span></td>
              <td class="p-4 font-semibold">${expense.amount.toFixed(2)} ${expense.currency}</td>
              <td class="p-4 space-x-2">
                  <button class="edit-btn text-yellow-500 hover:text-yellow-700" data-id="${expense.id}">Edit</button>
                  <button class="delete-btn text-red-500 hover:text-red-700" data-id="${expense.id}">Delete</button>
              </td>
          `;
      expensesTableBody.appendChild(row);
    });
  }

  /**
   * Updates the summary cards with total sum and count.
   * @param {number} sumEur - The total sum of expenses.
   * @param {number} amountEur - The total number of expenses in EUR.
   * @param {number} sumRon - The total sum of expenses in RON.
   * @param {number} amountRon - The total number of expenses in RON.
   */
  function updateSummary(sumEur, amountEur, sumRon, amountRon) {
    totalSumEuroEl.textContent = `EUR ${(sumEur || 0).toFixed(2)}`;
    totalSumRonEl.textContent = `RON ${(sumRon || 0).toFixed(2)}`;
    totalAmountEurEl.textContent = `${amountEur || 0}`;
    totalAmountRonEl.textContent = `${amountRon || 0}`;
  }

  /**
   * Logs the user out by clearing storage and redirecting.
   */
  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = 'index.html';
  }

  /**
   * Shows or hides the loading indicator.
   * @param {boolean} isLoading - Whether to show the spinner.
   */
  function showLoading(isLoading) {
    if (isLoading) {
      loadingSpinner.classList.remove('hidden');
      expensesTableBody.classList.add('hidden');
    } else {
      loadingSpinner.classList.add('hidden');
      expensesTableBody.classList.remove('hidden');
    }
  }

  // --- Event Handlers ---

  // Add Expense Form
  addExpenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newExpense = {
      amount: parseFloat(document.getElementById('amount').value),
      description: document.getElementById('description').value,
      category: document.getElementById('category').value,
      currency: document.getElementById('currency').value,
    };

    try {
      await api.call('/expenses', {
        method: 'POST',
        body: JSON.stringify(newExpense),
      });
      addExpenseForm.reset();
      loadExpenses(); // Refresh list
      loadCategories(); // Refresh categories in case a new one was added
    } catch (error) {
      console.error('Failed to add expense:', error);
      alert(error.message);
    }
  });

  // Edit and Delete Buttons (using event delegation)
  expensesTableBody.addEventListener('click', async (e) => {
    const target = e.target;
    const id = target.dataset.id;

    if (target.classList.contains('delete-btn')) {
      try {
        await api.call(`/expenses/${id}`, { method: 'DELETE' });
        loadExpenses(); // Refresh list
      } catch (error) {
        console.error('Failed to delete expense:', error);
        alert(error.message);
      }
    }

    if (target.classList.contains('edit-btn')) {
      try {
        const result = await api.call(`/expenses/${id}`);
        const expense = result; // The endpoint returns the expense object directly

        // Populate and show the modal
        document.getElementById('edit-id').value = expense.id;
        document.getElementById('edit-amount').value = expense.amount;
        document.getElementById('edit-description').value = expense.description;
        document.getElementById('edit-category').value = expense.category;
        document.getElementById('edit-currency').value = expense.currency;
        editModal.classList.remove('hidden');
      } catch (error) {
        console.error('Failed to fetch expense for editing:', error);
        alert(error.message);
      }
    }
  });

  // Edit Modal Form
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const updatedExpense = {
      amount: parseFloat(document.getElementById('edit-amount').value),
      description: document.getElementById('edit-description').value,
      category: document.getElementById('edit-category').value,
      currency: document.getElementById('edit-currency').value,
    };

    try {
      await api.call(`/expenses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updatedExpense),
      });
      editModal.classList.add('hidden');
      loadExpenses(); // Refresh list
      loadCategories();
    } catch (error) {
      console.error('Failed to update expense:', error);
      alert(error.message);
    }
  });

  // Cancel Edit
  cancelEditButton.addEventListener('click', () => {
    editModal.classList.add('hidden');
  });

  // Logout Button
  logoutButton.addEventListener('click', logout);

  // TODO: change to make the REST call only when ENTER key is pressed
  // Filter Handlers
  searchDescriptionInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      const description = searchDescriptionInput.value.trim();
      if (description.length > 2) {
        try {
          const result = await api.call(`/expenses/by-description?description=${description}`);
          renderExpenses(result.expenses);
        } catch (error) {
          console.error('Error searching by description', error);
        }
      } else if (description.length === 0) {
        loadExpenses();
      }
    }
  });

  searchCategorySelect.addEventListener('change', async () => {
    const category = searchCategorySelect.value;
    if (category) {
      try {
        const result = await api.call(`/expenses/by-category?category=${category}`);
        renderExpenses(result.expenses);
      } catch (error) {
        console.error('Error searching by category', error);
      }
    } else {
      loadExpenses();
    }
  });

  // --- Initial Load ---
  loadExpenses();
  loadCategories();
});
