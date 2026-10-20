import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

const emptyProduct = {
  id: '',
  name: '',
  price: '',
  old: '',
  save: '',
  image: '',
  tag: '',
  description: '',
  storage: '',
  categoryId: '',
};

const emptyCategory = { id: '', name: '', image: '' };

function editableProduct(product) {
  return {
    ...product,
    price: String(product.price),
    old: String(product.old),
  };
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function AdminDashboardPage({
  currentUser,
  authReady,
  onUserChange,
  onCatalogChange,
}) {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [editingProduct, setEditingProduct] = useState(false);
  const [editingCategory, setEditingCategory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  async function loadAdminCatalog() {
    setError('');
    try {
      const [productData, categoryData] = await Promise.all([
        api.adminProducts(),
        api.adminCategories(),
      ]);
      setProducts(productData.products);
      setCategories(categoryData.categories);
      setProductForm((form) => ({
        ...form,
        categoryId: form.categoryId || categoryData.categories[0]?.id || '',
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (currentUser?.role === 'admin') loadAdminCatalog();
  }, [currentUser]);

  function resetProductForm() {
    setProductForm({ ...emptyProduct, categoryId: categories[0]?.id ?? '' });
    setEditingProduct(false);
  }

  function resetCategoryForm() {
    setCategoryForm(emptyCategory);
    setEditingCategory(false);
  }

  async function finishChange(successMessage) {
    await loadAdminCatalog();
    await onCatalogChange();
    setMessage(successMessage);
    setError('');
  }

  async function saveProduct(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    const product = {
      ...productForm,
      id: productForm.id.trim(),
      name: productForm.name.trim(),
      price: Number(productForm.price),
      old: Number(productForm.old),
      save: productForm.save.trim(),
      image: productForm.image.trim(),
      tag: productForm.tag.trim(),
      description: productForm.description.trim(),
      storage: productForm.storage.trim(),
      categoryId: productForm.categoryId,
    };
    try {
      if (editingProduct) {
        await api.updateProduct(product.id, product);
      } else {
        await api.createProduct(product);
      }
      resetProductForm();
      await finishChange(editingProduct ? 'Product updated.' : 'Product created.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.deleteProduct(product.id);
      if (productForm.id === product.id) resetProductForm();
      await finishChange('Product deleted.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveCategory(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    const category = {
      ...categoryForm,
      id: categoryForm.id.trim(),
      name: categoryForm.name.trim(),
      image: categoryForm.image.trim(),
    };
    try {
      if (editingCategory) {
        await api.updateCategory(category.id, category);
      } else {
        await api.createCategory(category);
      }
      resetCategoryForm();
      await finishChange(editingCategory ? 'Category updated.' : 'Category created.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteCategory(category) {
    if (!window.confirm(`Delete ${category.name}?`)) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.deleteCategory(category.id);
      if (categoryForm.id === category.id) resetCategoryForm();
      await finishChange('Category deleted.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function signIn(event) {
    event.preventDefault();
    setError('');
    setSigningIn(true);
    try {
      const result = await api.login({ email, password });
      onUserChange(result.user);
      setPassword('');
      if (result.user.role !== 'admin') {
        setError('This account does not have administrator access.');
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSigningIn(false);
    }
  }

  if (!authReady) {
    return <main className="container flow-page"><h1>Loading admin dashboard…</h1></main>;
  }
  if (!currentUser) {
    return (
      <main className="container admin-page">
        <div className="breadcrumbs">
          <Link to="/">Home</Link><span>/</span><span>Admin dashboard</span>
        </div>
        <section className="admin-login-panel account-panel">
          <p className="eyebrow">MEGAMART ADMINISTRATION</p>
          <h1>Sign in to manage your catalog</h1>
          <p className="admin-login-description">
            Use your administrator account to manage products and categories.
          </p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <form className="admin-login-form" onSubmit={signIn}>
            <label>
              Email
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={signingIn}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={signingIn}
              />
            </label>
            <button className="primary-link-button" type="submit" disabled={signingIn}>
              {signingIn ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <Link className="admin-account-link" to="/account">Go to customer account</Link>
        </section>
      </main>
    );
  }
  if (currentUser.role !== 'admin') {
    return (
      <main className="container admin-page">
        <div className="admin-access-denied">
          <p className="eyebrow">ADMIN ACCESS</p>
          <h1>You don’t have permission to manage the catalog.</h1>
          <Link className="primary-link-button" to="/">Return to MegaMart</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container admin-page">
      <div className="breadcrumbs">
        <Link to="/">Home</Link><span>/</span><span>Admin dashboard</span>
      </div>
      <header className="admin-heading">
        <div>
          <p className="eyebrow">MEGAMART ADMINISTRATION</p>
          <h1>Catalog dashboard</h1>
          <p>Manage the products and categories shown in your storefront.</p>
        </div>
        <Link to="/products">View storefront</Link>
      </header>

      <nav className="admin-tabs" aria-label="Catalog management">
        <button
          type="button"
          className={activeTab === 'products' ? 'active' : ''}
          onClick={() => { setActiveTab('products'); setError(''); setMessage(''); }}
        >
          Products <span>{products.length}</span>
        </button>
        <button
          type="button"
          className={activeTab === 'categories' ? 'active' : ''}
          onClick={() => { setActiveTab('categories'); setError(''); setMessage(''); }}
        >
          Categories <span>{categories.length}</span>
        </button>
      </nav>

      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="form-success" role="status">{message}</p>}
      {loading ? (
        <p className="admin-loading">Loading catalog…</p>
      ) : activeTab === 'products' ? (
        <div className="admin-content">
          <section className="account-panel admin-form-panel">
            <div className="account-panel-heading">
              <h2>{editingProduct ? 'Edit product' : 'Add a product'}</h2>
              {editingProduct && <button type="button" onClick={resetProductForm}>Cancel edit</button>}
            </div>
            <form className="admin-form" onSubmit={saveProduct}>
              <label>
                Product ID
                <input
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  title="Use lowercase letters, numbers, and hyphens."
                  value={productForm.id}
                  disabled={busy || editingProduct}
                  onChange={(event) => setProductForm({ ...productForm, id: event.target.value })}
                  placeholder="e.g. galaxy-s24"
                />
              </label>
              <label>
                Product name
                <input required maxLength={160} value={productForm.name} disabled={busy}
                  onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}
                  onBlur={() => {
                    if (!editingProduct && !productForm.id) {
                      setProductForm((form) => ({ ...form, id: slugify(form.name) }));
                    }
                  }}
                />
              </label>
              <label>
                Price (₹)
                <input required type="number" min="0" step="1" value={productForm.price} disabled={busy}
                  onChange={(event) => setProductForm({ ...productForm, price: event.target.value })}
                />
              </label>
              <label>
                Previous price (₹)
                <input required type="number" min="0" step="1" value={productForm.old} disabled={busy}
                  onChange={(event) => setProductForm({ ...productForm, old: event.target.value })}
                />
              </label>
              <label>
                Savings label
                <input required maxLength={40} value={productForm.save} disabled={busy}
                  onChange={(event) => setProductForm({ ...productForm, save: event.target.value })}
                  placeholder="e.g. ₹5,000"
                />
              </label>
              <label>
                Badge
                <input required maxLength={40} value={productForm.tag} disabled={busy}
                  onChange={(event) => setProductForm({ ...productForm, tag: event.target.value })}
                  placeholder="e.g. 20% OFF"
                />
              </label>
              <label>
                Image URL
                <input required type="url" value={productForm.image} disabled={busy}
                  onChange={(event) => setProductForm({ ...productForm, image: event.target.value })}
                  placeholder="https://…"
                />
              </label>
              <label>
                Category
                <select required value={productForm.categoryId} disabled={busy || !categories.length}
                  onChange={(event) => setProductForm({ ...productForm, categoryId: event.target.value })}
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Storage / variant
                <input required maxLength={80} value={productForm.storage} disabled={busy}
                  onChange={(event) => setProductForm({ ...productForm, storage: event.target.value })}
                  placeholder="e.g. 128 GB"
                />
              </label>
              <label className="admin-form-wide">
                Description
                <textarea required maxLength={2000} rows={4} value={productForm.description} disabled={busy}
                  onChange={(event) => setProductForm({ ...productForm, description: event.target.value })}
                />
              </label>
              <div className="admin-form-actions admin-form-wide">
                <button className="primary-link-button" type="submit" disabled={busy || !categories.length}>
                  {busy ? 'Saving…' : editingProduct ? 'Save product' : 'Add product'}
                </button>
                {!categories.length && <span>Create a category before adding products.</span>}
              </div>
            </form>
          </section>
          <section className="account-panel admin-list-panel">
            <div className="account-panel-heading"><h2>Products</h2><span>{products.length} total</span></div>
            {products.length ? (
              <div className="admin-record-list">
                {products.map((product) => (
                  <article className="admin-record" key={product.id}>
                    <img src={product.image} alt="" />
                    <div className="admin-record-info">
                      <strong>{product.name}</strong>
                      <span>{categories.find((category) => category.id === product.categoryId)?.name ?? 'Unknown category'} · ₹{product.price.toLocaleString('en-IN')}</span>
                    </div>
                    <button type="button" disabled={busy} onClick={() => {
                      setProductForm(editableProduct(product));
                      setEditingProduct(true);
                      setError('');
                    }}>Edit</button>
                    <button type="button" className="admin-delete" disabled={busy} onClick={() => deleteProduct(product)}>Delete</button>
                  </article>
                ))}
              </div>
            ) : <p className="admin-empty">No products yet. Add your first product above.</p>}
          </section>
        </div>
      ) : (
        <div className="admin-content">
          <section className="account-panel admin-form-panel">
            <div className="account-panel-heading">
              <h2>{editingCategory ? 'Edit category' : 'Add a category'}</h2>
              {editingCategory && <button type="button" onClick={resetCategoryForm}>Cancel edit</button>}
            </div>
            <form className="admin-form admin-category-form" onSubmit={saveCategory}>
              <label>
                Category ID
                <input required pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  title="Use lowercase letters, numbers, and hyphens."
                  value={categoryForm.id} disabled={busy || editingCategory}
                  onChange={(event) => setCategoryForm({ ...categoryForm, id: event.target.value })}
                  placeholder="e.g. home-kitchen"
                />
              </label>
              <label>
                Category name
                <input required maxLength={80} value={categoryForm.name} disabled={busy}
                  onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
                  onBlur={() => {
                    if (!editingCategory && !categoryForm.id) {
                      setCategoryForm((form) => ({ ...form, id: slugify(form.name) }));
                    }
                  }}
                />
              </label>
              <label className="admin-form-wide">
                Image URL
                <input required type="url" value={categoryForm.image} disabled={busy}
                  onChange={(event) => setCategoryForm({ ...categoryForm, image: event.target.value })}
                  placeholder="https://…"
                />
              </label>
              <div className="admin-form-actions admin-form-wide">
                <button className="primary-link-button" type="submit" disabled={busy}>
                  {busy ? 'Saving…' : editingCategory ? 'Save category' : 'Add category'}
                </button>
              </div>
            </form>
          </section>
          <section className="account-panel admin-list-panel">
            <div className="account-panel-heading"><h2>Categories</h2><span>{categories.length} total</span></div>
            {categories.length ? (
              <div className="admin-record-list">
                {categories.map((category) => (
                  <article className="admin-record" key={category.id}>
                    <img src={category.image} alt="" />
                    <div className="admin-record-info">
                      <strong>{category.name}</strong>
                      <span>{products.filter((product) => product.categoryId === category.id).length} products</span>
                    </div>
                    <button type="button" disabled={busy} onClick={() => {
                      setCategoryForm(category);
                      setEditingCategory(true);
                      setError('');
                    }}>Edit</button>
                    <button type="button" className="admin-delete" disabled={busy} onClick={() => deleteCategory(category)}>Delete</button>
                  </article>
                ))}
              </div>
            ) : <p className="admin-empty">No categories yet.</p>}
          </section>
        </div>
      )}
    </main>
  );
}
