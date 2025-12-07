"use client";

import { useState, Fragment, ChangeEvent } from "react";
import { Combobox as HeadlessCombobox, Transition } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";

type Option = {
  id: number | string;
  label: string;
  [key: string]: unknown;
};

export interface ComboboxProps<T extends Option> {
  options: T[];
  value: T | null;
  onChange: (value: T | null) => void;
  placeholder?: string;
  loading?: boolean;
  onSearch?: (query: string) => void;
  displayValue?: (option: T | null) => string;
  className?: string;
  emptyMessage?: string;
}

export function Combobox<T extends Option>({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  loading = false,
  onSearch,
  displayValue = (option) => option?.label || "",
  className = "",
  emptyMessage = "No options found",
}: ComboboxProps<T>) {
  const [query, setQuery] = useState("");

  const filteredOptions =
    query === ""
      ? options
      : options.filter((option) =>
          option.label.toLowerCase().includes(query.toLowerCase())
        );

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className={className}>
      <HeadlessCombobox value={value} onChange={onChange}>
        <div className="relative">
          <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-sm border border-neutral-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
            <HeadlessCombobox.Input
              className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-neutral-900 focus:ring-0 outline-none"
              displayValue={displayValue}
              onChange={handleInputChange}
              placeholder={placeholder}
              autoComplete="off"
            />
            <HeadlessCombobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDown
                className="h-5 w-5 text-neutral-400"
                aria-hidden="true"
              />
            </HeadlessCombobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery("")}
          >
            <HeadlessCombobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
              {loading ? (
                <div className="relative cursor-default select-none px-4 py-2 text-neutral-700">
                  Loading...
                </div>
              ) : filteredOptions.length === 0 && query !== "" ? (
                <div className="relative cursor-default select-none px-4 py-2 text-neutral-700">
                  {emptyMessage}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <HeadlessCombobox.Option
                    key={option.id}
                    className={({ active }: { active: boolean }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? "bg-teal-600 text-white" : "text-neutral-900"
                      }`
                    }
                    value={option}
                  >
                    {({ selected, active }: { selected: boolean; active: boolean }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {option.label}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? "text-white" : "text-teal-600"
                            }`}
                          >
                            <Check className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </HeadlessCombobox.Option>
                ))
              )}
            </HeadlessCombobox.Options>
          </Transition>
        </div>
      </HeadlessCombobox>
    </div>
  );
}
