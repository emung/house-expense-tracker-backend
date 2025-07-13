document.addEventListener('DOMContentLoaded', () => {
  // --- Configuration ---
  const API_BASE_URL = 'http://localhost:3000/api/v1';

  // --- DOM Elements ---
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const toggleLink = document.getElementById('toggle-link');
  const formTitle = document.getElementById('form-title');
  const toggleText = document.getElementById('toggle-text');
  const errorMessageDiv = document.getElementById('error-message');
  const errorTextSpan = document.getElementById('error-text');

  let isLogin = true;

  // --- Event Listeners ---

  // Toggle between login and register views
  toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    updateFormView();
  });

  // Handle login form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    const formData = new FormData(loginForm);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }

      // Assuming the tokens are in result.data
      if (result.data && result.data.accessToken) {
        localStorage.setItem('accessToken', result.data.accessToken);
        localStorage.setItem('refreshToken', result.data.refreshToken);
        window.location.href = 'expenses.html'; // Redirect to expenses page
      } else {
        throw new Error('Invalid response structure from server.');
      }
    } catch (error) {
      showError(error.message);
    }
  });

  // Handle register form submission
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    const formData = new FormData(registerForm);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle cases where the backend returns an array of messages
        const errorMessage = Array.isArray(result.message) ? result.message.join(', ') : result.message;
        throw new Error(errorMessage || 'Registration failed');
      }

      // On successful registration, switch to login view with a success message
      isLogin = true;
      updateFormView();
      // You could show a success message here if you add a success message element
      alert('Registration successful! Please log in.');
    } catch (error) {
      showError(error.message);
    }
  });

  // --- UI Functions ---

  /**
   * Toggles the UI between the login and registration forms.
   */
  function updateFormView() {
    hideError();
    if (isLogin) {
      formTitle.textContent = 'Login';
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
      toggleText.textContent = "Don't have an account? ";
      toggleLink.textContent = 'Register here';
    } else {
      formTitle.textContent = 'Register';
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
      toggleText.textContent = 'Already have an account? ';
      toggleLink.textContent = 'Login here';
    }
  }

  /**
   * Displays an error message in the UI.
   * @param {string} message - The error message to display.
   */
  function showError(message) {
    errorTextSpan.textContent = message;
    errorMessageDiv.classList.remove('hidden');
  }

  /**
   * Hides the error message display.
   */
  function hideError() {
    errorMessageDiv.classList.add('hidden');
    errorTextSpan.textContent = '';
  }
});
