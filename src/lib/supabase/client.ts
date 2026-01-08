
import { createClient } from '@supabase/supabase-js';

// Hardcoded values to ensure client works regardless of build environment
const url = 'https://bzxjsdtkoakscmeuthlu.supabase.co';
const key = 'sb_publishable_ksSZeGQ4toGfqLttrL7Vsw_8Vq2AVxi';

export const supabase = createClient(url, key);
