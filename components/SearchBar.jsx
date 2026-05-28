export default function SearchBar({
  value,
  onChange,
  onSubmit,
  results = [],
  selectedKey = "",
  onSelectResult,
  placeholder,
  submitLabel = "Preview route"
}) {
  return (
    <div className="search-composer">
      <form
        className="search-shell"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.();
        }}
      >
        <label className="search-field">
          <span className="sr-only">Search campus buildings</span>
          <input
            className="search-input"
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            type="search"
            value={value}
          />
        </label>
        <button className="primary-link action-button search-submit" type="submit">
          {submitLabel}
        </button>
      </form>

      {results.length ? (
        <div className="search-suggestion-list">
          {results.slice(0, 5).map((result) => {
            const resultKey = `${result.buildingId}:${result.room || ""}`;

            return (
              <button
                className={`search-suggestion ${selectedKey === resultKey ? "search-suggestion-active" : ""}`}
                key={result.key}
                onClick={() => onSelectResult?.(result)}
                type="button"
              >
                <span className="search-suggestion-title">
                  {result.name}
                </span>
                <span className="search-suggestion-copy">
                  {result.typeLabel}
                  {result.buildingCode ? ` • ${result.buildingCode}` : ""}
                  {result.room ? ` • room ${result.room}` : ""}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
