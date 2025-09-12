import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase/client';

interface Product {
  id: string;
  name: string;
  image_url?: string;
  images?: string[] | any[];
}

export const ImageDebugger: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('id, name, image_url, images')
          .limit(5);

        if (error) {
          throw error;
        }

        console.log('🔍 Raw Supabase products data:', data);
        setProducts(data || []);
      } catch (err) {
        console.error('❌ Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const testImageUrl = async (url: string) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return {
        url,
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      };
    } catch (err) {
      return {
        url,
        status: 0,
        ok: false,
        statusText: err instanceof Error ? err.message : 'Network error'
      };
    }
  };

  const handleTestUrl = async (url: string) => {
    console.log('🧪 Testing URL:', url);
    const result = await testImageUrl(url);
    console.log('📊 URL Test Result:', result);
    alert(`URL: ${url}\nStatus: ${result.status}\nOK: ${result.ok}\nMessage: ${result.statusText}`);
  };

  if (loading) {
    return <div className="p-4">Loading products for debugging...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🔍 Image URL Debugger</h2>
      
      <div className="space-y-4">
        {products.map((product) => (
          <div key={product.id} className="border p-4 rounded-lg">
            <h3 className="font-semibold">{product.name}</h3>
            <p className="text-sm text-gray-600">ID: {product.id}</p>
            
            <div className="mt-2">
              <h4 className="font-medium">Raw Data:</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify({ 
                  image_url: product.image_url, 
                  images: product.images 
                }, null, 2)}
              </pre>
            </div>

            <div className="mt-2">
              <h4 className="font-medium">Generated URLs:</h4>
              <div className="space-y-2">
                {/* Test old image_url format */}
                {product.image_url && (
                  <div className="border-l-4 border-blue-500 pl-3">
                    <p className="text-sm font-medium">From image_url:</p>
                    {product.image_url.startsWith('/images/') ? (
                      <div>
                        <p className="text-xs">Path with /images/ prefix → Storage URL</p>
                        <button
                          onClick={() => handleTestUrl(`https://xsgumgcioyaehccvklbr.supabase.co/storage/v1/object/public/product-images${product.image_url}`)}
                          className="text-blue-600 underline text-sm"
                        >
                          Test: https://xsgumgcioyaehccvklbr.supabase.co/storage/v1/object/public/product-images{product.image_url}
                        </button>
                      </div>
                    ) : product.image_url.startsWith('http') ? (
                      <div>
                        <p className="text-xs">Full HTTP URL</p>
                        <button
                          onClick={() => handleTestUrl(product.image_url!)}
                          className="text-blue-600 underline text-sm"
                        >
                          Test: {product.image_url}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs">Storage path → Full URL</p>
                        <button
                          onClick={() => handleTestUrl(`https://xsgumgcioyaehccvklbr.supabase.co/storage/v1/object/public/product-images/${product.image_url}`)}
                          className="text-blue-600 underline text-sm"
                        >
                          Test: https://xsgumgcioyaehccvklbr.supabase.co/storage/v1/object/public/product-images/{product.image_url}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Test new images array */}
                {product.images && Array.isArray(product.images) && product.images.length > 0 && (
                  <div className="border-l-4 border-green-500 pl-3">
                    <p className="text-sm font-medium">From images array:</p>
                    {product.images.map((img, index) => (
                      <div key={index} className="mt-1">
                        <button
                          onClick={() => handleTestUrl(typeof img === 'string' ? img : String(img))}
                          className="text-green-600 underline text-sm block"
                        >
                          Test [{index}]: {typeof img === 'string' ? img : String(img)}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h4 className="font-medium text-yellow-800">🎯 Instructions:</h4>
        <ol className="text-sm text-yellow-700 mt-2 space-y-1">
          <li>1. Click on the "Test:" links to check if image URLs are accessible</li>
          <li>2. Check the browser network tab for detailed error responses</li>
          <li>3. Check the console for raw data structure</li>
          <li>4. Compare expected URLs vs actual storage structure</li>
        </ol>
      </div>
    </div>
  );
};

export default ImageDebugger;