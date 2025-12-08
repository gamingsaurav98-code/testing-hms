<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
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
            'user_id' => [
                'required',
                'string',
                'max:255'
            ],
            'password' => [
                'required',
                'string',
                'min:6'
            ],
            'remember' => [
                'nullable',
                'boolean'
            ]
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'user_id.required' => 'User ID is required.',
            'user_id.string' => 'Please provide a valid user ID.',
            'password.required' => 'Password is required.',
            'password.min' => 'Password must be at least 6 characters long.',
        ];
    }
}
