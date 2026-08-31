const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://triple-e-folder-management-system.onrender.com/api';

const token = () =>
  localStorage.getItem('tripleE_token');

async function request(
  path,
  {
    method = 'GET',
    body,
    headers = {},
  } = {}
) {
  const h = { ...headers };

  if (
    body &&
    !(body instanceof FormData)
  ) {
    h['Content-Type'] =
      'application/json';
  }

  const t = token();

  if (t) {
    h.Authorization = `Bearer ${t}`;
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      method,
      headers: h,
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    // No JSON response
  }

  if (
    response.status === 401 &&
    path !== '/auth/login'
  ) {
    localStorage.removeItem(
      'tripleE_token'
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Request failed (${response.status})`
    );
  }

  return data;
}

export const api = {
  baseUrl: API_URL.replace(
    /\/api$/,
    ''
  ),

  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  me: () =>
    request('/auth/me'),

  dashboard: () =>
    request('/dashboard'),

  profile: () =>
    request('/profile'),

  saveProfile: (data) =>
    request('/profile', {
      method: 'PUT',
      body: data,
    }),

  uploadProfilePhoto: (fd) =>
    request('/profile/photo', {
      method: 'POST',
      body: fd,
    }),

  changePassword: (data) =>
    request('/profile/password', {
      method: 'PUT',
      body: data,
    }),

  users: () =>
    request('/users'),

  user: (id) =>
    request(`/users/${id}`),

  userPermissions: (id) =>
    request(`/users/${id}/permissions`),

  saveUserPermissions: (
    id,
    permissions
  ) =>
    request(
      `/users/${id}/permissions`,
      {
        method: 'PUT',
        body: { permissions },
      }
    ),

  createUser: (data) =>
    request('/users', {
      method: 'POST',
      body: data,
    }),

  updateUser: (id, data) =>
    request(`/users/${id}`, {
      method: 'PUT',
      body: data,
    }),

  deleteUser: (id) =>
    request(`/users/${id}`, {
      method: 'DELETE',
    }),

  /* =========================
     CATEGORIES
     ========================= */

  categories: () =>
    request('/categories'),

  createCategory: (data) =>
    request('/categories', {
      method: 'POST',
      body: data,
    }),

  updateCategory: (id, data) =>
    request(`/categories/${id}`, {
      method: 'PUT',
      body: data,
    }),

  deleteCategory: (id) =>
    request(`/categories/${id}`, {
      method: 'DELETE',
    }),

  /* =========================
     FOLDERS
     ========================= */

  folders: (q = '') =>
    request(`/folders${q}`),

  folder: (id) =>
    request(`/folders/${id}`),

  createFolder: (data) =>
    request('/folders', {
      method: 'POST',
      body: data,
    }),

  updateFolder: (id, data) =>
    request(`/folders/${id}`, {
      method: 'PUT',
      body: data,
    }),

  deleteFolder: (id) =>
    request(`/folders/${id}`, {
      method: 'DELETE',
    }),

  /* =========================
     DOCUMENTS
     ========================= */

  documents: (q = '') =>
    request(`/documents${q}`),

  document: (id) =>
    request(`/documents/${id}`),

  uploadDocument: (fd) =>
    request('/documents', {
      method: 'POST',
      body: fd,
    }),

  updateDocument: (id, data) =>
    request(`/documents/${id}`, {
      method: 'PUT',
      body: data,
    }),

  deleteDocument: (id) =>
    request(`/documents/${id}`, {
      method: 'DELETE',
    }),

  /*
   * Download file using the logged-in user's JWT.
   * This returns a Blob so the browser does not
   * navigate to the file URL.
   */
  downloadFile: async (fileUrl) => {
    const t = token();

    const response = await fetch(
      fileUrl,
      {
        method: 'GET',
        headers: t
          ? {
              Authorization: `Bearer ${t}`,
            }
          : {},
      }
    );

    if (!response.ok) {
      let message =
        'Failed to download the file.';

      try {
        const data =
          await response.json();

        if (data?.message) {
          message = data.message;
        }
      } catch {
        // Response was not JSON
      }

      throw new Error(message);
    }

    return response.blob();
  },

  /* =========================
     ADMIN
     ========================= */

  roles: () =>
    request('/admin/roles'),

  permissions: () =>
    request('/admin/permissions'),

  updateRole: (id, data) =>
    request(`/admin/roles/${id}`, {
      method: 'PUT',
      body: data,
    }),

  settings: () =>
    request('/admin/settings'),

  updateSetting: (data) =>
    request('/admin/settings', {
      method: 'PUT',
      body: data,
    }),

  auditLogs: (q = '') =>
    request(`/admin/audit-logs${q}`),
};