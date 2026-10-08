<?php

namespace App\Http\Requests\Chat;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Validator;

class StoreChatMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'body' => ['nullable', 'string'],
            'files' => ['nullable', 'array', 'max:10'],
            'files.*' => ['file', 'max:20480'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $body = trim((string) $this->input('body', ''));
            $files = $this->file('files', []);

            if ($files instanceof UploadedFile) {
                $files = [$files];
            }

            if ($body === '' && count($files) === 0) {
                $validator->errors()->add('body', 'Bitte Text, Foto oder Sprachnachricht angeben.');
            }

            foreach ($files as $index => $file) {
                if (! $file instanceof UploadedFile) {
                    continue;
                }

                $mime = (string) ($file->getClientMimeType() ?: '');
                $name = strtolower($file->getClientOriginalName());
                $isImage = str_starts_with($mime, 'image/')
                    || preg_match('/\.(jpe?g|png|webp|heic|heif)$/', $name);
                $isAudio = str_starts_with($mime, 'audio/')
                    || preg_match('/\.(webm|ogg|mp3|mp4|m4a|wav|aac|mpeg)$/', $name);

                if (! $isImage && ! $isAudio) {
                    $validator->errors()->add("files.$index", 'Nur Fotos oder Audiodateien sind erlaubt.');
                }
            }
        });
    }
}
