<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-zA-Z\s]+$/'
            ],
            'email' => [
                'required',
                'email',
                'string',
                'max:255',
                'unique:users,email'
            ],
            'password' => [
                'required',
                'string',
                'confirmed',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised()
            ],
            'role' => [
                'required',
                'string',
                'in:admin,student,staff'
            ],
            'user_type_id' => [
                'nullable',
                'integer',
                'exists:' . $this->getTableForRole() . ',id'
            ]
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Name is required.',
            'name.regex' => 'Name should only contain letters and spaces.',
            'email.required' => 'Email address is required.',
            'email.email' => 'Please provide a valid email address.',
            'email.unique' => 'This email address is already registered.',
            'password.required' => 'Password is required.',
            'password.confirmed' => 'Password confirmation does not match.',
            'role.required' => 'User role is required.',
            'role.in' => 'Invalid user role selected.',
            'user_type_id.exists' => 'Invalid user type ID for the selected role.',
        ];
    }

    /**
     * Get the table name based on the role
     */
    private function getTableForRole(): string
    {
        return match($this->input('role')) {
            'student' => 'students',
            'staff' => 'staff',
            default => 'users'
        };
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Additional validation logic can be added here
            if ($this->input('role') === 'student' && !$this->input('user_type_id')) {
                $validator->errors()->add('user_type_id', 'Student ID is required for student role.');
            }
            
            if ($this->input('role') === 'staff' && !$this->input('user_type_id')) {
                $validator->errors()->add('user_type_id', 'Staff ID is required for staff role.');
            }
        });
    }
}
