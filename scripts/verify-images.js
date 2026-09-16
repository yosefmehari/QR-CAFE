const https = require('https');

const imageUrls = {
  'Classic Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
  'Cheese Burger': 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop&q=80',
  'Chicken Burger': 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800&auto=format&fit=crop&q=80',
  'Chicken Pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80',
  'Cheese Pizza': 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=800&auto=format&fit=crop&q=80',
  'Vegetable Pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
  'Coca Cola': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=80',
  'Sprite': 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=800&auto=format&fit=crop&q=80',
  'Fresh Orange Juice': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&auto=format&fit=crop&q=80',
  'Mango Juice': 'https://images.unsplash.com/photo-1546173159-315724a31696?w=800&auto=format&fit=crop&q=80',
  'Cappuccino': 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=800&auto=format&fit=crop&q=80',
  'Espresso': 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&auto=format&fit=crop&q=80',
  'Pancakes': 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&auto=format&fit=crop&q=80',
  'Chocolate Cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80'
};

async function checkUrl(name, url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      console.log(`[${res.statusCode === 200 ? 'OK' : res.statusCode}] ${name} -> Content-Type: ${res.headers['content-type']}`);
      resolve(res.statusCode === 200);
    }).on('error', (e) => {
      console.error(`[ERR] ${name}: ${e.message}`);
      resolve(false);
    });
  });
}

async function verifyAll() {
  console.log('Verifying all food image URLs:');
  for (const [name, url] of Object.entries(imageUrls)) {
    await checkUrl(name, url);
  }
}

verifyAll();
