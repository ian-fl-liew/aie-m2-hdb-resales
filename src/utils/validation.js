// Form validation rules.
//
// These live outside the component files on purpose. Keeping them here means a
// component file exports only its component (which is what React Fast Refresh
// needs to hot-reload reliably), and it lets the rules be unit tested without
// rendering anything.
//
// Each function returns an object of { fieldName: "message" }. An empty object
// means the form is valid.

import { AGENT_SPECIALTIES } from "./agents";

/** Rules for the create/edit listing form. */
export function validateListing(values) {
  const errors = {};
  const thisYear = new Date().getFullYear();

  if (!values.title.trim()) errors.title = "Give the listing a title.";
  else if (values.title.trim().length < 8)
    errors.title = "Use at least 8 characters so buyers know what this is.";

  if (!values.town) errors.town = "Select a town.";
  if (!values.flatType) errors.flatType = "Select a flat type.";
  if (!values.block.trim()) errors.block = "Enter the block number.";
  if (!values.streetName.trim()) errors.streetName = "Enter the street name.";
  if (!values.storeyRange) errors.storeyRange = "Select a storey range.";
  if (!values.flatModel) errors.flatModel = "Select a flat model.";

  const area = Number(values.floorAreaSqm);
  if (!values.floorAreaSqm) errors.floorAreaSqm = "Enter the floor area.";
  else if (Number.isNaN(area) || area < 30 || area > 300)
    errors.floorAreaSqm = "Floor area should be between 30 and 300 sqm.";

  const year = Number(values.leaseCommenceYear);
  if (!values.leaseCommenceYear)
    errors.leaseCommenceYear = "Enter the lease commence year.";
  else if (Number.isNaN(year) || year < 1960 || year > thisYear)
    errors.leaseCommenceYear = `Enter a year between 1960 and ${thisYear}.`;

  const price = Number(values.price);
  if (!values.price) errors.price = "Enter an asking price.";
  else if (Number.isNaN(price) || price < 100_000)
    errors.price = "Enter a realistic asking price above S$100,000.";
  else if (price > 2_000_000)
    errors.price = "That looks too high for a HDB flat. Check the figure.";

  if (values.imageUrl && !/^https?:\/\/.+/.test(values.imageUrl))
    errors.imageUrl = "Enter a full URL starting with http:// or https://";

  if (
    values.description.trim().length > 0 &&
    values.description.trim().length < 20
  )
    errors.description = "Write at least 20 characters, or leave it empty.";

  return errors;
}

/** Rules for the registration form. */
export function validateRegistration(form) {
  const errors = {};

  if (!form.name.trim()) errors.name = "Enter your name.";

  if (!form.email.trim()) errors.email = "Enter your email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "That does not look like a valid email address.";

  if (!form.password) errors.password = "Choose a password.";
  else if (form.password.length < 6)
    errors.password = "Use at least 6 characters.";

  if (form.password !== form.confirmPassword)
    errors.confirmPassword = "The passwords do not match.";

  return errors;
}

/** Rules for the create/edit agent form. */
export function validateAgent(values) {
  const errors = {};

  if (!values.name.trim()) errors.name = "Enter the agent name.";

  if (!values.email.trim()) errors.email = "Enter the agent email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = "That does not look like a valid email address.";

  const phone = values.phone.trim().replace(/\s/g, "").replace(/^\+65/, "");
  if (!values.phone.trim()) errors.phone = "Enter the phone number.";
  else if (!/^[689]\d{7}$/.test(phone))
    errors.phone = "Enter a valid Singapore phone number.";

  if (!AGENT_SPECIALTIES.includes(values.specialty))
    errors.specialty = "Select a specialty.";

  if (!values.remarks.trim()) errors.remarks = "Enter remarks.";
  else if (values.remarks.trim().length < 10)
    errors.remarks = "Remarks must be at least 10 characters.";

  return errors;
}
