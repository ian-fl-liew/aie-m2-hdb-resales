import { useState } from "react";
import { TOWNS, FLAT_TYPES, STOREY_RANGES, FLAT_MODELS } from "../utils/hdb";
import { titleCase } from "../utils/format";
import { validateListing } from "../utils/validation";

/**
 * Controlled form shared by "Create listing" and "Edit listing".
 *
 * Validation runs on submit and again on every change once a field has been
 * touched, so the user is not scolded for an empty field they have not
 * reached yet.
 *
 * @param {object}   [initialValues] pre-fill for editing
 * @param {function} onSubmit        receives the cleaned listing values
 * @param {boolean}  submitting
 * @param {string}   submitLabel
 */
function ListingForm({
  initialValues,
  onSubmit,
  submitting,
  submitLabel = "Publish listing",
}) {
  const [values, setValues] = useState({
    title: "",
    town: "",
    flatType: "",
    block: "",
    streetName: "",
    storeyRange: "",
    floorAreaSqm: "",
    flatModel: "",
    leaseCommenceYear: "",
    price: "",
    description: "",
    imageUrl: "",
    ...initialValues,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...values, [name]: value };
    setValues(next);

    // Re-validate a field the user has already interacted with.
    if (touched[name]) {
      setErrors(validateListing(next));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validateListing(values));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const foundErrors = validateListing(values);
    setErrors(foundErrors);
    setTouched(
      Object.fromEntries(Object.keys(values).map((key) => [key, true])),
    );

    if (Object.keys(foundErrors).length > 0) {
      // Move focus to the first problem so keyboard users are not stranded.
      document.querySelector(`[name="${Object.keys(foundErrors)[0]}"]`)?.focus();
      return;
    }

    onSubmit({
      ...values,
      // Numbers arrive from inputs as strings — coerce before they hit the API.
      price: Number(values.price),
      floorAreaSqm: Number(values.floorAreaSqm),
      leaseCommenceYear: Number(values.leaseCommenceYear),
    });
  };

  /** Only show an error once the field has been touched. */
  const errorFor = (name) => (touched[name] ? errors[name] : undefined);

  const field = (name) => ({
    name,
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
    "aria-invalid": errorFor(name) ? "true" : undefined,
    "aria-describedby": errorFor(name) ? `${name}-error` : undefined,
  });

  return (
    <form onSubmit={handleSubmit} className="form" noValidate>
      <div className="form-field">
        <label htmlFor="title">Listing title</label>
        <input
          id="title"
          placeholder="e.g. Bright 4-room near Tampines MRT"
          {...field("title")}
        />
        <FieldError id="title-error" message={errorFor("title")} />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="town">Town</label>
          <select id="town" {...field("town")}>
            <option value="">Select a town</option>
            {TOWNS.map((town) => (
              <option key={town} value={town}>
                {titleCase(town)}
              </option>
            ))}
          </select>
          <FieldError id="town-error" message={errorFor("town")} />
        </div>

        <div className="form-field">
          <label htmlFor="flatType">Flat type</label>
          <select id="flatType" {...field("flatType")}>
            <option value="">Select a flat type</option>
            {FLAT_TYPES.map((type) => (
              <option key={type} value={type}>
                {titleCase(type)}
              </option>
            ))}
          </select>
          <FieldError id="flatType-error" message={errorFor("flatType")} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="block">Block</label>
          <input id="block" placeholder="e.g. 406" {...field("block")} />
          <FieldError id="block-error" message={errorFor("block")} />
        </div>

        <div className="form-field">
          <label htmlFor="streetName">Street name</label>
          <input
            id="streetName"
            placeholder="e.g. TAMPINES ST 21"
            {...field("streetName")}
          />
          <FieldError id="streetName-error" message={errorFor("streetName")} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="storeyRange">Storey range</label>
          <select id="storeyRange" {...field("storeyRange")}>
            <option value="">Select a range</option>
            {STOREY_RANGES.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
          <FieldError id="storeyRange-error" message={errorFor("storeyRange")} />
        </div>

        <div className="form-field">
          <label htmlFor="floorAreaSqm">Floor area (sqm)</label>
          <input
            id="floorAreaSqm"
            type="number"
            min="30"
            max="300"
            placeholder="e.g. 92"
            {...field("floorAreaSqm")}
          />
          <FieldError
            id="floorAreaSqm-error"
            message={errorFor("floorAreaSqm")}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="flatModel">Flat model</label>
          <select id="flatModel" {...field("flatModel")}>
            <option value="">Select a model</option>
            {FLAT_MODELS.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          <FieldError id="flatModel-error" message={errorFor("flatModel")} />
        </div>

        <div className="form-field">
          <label htmlFor="leaseCommenceYear">Lease commence year</label>
          <input
            id="leaseCommenceYear"
            type="number"
            min="1960"
            max={new Date().getFullYear()}
            placeholder="e.g. 1986"
            {...field("leaseCommenceYear")}
          />
          <p className="field-hint">
            HDB leases run 99 years from this year. It drives the valuation.
          </p>
          <FieldError
            id="leaseCommenceYear-error"
            message={errorFor("leaseCommenceYear")}
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="price">Asking price (SGD)</label>
        <input
          id="price"
          type="number"
          min="100000"
          step="1000"
          placeholder="e.g. 560000"
          {...field("price")}
        />
        <FieldError id="price-error" message={errorFor("price")} />
      </div>

      <div className="form-field">
        <label htmlFor="imageUrl">Image URL (optional)</label>
        <input
          id="imageUrl"
          type="url"
          placeholder="https://…"
          {...field("imageUrl")}
        />
        <FieldError id="imageUrl-error" message={errorFor("imageUrl")} />
      </div>

      <div className="form-field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          placeholder="Renovated kitchen, 5 minutes to the MRT, high floor with unblocked views…"
          {...field("description")}
        />
        <FieldError id="description-error" message={errorFor("description")} />
      </div>

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="field-error" role="alert">
      {message}
    </p>
  );
}

export default ListingForm;
