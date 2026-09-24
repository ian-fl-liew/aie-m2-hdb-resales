import { useState } from "react";
import { AGENT_SPECIALTIES, normalizeSingaporePhone } from "../utils/agents";
import { validateAgent } from "../utils/validation";

function AgentForm({
  initialValues,
  onSubmit,
  submitting,
  submitLabel = "Add agent",
}) {
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    remarks: "",
    ...initialValues,
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    const next = { ...values, [name]: value };
    setValues(next);

    if (touched[name]) {
      setErrors(validateAgent(next));
    }
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((current) => ({ ...current, [name]: true }));
    setErrors(validateAgent(values));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const foundErrors = validateAgent(values);
    setErrors(foundErrors);
    setTouched(
      Object.fromEntries(Object.keys(values).map((key) => [key, true])),
    );

    if (Object.keys(foundErrors).length > 0) {
      document.querySelector(`[name="${Object.keys(foundErrors)[0]}"]`)?.focus();
      return;
    }

    onSubmit({
      name: values.name.trim(),
      email: values.email.trim(),
      phone: normalizeSingaporePhone(values.phone),
      specialty: values.specialty,
      remarks: values.remarks.trim(),
    });
  };

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
        <label htmlFor="name">Name</label>
        <input id="name" autoComplete="name" {...field("name")} />
        <FieldError id="name-error" message={errorFor("name")} />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...field("email")}
          />
          <FieldError id="email-error" message={errorFor("email")} />
        </div>

        <div className="form-field">
          <label htmlFor="phone">Phone number</label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+65 9123 4567"
            {...field("phone")}
          />
          <FieldError id="phone-error" message={errorFor("phone")} />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="specialty">Specialty</label>
        <select id="specialty" {...field("specialty")}>
          <option value="">Select a specialty</option>
          {AGENT_SPECIALTIES.map((specialty) => (
            <option key={specialty} value={specialty}>
              {specialty}
            </option>
          ))}
        </select>
        <FieldError id="specialty-error" message={errorFor("specialty")} />
      </div>

      <div className="form-field">
        <label htmlFor="remarks">Remarks</label>
        <textarea
          id="remarks"
          placeholder="Add relevant experience or coverage areas"
          {...field("remarks")}
        />
        <FieldError id="remarks-error" message={errorFor("remarks")} />
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

export default AgentForm;