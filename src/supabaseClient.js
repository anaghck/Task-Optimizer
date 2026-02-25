import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project details
// You can get these from your Supabase Dashboard -> Settings -> API
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);

/* 
INSTRUCTIONS TO SYNC DATA:
1. Install Supabase: npm install @supabase/supabase-js
2. In App.jsx, import { supabase } from './supabaseClient'
3. Replace your useEffect [tasks] with an async function:

   const fetchTasks = async () => {
     let { data: tasks, error } = await supabase
       .from('tasks')
       .select('*')
     if (tasks) setTasks(tasks);
   };

4. Update your addTask function to use:
   await supabase.from('tasks').insert([task]);
*/
