"use client";

export default function CampusUtilityRail({
  categories,
  activeCategoryId,
  disabled = false,
  sheetPosition = "expanded",
  onSelectCategory
}) {
  if (!categories?.length) return null;

  function handleSelect(categoryId) {
    if (disabled) return;
    onSelectCategory?.(activeCategoryId === categoryId ? "" : categoryId);
  }

  return (
    <div
      className={`utility-rail-shell utility-rail-shell-${sheetPosition}`}
      aria-label="Campus destination utilities"
    >
      <div className="utility-rail" role="tablist" aria-label="Nearby campus utilities">
        {categories.map((category) => {
          const isActive = activeCategoryId === category.id;

          return (
            <button
              aria-label={category.label}
              aria-selected={isActive}
              className={`utility-rail-item ${isActive ? "utility-rail-item-active" : ""}`}
              disabled={disabled}
              key={category.id}
              onClick={() => handleSelect(category.id)}
              role="tab"
              title={category.description}
              type="button"
            >
              <span className="utility-rail-icon" aria-hidden="true">
                {category.iconLabel}
              </span>
              <span className="utility-rail-label">{category.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
