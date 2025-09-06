const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

async function addSequinDress() {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables. Check your .env.local file.');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Product data based on user's request - using basic fields that should exist
    const productData = {
      name: 'Sequin Party Dress',
      category: 'Party',
      price: 2456.00,
      description: 'new stuff',
      images: [] // Empty for now, can add images separately
    };

    console.log('Adding product:', productData);

    // Insert product
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return;
    }

    console.log('Product created successfully:', data);
    console.log('Product ID:', data.id);

  } catch (error) {
    console.error('Failed to add product:', error);
  }
}

// Run the function
addSequinDress();
