# 🧪 Session Switcher Extension - Testing Guide

Guide ini menjelaskan cara test extension tanpa perlu load ke Chrome.

## 🚀 **Cara Test Extension:**

### **Opsi 1: Test Popup HTML/CSS Langsung di Browser**

1. **Buka file test:**
   ```
   test/popup-test.html
   ```
2. **Fitur yang bisa ditest:**
   - ✅ Popup preview dan styling
   - ✅ Button functionality
   - ✅ CSS styling dan layout
   - ✅ Console logging

### **Opsi 2: Test dengan Live Server**

1. **Install http-server (jika belum):**

   ```bash
   npm install -g http-server
   ```

2. **Jalankan test server:**

   ```bash
   yarn test:server
   # atau
   npm run test:server
   ```

3. **Buka browser ke:**
   ```
   http://localhost:3000
   ```

### **Opsi 3: Test JavaScript Functions di Console**

1. **Buka file test:**

   ```
   test/extension-test.js
   ```

2. **Load di browser console atau buat script tag:**

   ```html
   <script src="test/extension-test.js"></script>
   ```

3. **Jalankan test:**

   ```javascript
   // Run semua test
   ExtensionTester.runAllTests();

   // Atau test individual
   ExtensionTester.testStorage();
   ExtensionTester.testTabs();
   ExtensionTester.testCookies();
   ExtensionTester.testSessionManagement();
   ExtensionTester.testUIInteractions();
   ```

## 📋 **Test yang Tersedia:**

### **🧪 Popup Test (popup-test.html)**

- **Popup Preview**: Lihat bagaimana popup akan terlihat
- **Button Testing**: Test fungsi button tanpa extension
- **CSS Styling**: Verifikasi styling dan layout
- **Console Logging**: Test JavaScript functionality

### **🔧 Extension Functions Test (extension-test.js)**

- **Storage API**: Test chrome.storage.local
- **Tabs API**: Test chrome.tabs.query
- **Cookies API**: Test chrome.cookies.getAll
- **Session Management**: Test session switching logic
- **UI Interactions**: Test button click behaviors

### **🌐 Mock Chrome API**

- **chrome.storage.local**: Simulate storage operations
- **chrome.tabs**: Simulate tabs data
- **chrome.cookies**: Simulate cookies data

## 🎯 **Cara Test Button Functions:**

### **1. Test Button Click:**

```javascript
// Di browser console
testButton("primary"); // Test primary button
testButton("secondary"); // Test secondary button
testButton("success"); // Test success button
testButton("danger"); // Test danger button
```

### **2. Test Extension Functions:**

```javascript
// Test storage
ExtensionTester.testStorage();

// Test tabs
ExtensionTester.testTabs();

// Test session management
ExtensionTester.testSessionManagement();
```

### **3. Test UI Interactions:**

```javascript
// Simulate button clicks
ExtensionTester.testUIInteractions();
```

## 📁 **File Structure:**

```
test/
├── README.md                    # This file
├── popup-test.html             # Main test page
├── extension-test.js            # Extension functions test
└── start-test-server.js        # Custom test server (optional)
```

## 🔍 **Debugging Tips:**

### **1. Console Logs:**

- Buka Developer Tools (F12)
- Lihat Console tab untuk log messages
- Semua test functions akan log ke console

### **2. Network Tab:**

- Monitor network requests
- Check file loading errors
- Verify resource paths

### **3. Elements Tab:**

- Inspect HTML structure
- Check CSS styling
- Verify DOM manipulation

## 🚨 **Troubleshooting:**

### **File Not Found:**

- Pastikan extension sudah di-build (`yarn build:chrome`)
- Check path di test files
- Verify file permissions

### **JavaScript Errors:**

- Check console for error messages
- Verify file paths in script tags
- Check browser compatibility

### **Styling Issues:**

- Verify CSS file paths
- Check CSS syntax
- Inspect element styles

## 💡 **Best Practices:**

1. **Test sebelum build**: Test UI dan functions sebelum load ke Chrome
2. **Use console logging**: Tambah log untuk debugging
3. **Mock data**: Gunakan mock data untuk testing
4. **Cross-browser**: Test di berbagai browser
5. **Responsive**: Test di berbagai ukuran screen

## 🎉 **Next Steps:**

Setelah test berhasil:

1. **Load extension ke Chrome** untuk full testing
2. **Test di real environment** dengan actual websites
3. **Debug real issues** yang tidak terdeteksi di mock environment

---

**Happy Testing! 🧪✨**
