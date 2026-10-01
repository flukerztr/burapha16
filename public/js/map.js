// Leaflet GPS & Interactive Mapping Module
const MapManager = {
  pickerMap: null,
  pickerMarker: null,
  explorerMap: null,
  explorerMarkers: [],
  detailMap: null,
  detailMarker: null,

  // Default coordinate: Burapha University, Bangsaen, Chonburi
  DEFAULT_LAT: 13.2835,
  DEFAULT_LNG: 100.9240,

  // Initialize GPS picker map inside Create/Edit modal
  initPickerMap(initialLat, initialLng) {
    const lat = initialLat || this.DEFAULT_LAT;
    const lng = initialLng || this.DEFAULT_LNG;

    const container = document.getElementById('picker-map-container');
    if (!container) return;

    if (!this.pickerMap) {
      this.pickerMap = L.map('picker-map-container').setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.pickerMap);

      this.pickerMarker = L.marker([lat, lng], { draggable: true }).addTo(this.pickerMap);

      // On marker drag
      this.pickerMarker.on('dragend', (e) => {
        const coord = e.target.getLatLng();
        this.updatePickerInputs(coord.lat, coord.lng);
      });

      // On map click
      this.pickerMap.on('click', (e) => {
        this.pickerMarker.setLatLng(e.latlng);
        this.updatePickerInputs(e.latlng.lat, e.latlng.lng);
      });
    } else {
      this.pickerMap.setView([lat, lng], 15);
      this.pickerMarker.setLatLng([lat, lng]);
      this.pickerMap.invalidateSize();
    }

    this.updatePickerInputs(lat, lng);
  },

  updatePickerInputs(lat, lng) {
    const latInput = document.getElementById('post-lat');
    const lngInput = document.getElementById('post-lng');
    if (latInput) latInput.value = Number(lat).toFixed(6);
    if (lngInput) lngInput.value = Number(lng).toFixed(6);
  },

  // Search place by name using Geocoding (แก้ปัญหาเลื่อนหมุดไกลหรือหาไม่เจอ)
  async searchPlace() {
    const input = document.getElementById('map-search-query');
    const query = input ? input.value.trim() : '';
    if (!query) {
      alert('กรุณากรอกชื่อสถานที่ที่ต้องการค้นหา');
      return;
    }

    const btn = document.getElementById('map-search-btn');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังค้นหา...';

    try {
      // 1. Search with Chonburi bias first
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' ชลบุรี')}&limit=1`;
      let res = await fetch(url);
      let data = await res.json();

      // 2. Fallback search query directly
      if (!data || data.length === 0) {
        const urlFallback = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        res = await fetch(urlFallback);
        data = await res.json();
      }

      if (data && data.length > 0) {
        const place = data[0];
        const lat = parseFloat(place.lat);
        const lng = parseFloat(place.lon);

        if (this.pickerMap && this.pickerMarker) {
          this.pickerMap.setView([lat, lng], 16);
          this.pickerMarker.setLatLng([lat, lng]);
          this.updatePickerInputs(lat, lng);
        }

        const locationInput = document.getElementById('post-location-input');
        if (locationInput && (!locationInput.value.trim() || locationInput.value === 'มหาวิทยาลัยบูรพา ชลบุรี')) {
          locationInput.value = query;
        }
      } else {
        alert(`ไม่พบสถานที่ "${query}" ลองพิมพ์ชื่อสถานที่หลัก หรือคลิกเลือกจากจุดยอดนิยมด้านล่างครับ`);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการค้นหา: ' + err.message);
    } finally {
      if (btn) btn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> ค้นหา';
    }
  },

  // Set quick location shortcut (จุดยอดนิยมใน ม.บูรพา)
  setQuickLocation(lat, lng, name) {
    if (this.pickerMap && this.pickerMarker) {
      this.pickerMap.setView([lat, lng], 16);
      this.pickerMarker.setLatLng([lat, lng]);
      this.updatePickerInputs(lat, lng);
    }
    const locationInput = document.getElementById('post-location-input');
    if (locationInput) {
      locationInput.value = name;
    }
  },

  // Reset back to Burapha University if scrolled too far
  resetToBurapha() {
    this.setQuickLocation(this.DEFAULT_LAT, this.DEFAULT_LNG, 'มหาวิทยาลัยบูรพา ชลบุรี');
  },

  // Auto-detect user's current GPS location
  detectCurrentLocation() {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ของคุณไม่รองรับการดึงพิกัด GPS');
      return;
    }

    const btn = document.getElementById('gps-detect-btn');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังค้นหาตำแหน่ง...';

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (this.pickerMap && this.pickerMarker) {
          this.pickerMap.setView([lat, lng], 16);
          this.pickerMarker.setLatLng([lat, lng]);
          this.updatePickerInputs(lat, lng);
        }
        if (this.explorerMap) {
          this.explorerMap.setView([lat, lng], 16);
        }
        if (btn) btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> 📍 ใช้ตำแหน่งปัจจุบันของฉัน';
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        alert('ไม่สามารถดึงตำแหน่งปัจจุบันได้ ระบบจะใช้พิกัดเริ่มต้น ม.บูรพา บางแสน');
        if (btn) btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> 📍 ใช้ตำแหน่งปัจจุบันของฉัน';
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  },

  // Search place on Explorer Map
  async searchExplorerPlace() {
    const input = document.getElementById('explorer-search-query');
    const query = input ? input.value.trim() : '';
    if (!query) {
      alert('กรุณากรอกชื่อสถานที่ที่ต้องการค้นหาบนแผนที่');
      return;
    }

    const btn = document.getElementById('explorer-search-btn');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' ชลบุรี')}&limit=1`;
      let res = await fetch(url);
      let data = await res.json();

      if (!data || data.length === 0) {
        const urlFallback = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        res = await fetch(urlFallback);
        data = await res.json();
      }

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        this.panExplorer(lat, lng);
      } else {
        alert(`ไม่พบสถานที่ "${query}" ลองค้นหาด้วยชื่อถนนหรือสถานที่สำคัญ เช่น ม.บูรพา หรือ บางแสน`);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการค้นหา: ' + err.message);
    } finally {
      if (btn) btn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> ค้นหา';
    }
  },

  panExplorer(lat, lng) {
    if (this.explorerMap) {
      this.explorerMap.setView([lat, lng], 16);
    }
  },

  resetExplorer() {
    if (this.explorerMap) {
      this.explorerMap.setView([this.DEFAULT_LAT, this.DEFAULT_LNG], 14);
    }
  },

  // Initialize Map Explorer showing all posted items
  initExplorerMap(posts = []) {
    const container = document.getElementById('explorer-map-container');
    if (!container) return;

    if (!this.explorerMap) {
      this.explorerMap = L.map('explorer-map-container').setView([this.DEFAULT_LAT, this.DEFAULT_LNG], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.explorerMap);
    }

    // Clear existing markers
    this.explorerMarkers.forEach(m => m.remove());
    this.explorerMarkers = [];

    // Add pins for posts
    posts.forEach(post => {
      if (post.latitude && post.longitude) {
        const marker = L.marker([post.latitude, post.longitude]).addTo(this.explorerMap);

        const imgUrl = (post.images && post.images.length > 0) ? post.images[0] : '';
        const typeBadge = post.post_type === 'donation'
          ? '<span style="color:#6d28d9; background:#ede9fe; padding:2px 6px; border-radius:4px; font-size:0.72rem; font-weight:600;">🎁 บริจาค/แจกฟรี</span>'
          : (post.post_type === 'request'
            ? '<span style="color:#b45309; background:#fef3c7; padding:2px 6px; border-radius:4px; font-size:0.72rem; font-weight:600;">🙏 ตามหา/ขอรับบริจาค</span>'
            : '<span style="color:#047857; background:#d1fae5; padding:2px 6px; border-radius:4px; font-size:0.72rem; font-weight:600;">🔄 แลกเปลี่ยน</span>');

        const exchangeInfo = post.post_type === 'donation'
          ? '<div style="font-size:0.75rem; color:#6d28d9; background:#ede9fe; padding:2px 6px; border-radius:4px; margin-bottom:6px;">🎁 แจกฟรี (ไม่มีค่าใช้จ่าย)</div>'
          : (post.post_type === 'request'
            ? `<div style="font-size:0.75rem; color:#b45309; background:#fef3c7; padding:2px 6px; border-radius:4px; margin-bottom:6px;">🙏 ของที่อยากได้: ${post.desired_exchange || 'ตามระบุ'}</div>`
            : `<div style="font-size:0.75rem; color:#166534; background:#dcfce7; padding:2px 6px; border-radius:4px; margin-bottom:6px;">🔄 สิ่งที่ต้องการแลก: ${post.desired_exchange}</div>`);

        const popupContent = `
          <div style="font-family: 'Prompt', sans-serif; width: 210px;">
            ${imgUrl ? `<img src="${imgUrl}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;">` : ''}
            <div style="margin-bottom: 4px;">${typeBadge}</div>
            <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 2px;">${post.title}</div>
            <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 4px;">📍 ${post.location_name || 'ม.บูรพา'}</div>
            ${exchangeInfo}
            <button class="btn btn-primary btn-sm" style="width: 100%; font-size: 0.75rem; padding: 4px;" onclick="Posts.showPostDetails('${post.id}')">
              ดูรายละเอียด / ยื่นข้อเสนอ
            </button>
          </div>
        `;

        marker.bindPopup(popupContent);
        this.explorerMarkers.push(marker);
      }
    });

    this.explorerMap.invalidateSize();
  },

  // Initialize mini map in Post Details Modal
  initDetailMap(lat, lng, locationName) {
    const container = document.getElementById('detail-map-container');
    if (!container) return;

    const itemLat = lat || this.DEFAULT_LAT;
    const itemLng = lng || this.DEFAULT_LNG;

    if (!this.detailMap) {
      this.detailMap = L.map('detail-map-container').setView([itemLat, itemLng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(this.detailMap);
      this.detailMarker = L.marker([itemLat, itemLng]).addTo(this.detailMap);
    } else {
      this.detailMap.setView([itemLat, itemLng], 15);
      this.detailMarker.setLatLng([itemLat, itemLng]);
      this.detailMap.invalidateSize();
    }

    if (locationName) {
      this.detailMarker.bindPopup(`<b>จุดนัดรับ:</b><br>${locationName}`).openPopup();
    }
  }
};
