import { useState } from 'react';
import {
  ChevronDown,
  ListFilter,
  MapPin,
  Menu,
  Search,
  ShoppingCart,
  Tag,
  Truck,
  UserRound,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { products } from '../data/storeData.js';

const navigationItems = [
  'Groceries',
  'Premium Fruits',
  'Home & Kitchen',
  'Fashion',
  'Electronics',
  'Beauty',
  'Home Improvement',
  'Sports, Toys & Luggage',
];

export default function Header({ cartCount, currentUser, onCart }) {
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [mobileNav, setMobileNav] = useState(false);
  const navigate = useNavigate();
  const query = search.trim().toLowerCase();
  const suggestions = query
    ? products
        .filter((product) => product.name.toLowerCase().includes(query))
        .slice(0, 5)
    : [];
  const showSuggestions = searchFocused && query;

  function handleSearch(event) {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products');
    setSearchFocused(false);
    setActiveSuggestion(-1);
    setMobileNav(false);
  }

  function selectSuggestion(product) {
    navigate(`/products/${product.id}`);
    setSearch('');
    setSearchFocused(true);
    setActiveSuggestion(-1);
  }

  function handleSearchKeyDown(event) {
    if (event.key === 'Escape') {
      setSearchFocused(false);
      setActiveSuggestion(-1);
      return;
    }

    if (!suggestions.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSuggestion((current) => (current + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestion(
        (current) => (current <= 0 ? suggestions.length - 1 : current - 1),
      );
    } else if (event.key === 'Enter' && activeSuggestion >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeSuggestion]);
    }
  }

  return (
    <>
      <div className="top-strip">
        <div className="container top-inner">
          <span>Welcome to worldwide Megamart!</span>
          <div>
            <span>
              <MapPin /> Deliver to <b>423651</b>
            </span>
            <span>
              <Truck /> Track your order
            </span>
            <span>
              <Tag /> All Offers
            </span>
          </div>
        </div>
      </div>
      <header className="main-header container">
        <button
          className="menu-button icon-button"
          aria-label="Toggle navigation"
          onClick={() => setMobileNav(!mobileNav)}
        >
          <Menu />
        </button>
        <Link className="brand" to="/">
          <span className="brand-mark">≋</span>
          <strong>MegaMart</strong>
        </Link>
        <div
          className="search-area"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setSearchFocused(false);
              setActiveSuggestion(-1);
            }
          }}
        >
          <form className="search-box" onSubmit={handleSearch}>
            <Search />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setActiveSuggestion(-1);
              }}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={handleSearchKeyDown}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={Boolean(showSuggestions)}
              aria-controls="search-suggestions"
              aria-activedescendant={
                activeSuggestion >= 0
                  ? `search-suggestion-${suggestions[activeSuggestion]?.id}`
                  : undefined
              }
              placeholder="Search essentials, groceries and more..."
            />
            <button aria-label="Search">
              <ListFilter />
            </button>
          </form>
          {showSuggestions && (
            <div
              className="search-suggestions"
              id="search-suggestions"
            >
              {suggestions.length ? (
                <div role="listbox" aria-label="Product suggestions">
                  {suggestions.map((product, index) => (
                    <Link
                      className={`search-suggestion ${
                        index === activeSuggestion ? 'is-active' : ''
                      }`}
                      id={`search-suggestion-${product.id}`}
                      key={product.id}
                      role="option"
                      aria-selected={index === activeSuggestion}
                      to={`/products/${product.id}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={(event) => {
                        event.preventDefault();
                        selectSuggestion(product);
                      }}
                    >
                      <img src={product.image} alt="" />
                      <span>{product.name}</span>
                      <strong>₹{product.price.toLocaleString('en-IN')}</strong>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="search-no-suggestions">No matching products found.</p>
              )}
              <button className="search-all-results" onClick={handleSearch}>
                Search for “{search.trim()}”
              </button>
            </div>
          )}
        </div>
        <div className="header-actions">
          <Link className="action-link" to="/account">
            <UserRound />
            <span>{currentUser ? currentUser.name : 'Sign Up/Sign In'}</span>
          </Link>
          <i />
          <button className="action-link" onClick={onCart}>
            <ShoppingCart />
            <span>Cart</span>
            {cartCount > 0 && <b className="cart-count">{cartCount}</b>}
          </button>
        </div>
      </header>
      <nav className={`category-nav ${mobileNav ? 'is-open' : ''}`}>
        <div className="container nav-inner">
          {navigationItems.map((item, index) => (
            <Link
              className={`nav-pill ${index === 0 ? 'active' : ''}`}
              key={item}
              to="/products"
              onClick={() => setMobileNav(false)}
            >
              {item}
              {index !== 0 && <ChevronDown />}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
