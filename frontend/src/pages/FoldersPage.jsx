import { useEffect, useMemo, useState } from 'react';
import {
  Link,
  useSearchParams,
} from 'react-router-dom';

import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function FoldersPage() {
  const { user } = useAuth();
  const { push } = useToast();

  const [searchParams] = useSearchParams();

  const categoryId =
    searchParams.get('category');

  const [folders, setFolders] = useState(null);
  const [categories, setCategories] =
    useState([]);

  const [form, setForm] = useState({
    name: '',
    description: '',
    categoryId: categoryId || '',
    accessLevel: 'PUBLIC',
  });

  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const canManage =
    user?.isSuperAdmin ||
    user?.role?.name === 'Admin';

  async function load() {
    try {
      const [foldersData, categoriesData] =
        await Promise.all([
          api.folders(),
          api.categories(),
        ]);

      setFolders(
        Array.isArray(foldersData)
          ? foldersData
          : []
      );

      setCategories(
        Array.isArray(categoriesData)
          ? categoriesData
          : []
      );
    } catch (error) {
      push(error.message, 'error');
      setFolders([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      categoryId: categoryId || '',
    }));
  }, [categoryId]);

  const visibleFolders = useMemo(() => {
    if (!folders) return [];

    if (!categoryId) {
      return folders;
    }

    return folders.filter(
      (folder) =>
        folder.categoryId === categoryId ||
        folder.category?.id === categoryId
    );
  }, [folders, categoryId]);

  const selectedCategory = categories.find(
    (category) => category.id === categoryId
  );

  async function createFolder(event) {
    event.preventDefault();

    if (!form.name.trim() || !form.categoryId) {
      return;
    }

    setCreating(true);

    try {
      await api.createFolder({
        name: form.name.trim(),
        description: form.description.trim(),
        categoryId: form.categoryId,
        accessLevel: form.accessLevel,
      });

      setForm({
        name: '',
        description: '',
        categoryId: categoryId || '',
        accessLevel: 'PUBLIC',
      });

      await load();

      push('Folder created.');
    } catch (error) {
      push(error.message, 'error');
    } finally {
      setCreating(false);
    }
  }

  async function removeFolder(id) {
    if (
      !window.confirm(
        'Delete this folder?'
      )
    ) {
      return;
    }

    setDeleting(id);

    try {
      await api.deleteFolder(id);

      await load();

      push('Folder deleted.');
    } catch (error) {
      push(error.message, 'error');
    } finally {
      setDeleting(null);
    }
  }

  if (!folders) {
    return (
      <div
        style={{
          padding: 30,
          textAlign: 'center',
        }}
      >
        Loading folders...
      </div>
    );
  }

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '24px 20px 40px',
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <Link
          to="/categories"
          style={{
            color: '#64748b',
            textDecoration: 'none',
            fontSize: 13,
          }}
        >
          ← Categories
        </Link>

        <div
          style={{
            marginTop: 18,
            fontSize: 11,
            color: '#64748b',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {selectedCategory
            ? selectedCategory.name
            : 'Workspace'}
        </div>

        <h1
          style={{
            margin: '5px 0',
            fontSize: 26,
          }}
        >
          Folders
        </h1>

        <p
          style={{
            margin: 0,
            color: '#64748b',
            fontSize: 14,
          }}
        >
          Open a folder to see the files inside it.
        </p>
      </div>

      {/* Create folder — Admin/Super Admin only */}
      {canManage && (
        <section
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Create folder
          </h3>

          <form
            onSubmit={createFolder}
            style={{
              display: 'grid',
              gap: 12,
            }}
          >
            <input
              placeholder="Folder name"
              value={form.name}
              onChange={(event) =>
                setForm({
                  ...form,
                  name: event.target.value,
                })
              }
              required
              style={{
                padding: '11px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
              }}
            />

            <select
              value={form.categoryId}
              onChange={(event) =>
                setForm({
                  ...form,
                  categoryId: event.target.value,
                })
              }
              required
              style={{
                padding: '11px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              <option value="">
                Select category
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>

            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(event) =>
                setForm({
                  ...form,
                  description:
                    event.target.value,
                })
              }
              rows={3}
              style={{
                padding: '11px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                resize: 'vertical',
              }}
            />

            <select
              value={form.accessLevel}
              onChange={(event) =>
                setForm({
                  ...form,
                  accessLevel: event.target.value,
                })
              }
              style={{
                padding: '11px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              <option value="PUBLIC">
                Public to permitted users
              </option>
              <option value="RESTRICTED">
                Restricted
              </option>
              <option value="PRIVATE">
                Private
              </option>
            </select>

            <button
              type="submit"
              disabled={
                creating ||
                !form.name.trim() ||
                !form.categoryId
              }
              style={{
                width: 'fit-content',
                padding: '10px 16px',
                border: 'none',
                borderRadius: 8,
                background: '#0f766e',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {creating
                ? 'Creating...'
                : 'Create folder'}
            </button>
          </form>
        </section>
      )}

      {visibleFolders.length === 0 ? (
        <section
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 35,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 45 }}>📁</div>

          <h3>No folders found</h3>

          <p
            style={{
              color: '#64748b',
              fontSize: 14,
            }}
          >
            There are no visible folders in this
            category.
          </p>
        </section>
      ) : (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {visibleFolders.map((folder) => (
            <article
              key={folder.id}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 18,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 34 }}>
                    📁
                  </div>

                  <h2
                    style={{
                      margin: '8px 0 4px',
                      fontSize: 18,
                    }}
                  >
                    {folder.name}
                  </h2>

                  <div
                    style={{
                      color: '#64748b',
                      fontSize: 12,
                    }}
                  >
                    {folder.category?.name ||
                      categories.find(
                        (c) =>
                          c.id === folder.categoryId
                      )?.name ||
                      'Uncategorized'}
                  </div>
                </div>

                <span
                  style={{
                    height: 'fit-content',
                    padding: '4px 9px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    background:
                      folder.accessLevel ===
                      'PUBLIC'
                        ? '#d1fae5'
                        : '#ccfbf1',
                    color:
                      folder.accessLevel ===
                      'PUBLIC'
                        ? '#065f46'
                        : '#0f766e',
                  }}
                >
                  {folder.accessLevel ||
                    'PRIVATE'}
                </span>
              </div>

              <p
                style={{
                  color: '#64748b',
                  fontSize: 13,
                  lineHeight: 1.5,
                  minHeight: 40,
                }}
              >
                {folder.description ||
                  'No description.'}
              </p>

              <div
                style={{
                  color: '#64748b',
                  fontSize: 12,
                  marginBottom: 14,
                }}
              >
                {folder._count?.documents || 0}{' '}
                documents
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                }}
              >
                <Link
                  to={`/documents?folder=${encodeURIComponent(
                    folder.id
                  )}`}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '9px 10px',
                    borderRadius: 8,
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  View files
                </Link>

                {canManage && (
                  <button
                    type="button"
                    disabled={
                      deleting === folder.id
                    }
                    onClick={() =>
                      removeFolder(folder.id)
                    }
                    style={{
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#fee2e2',
                      color: '#b91c1c',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {deleting === folder.id
                      ? '...'
                      : 'Delete'}
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}