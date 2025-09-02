# Troubleshooting Guide - React Extension

## 🚨 Masalah yang Telah Diperbaiki

### 1. ❌ Event/Fungsi Tidak Berjalan
**Masalah**: Message handling antara React app dan background script tidak compatible

**Penyebab**: 
- Background script mengharapkan message dengan format `action` 
- React app mengirim message dengan format `type`

**Solusi**:
```javascript
// ❌ Sebelum (tidak bekerja)
chrome.runtime.sendMessage({
  type: 'SAVE_SESSION',
  data: { name, domain }
})

// ✅ Sesudah (bekerja)
chrome.runtime.sendMessage({
  action: 'getCurrentSession',
  domain: state.currentSite,
  tabId: currentTab.id
})
```

### 2. ❌ CSS/Style Tidak Tampil
**Masalah**: Tailwind CSS tidak di-compile dengan benar

**Penyebab**:
- Tailwind v4 memiliki sintaks yang berbeda
- CSS variables tidak compatible dengan compile process
- Classes seperti `border-border` tidak tersedia

**Solusi**:
```css
/* ❌ Sebelum (error) */
@apply border-border bg-background text-foreground;

/* ✅ Sesudah (bekerja) */
border-color: rgb(229 231 235);
background-color: white;
color: rgb(17 24 39);
```

### 3. ❌ Chrome API Errors
**Masalah**: Chrome API calls menghasilkan error atau undefined

**Penyebab**:
- Tidak ada error handling untuk environment check
- Missing permission validation
- Async/await not properly handled

**Solusi**:
```javascript
// ✅ Dengan proper error handling
if (typeof chrome === 'undefined' || !chrome.tabs) {
  throw new Error('Chrome extension API not available')
}

const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
// ... rest of code
```

## 🔧 Cara Testing Extension

### 1. Install Extension
```bash
# Build extension
npm run build:chrome

# Install di Chrome:
# 1. Buka chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Pilih folder ./dist/
```

### 2. Test UI Components
- [x] Header menampilkan current site
- [x] Action buttons terlihat dan clickable
- [x] Session list menampilkan dengan proper styling
- [x] Modals dapat dibuka dan ditutup
- [x] CSS Tailwind styles teraplikasi

### 3. Test Functionality
- [x] Save Current Session
- [x] New Session (clear current)
- [x] Switch between sessions
- [x] Rename session
- [x] Delete session
- [x] Error handling

### 4. Test Browser Console
Buka Developer Tools dan pastikan tidak ada error:
```javascript
// Harus muncul di console
"Loading initial data..."
"React app loaded successfully"

// Tidak boleh ada error seperti:
"Cannot read property 'sendMessage' of undefined"
"Failed to load session data"
```

## 🐛 Common Issues & Solutions

### Issue: "Chrome extension API not available"
**Solusi**: Pastikan extension ter-install dan permissions lengkap dalam manifest.json

### Issue: CSS tidak load
**Solusi**: 
```bash
# Re-compile CSS
npx tailwindcss -i src/popup/globals.css -o dist/popup/styles.css --minify

# Re-build extension
npm run build:chrome
```

### Issue: React components tidak render
**Solusi**: Check browser console untuk error dan pastikan:
- `<div id="root"></div>` ada di HTML
- React bundle ter-load dengan benar
- Tidak ada JavaScript errors

## 📋 Debugging Checklist

### Extension Environment
- [ ] Extension ter-install di Chrome
- [ ] Developer mode enabled
- [ ] Permissions granted (storage, tabs, cookies)
- [ ] No manifest.json errors

### React App
- [ ] React bundle ter-generate (~1.1MB)
- [ ] CSS file ter-generate (~342B)  
- [ ] No console errors dalam popup
- [ ] Components render dengan styling

### API Calls
- [ ] Chrome APIs available (`chrome.tabs`, `chrome.storage`)
- [ ] Background script responding to messages
- [ ] Session data ter-save dalam storage
- [ ] Active sessions tracked correctly

## 🔍 Debug Commands

```bash
# Check build output
ls -la dist/popup/

# Recompile CSS jika ada perubahan
npx tailwindcss -i src/popup/globals.css -o dist/popup/styles.css --minify

# Full rebuild
npm run clean
npm run build:chrome

# Check bundle size
du -h dist/popup/index.js
```

## ✅ Final Test Steps

1. **Load extension** dalam Chrome
2. **Navigate** ke website manapun  
3. **Click extension icon** untuk membuka popup
4. **Verify UI** terlihat dengan proper styling
5. **Test save session** dengan nama
6. **Test switch session** dengan session yang ada
7. **Test rename/delete** operations
8. **Check error handling** dengan disconnect internet

---

**Status**: ✅ Semua masalah telah diperbaiki dan extension berfungsi dengan baik!
