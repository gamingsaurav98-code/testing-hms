# Admin Components & Hooks - Reorganized Structure

This folder contains a clean, organized structure for all admin-related components and hooks, replacing the monolithic design-system.tsx and admin-hooks.tsx files.

## Structure Overview

### Components (`/components/admin/ui/`)

**Core UI Components:**
- `button.tsx` - Base button component
- `form-buttons.tsx` - Specialized form buttons (Submit, Cancel)
- `form-field.tsx` - Text input and textarea fields
- `checkbox.tsx` - Checkbox component with description support
- `search-bar.tsx` - Search input with icon

**Specialized Components:**

**Image Components:**
- `image-modal.tsx` - Image preview modal
- `single-image-upload-create.tsx` - Single image upload for create forms
- `single-image-upload-edit.tsx` - Single image upload for edit forms (shows current vs new)
- `multiple-image-upload-create.tsx` - Multiple image upload for create forms
- `multiple-image-upload-edit.tsx` - Multiple image upload for edit forms

**Advanced Components:**
- `multi-select-search-dropdown.tsx` - Searchable multi-select dropdown

**Feedback Components:**
- `success-toast.tsx` - Success notification toast
- `confirm-modal.tsx` - Confirmation dialog modal

**Loading Components:**
- `loading-skeletons.tsx` - Loading skeleton states

**Index File:**
- `index.tsx` - Exports all components with legacy aliases for backward compatibility

### Hooks (`/hooks/admin/`)

**Toast Hooks:**
- `use-toast.ts` - Success toast state management

**Modal Hooks:**
- `use-image-modal.ts` - Image modal state management
- `use-confirm-modal.ts` - Confirmation modal state management

**Image Upload Hooks:**
- `use-image-upload.ts` - Single image upload logic
- `use-multiple-image-upload.ts` - Multiple image upload for create forms
- `use-multiple-image-upload-edit.ts` - Multiple image upload for edit forms

**Form Hooks:**
- `use-form-errors.ts` - Form validation error management
- `use-multi-select.ts` - Multi-select dropdown logic

**Index File:**
- `index.ts` - Exports all hooks

## Usage

### Import Components
```tsx
import { 
  Button, 
  FormField, 
  SingleImageUploadCreate,
  MultiSelectSearchDropdown,
  SuccessToast 
} from '@/components/admin/ui'
```

### Import Hooks
```tsx
import { 
  useToast, 
  useImageUpload, 
  useFormErrors,
  useMultiSelect 
} from '@/hooks/admin'
```

### Legacy Compatibility
For backward compatibility, the following aliases are maintained:
- `ImageUpload` → `SingleImageUploadCreate`
- `MultipleImageUpload` → `MultipleImageUploadCreate`
- `MultiSelect` → `MultiSelectSearchDropdown`

## Benefits of New Structure

1. **Separation of Concerns**: Each component/hook has a single responsibility
2. **Better Maintainability**: Easy to find and modify specific functionality
3. **Cleaner Imports**: Import only what you need
4. **Type Safety**: Better TypeScript support with focused interfaces
5. **Reusability**: Components can be easily reused across different forms
6. **Testing**: Each component can be tested independently

## Migration Guide

### Before (Old Structure)
```tsx
import { FormField, ImageUpload, MultiSelect } from '@/components/admin/ui/design-system'
import { useToast, useImageUpload, useMultiSelect } from '@/components/admin/ui/admin-hooks'
```

### After (New Structure)
```tsx
import { FormField, SingleImageUploadCreate, MultiSelectSearchDropdown } from '@/components/admin/ui'
import { useToast, useImageUpload, useMultiSelect } from '@/hooks/admin'

// OR use legacy aliases (recommended for gradual migration)
import { FormField, ImageUpload, MultiSelect } from '@/components/admin/ui'
```

## File Naming Convention

- **Components**: kebab-case (e.g., `single-image-upload-create.tsx`)
- **Hooks**: kebab-case with `use-` prefix (e.g., `use-image-upload.ts`)
- **Types**: PascalCase interfaces within component files
- **Index files**: Re-export everything for clean imports

This structure makes the codebase much more maintainable and scalable for future development.
