document.addEventListener('DOMContentLoaded', () => {
  // --- Configuration ---
  const API_BASE_URL = '/api/v1';

  // --- DOM Elements ---
  const contractorsTableBody = document.getElementById('contractors-table-body');
  const addContractorForm = document.getElementById('add-contractor-form');
  const logoutButton = document.getElementById('logout-button');
  const loadingSpinner = document.getElementById('loading-spinner');
  const totalContractorsEl = document.getElementById('total-contractors');

  // Edit Modal Elements
  const editModal = document.getElementById('edit-modal');
  const editForm = document.getElementById('edit-contractor-form');
  const cancelEditButton = document.getElementById('cancel-edit');

  // View Modal Elements
  const viewModal = document.getElementById('view-modal');
  const closeViewButton = document.getElementById('close-view');

  // Filter Elements
  const searchNameInput = document.getElementById('search-name');
  const searchPhoneInput = document.getElementById('search-phone');

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
   * Fetches all contractors and renders them in the table.
   */
  async function loadContractors() {
    showLoading(true);
    try {
      const contractors = await api.call('/contractors');

      renderContractors(contractors);
      updateSummary(contractors.length);
    } catch (error) {
      console.error('Failed to load contractors:', error);
      alert(error.message); // Simple error feedback
    } finally {
      showLoading(false);
    }
  }

  /**
   * Renders an array of contractor objects into the table.
   * @param {Array<Object>} contractors - The array of contractors.
   */
  function renderContractors(contractors) {
    contractorsTableBody.innerHTML = '';
    if (!contractors || contractors.length === 0) {
      contractorsTableBody.innerHTML =
        '<tr><td colspan="7" class="text-center p-8 text-gray-500">No contractors found.</td></tr>';
      return;
    }

    contractors.forEach((contractor) => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700';
      row.innerHTML = `
              <td class="p-4">${contractor.id}</td>
              <td class="p-4 font-semibold">${contractor.name}</td>
              <td class="p-4">${contractor.phone}</td>
              <td class="p-4">${contractor.email || '-'}</td>
              <td class="p-4">${contractor.address || '-'}</td>
              <td class="p-4">${contractor.website ? `<a href="${contractor.website}" target="_blank" class="text-blue-500 hover:text-blue-700">Visit</a>` : '-'}</td>
              <td class="p-4 space-x-2">
                  <button class="view-btn text-blue-500 hover:text-blue-700" data-id="${contractor.id}">View</button>
                  <button class="edit-btn text-yellow-500 hover:text-yellow-700" data-id="${contractor.id}">Edit</button>
                  <button class="delete-btn text-red-500 hover:text-red-700" data-id="${contractor.id}">Delete</button>
              </td>
          `;
      contractorsTableBody.appendChild(row);
    });
  }

  /**
   * Updates the summary cards with total count.
   * @param {number} total - The total number of contractors.
   */
  function updateSummary(total) {
    totalContractorsEl.textContent = `${total || 0}`;
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
      contractorsTableBody.classList.add('hidden');
    } else {
      loadingSpinner.classList.add('hidden');
      contractorsTableBody.classList.remove('hidden');
    }
  }

  /**
   * Shows contractor details in the view modal.
   * @param {Object} contractor - The contractor object.
   */
  function showContractorDetails(contractor) {
    document.getElementById('view-name').textContent = contractor.name;
    document.getElementById('view-phone').textContent = contractor.phone;
    document.getElementById('view-email').textContent = contractor.email || 'Not provided';
    document.getElementById('view-address').textContent = contractor.address || 'Not provided';
    document.getElementById('view-website').innerHTML = contractor.website
      ? `<a href="${contractor.website}" target="_blank" class="text-blue-500 hover:text-blue-700">${contractor.website}</a>`
      : 'Not provided';
    document.getElementById('view-notes').textContent = contractor.notes || 'No notes';
    viewModal.classList.remove('hidden');
  }

  // --- Event Handlers ---

  // Add Contractor Form
  addContractorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newContractor = {
      name: document.getElementById('name').value,
      phone: document.getElementById('phone').value,
      address: document.getElementById('address').value || undefined,
      email: document.getElementById('email').value || undefined,
      website: document.getElementById('website').value || undefined,
      notes: document.getElementById('notes').value || undefined,
    };

    try {
      await api.call('/contractors', {
        method: 'POST',
        body: JSON.stringify(newContractor),
      });
      addContractorForm.reset();
      loadContractors();
      toastr.success('Contractor added successfully');
    } catch (error) {
      console.error('Failed to add contractor:', error);
      alert(error.message);
    }
  });

  // View, Edit and Delete Buttons (using event delegation)
  contractorsTableBody.addEventListener('click', async (e) => {
    const target = e.target;
    const id = target.dataset.id;

    if (target.classList.contains('delete-btn')) {
      try {
        await api.call(`/contractors/${id}`, { method: 'DELETE' });
        toastr.success('Contractor deleted successfully');
        loadContractors(); // Refresh list
      } catch (error) {
        console.error('Failed to delete contractor:', error);
        alert(error.message);
      }
    }

    if (target.classList.contains('view-btn')) {
      try {
        const contractor = await api.call(`/contractors/${id}`);
        showContractorDetails(contractor);
      } catch (error) {
        console.error('Failed to fetch contractor for viewing:', error);
        alert(error.message);
      }
    }

    if (target.classList.contains('edit-btn')) {
      try {
        const contractor = await api.call(`/contractors/${id}`);

        // Populate and show the modal
        document.getElementById('edit-id').value = contractor.id;
        document.getElementById('edit-name').value = contractor.name;
        document.getElementById('edit-phone').value = contractor.phone;
        document.getElementById('edit-address').value = contractor.address || '';
        document.getElementById('edit-email').value = contractor.email || '';
        document.getElementById('edit-website').value = contractor.website || '';
        document.getElementById('edit-notes').value = contractor.notes || '';
        editModal.classList.remove('hidden');
      } catch (error) {
        console.error('Failed to fetch contractor for editing:', error);
        alert(error.message);
      }
    }
  });

  // Edit Modal Form
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const updatedContractor = {
      name: document.getElementById('edit-name').value,
      phone: document.getElementById('edit-phone').value,
      address: document.getElementById('edit-address').value || undefined,
      email: document.getElementById('edit-email').value || undefined,
      website: document.getElementById('edit-website').value || undefined,
      notes: document.getElementById('edit-notes').value || undefined,
    };

    try {
      await api.call(`/contractors/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updatedContractor),
      });
      editModal.classList.add('hidden');
      loadContractors(); // Refresh list
      toastr.success('Contractor updated successfully');
    } catch (error) {
      console.error('Failed to update contractor:', error);
      alert(error.message);
    }
  });

  // Cancel Edit
  cancelEditButton.addEventListener('click', () => {
    editModal.classList.add('hidden');
  });

  // Close View Modal
  closeViewButton.addEventListener('click', () => {
    viewModal.classList.add('hidden');
  });

  // Close modals when clicking outside
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
      editModal.classList.add('hidden');
    }
  });

  viewModal.addEventListener('click', (e) => {
    if (e.target === viewModal) {
      viewModal.classList.add('hidden');
    }
  });

  // Logout Button
  logoutButton.addEventListener('click', logout);

  // Filter Handlers
  searchNameInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      const name = searchNameInput.value.trim();
      if (name.length > 0) {
        try {
          const contractors = await api.call(`/contractors/name/${encodeURIComponent(name)}`);
          renderContractors(contractors);
        } catch (error) {
          console.error('Error searching by name', error);
          // If not found, show empty results
          renderContractors([]);
        }
      } else {
        loadContractors();
      }
    }
  });

  searchPhoneInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      const phone = searchPhoneInput.value.trim();
      if (phone.length > 0) {
        try {
          // Since there's no specific phone search endpoint, we'll load all and filter client-side
          const contractors = await api.call('/contractors');
          const filtered = contractors.filter((contractor) =>
            contractor.phone.toLowerCase().includes(phone.toLowerCase()),
          );
          renderContractors(filtered);
        } catch (error) {
          console.error('Error searching by phone', error);
        }
      } else {
        loadContractors();
      }
    }
  });

  // Clear filters when input is cleared
  searchNameInput.addEventListener('input', (e) => {
    if (e.target.value === '') {
      loadContractors();
    }
  });

  searchPhoneInput.addEventListener('input', (e) => {
    if (e.target.value === '') {
      loadContractors();
    }
  });

  // --- Initial Load ---
  loadContractors();
});
