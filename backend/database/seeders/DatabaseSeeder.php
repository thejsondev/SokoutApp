<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $hm = User::query()->firstOrNew(['email' => 'hm@sokout.app']);

        if (! $hm->exists) {
            $hm->password = Str::password(16);
        }

        $hm->fill([
            'first_name' => 'Thomas',
            'last_name' => 'Berger',
            'address' => 'Leopoldstraße 8, 80802 München',
            'phone' => '+498912345678',
            'role' => Role::Hausmeister,
            'email_verified_at' => now(),
        ]);

        $hm->save();
    }
}
