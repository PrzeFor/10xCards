# Database Schema

## 1. Tables

- **users** (Supabase Auth)
    This table   is managed by Supabase Auth.

  - `id` UUID PRIMARY KEY  
  - `email` VARCHAR(255) NOT NULL UNIQUE  
  - `encrypted_password` VARCHAR NOT NULL  
  - `confirmed_at` TIMESTAMPTZ  
  - `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()  
  - `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()  

- **flashcards**
  - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()  
  - `user_id` UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE  
  - `generation_id` UUID REFERENCES generations(id) ON DELETE SET NULL  
  - `front` VARCHAR(300) NOT NULL  
  - `back` VARCHAR(500) NOT NULL  
  - `source` flashcard_source NOT NULL  
  - `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()  
  - `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()  

- **generations**
  - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()  
  - `model` VARCHAR NOT NULL
  - `user_id` UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE  
  - `generated_count` INTEGER NOT NULL
  - `accepted_unedited_count` INTEGER NULLABLE
  - `accepted_edited_count` INTEGER NULLABLE
  - `source_text` VARCHAR NOT NULL
  - `source_text_length` INTEGER NOT NULL CHECK (source_text_length) BETWEEN 500 AND 15000)  
  - `status` generation_status NOT NULL  
  - `generation_druration` INTEGER NOT NULL DEFAULT
  - `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()  
  - `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()  

- **generation_error_logs**
  - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()  
  - `generation_id` UUID NOT NULL REFERENCES generations(id) ON DELETE CASCADE  
  - `error_message` VARCHAR(1000) NOT NULL  
  - `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()  

## 2. Relationships

- `users` 1—* `flashcards` (`user_id`)  
- `users` 1—* `generations` (`user_id`)  
- `generations` 1—* `flashcards` (`generation_id`)  
- `generations` 1—* `generation_error_logs` (`generation_id`)  

## 3. Indexes

```sql
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_generation_id ON flashcards(generation_id);
CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_status ON generations(status);
CREATE INDEX idx_error_logs_generation_id ON generation_error_logs(generation_id);
```

## 4. PostgreSQL Policies (RLS)

- Enable RLS on `flashcards`, `generations`, and `generation_error_logs` tables.
- For `flashcards` and `generations`:
  - USING (auth.uid() = user_id)  
  - WITH CHECK (auth.uid() = user_id)  
- For `generation_error_logs`:
  - USING (auth.uid() = (SELECT user_id FROM generations WHERE id = generation_error_logs.generation_id))  
  - WITH CHECK (auth.uid() = (SELECT user_id FROM generations WHERE id = generation_error_logs.generation_id))  

## 5. Additional Notes

- For the `flashcards` table, there is a trigger `trg_flashcards_updated_at` BEFORE UPDATE ON flashcards invoking the `set_updated_at()` function.

- ENUM Types:
  - `flashcard_source`: ('ai_full', 'ai_edited', 'manual')  
  - `generation_status`: ('pending', 'completed', 'failed')  
- Trigger for automatically setting `updated_at`:
  ```sql
  CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS trigger AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER trg_flashcards_updated_at
    BEFORE UPDATE ON flashcards
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

  CREATE TRIGGER trg_generations_updated_at
    BEFORE UPDATE ON generations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  ```
- Migrations managed using the `pg-migrate` tool.  
- Cascading deletes (`ON DELETE CASCADE`) instead of soft deletes; if necessary, it can be extended with an `is_deleted` flag.
