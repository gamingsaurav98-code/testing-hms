# MultiSelect Component Documentation

The MultiSelect component is a reusable UI component that allows users to search and select multiple items from a dropdown list. It's designed to be used in forms where multiple related items need to be selected, such as assigning categories, tags, or attributes to a product.

## Features

- Search functionality to filter options
- Keyboard navigation support
- Accessible design
- Clear selected items individually
- Customizable appearance
- Shows selected items as tags/chips
- Support for disabled state

## Usage

### Basic Usage

```tsx
import { MultiSelect } from "@/components/admin/ui/design-system"
import { useState } from "react"

const options = [
  { id: 1, label: "Option 1", value: { id: 1, name: "Option 1" } },
  { id: 2, label: "Option 2", value: { id: 2, name: "Option 2" } },
  { id: 3, label: "Option 3", value: { id: 3, name: "Option 3" } },
]

function MyForm() {
  const [selectedOptions, setSelectedOptions] = useState([])
  
  return (
    <MultiSelect
      label="Select Options"
      options={options}
      selectedOptions={selectedOptions}
      onChange={setSelectedOptions}
      placeholder="Search and select options..."
    />
  )
}
```

### With useMultiSelect Hook

The `useMultiSelect` hook makes it easier to work with the MultiSelect component by handling the state and transformations needed for the component.

```tsx
import { MultiSelect } from "@/components/admin/ui/design-system"
import { useMultiSelect } from "@/components/admin/ui/admin-hooks"

// Your data from API or elsewhere
const categories = [
  { id: 1, name: "Category 1" },
  { id: 2, name: "Category 2" },
  { id: 3, name: "Category 3" },
]

function MyForm() {
  // Initialize the hook with your data array and optional initial selection
  const {
    options,              // Formatted options for the MultiSelect component
    selected,             // Currently selected options
    handleSelectionChange, // Function to update selection
    getSelectedIds,       // Helper to get just the IDs of selected items
    getSelectedItems,     // Helper to get the original data objects that are selected
    resetSelection,       // Reset to empty selection
    setSelectionByIds     // Set selection using an array of IDs
  } = useMultiSelect(categories, [1], 'name')
  
  return (
    <MultiSelect
      label="Categories"
      options={options}
      selectedOptions={selected}
      onChange={handleSelectionChange}
      placeholder="Search and select categories..."
    />
  )
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| label | string | Yes | The label for the component |
| options | Option[] | Yes | Array of options to select from |
| selectedOptions | Option[] | Yes | Currently selected options |
| onChange | (options: Option[]) => void | Yes | Callback when selection changes |
| placeholder | string | No | Placeholder text when no search query |
| error | string | No | Error message to display |
| required | boolean | No | Whether the field is required |
| maxHeight | number | No | Maximum height of dropdown in pixels |
| disabled | boolean | No | Whether the component is disabled |

### Option Interface

```tsx
interface Option {
  id: number | string;  // Unique identifier
  label: string;        // Display text
  value: any;           // The original data object or any value
}
```

## useMultiSelect Hook Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| items | T[] | Yes | Array of original data items |
| selectedIds | (number \| string)[] | No | Array of initially selected IDs |
| labelKey | keyof T | No | Property of items to use as label (default: 'name') |

## Integration with Form Submission

When submitting a form with MultiSelect components, you can use the `getSelectedIds()` helper to get just the IDs:

```tsx
const handleSubmit = (e) => {
  e.preventDefault()
  
  const formData = {
    name: name,
    // ...other fields
    categoryIds: categorySelect.getSelectedIds()
  }
  
  // Submit the form data
}
```

## Example in Product Form

Here's how to use the MultiSelect component in a product form for selecting categories, skin types, and other attributes:

```tsx
// See the full example in /examples/ProductFormWithMultiSelect.tsx
```
