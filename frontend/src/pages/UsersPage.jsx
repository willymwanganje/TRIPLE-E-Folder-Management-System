import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const groups = {
  Dashboard: [
    'dashboard.view',
  ],

  Documents: [
    'document.view',
    'document.create',
    'document.update',
    'document.delete',
  ],

  Folders: [
    'folder.view',
    'folder.create',
    'folder.update',
    'folder.delete',
  ],

  Users: [
    'user.view',
    'user.create',
    'user.update',
    'user.delete',
  ],

  Administration: [
    'role.manage',
    'category.manage',
    'settings.manage',
    'audit.view',
  ],

  Profile: [
    'profile.update',
  ],
};

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  roleId: '',
};

export default function UsersPage() {
  const { push } = useToast();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [perms, setPerms] = useState([]);

  const [selected, setSelected] = useState(null);
  const [overrides, setOverrides] = useState({});

  const [openCreate, setOpenCreate] =
    useState(false);

  const [openEdit, setOpenEdit] =
    useState(false);

  const [
    showCreatePassword,
    setShowCreatePassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] =
    useState(emptyForm);

  const [editForm, setEditForm] =
    useState({
      fullName: '',
      email: '',
      phone: '',
      roleId: '',
      isActive: true,
    });

  const [editTarget, setEditTarget] =
    useState(null);

  const isSuperAdmin =
    currentUser?.isSuperAdmin === true;

  /*
  |--------------------------------------------------------------------------
  | LOAD USERS / ROLES / PERMISSIONS
  |--------------------------------------------------------------------------
  */

  const load = async () => {
    setLoading(true);

    try {
      const [
        usersData,
        rolesData,
        permissionsData,
      ] = await Promise.all([
        api.users(),
        api.roles(),
        api.permissions(),
      ]);

      setUsers(
        Array.isArray(usersData)
          ? usersData
          : []
      );

      setRoles(
        Array.isArray(rolesData)
          ? rolesData
          : []
      );

      setPerms(
        Array.isArray(
          permissionsData
        )
          ? permissionsData
          : []
      );
    } catch (error) {
      push(
        error.message ||
          'Unable to load users.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | PERMISSION MAP
  |--------------------------------------------------------------------------
  */

  const permissionMap = useMemo(
    () =>
      Object.fromEntries(
        perms.map((permission) => [
          permission.name,
          permission,
        ])
      ),
    [perms]
  );

  /*
  |--------------------------------------------------------------------------
  | SELECT USER
  |--------------------------------------------------------------------------
  */

  async function selectUser(user) {
    setSelected(user);

    try {
      const rows =
        await api.userPermissions(
          user.id
        );

      setOverrides(
        Object.fromEntries(
          rows.map((row) => [
            row.permission.name,
            row.allowed,
          ])
        )
      );
    } catch (error) {
      push(
        error.message ||
          'Unable to load permissions.',
        'error'
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | SAVE USER PERMISSIONS
  |--------------------------------------------------------------------------
  */

  async function saveOverrides() {
    if (!selected) {
      return;
    }

    try {
      const changes =
        Object.entries(
          overrides
        )
          .map(
            ([name, allowed]) => ({
              permissionId:
                permissionMap[name]?.id,
              allowed,
            })
          )
          .filter(
            (item) =>
              item.permissionId
          );

      await api.saveUserPermissions(
        selected.id,
        changes
      );

      push(
        'User permission overrides saved.'
      );
    } catch (error) {
      push(
        error.message ||
          'Unable to save permissions.',
        'error'
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CREATE USER
  |--------------------------------------------------------------------------
  */

  async function create() {
    if (!form.fullName.trim()) {
      push(
        'Full name is required.',
        'error'
      );
      return;
    }

    if (!form.email.trim()) {
      push(
        'Email is required.',
        'error'
      );
      return;
    }

    if (!form.password) {
      push(
        'Password is required.',
        'error'
      );
      return;
    }

    if (!form.roleId) {
      push(
        'Please select a role.',
        'error'
      );
      return;
    }

    setSaving(true);

    try {
      await api.createUser({
        fullName:
          form.fullName.trim(),

        email:
          form.email.trim(),

        phone:
          form.phone.trim(),

        password:
          form.password,

        roleId:
          form.roleId,
      });

      setForm(emptyForm);

      setShowCreatePassword(false);

      setOpenCreate(false);

      await load();

      push(
        'User created successfully.'
      );
    } catch (error) {
      push(
        error.message ||
          'Unable to create user.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | OPEN EDIT
  |--------------------------------------------------------------------------
  */

  function openEditUser(user) {
    if (!isSuperAdmin) {
      push(
        'Only the Super Admin can edit users.',
        'error'
      );
      return;
    }

    setEditTarget(user);

    setEditForm({
      fullName:
        user.fullName || '',

      email:
        user.email || '',

      phone:
        user.phone || '',

      roleId:
        user.roleId || '',

      isActive:
        Boolean(user.isActive),
    });

    setOpenEdit(true);
  }

  /*
  |--------------------------------------------------------------------------
  | SAVE EDIT
  |--------------------------------------------------------------------------
  */

  async function saveEdit() {
    if (!editTarget) {
      return;
    }

    if (!editForm.fullName.trim()) {
      push(
        'Full name is required.',
        'error'
      );
      return;
    }

    if (!editForm.email.trim()) {
      push(
        'Email is required.',
        'error'
      );
      return;
    }

    if (!editForm.roleId) {
      push(
        'Please select a role.',
        'error'
      );
      return;
    }

    setSaving(true);

    try {
      await api.updateUser(
        editTarget.id,
        {
          fullName:
            editForm.fullName.trim(),

          email:
            editForm.email.trim(),

          phone:
            editForm.phone.trim(),

          roleId:
            editForm.roleId,

          isActive:
            editForm.isActive,
        }
      );

      setOpenEdit(false);
      setEditTarget(null);

      if (
        selected?.id ===
        editTarget.id
      ) {
        setSelected(null);
      }

      await load();

      push(
        'User updated successfully.'
      );
    } catch (error) {
      push(
        error.message ||
          'Unable to update user.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | ENABLE / DISABLE
  |--------------------------------------------------------------------------
  */

  async function toggle(user) {
    if (!isSuperAdmin) {
      push(
        'Only the Super Admin can change user status.',
        'error'
      );
      return;
    }

    if (user.isSuperAdmin) {
      push(
        'The Super Admin account is protected.',
        'error'
      );
      return;
    }

    try {
      await api.updateUser(
        user.id,
        {
          isActive:
            !user.isActive,
        }
      );

      await load();

      push(
        user.isActive
          ? 'User disabled.'
          : 'User enabled.'
      );
    } catch (error) {
      push(
        error.message ||
          'Unable to change user status.',
        'error'
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  async function del(user) {
    if (!isSuperAdmin) {
      push(
        'Only the Super Admin can delete users.',
        'error'
      );
      return;
    }

    if (
      user.id ===
      currentUser?.id
    ) {
      push(
        'You cannot delete your own account.',
        'error'
      );
      return;
    }

    if (user.isSuperAdmin) {
      push(
        'The Super Admin account cannot be deleted.',
        'error'
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Delete ${user.fullName}? This action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      await api.deleteUser(
        user.id
      );

      if (
        selected?.id ===
        user.id
      ) {
        setSelected(null);
      }

      await load();

      push(
        'User deleted successfully.'
      );
    } catch (error) {
      push(
        error.message ||
          'Unable to delete user.',
        'error'
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>
            Users & Access
          </h1>

          <div className="subtle">
            Create accounts and control
            access without touching code.
          </div>
        </div>

        {isSuperAdmin && (
          <button
            className="btn btn-primary"
            onClick={() =>
              setOpenCreate(true)
            }
          >
            + Create user
          </button>
        )}
      </div>

      {!isSuperAdmin && (
        <div
          className="card"
          style={{
            padding: 14,
            marginBottom: 15,
          }}
        >
          <strong>
            View-only access
          </strong>

          <div
            className="subtle"
            style={{
              marginTop: 4,
            }}
          >
            Only the Super Admin can
            create, edit, enable/disable,
            or delete user accounts.
          </div>
        </div>
      )}

      <div className="grid-3">
        <section
          className="card table-wrap"
          style={{
            gridColumn:
              'span 2',
          }}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  User
                </th>

                <th>
                  Role
                </th>

                <th>
                  Status
                </th>

                <th>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {users.map(
                (user) => (
                  <tr
                    key={
                      user.id
                    }
                  >
                    <td>
                      <div
                        style={{
                          fontWeight: 850,
                        }}
                      >
                        {
                          user.fullName
                        }
                      </div>

                      <div
                        className="subtle"
                        style={{
                          fontSize: 12,
                        }}
                      >
                        {
                          user.email
                        }
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-teal">
                        {user.isSuperAdmin
                          ? 'Super Admin'
                          : user.role
                              ?.name ||
                            'No role'}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          user.isActive
                            ? 'badge-green'
                            : 'badge-red'
                        }`}
                      >
                        {user.isActive
                          ? 'Active'
                          : 'Inactive'}
                      </span>
                    </td>

                    <td>
                      <div
                        style={{
                          display:
                            'flex',
                          gap: 6,
                          flexWrap:
                            'wrap',
                        }}
                      >
                        <button
                          className="btn btn-light btn-sm"
                          onClick={() =>
                            selectUser(
                              user
                            )
                          }
                        >
                          Permissions
                        </button>

                        {isSuperAdmin &&
                          !user.isSuperAdmin && (
                            <>
                              <button
                                className="btn btn-light btn-sm"
                                onClick={() =>
                                  openEditUser(
                                    user
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                className="btn btn-light btn-sm"
                                onClick={() =>
                                  toggle(
                                    user
                                  )
                                }
                              >
                                {user.isActive
                                  ? 'Disable'
                                  : 'Enable'}
                              </button>

                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() =>
                                  del(
                                    user
                                  )
                                }
                              >
                                Delete
                              </button>
                            </>
                          )}

                        {isSuperAdmin &&
                          user.isSuperAdmin &&
                          user.id ===
                            currentUser?.id && (
                            <button
                              className="btn btn-light btn-sm"
                              onClick={() =>
                                openEditUser(
                                  user
                                )
                              }
                            >
                              Edit
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                )
              )}

              {users.length ===
                0 &&
                !loading && (
                  <tr>
                    <td
                      colSpan="4"
                      style={{
                        textAlign:
                          'center',
                        padding: 30,
                      }}
                    >
                      No users found.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </section>

        <section
          className="card"
          style={{
            padding: 20,
          }}
        >
          <h3>
            Access model
          </h3>

          <div className="admin-list">
            <div>
              <b>
                Super Admin
              </b>

              <div
                className="subtle"
                style={{
                  fontSize: 12,
                }}
              >
                Master access to all
                system controls,
                including user
                management.
              </div>
            </div>

            <div>
              <b>
                Admin
              </b>

              <div
                className="subtle"
                style={{
                  fontSize: 12,
                }}
              >
                Operational folders
                and documents.
              </div>
            </div>

            <div>
              <b>
                User
              </b>

              <div
                className="subtle"
                style={{
                  fontSize: 12,
                }}
              >
                Allowed content +
                own document
                management.
              </div>
            </div>
          </div>
        </section>
      </div>

      {selected && (
        <section
          className="card"
          style={{
            padding: 22,
            marginTop: 15,
          }}
        >
          <div
            className="page-head"
            style={{
              marginBottom: 14,
            }}
          >
            <div>
              <h2
                style={{
                  marginBottom: 4,
                }}
              >
                Permission overrides:{' '}
                {
                  selected.fullName
                }
              </h2>

              <div className="subtle">
                Role:{' '}
                {selected.role
                  ?.name ||
                  'No role'}
                . Explicit overrides
                take precedence over
                the role.
              </div>
            </div>

            <div
              style={{
                display:
                  'flex',
                gap: 8,
              }}
            >
              <button
                className="btn btn-light"
                onClick={() =>
                  setSelected(
                    null
                  )
                }
              >
                Close
              </button>

              {!selected.isSuperAdmin && (
                <button
                  className="btn btn-primary"
                  onClick={
                    saveOverrides
                  }
                >
                  Save permissions
                </button>
              )}
            </div>
          </div>

          {selected.isSuperAdmin ? (
            <div
              className="subtle"
              style={{
                padding: 12,
              }}
            >
              Super Admin automatically
              has all permissions.
              Direct permission
              overrides are not
              required.
            </div>
          ) : (
            <div>
              {Object.entries(
                groups
              ).map(
                ([
                  group,
                  names,
                ]) => (
                  <div
                    key={group}
                    style={{
                      marginBottom: 18,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 14,
                      }}
                    >
                      {group}
                    </h3>

                    <div className="check-grid">
                      {names.map(
                        (name) => (
                          <label
                            key={name}
                            className="check-item"
                          >
                            <input
                              type="checkbox"
                              checked={
                                overrides[
                                  name
                                ] ??
                                false
                              }
                              onChange={(
                                event
                              ) =>
                                setOverrides(
                                  {
                                    ...overrides,
                                    [name]:
                                      event
                                        .target
                                        .checked,
                                  }
                                )
                              }
                            />

                            <span>
                              {name}
                            </span>
                          </label>
                        )
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      )}

      <Modal
        open={openCreate}
        title="Create user"
        onClose={() => {
          if (!saving) {
            setOpenCreate(
              false
            );
          }
        }}
      >
        <div
          style={{
            display:
              'grid',
            gap: 12,
          }}
        >
          <label>
            Full name

            <input
              value={
                form.fullName
              }
              onChange={(
                event
              ) =>
                setForm({
                  ...form,
                  fullName:
                    event.target
                      .value,
                })
              }
              disabled={saving}
            />
          </label>

          <label>
            Email

            <input
              type="email"
              value={
                form.email
              }
              onChange={(
                event
              ) =>
                setForm({
                  ...form,
                  email:
                    event.target
                      .value,
                })
              }
              disabled={saving}
            />
          </label>

          <label>
            Phone

            <input
              value={
                form.phone
              }
              onChange={(
                event
              ) =>
                setForm({
                  ...form,
                  phone:
                    event.target
                      .value,
                })
              }
              disabled={saving}
            />
          </label>

          <label>
            Temporary password

            <div
              style={{
                position:
                  'relative',
              }}
            >
              <input
                type={
                  showCreatePassword
                    ? 'text'
                    : 'password'
                }
                value={
                  form.password
                }
                onChange={(
                  event
                ) =>
                  setForm({
                    ...form,
                    password:
                      event.target
                        .value,
                  })
                }
                disabled={
                  saving
                }
                style={{
                  width:
                    '100%',
                  paddingRight:
                    48,
                  boxSizing:
                    'border-box',
                }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowCreatePassword(
                    (value) =>
                      !value
                  )
                }
                disabled={
                  saving
                }
                aria-label={
                  showCreatePassword
                    ? 'Hide password'
                    : 'Show password'
                }
                style={{
                  position:
                    'absolute',
                  right: 8,
                  top:
                    '50%',
                  transform:
                    'translateY(-50%)',
                  border:
                    'none',
                  background:
                    'transparent',
                  cursor:
                    'pointer',
                  fontSize:
                    18,
                  padding: 4,
                }}
              >
                {showCreatePassword
                  ? '🙈'
                  : '👁️'}
              </button>
            </div>
          </label>

          <label>
            Role

            <select
              value={
                form.roleId
              }
              onChange={(
                event
              ) =>
                setForm({
                  ...form,
                  roleId:
                    event.target
                      .value,
                })
              }
              disabled={
                saving
              }
            >
              <option value="">
                Select role
              </option>

              {roles
                .filter(
                  (role) =>
                    role.name !==
                    'Super Admin'
                )
                .map(
                  (role) => (
                    <option
                      key={
                        role.id
                      }
                      value={
                        role.id
                      }
                    >
                      {
                        role.name
                      }
                    </option>
                  )
                )}
            </select>
          </label>

          <button
            className="btn btn-primary"
            onClick={create}
            disabled={saving}
          >
            {saving
              ? 'Creating...'
              : 'Create account'}
          </button>
        </div>
      </Modal>

      <Modal
        open={openEdit}
        title={
          editTarget
            ? `Edit user: ${editTarget.fullName}`
            : 'Edit user'
        }
        onClose={() => {
          if (!saving) {
            setOpenEdit(false);
            setEditTarget(
              null
            );
          }
        }}
      >
        <div
          style={{
            display:
              'grid',
            gap: 12,
          }}
        >
          <label>
            Full name

            <input
              value={
                editForm.fullName
              }
              onChange={(
                event
              ) =>
                setEditForm({
                  ...editForm,
                  fullName:
                    event.target
                      .value,
                })
              }
              disabled={
                saving
              }
            />
          </label>

          <label>
            Email

            <input
              type="email"
              value={
                editForm.email
              }
              onChange={(
                event
              ) =>
                setEditForm({
                  ...editForm,
                  email:
                    event.target
                      .value,
                })
              }
              disabled={
                saving
              }
            />
          </label>

          <label>
            Phone

            <input
              value={
                editForm.phone
              }
              onChange={(
                event
              ) =>
                setEditForm({
                  ...editForm,
                  phone:
                    event.target
                      .value,
                })
              }
              disabled={
                saving
              }
            />
          </label>

          <label>
            Role

            <select
              value={
                editForm.roleId
              }
              onChange={(
                event
              ) =>
                setEditForm({
                  ...editForm,
                  roleId:
                    event.target
                      .value,
                })
              }
              disabled={
                saving
              }
            >
              <option value="">
                Select role
              </option>

              {roles
                .filter(
                  (role) =>
                    role.name !==
                      'Super Admin' ||
                    editTarget?.isSuperAdmin
                )
                .map(
                  (role) => (
                    <option
                      key={
                        role.id
                      }
                      value={
                        role.id
                      }
                    >
                      {
                        role.name
                      }
                    </option>
                  )
                )}
            </select>
          </label>

          <label
            style={{
              display:
                'flex',
              alignItems:
                'center',
              gap: 8,
              cursor:
                'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={
                editForm.isActive
              }
              onChange={(
                event
              ) =>
                setEditForm({
                  ...editForm,
                  isActive:
                    event.target
                      .checked,
                })
              }
              disabled={
                saving ||
                editTarget?.isSuperAdmin
              }
            />

            <span>
              Account active
            </span>
          </label>

          <div
            style={{
              display:
                'flex',
              gap: 8,
              marginTop: 4,
            }}
          >
            <button
              className="btn btn-primary"
              onClick={
                saveEdit
              }
              disabled={
                saving
              }
            >
              {saving
                ? 'Saving...'
                : 'Save changes'}
            </button>

            <button
              className="btn btn-light"
              onClick={() => {
                setOpenEdit(
                  false
                );
                setEditTarget(
                  null
                );
              }}
              disabled={
                saving
              }
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}