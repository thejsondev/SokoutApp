<?php

namespace Database\Factories;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'address' => fake()->address(),
            'phone' => fake()->optional()->phoneNumber(),
            'role' => Role::Bewohner,
            'remember_token' => Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function hausverwaltung(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => Role::Hausverwaltung,
        ]);
    }

    public function hausmeister(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => Role::Hausmeister,
        ]);
    }
}
