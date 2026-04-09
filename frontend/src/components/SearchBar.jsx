import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { BsSearch, BsXLg } from 'react-icons/bs';
import { setSearchQuery } from '../redux/productsSlice';

// Turkish-aware lowercase (stable - outside component)
const toLower = (str) =>
  str
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/Ş/g, 'ş')
    .replace(/Ç/g, 'ç')
    .replace(/Ü/g, 'ü')
    .replace(/Ö/g, 'ö')
    .replace(/Ğ/g, 'ğ')
    .toLowerCase();

function SearchBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { items, searchQuery } = useSelector((state) => state.products);

  const [inputValue, setInputValue] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  // Compute suggestions from the product list
  const suggestions = useMemo(() => {
    if (!inputValue || inputValue.trim().length < 1) return [];
    const q = toLower(inputValue.trim());
    const matched = items
      .filter((p) => {
        const name = toLower(p.product_name || '');
        const category = toLower(p.category_name || '');
        return name.includes(q) || category.includes(q);
      })
      .slice(0, 8); // max 8 suggestions
    return matched;
  }, [inputValue, items]);

  // Debounced dispatch to Redux
  const dispatchSearch = useCallback(
    (value) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        dispatch(setSearchQuery(value));
        // Navigate to home if not already there
        if (value && location.pathname !== '/') {
          navigate('/');
        }
      }, 150);
    },
    [dispatch, navigate, location.pathname]
  );

  const handleChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setHighlightIndex(-1);
    dispatchSearch(val);
  };

  const handleClear = () => {
    setInputValue('');
    setHighlightIndex(-1);
    dispatch(setSearchQuery(''));
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (product) => {
    setInputValue(product.product_name);
    dispatch(setSearchQuery(product.product_name));
    setIsFocused(false);
    navigate(`/product/${product.product_id}`);
  };

  const handleKeyDown = (e) => {
    if (!suggestions.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
        handleSuggestionClick(suggestions[highlightIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && dropdownRef.current) {
      const el = dropdownRef.current.children[highlightIndex];
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync external searchQuery changes (e.g. navigation)
  useEffect(() => {
    if (searchQuery !== inputValue) {
      setInputValue(searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Highlight matching text in suggestion
  const highlightText = (text, query) => {
    if (!query) return text;
    const q = toLower(query.trim());
    const tLower = toLower(text);
    const idx = tLower.indexOf(q);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <strong className="search-highlight">{text.slice(idx, idx + query.trim().length)}</strong>
        {text.slice(idx + query.trim().length)}
      </>
    );
  };

  const showDropdown = isFocused && inputValue.trim().length >= 1 && suggestions.length > 0;

  return (
    <div className="header-search-wrapper">
      <div className="header-search-bar">
        <BsSearch className="header-search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="header-search-input"
          placeholder="Ürün ara..."
          value={inputValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
        {inputValue && (
          <button className="header-search-clear" onClick={handleClear} type="button">
            <BsXLg size={12} />
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {showDropdown && (
        <div className="search-suggestions-dropdown" ref={dropdownRef}>
          {suggestions.map((product, index) => (
            <div
              key={product.product_id}
              className={`search-suggestion-item ${index === highlightIndex ? 'highlighted' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSuggestionClick(product);
              }}
              onMouseEnter={() => setHighlightIndex(index)}
            >
              <img
                src={product.imageurl}
                alt={product.product_name}
                className="search-suggestion-img"
              />
              <div className="search-suggestion-info">
                <span className="search-suggestion-name">
                  {highlightText(product.product_name, inputValue)}
                </span>
                <span className="search-suggestion-meta">
                  {product.category_name}
                  {' · '}
                  {parseFloat(product.default_price).toFixed(2)} {product.currency_code}
                </span>
              </div>
            </div>
          ))}
          {inputValue.trim().length >= 1 && (
            <div className="search-suggestion-footer">
              {suggestions.length} ürün bulundu
            </div>
          )}
        </div>
      )}

      {/* No results message */}
      {isFocused && inputValue.trim().length >= 1 && suggestions.length === 0 && items.length > 0 && (
        <div className="search-suggestions-dropdown" ref={dropdownRef}>
          <div className="search-no-results">
            Sonuç bulunamadı
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchBar;


