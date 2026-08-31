import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function CategoriesPage() {
  const { user } = useAuth();
  const { push } = useToast();

  const [categories, setCategories] = useState(null);
  const [folders, setFolders] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const canManage =
    user?.isSuperAdmin ||
    user?.role?.name === 'Admin';

  async function load() {
    try {
      const [categoriesData, foldersData] =
        await Promise.all([
          api.categories(),
          api.folders(),
        ]);

      setCategories(
        Array.isArray(categoriesData)
          ? categoriesData
          : []
      );

      setFolders(
        Array.isArray(foldersData)
          ? foldersData
          : []
      );
    } catch (error) {
      push(error.message, 'error');
      setCategories([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createCategory(event) {
    event.preventDefault();

    if (!form.name.trim()) return;

    setSaving(true);

    try {
      await api.createCategory({
        name: form.name.trim(),
        description: form.description.trim(),
      });

      setForm({
        name: '',
        description: '',
      });

      await load();

      push('Category created.');
    } catch (error) {
      push(error.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function removeCategory(id) {
    if (
      !window.confirm(
        'Delete this category? This action cannot be undone.'
      )
    ) {
      return;
    }

    setDeleting(id);

    try {
      await api.deleteCategory(id);

      await load();

      push('Category deleted.');
    } catch (error) {
      push(error.message, 'error');
    } finally {
      setDeleting(null);
    }
  }

  if (!categories) {
    return (
      <div
        style={{
          padding: 30,
          textAlign: 'center',
        }}
      >
        Loading categories...
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
      <div
        style={{
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: '#64748b',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Workspace
        </div>

        <h1
          style={{
            margin: '5px 0',
            fontSize: 26,
          }}
        >
          Categories
        </h1>

        <p
          style={{
            margin: 0,
            color: '#64748b',
            fontSize: 14,
          }}
        >
          Select a category to view its folders and files.
        </p>
      </div>

      {/* Admin create section */}
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
            Create category
          </h3>

          <form
            onSubmit={createCategory}
            style={{
              display: 'grid',
              gap: 12,
            }}
          >
            <input
              value={form.name}
              onChange={(event) =>
                setForm({
                  ...form,
                  name: event.target.value,
                })
              }
              placeholder="Category name"
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '11px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
              }}
            />

            <textarea
              value={form.description}
              onChange={(event) =>
                setForm({
                  ...form,
                  description: event.target.value,
                })
              }
              placeholder="Description"
              rows={3}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '11px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                resize: 'vertical',
              }}
            />

            <button
              type="submit"
              disabled={saving}
              style={{
                width: 'fit-content',
                padding: '10px 16px',
                border: 'none',
                borderRadius: 8,
                background: '#0f766e',
                color: '#fff',
                fontWeight: 600,
                cursor: saving
                  ? 'not-allowed'
                  : 'pointer',
              }}
            >
              {saving
                ? 'Creating...'
                : 'Create category'}
            </button>
          </form>
        </section>
      )}

      {/* Categories */}
      {categories.length === 0 ? (
        <section
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 35,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 42 }}>🏷️</div>

          <h3>No categories available</h3>

          <p
            style={{
              color: '#64748b',
              fontSize: 14,
            }}
          >
            There are currently no categories visible
            to your account.
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
          {categories.map((category) => {
            const categoryFolders = folders.filter(
              (folder) =>
                folder.categoryId === category.id ||
                folder.category?.id === category.id
            );

            return (
              <article
                key={category.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 18,
                }}
              >
                <div
                  style={{
                    fontSize: 34,
                    marginBottom: 10,
                  }}
                >
                  🏷️
                </div>

                <h2
                  style={{
                    margin: '0 0 6px',
                    fontSize: 18,
                  }}
                >
                  {category.name}
                </h2>

                <p
                  style={{
                    color: '#64748b',
                    fontSize: 13,
                    lineHeight: 1.5,
                    minHeight: 40,
                  }}
                >
                  {category.description ||
                    'No description provided.'}
                </p>

                <div
                  style={{
                    color: '#64748b',
                    fontSize: 12,
                    marginBottom: 14,
                  }}
                >
                  {categoryFolders.length}{' '}
                  {categoryFolders.length === 1
                    ? 'folder'
                    : 'folders'}
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                  }}
                >
                  <Link
                    to={`/folders?category=${encodeURIComponent(
                      category.id
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
                    View folders
                  </Link>

                  {canManage && (
                    <button
                      type="button"
                      disabled={
                        deleting === category.id
                      }
                      onClick={() =>
                        removeCategory(category.id)
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
                      {deleting === category.id
                        ? '...'
                        : 'Delete'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}