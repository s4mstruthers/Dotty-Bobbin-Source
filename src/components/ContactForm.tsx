// The contact form: renders whichever Wix form `formId` names, field by field from its live schema
// (the owner edits fields, choices and required marks in the Wix dashboard and this follows with no
// code change). Values, rules, validation and the submit all go through the shipped useWixForm hook;
// this file is only the rendering. Never name a field here: map `form.fields`.
import { useEffect, useRef } from "react";
import { useWixForm, FORM_ERROR, otherText, otherValue } from "../hooks/forms/useWixForm";
import type { FormDto, FormFieldDto } from "../wix/forms/types";

// Same field styling as the class booking form (src/components/bookings/ClassBooking.tsx).
const input =
  "w-full rounded-sm border-[1.5px] border-border bg-background px-4 py-2.5 text-base text-foreground outline-none transition-shadow focus:border-sage focus:ring-2 focus:ring-sage/25 disabled:opacity-60 aria-[invalid=true]:border-destructive";
const headingText = "block text-xs font-bold uppercase tracking-wider text-sage-deep";
const heading = `mb-2 ${headingText}`;
const errorText = "mt-1.5 text-sm text-destructive";
const helpText = "mt-1.5 text-sm text-muted-foreground";

const SUCCESS = "Thanks, I've got your message and will reply soon.";

/** The browser's autofill hint for a field, from its kind (never its name or label). */
function autoCompleteOf(f: FormFieldDto): string | undefined {
  switch (f.identifier) {
    case "CONTACTS_FIRST_NAME":
    case "FULL_NAME_FIRST_NAME":
      return "given-name";
    case "CONTACTS_LAST_NAME":
    case "FULL_NAME_LAST_NAME":
      return "family-name";
    case "CONTACTS_COMPANY":
      return "organization";
    case "CONTACTS_POSITION":
      return "organization-title";
    case "CONTACTS_BIRTHDATE":
      return "bday";
  }
  switch (f.control) {
    case "email":
      return "email";
    case "phone":
      return "tel";
    case "url":
      return "url";
    case "textarea":
      return "off";
  }
  return undefined;
}

const ADDRESS_AUTOCOMPLETE: Record<string, string> = {
  country: "country",
  addressLine: "address-line1",
  addressLine2: "address-line2",
  city: "address-level2",
  subdivision: "address-level1",
  postalCode: "postal-code",
};

const INPUT_TYPE: Partial<Record<FormFieldDto["control"], string>> = {
  text: "text",
  email: "email",
  phone: "tel",
  url: "url",
  password: "password",
  number: "number",
  rating: "number",
  date: "date",
  time: "time",
  datetime: "datetime-local",
};

const WIDE = new Set<FormFieldDto["control"]>(["textarea", "address", "checkboxGroup", "tags", "radio", "checkbox", "file", "signature"]);

type Props = {
  formId: string;
  initialForm?: FormDto;
  /** Shown when the form can't load or send, so a visitor always has another way to reach Saskia. */
  fallbackEmail: string;
};

export default function ContactForm({ formId, initialForm, fallbackEmail }: Props) {
  const f = useWixForm(formId, { initialForm });
  const successRef = useRef<HTMLDivElement>(null);

  // The owner's submit settings: follow a redirect or a paid form's checkout; focus the thank-you.
  useEffect(() => {
    const o = f.outcome;
    if (!o) return;
    if (o.url) {
      if (o.newTab) window.open(o.url, "_blank", "noopener");
      else window.location.assign(o.url);
      return;
    }
    successRef.current?.focus();
  }, [f.outcome]);

  if (f.outcome) {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className="rounded-lg bg-secondary p-6 outline-none sm:p-8">
        <p className="text-xl text-sage">{f.outcome.url ? "Thanks, taking you on now…" : SUCCESS}</p>
        {!f.outcome.url && (
          <button type="button" onClick={f.reset} className="link-pill mt-5 bg-background">
            Send another message
          </button>
        )}
      </div>
    );
  }

  if (!f.form && f.errors[FORM_ERROR]) {
    return (
      <div role="alert" className="rounded-lg border border-border p-6 sm:p-8">
        <p>
          Sorry, the message form isn't loading just now. Please email me at{" "}
          <a href={`mailto:${fallbackEmail}`} className="font-semibold underline">{fallbackEmail}</a> instead.
        </p>
      </div>
    );
  }

  if (!f.form) {
    return (
      <div aria-busy="true" aria-label="Loading the message form" className="grid animate-pulse gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <div className="mb-2 h-3 w-24 rounded bg-secondary" />
            <div className="h-11 rounded-sm bg-secondary" />
          </div>
        ))}
        <div className="sm:col-span-2">
          <div className="mb-2 h-3 w-24 rounded bg-secondary" />
          <div className="h-32 rounded-sm bg-secondary" />
        </div>
        <div className="h-11 w-40 rounded-control bg-secondary" />
      </div>
    );
  }

  const form = f.form;

  if (f.closed) {
    return (
      <div className="rounded-lg border border-border p-6 sm:p-8">
        <p>{form.disabledMessage || "This form isn't taking messages at the moment."}</p>
        <p className="mt-3">
          You can still email me at{" "}
          <a href={`mailto:${fallbackEmail}`} className="font-semibold underline">{fallbackEmail}</a>.
        </p>
      </div>
    );
  }

  const step = form.steps[f.step] ?? form.steps[0];
  const last = f.step >= form.steps.length - 1;
  const fields = step ? form.fields.filter((x) => x.stepId === step.id) : form.fields;
  const sending = f.loading;

  /** The label text with the owner's required mark (asterisk, "Required" or none, before or after). */
  function labelText(field: { label: string; required: boolean }) {
    if (!field.required || form.requiredIndicator === "NONE") return field.label;
    const mark = form.requiredIndicator === "TEXT" ? "(Required)" : "*";
    return form.requiredIndicatorBefore ? `${mark} ${field.label}` : `${field.label} ${mark}`;
  }

  const set = (target: string, value: unknown) => f.setValues((v) => ({ ...v, [target]: value }));
  const errorFor = (key: string) =>
    f.errors[key] ? (
      <p id={`err-${key}`} className={errorText}>{f.errors[key]}</p>
    ) : (
      <span id={`err-${key}`} hidden />
    );
  const help = (field: FormFieldDto) => (field.description ? <p className={helpText}>{field.description}</p> : null);

  function renderField(field: FormFieldDto) {
    const target = field.target;
    const label = labelText(field);
    const visibleLabel = field.showLabel ? <span className={heading}>{label}</span> : null;
    const aria = field.showLabel ? {} : { "aria-label": label };
    const describedBy = `err-${target}`;
    const invalid = f.errors[target] ? (true as const) : undefined;

    switch (field.control) {
      case "textarea":
        return (
          <label className="block">
            {visibleLabel}
            <textarea
              {...f.bind(target)}
              {...aria}
              rows={6}
              required={field.required}
              disabled={field.readOnly}
              placeholder={field.placeholder}
              minLength={field.validation.minLength}
              maxLength={field.validation.maxLength}
              autoComplete={autoCompleteOf(field)}
              className={`${input} min-h-36 resize-y`}
            />
            {help(field)}
            {errorFor(target)}
          </label>
        );

      case "select": {
        const value = String(f.values[target] ?? "");
        const other = otherText(field, value);
        const otherOn = field.otherOption && other !== null;
        return (
          <div>
            <label className="block">
              {visibleLabel}
              <select
                {...f.bind(target)}
                {...aria}
                value={otherOn ? "__other" : value}
                onChange={(e) => set(target, e.target.value === "__other" ? otherValue(field, "") : e.target.value)}
                required={field.required}
                disabled={field.readOnly}
                className={input}
              >
                <option value="">{field.placeholder || "Choose…"}</option>
                {field.choices.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
                {field.otherOption && <option value="__other">{field.otherOption.label}</option>}
              </select>
            </label>
            {otherOn && (
              <input
                type="text"
                aria-label={field.otherOption!.label}
                value={other ?? ""}
                placeholder={field.otherOption!.placeholder}
                onChange={(e) => set(target, otherValue(field, e.target.value))}
                onBlur={() => f.validate(target)}
                className={`${input} mt-2`}
              />
            )}
            {help(field)}
            {errorFor(target)}
          </div>
        );
      }

      case "radio": {
        const value = String(f.values[target] ?? "");
        const other = otherText(field, value);
        return (
          <fieldset aria-describedby={describedBy}>
            <legend className={field.showLabel ? heading : "sr-only"}>{label}</legend>
            <div className="space-y-2">
              {field.choices.map((c) => (
                <label key={c.value} className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name={target}
                    value={c.value}
                    checked={value === c.value}
                    disabled={field.readOnly}
                    onChange={() => set(target, c.value)}
                    onBlur={() => f.validate(target)}
                    className="size-4 accent-sage"
                  />
                  <span>{c.label}</span>
                </label>
              ))}
              {field.otherOption && (
                <div className="flex flex-wrap items-center gap-2.5">
                  <label className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name={target}
                      checked={other !== null}
                      disabled={field.readOnly}
                      onChange={() => set(target, otherValue(field, ""))}
                      className="size-4 accent-sage"
                    />
                    <span>{field.otherOption.label}</span>
                  </label>
                  {other !== null && (
                    <input
                      type="text"
                      aria-label={field.otherOption.label}
                      value={other}
                      placeholder={field.otherOption.placeholder}
                      onChange={(e) => set(target, otherValue(field, e.target.value))}
                      onBlur={() => f.validate(target)}
                      className={`${input} max-w-xs`}
                    />
                  )}
                </div>
              )}
            </div>
            {help(field)}
            {errorFor(target)}
          </fieldset>
        );
      }

      case "checkboxGroup":
      case "tags": {
        const chosen = Array.isArray(f.values[target]) ? (f.values[target] as string[]) : [];
        const otherEntry = field.otherOption ? chosen.find((v) => otherText(field, v) !== null) : undefined;
        const toggle = (v: string, on: boolean) => set(target, on ? [...chosen, v] : chosen.filter((x) => x !== v));
        return (
          <fieldset aria-describedby={describedBy}>
            <legend className={field.showLabel ? heading : "sr-only"}>{label}</legend>
            <div className="space-y-2">
              {field.choices.map((c) => (
                <label key={c.value} className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    name={target}
                    value={c.value}
                    checked={chosen.includes(c.value)}
                    disabled={field.readOnly}
                    onChange={(e) => toggle(c.value, e.target.checked)}
                    onBlur={() => f.validate(target)}
                    className="size-4 accent-sage"
                  />
                  {c.imageUrl && <img src={c.imageUrl} alt="" className="size-12 rounded-sm object-cover" />}
                  <span>{c.label}</span>
                </label>
              ))}
              {field.otherOption && (
                <div className="flex flex-wrap items-center gap-2.5">
                  <label className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={otherEntry !== undefined}
                      disabled={field.readOnly}
                      onChange={(e) =>
                        set(target, e.target.checked ? [...chosen, otherValue(field, "")] : chosen.filter((x) => x !== otherEntry))
                      }
                      className="size-4 accent-sage"
                    />
                    <span>{field.otherOption.label}</span>
                  </label>
                  {otherEntry !== undefined && (
                    <input
                      type="text"
                      aria-label={field.otherOption.label}
                      value={otherText(field, otherEntry) ?? ""}
                      placeholder={field.otherOption.placeholder}
                      onChange={(e) => set(target, chosen.map((x) => (x === otherEntry ? otherValue(field, e.target.value) : x)))}
                      onBlur={() => f.validate(target)}
                      className={`${input} max-w-xs`}
                    />
                  )}
                </div>
              )}
            </div>
            {help(field)}
            {errorFor(target)}
          </fieldset>
        );
      }

      case "checkbox":
        return (
          <div>
            <label className="flex items-start gap-2.5">
              <input
                type="checkbox"
                name={target}
                checked={f.values[target] === true}
                disabled={field.readOnly}
                onChange={(e) => set(target, e.target.checked)}
                onBlur={() => f.validate(target)}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                className="mt-1 size-4 shrink-0 accent-sage"
              />
              <span>{label}</span>
            </label>
            {help(field)}
            {errorFor(target)}
          </div>
        );

      case "address": {
        const value = (f.values[target] ?? {}) as Record<string, string>;
        return (
          <fieldset>
            <legend className={field.showLabel ? heading : "sr-only"}>{label}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {field.addressParts.map((p) => {
                const key = `${target}/${p.sub}`;
                const common = {
                  name: key,
                  value: value[p.sub] ?? "",
                  required: p.required,
                  disabled: field.readOnly,
                  autoComplete: ADDRESS_AUTOCOMPLETE[p.sub],
                  onBlur: () => f.validate(key),
                  "aria-describedby": `err-${key}`,
                  "aria-invalid": f.errors[key] ? (true as const) : undefined,
                  className: input,
                };
                const onChange = (e: { target: { value: string } }) => set(target, { ...value, [p.sub]: e.target.value });
                return (
                  <label key={p.sub} className={`block ${p.sub === "country" || p.sub.startsWith("addressLine") ? "sm:col-span-2" : ""}`}>
                    <span className={heading}>{p.required && form.requiredIndicator !== "NONE" ? `${p.label} *` : p.label}</span>
                    {p.choices ? (
                      <select {...common} onChange={onChange}>
                        <option value="">Choose…</option>
                        {p.choices.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input type="text" {...common} onChange={onChange} />
                    )}
                    {errorFor(key)}
                  </label>
                );
              })}
            </div>
            {help(field)}
          </fieldset>
        );
      }

      case "file":
      case "signature":
        return (
          <label className="block">
            {visibleLabel}
            <input
              type="file"
              name={target}
              {...aria}
              accept={field.validation.accept || (field.control === "signature" ? "image/*" : undefined)}
              multiple={(field.validation.fileLimit ?? 1) > 1}
              disabled={field.readOnly}
              onChange={(e) => set(target, Array.from(e.target.files ?? []))}
              onBlur={() => f.validate(target)}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className="block w-full text-sm file:mr-3 file:rounded-control file:border-0 file:bg-secondary file:px-4 file:py-2 file:font-semibold"
            />
            {field.explanationText && <p className={helpText}>{field.explanationText}</p>}
            {help(field)}
            {errorFor(target)}
          </label>
        );

      case "payment":
      case "appointment":
      case "unknown":
        return (
          <div>
            {visibleLabel}
            <p className="text-sm text-muted-foreground">This part of the form can't be filled in here. Please email me instead.</p>
          </div>
        );

      default: {
        // text, email, phone, url, password, number, rating, date, time, datetime
        const type = INPUT_TYPE[field.control] ?? "text";
        const numeric = field.control === "number" || field.control === "rating";
        const dated = field.control === "date" || field.control === "time" || field.control === "datetime";
        return (
          <label className="block">
            {visibleLabel}
            <input
              type={type}
              {...f.bind(target)}
              {...aria}
              required={field.required}
              disabled={field.readOnly}
              placeholder={field.placeholder}
              autoComplete={autoCompleteOf(field)}
              inputMode={field.control === "email" ? "email" : field.control === "phone" ? "tel" : undefined}
              min={numeric ? (field.control === "rating" ? 1 : field.validation.minimum) : dated ? field.validation.minDate : undefined}
              max={numeric ? (field.control === "rating" ? 5 : field.validation.maximum) : dated ? field.validation.maxDate : undefined}
              step={numeric ? field.validation.multipleOf : undefined}
              minLength={field.validation.minLength}
              maxLength={field.validation.maxLength}
              className={input}
            />
            {help(field)}
            {errorFor(target)}
          </label>
        );
      }
    }
  }

  return (
    <form
      noValidate
      aria-busy={sending || undefined}
      onSubmit={async (e) => {
        await f.submit(e);
      }}
    >
      {form.steps.length > 1 && (
        <p className="mb-5 text-sm text-muted-foreground">
          Step {f.step + 1} of {form.steps.length}
          {step?.name ? `: ${step.name}` : ""}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.target} className={WIDE.has(field.control) ? "sm:col-span-2" : undefined}>
            {renderField(field)}
          </div>
        ))}
      </div>

      {f.errors[FORM_ERROR] && (
        <div role="alert" className="mt-5 rounded-sm border-[1.5px] border-destructive/40 bg-background p-4 text-sm">
          <p className="font-semibold text-destructive">{f.errors[FORM_ERROR]}</p>
          <p className="mt-1">
            If it keeps happening, email me at{" "}
            <a href={`mailto:${fallbackEmail}`} className="font-semibold underline">{fallbackEmail}</a>.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {f.step > 0 && (
          <button type="button" onClick={f.previous} className="link-pill bg-background" disabled={sending}>
            {form.previousText || "Back"}
          </button>
        )}
        {last ? (
          <button
            type="submit"
            disabled={sending}
            className="btn w-full disabled:cursor-not-allowed sm:w-auto"
          >
            {sending ? "Sending…" : form.submitText || "Send message"}
          </button>
        ) : (
          <button type="button" onClick={(e) => f.next({ currentTarget: e.currentTarget.form })} className="btn w-full sm:w-auto">
            {form.nextText || "Continue"}
          </button>
        )}
      </div>
      <p className="sr-only" aria-live="polite">{sending ? "Sending your message…" : ""}</p>
    </form>
  );
}
