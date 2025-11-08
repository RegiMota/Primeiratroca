export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string | { id: number; name: string; slug: string; description?: string; createdAt?: Date; updatedAt?: Date };
  image: string;
  sizes: string[];
  colors: string[];
  featured: boolean;
  stock: number;
}

export const products: Product[] = [
  {
    id: 1,
    name: "Rainbow Striped Dress",
    description: "Beautiful rainbow striped dress perfect for summer days. Made with soft, breathable cotton for maximum comfort.",
    price: 45.99,
    originalPrice: 59.99,
    category: "Dresses",
    image: "https://images.unsplash.com/photo-1759313560222-b73784cd42f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsZHJlbiUyMGRyZXNzJTIwZmFzaGlvbnxlbnwxfHx8fDE3NjIwNDExMDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    sizes: ["2T", "3T", "4T", "5T", "6T"],
    colors: ["Multi-color"],
    featured: true,
    stock: 25
  },
  {
    id: 2,
    name: "Cool Graphic Tee",
    description: "Trendy graphic t-shirt featuring fun designs kids love. 100% cotton for all-day comfort.",
    price: 24.99,
    category: "Tops",
    image: "https://images.unsplash.com/photo-1607454317633-a30150d568a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWRzJTIwc2hpcnQlMjBjYXN1YWx8ZW58MXx8fHwxNzYyMDQxMTA4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["White", "Blue", "Pink"],
    featured: true,
    stock: 40
  },
  {
    id: 3,
    name: "Colorful Kids Sneakers",
    description: "Vibrant and comfortable sneakers perfect for active kids. Non-slip sole for safety.",
    price: 54.99,
    originalPrice: 69.99,
    category: "Shoes",
    image: "https://images.unsplash.com/photo-1707013537977-90e0a6cfa484?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsZHJlbiUyMHNob2VzJTIwc25lYWtlcnN8ZW58MXx8fHwxNzYyMDQxMTA4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    sizes: ["10", "11", "12", "13", "1"],
    colors: ["Blue", "Pink", "Yellow"],
    featured: true,
    stock: 30
  },
  {
    id: 4,
    name: "Cozy Winter Jacket",
    description: "Warm and stylish jacket to keep your little ones cozy during cold days. Water-resistant outer layer.",
    price: 79.99,
    category: "Outerwear",
    image: "https://images.unsplash.com/photo-1513978121979-75bfaa6a713b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWRzJTIwamFja2V0JTIwb3V0ZXJ3ZWFyfGVufDF8fHx8MTc2MjA0MTEwOXww&ixlib=rb-4.1.0&q=80&w=1080",
    sizes: ["2T", "3T", "4T", "5T", "6T"],
    colors: ["Navy", "Red", "Green"],
    featured: false,
    stock: 20
  },
  {
    id: 5,
    name: "Comfy Denim Jeans",
    description: "Classic denim jeans with stretch for extra comfort. Perfect for everyday wear.",
    price: 34.99,
    category: "Bottoms",
    image: "https://images.unsplash.com/photo-1713268527421-44e7ce8b91d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsZHJlbiUyMHBhbnRzJTIwamVhbnN8ZW58MXx8fHwxNzYyMDQxMTA5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    sizes: ["2T", "3T", "4T", "5T", "6T"],
    colors: ["Blue", "Black"],
    featured: false,
    stock: 35
  },
  {
    id: 6,
    name: "Playful Print Dress",
    description: "Adorable dress with playful prints. Perfect for parties and special occasions.",
    price: 39.99,
    category: "Dresses",
    image: "https://images.unsplash.com/photo-1637379190964-8fb8db306fbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWRzJTIwY2xvdGhpbmclMjBjb2xvcmZ1bHxlbnwxfHx8fDE3NjIwNDExMDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    sizes: ["2T", "3T", "4T", "5T", "6T"],
    colors: ["Pink", "Purple", "Yellow"],
    featured: true,
    stock: 28
  },
  {
    id: 7,
    name: "Summer Shorts Set",
    description: "Comfortable shorts perfect for summer adventures. Elastic waistband for easy fit.",
    price: 29.99,
    category: "Bottoms",
    image: "https://images.unsplash.com/photo-1607454317633-a30150d568a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWRzJTIwc2hpcnQlMjBjYXN1YWx8ZW58MXx8fHwxNzYyMDQxMTA4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Khaki", "Navy", "Gray"],
    featured: false,
    stock: 45
  },
  {
    id: 8,
    name: "Sporty Running Shoes",
    description: "Athletic shoes designed for active kids. Lightweight and breathable with excellent support.",
    price: 49.99,
    category: "Shoes",
    image: "https://images.unsplash.com/photo-1707013537977-90e0a6cfa484?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsZHJlbiUyMHNob2VzJTIwc25lYWtlcnN8ZW58MXx8fHwxNzYyMDQxMTA4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    sizes: ["10", "11", "12", "13", "1", "2"],
    colors: ["Black", "White", "Red"],
    featured: false,
    stock: 33
  },
  {
    id: 9,
    name: "Cozy Knit Sweater",
    description: "Soft knitted sweater to keep kids warm. Perfect for layering during fall and winter.",
    price: 42.99,
    originalPrice: 54.99,
    category: "Tops",
    image: "https://images.unsplash.com/photo-1758782213532-bbb5fd89885e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWRzJTIwc3dlYXRlciUyMGNsb3RoaW5nfGVufDF8fHx8MTc2MjA0MTUxNnww&ixlib=rb-4.1.0&q=80&w=1080",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Beige", "Gray", "Navy"],
    featured: true,
    stock: 22
  },
  {
    id: 10,
    name: "Fun Character Hat",
    description: "Adorable hat with fun character designs. Protects from sun and adds style.",
    price: 19.99,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1759271313564-3640548f95bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsZHJlbiUyMGFjY2Vzc29yaWVzJTIwaGF0fGVufDF8fHx8MTc2MjA0MTUxN3ww&ixlib=rb-4.1.0&q=80&w=1080",
    sizes: ["One Size"],
    colors: ["Blue", "Pink", "Yellow", "Red"],
    featured: false,
    stock: 50
  },
  {
    id: 11,
    name: "School Backpack",
    description: "Durable and spacious backpack for school. Multiple compartments for organized storage.",
    price: 39.99,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1631126279646-e1843e7db9d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWRzJTIwYmFja3BhY2slMjBzY2hvb2x8ZW58MXx8fHwxNzYyMDQxNTE3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    sizes: ["Small", "Medium", "Large"],
    colors: ["Blue", "Pink", "Black", "Green"],
    featured: false,
    stock: 30
  },
  {
    id: 12,
    name: "Beach Swimsuit Set",
    description: "Colorful swimsuit perfect for beach and pool days. Quick-dry material with UV protection.",
    price: 32.99,
    category: "Swimwear",
    image: "https://images.unsplash.com/photo-1621886671500-66a77b03e75d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsZHJlbiUyMHN3aW1zdWl0JTIwYmVhY2h8ZW58MXx8fHwxNzYyMDQxNTE3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    sizes: ["2T", "3T", "4T", "5T", "6T"],
    colors: ["Blue", "Pink", "Rainbow"],
    featured: false,
    stock: 38
  },
  {
    id: 13,
    name: "Striped Polo Shirt",
    description: "Classic polo shirt with stripes. Smart casual style for any occasion.",
    price: 27.99,
    category: "Tops",
    image: "https://images.unsplash.com/photo-1607454317633-a30150d568a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWRzJTIwc2hpcnQlMjBjYXN1YWx8ZW58MXx8fHwxNzYyMDQxMTA4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Navy", "Red", "Green"],
    featured: false,
    stock: 42
  },
  {
    id: 14,
    name: "Floral Summer Dress",
    description: "Light and breezy dress with beautiful floral patterns. Perfect for warm weather.",
    price: 36.99,
    originalPrice: 44.99,
    category: "Dresses",
    image: "https://images.unsplash.com/photo-1759313560222-b73784cd42f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsZHJlbiUyMGRyZXNzJTIwZmFzaGlvbnxlbnwxfHx8fDE3NjIwNDExMDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    sizes: ["2T", "3T", "4T", "5T", "6T"],
    colors: ["Pink", "Blue", "Yellow"],
    featured: true,
    stock: 26
  },
  {
    id: 15,
    name: "Cargo Pants",
    description: "Practical cargo pants with multiple pockets. Durable fabric for active play.",
    price: 38.99,
    category: "Bottoms",
    image: "https://images.unsplash.com/photo-1713268527421-44e7ce8b91d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsZHJlbiUyMHBhbnRzJTIwamVhbnN8ZW58MXx8fHwxNzYyMDQxMTA5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    sizes: ["2T", "3T", "4T", "5T", "6T"],
    colors: ["Khaki", "Olive", "Navy"],
    featured: false,
    stock: 31
  },
  {
    id: 16,
    name: "Rain Jacket",
    description: "Waterproof rain jacket with hood. Keeps kids dry during rainy days.",
    price: 44.99,
    category: "Outerwear",
    image: "https://images.unsplash.com/photo-1513978121979-75bfaa6a713b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWRzJTIwamFja2V0JTIwb3V0ZXJ3ZWFyfGVufDF8fHx8MTc2MjA0MTEwOXww&ixlib=rb-4.1.0&q=80&w=1080",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Yellow", "Blue", "Red"],
    featured: false,
    stock: 24
  }
];

export const categories = [
  "All",
  "Dresses",
  "Tops",
  "Bottoms",
  "Shoes",
  "Outerwear",
  "Accessories",
  "Swimwear"
];

export interface Order {
  id: number;
  date: string;
  status: "pending" | "processing" | "shipped" | "delivered";
  total: number;
  items: {
    product: Product;
    quantity: number;
    size: string;
    color: string;
  }[];
}

export const mockOrders: Order[] = [
  {
    id: 1001,
    date: "2025-10-28",
    status: "delivered",
    total: 124.97,
    items: [
      {
        product: products[0],
        quantity: 1,
        size: "4T",
        color: "Multi-color"
      },
      {
        product: products[1],
        quantity: 2,
        size: "M",
        color: "Blue"
      }
    ]
  },
  {
    id: 1002,
    date: "2025-10-30",
    status: "shipped",
    total: 79.99,
    items: [
      {
        product: products[3],
        quantity: 1,
        size: "5T",
        color: "Navy"
      }
    ]
  }
];
