# Account Switcher - React Setup

Aplikasi Account Switcher telah berhasil dikonversi dari HTML/CSS/JS menjadi React dengan shadcn/ui dan Tailwind CSS.

## 🚀 Fitur-fitur React

### Komponen-komponen Utama
- **Header**: Menampilkan judul aplikasi dan domain saat ini
- **ActionButtons**: Tombol untuk save session dan new session
- **SessionList**: Daftar session yang tersimpan dengan aksi rename/delete
- **Modals**: Dialog untuk save, rename, delete, dan error handling

### Teknologi Stack
- ⚛️ **React 18**: Framework JavaScript untuk UI
- 🎨 **Tailwind CSS**: Utility-first CSS framework
- 🧩 **shadcn/ui**: Komponen UI yang modern dan accessible
- 📦 **TypeScript**: Type safety untuk JavaScript
- ⚡ **esbuild**: Bundler yang cepat untuk development

## 🛠️ Setup Development

### Prerequisites
```bash
node >= 18.16.0
npm >= 9.x
```

### Installation
```bash
# Install dependencies
npm install

# Build untuk Chrome
npm run build:chrome

# Build untuk Firefox
npm run build:firefox
```

### Development
```bash
# Watch mode untuk development
npm run dev:chrome

# Testing
npm run test:server
```

## 📁 Struktur Folder React

```
src/
├── components/ui/          # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── input.tsx
├── popup/
│   ├── components/         # React components
│   │   ├── Header.tsx
│   │   ├── ActionButtons.tsx
│   │   ├── SessionList.tsx
│   │   └── Modals.tsx
│   ├── App.tsx            # Main React app
│   ├── index.tsx          # React entry point
│   ├── index.html         # Simplified HTML
│   └── globals.css        # Tailwind CSS
├── lib/
│   └── utils.ts           # Utility functions
```

## 🎨 Styling dengan Tailwind

### CSS Variables
Aplikasi menggunakan CSS variables untuk theme consistency:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  /* ... */
}
```

### Responsive Design
- Width: 350px (optimal untuk Chrome extension popup)
- Min-height: 400px
- Responsif dengan Tailwind utilities

## 🔧 Build Configuration

### esbuild Config
```javascript
// React JSX processing
jsx: "automatic"
loader: {
  ".tsx": "tsx",
  ".ts": "ts", 
  ".css": "css"
}
external: ["chrome"]
```

### TypeScript Config
```json
{
  "jsx": "react-jsx",
  "allowSyntheticDefaultImports": true,
  "types": ["chrome", "react", "react-dom"]
}
```

## 🧪 Testing

Extension dapat ditest dengan:
1. Load sebagai unpacked extension di Chrome
2. Klik icon extension di toolbar
3. UI React akan muncul dengan styling shadcn/ui

## 📈 Performance

### Bundle Sizes
- **React App**: ~1.1MB (includes React + shadcn/ui)
- **CSS**: ~965B (Tailwind purged)
- **Background Script**: ~17.4KB

### Optimizations
- Tree shaking dengan esbuild
- CSS purging dengan Tailwind
- External Chrome APIs untuk mengurangi bundle size

## 🔄 Migration Notes

### Dari HTML ke React:
1. ✅ Vanilla JS → React components
2. ✅ CSS modules → Tailwind classes  
3. ✅ DOM manipulation → React state
4. ✅ Event listeners → React event handlers
5. ✅ Manual modals → shadcn/ui dialogs

### Breaking Changes:
- HTML structure sekarang dirender oleh React
- CSS classes menggunakan Tailwind utilities
- Event handling menggunakan React patterns
- State management dengan useState hooks

## 🐛 Troubleshooting

### Common Issues:
1. **Build errors**: Pastikan semua dependencies terinstall
2. **CSS tidak load**: Check link href di index.html
3. **React errors**: Check browser console untuk error details
4. **Extension errors**: Check Chrome extension console

### Debug Mode:
```bash
# Build dengan sourcemaps
npm run build:chrome -- --sourcemap

# Check logs
console.log("React app loaded successfully")
```

---

✨ **Selamat!** Aplikasi Account Switcher sekarang menggunakan React modern stack dengan shadcn/ui yang beautiful dan accessible.
