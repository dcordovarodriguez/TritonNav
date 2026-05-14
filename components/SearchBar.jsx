export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <label className="search-shell">
      <span className="sr-only">Search campus buildings</span>
      <input
        className="search-input"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
    </label>
  );
}
