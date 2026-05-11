-- Rename brew_preset table to preset and update all constraint/index/policy names

alter table brew_preset rename to preset;

-- Primary key constraint
alter index brew_preset_pkey rename to preset_pkey;

-- Foreign key constraints
alter table preset rename constraint brew_preset_user_id_fkey to preset_user_id_fkey;

-- RLS policies
alter policy "brew_preset_select" on preset rename to "preset_select";
alter policy "brew_preset_insert" on preset rename to "preset_insert";
alter policy "brew_preset_update" on preset rename to "preset_update";
alter policy "brew_preset_delete" on preset rename to "preset_delete";
