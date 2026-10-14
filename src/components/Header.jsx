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
  const [mobileNav, setMobileNav] = useState(false);
  const navigate = useNavigate();

  function handleSearch(event) {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products');
    setMobileNav(false);
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
        <form className="search-box" onSubmit={handleSearch}>
          <Search />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search essentials, groceries and more..."
          />
          <button aria-label="Search">
            <ListFilter />
          </button>
        </form>
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
