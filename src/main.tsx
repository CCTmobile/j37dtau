
  import { createBrowserRouter, RouterProvider } from 'react-router-dom'
  import { StrictMode } from 'react'
  import { createRoot } from 'react-dom/client'
  import './index.css'

  // Your route components
  import App from './App'
  import { Home } from './components/Home'
  import { ProductCatalog } from './components/ProductCatalog'
  // ... other imports

  // Router configuration for GitHub Pages
  const router = createBrowserRouter([
    {
      path: "/",
      element: <App />,
      children: [
        {
          index: true,
          element: <Home onViewProduct={() => {}} onNavigateToCategory={() => {}} />
        },
        {
          path: "products",
          element: <ProductCatalog searchQuery="" selectedCategory="All" onViewProduct={() => {}} onCategoryChange={() => {}} />
        },
      // ... other routes
      ]
    }
  ], {
    // For custom domain, use root path
    basename: "/"
  })

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
