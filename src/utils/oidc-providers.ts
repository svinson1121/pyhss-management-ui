export const getAuthStatus = () => {
  return new Promise((res) => {
    // Auto-authenticate using stored API URL — no login screen needed
    const api = localStorage.getItem('api') || 'http://localhost:8080';
    localStorage.setItem('api', api);
    localStorage.setItem(
      'authentication',
      JSON.stringify({ profile: { api } })
    );
    res({ profile: { api } });
  });
};
