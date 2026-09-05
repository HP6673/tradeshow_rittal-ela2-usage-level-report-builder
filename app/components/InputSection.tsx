"use client";

import { softwareOptions, type Inputs, type NumericInputKey } from "../lib/calculations.ts";
import { Field, SectionCard } from "./ui.tsx";

const quantityOptions = Array.from({ length: 10 }, (_, index) => index + 1);

function SoftwareRadioGroup({
  value,
  otherValue,
  onChange,
  onOtherChange,
}: {
  value: string;
  otherValue: string;
  onChange: (value: string) => void;
  onOtherChange: (value: string) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-sm font-medium text-[#4d5662]">
        What software do you use?
      </legend>
      <div className="mt-2 grid gap-1.5">
        {softwareOptions.map((option) => {
          const selected = value === option;

          return (
            <label
              className={`flex min-w-0 cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm transition focus-within:ring-2 focus-within:ring-[#e50043]/40 ${
                selected
                  ? "border-[#e50043] bg-[#fdeef0]"
                  : "border-[#e2e8f0] bg-white hover:bg-[#f8fafc]"
              }`}
              key={option}
            >
              <input
                checked={selected}
                className="h-4 w-4 shrink-0 accent-[#e50043]"
                name="software-choice"
                onChange={() => onChange(option)}
                type="radio"
                value={option}
              />
              <span className="text-[#33404c]">{option}</span>
            </label>
          );
        })}
      </div>
      {value === "Other" ? (
        <div className="mt-2">
          <Field
            inputMode="text"
            label="Please specify"
            value={otherValue}
            onChange={onOtherChange}
          />
        </div>
      ) : null}
    </fieldset>
  );
}

function QuantitySelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid min-w-0 gap-1">
      <label className="text-sm font-medium text-[#4d5662]">{label}</label>
      <select
        className="h-11 w-full max-w-full rounded border border-[#cbd5e1] bg-white px-3 text-base shadow-inner outline-none transition focus-visible:ring-2 focus-visible:ring-[#e50043]/40 focus:border-[#e50043]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {quantityOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export function InputSection({
  input,
  onNumberChange,
  onTextChange,
  onSoftwareChange,
  onSoftwareOtherChange,
  displayValue,
  fieldError,
}: {
  input: Inputs;
  onNumberChange: (key: NumericInputKey, value: string) => void;
  onTextChange: (key: keyof Inputs, value: string) => void;
  onSoftwareChange: (value: string) => void;
  onSoftwareOtherChange: (value: string) => void;
  displayValue: (key: NumericInputKey) => string;
  fieldError: (key: NumericInputKey) => string | undefined;
}) {
  return (
    <SectionCard
      description="A few quick questions for this booth visitor — enough for an instant savings estimate."
      id="step-1"
      step={1}
      title="Trade show quick inputs"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          hint="Up to 256 characters"
          inputMode="text"
          label="Company name"
          maxLength={256}
          value={input.companyName}
          onChange={(value) => onTextChange("companyName", value)}
        />
        <Field
          error={fieldError("panelsPerYear")}
          hint="Whole number"
          label="Quantity of panels per year"
          value={displayValue("panelsPerYear")}
          onChange={(value) => onNumberChange("panelsPerYear", value)}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <QuantitySelect
          label="Quantity of engineers"
          value={displayValue("engineeringFte")}
          onChange={(value) => onNumberChange("engineeringFte", value)}
        />
        <QuantitySelect
          label="Quantity of panel builders"
          value={displayValue("productionFte")}
          onChange={(value) => onNumberChange("productionFte", value)}
        />
      </div>

      <div className="mt-4">
        <SoftwareRadioGroup
          onChange={onSoftwareChange}
          onOtherChange={onSoftwareOtherChange}
          otherValue={input.softwareOther}
          value={input.softwareChoice}
        />
      </div>
    </SectionCard>
  );
}
